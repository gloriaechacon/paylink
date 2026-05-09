"use client";
import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import BN from "bn.js";
import { useAnchorProgram } from "@/lib/program";
import {
  getConfigPda,
  getPaymentLinkPda,
  getEscrowVaultPda,
  encodeLinkParam,
} from "@/lib/pdas";
import {
  USDC_MINT,
  PLATFORM_FEE_BPS,
  usdcToLamports,
  lamportsToUsdc,
} from "@/lib/constants";

type SavedLink = {
  id: string; // encoded param
  linkId: string;
  amount: number;
  description: string;
  createdAt: number;
  txSig: string;
};

export default function Dashboard() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useAnchorProgram();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isX402, setIsX402] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  // Load saved links from localStorage
  useEffect(() => {
    if (!publicKey) return;
    const raw = localStorage.getItem(`paylink-links-${publicKey.toBase58()}`);
    if (raw) setLinks(JSON.parse(raw));
  }, [publicKey]);

  const saveLink = useCallback(
    (link: SavedLink) => {
      if (!publicKey) return;
      setLinks((prev) => {
        const updated = [link, ...prev];
        localStorage.setItem(
          `paylink-links-${publicKey.toBase58()}`,
          JSON.stringify(updated)
        );
        return updated;
      });
    },
    [publicKey]
  );

  async function ensureConfig() {
    if (!program || !publicKey) throw new Error("Wallet not connected");
    const [configPda] = getConfigPda(publicKey);
    const existing = await connection.getAccountInfo(configPda);
    if (existing) return configPda;

    // First time: initialize config for this seller
    await program.methods
      .initializeConfig(PLATFORM_FEE_BPS, publicKey) // treasury = seller wallet for demo
      .accounts({
        config: configPda,
        authority: publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return configPda;
  }

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    if (!program || !publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const configPda = await ensureConfig();

      // link_id = current timestamp in ms (fits in u64)
      const linkId = new BN(Date.now());
      const amountLamports = new BN(usdcToLamports(parseFloat(amount)).toString());

      const [paymentLinkPda] = getPaymentLinkPda(publicKey, linkId);
      const [escrowVaultPda] = getEscrowVaultPda(publicKey, linkId);

      const txSig = await program.methods
        .createPaymentLink(
          linkId,
          amountLamports,
          description || "Pago PayLink",
          isX402,
          new BN(0) // no expiry
        )
        .accounts({
          config: configPda,
          paymentLink: paymentLinkPda,
          escrowVault: escrowVaultPda,
          mint: USDC_MINT,
          seller: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      const param = encodeLinkParam(publicKey, linkId);
      saveLink({
        id: param,
        linkId: linkId.toString(),
        amount: parseFloat(amount),
        description: description || "Pago PayLink",
        createdAt: Date.now(),
        txSig,
      });

      setAmount("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!publicKey) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-bold">Mi dashboard</h1>
          <p className="text-gray-400">
            Conectá tu wallet para crear links de pago
          </p>
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mi dashboard</h1>
            <p className="text-gray-400 mt-1 font-mono text-sm">
              {publicKey.toBase58().slice(0, 8)}…
              {publicKey.toBase58().slice(-8)}
            </p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Create link form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">Crear nuevo link de pago</h2>
          <form onSubmit={createLink} className="space-y-3">
            <div>
              <label className="text-gray-400 text-sm">Monto en USDC</label>
              <input
                type="number"
                placeholder="200"
                min="0.000001"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full mt-1 bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">
                Descripción (opcional)
              </label>
              <input
                type="text"
                placeholder="Diseño de logo"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isX402}
                onChange={(e) => setIsX402(e.target.checked)}
                className="w-4 h-4 accent-green-400"
              />
              <span className="text-gray-400 text-sm">
                x402 micropayment gate
              </span>
            </label>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !amount}
              className="w-full bg-green-400 text-black font-bold py-3 rounded-xl hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando en Solana…" : "Generar link"}
            </button>
          </form>
        </div>

        {/* Links list */}
        {links.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Links recientes</h2>
            {links.map((link) => {
              const url = `${
                typeof window !== "undefined" ? window.location.origin : ""
              }/pay/${link.id}`;
              return (
                <div
                  key={link.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{link.description}</p>
                      <p className="text-green-400 font-bold text-lg">
                        ${link.amount} USDC
                      </p>
                      <p className="font-mono text-xs text-gray-500 truncate mt-1">
                        {url}
                      </p>
                    </div>
                    <button
                      onClick={() => copyLink(link.id)}
                      className="shrink-0 text-sm border border-gray-700 px-3 py-2 rounded-lg hover:border-green-400 hover:text-green-400 transition-colors"
                    >
                      {copied === link.id ? "✓ Copiado" : "Copiar URL"}
                    </button>
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${link.txSig}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-gray-600 hover:text-gray-400 mt-2 inline-block font-mono"
                  >
                    {link.txSig.slice(0, 16)}… ↗
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

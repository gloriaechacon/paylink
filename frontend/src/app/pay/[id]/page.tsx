"use client";
import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { useAnchorProgram } from "@/lib/program";
import {
  getConfigPda,
  getPaymentLinkPda,
  getEscrowVaultPda,
  decodeLinkParam,
} from "@/lib/pdas";
import { USDC_MINT, lamportsToUsdc } from "@/lib/constants";
import type { PaymentLinkAccount } from "@/lib/idl";

type PageProps = { params: Promise<{ id: string }> };

type LinkStatus = "loading" | "not_found" | "active" | "paid" | "settled";

export default function PayPage({ params }: PageProps) {
  const [id, setId] = useState<string | null>(null);
  const [link, setLink] = useState<PaymentLinkAccount | null>(null);
  const [status, setStatus] = useState<LinkStatus>("loading");
  const [paying, setPaying] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useAnchorProgram();

  // Unwrap async params (Next.js 15 App Router)
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // Fetch payment link account from Solana
  useEffect(() => {
    if (!id || !program) return;

    async function fetchLink() {
      try {
        const { seller, linkId } = decodeLinkParam(id!);
        const [pda] = getPaymentLinkPda(seller, linkId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await (program!.account as any).paymentLink.fetch(pda);
        setLink(data);
        if (data.isSettled) setStatus("settled");
        else if (data.isPaid) setStatus("paid");
        else setStatus("active");
      } catch {
        setStatus("not_found");
      }
    }

    fetchLink();
  }, [id, program]);

  async function handlePay() {
    if (!id || !program || !publicKey || !link) return;
    setError(null);
    setPaying(true);

    try {
      const { seller, linkId } = decodeLinkParam(id);
      const [configPda] = getConfigPda(seller);
      const [paymentLinkPda] = getPaymentLinkPda(seller, linkId);
      const [escrowVaultPda] = getEscrowVaultPda(seller, linkId);

      // Buyer's USDC associated token account
      const buyerToken = getAssociatedTokenAddressSync(USDC_MINT, publicKey);

      // Check buyer has enough USDC
      const tokenAcc = await connection.getTokenAccountBalance(buyerToken);
      const required = link.amount;
      if (BigInt(tokenAcc.value.amount) < BigInt(required.toString())) {
        throw new Error(
          `Insufficient USDC. Need ${lamportsToUsdc(
            required.toNumber()
          )} but have ${tokenAcc.value.uiAmount}`
        );
      }

      const sig = await program.methods
        .pay()
        .accounts({
          config: configPda,
          paymentLink: paymentLinkPda,
          escrowVault: escrowVaultPda,
          buyerToken,
          buyer: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setTxSig(sig);
      setStatus("paid");

      // Re-fetch to sync on-chain state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (program.account as any).paymentLink.fetch(
        paymentLinkPda
      );
      setLink(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPaying(false);
    }
  }

  // ── Derived display values ──
  const amountUsdc = link ? lamportsToUsdc(link.amount.toNumber()) : 0;
  const sellerShort = link
    ? `${link.seller.toBase58().slice(0, 6)}…${link.seller.toBase58().slice(-4)}`
    : "";

  // ── Render states ──
  if (status === "loading") {
    return <Screen><p className="text-gray-400 animate-pulse">Cargando link…</p></Screen>;
  }

  if (status === "not_found") {
    return (
      <Screen>
        <p className="text-red-400 text-lg font-medium">Link no encontrado</p>
        <p className="text-gray-500 text-sm">
          Este link no existe o ya fue cancelado.
        </p>
      </Screen>
    );
  }

  if (status === "settled") {
    return (
      <Screen>
        <div className="text-green-400 text-5xl">✓</div>
        <p className="text-2xl font-bold">Pago completado</p>
        <p className="text-gray-400">
          ${amountUsdc} USDC ya fueron enviados a {sellerShort}
        </p>
      </Screen>
    );
  }

  if (status === "paid") {
    return (
      <Screen>
        <div className="text-yellow-400 text-5xl">⏳</div>
        <p className="text-2xl font-bold">Pago recibido</p>
        <p className="text-gray-400 text-sm">
          Los fondos están en escrow. El vendedor va a liquidar en breve.
        </p>
        {txSig && (
          <a
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="text-green-400 text-xs font-mono hover:underline"
          >
            Ver tx en Explorer ↗
          </a>
        )}
      </Screen>
    );
  }

  // status === "active"
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Link ID breadcrumb */}
        <p className="text-gray-500 text-sm font-mono text-center">
          paylink / {id?.slice(0, 12)}…
        </p>

        {/* Payment card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Para</span>
            <span className="font-mono text-sm">{sellerShort}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Monto</span>
            <span className="text-3xl font-bold text-green-400">
              ${amountUsdc} USDC
            </span>
          </div>
          {link?.description && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Concepto</span>
              <span className="text-sm">{link.description}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Recibe en</span>
            <span className="text-sm">Solana</span>
          </div>
          <div className="border-t border-gray-800 pt-4">
            <p className="text-gray-500 text-sm text-center">
              Necesitás USDC en Solana devnet para pagar
            </p>
          </div>
        </div>

        {/* Wallet + Pay */}
        {!publicKey ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-400 text-sm">
              Conectá tu wallet para pagar
            </p>
            <WalletMultiButton />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Wallet conectada</span>
              <WalletMultiButton />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full bg-green-400 text-black font-bold py-4 rounded-xl text-lg hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paying ? "Enviando a escrow…" : `Pagar $${amountUsdc} USDC`}
            </button>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs">
          Powered by Solana · Escrow on-chain · PayLink
        </p>
      </div>
    </main>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 gap-4 text-center">
      {children}
    </main>
  );
}

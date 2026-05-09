"use client";
import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL } from "./idl";

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      },
      { commitment: "confirmed" }
    );
    // IDL.address carries the program ID in Anchor 0.31
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Program(IDL as any, provider);
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);
}

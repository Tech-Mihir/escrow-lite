"use client";

import {
  isConnected,
  getPublicKey,
  signTransaction,
  requestAccess,
} from "@stellar/freighter-api";

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  error: string | null;
}

/** Check if Freighter is installed and already has access granted. */
export async function checkFreighterConnection(): Promise<WalletState> {
  try {
    const connected = await isConnected();
    if (!connected) {
      return { connected: false, publicKey: null, error: null };
    }
    // getPublicKey returns the key string directly, throws if not allowed
    try {
      const publicKey = await getPublicKey();
      return { connected: true, publicKey, error: null };
    } catch {
      // Not yet allowed — connected but no key yet
      return { connected: true, publicKey: null, error: null };
    }
  } catch (e: unknown) {
    return {
      connected: false,
      publicKey: null,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

/** Request wallet access (prompts user if not already granted). */
export async function connectWallet(): Promise<WalletState> {
  try {
    // requestAccess returns the public key string directly
    const publicKey = await requestAccess();
    return { connected: true, publicKey, error: null };
  } catch (e: unknown) {
    return {
      connected: false,
      publicKey: null,
      error: e instanceof Error ? e.message : "Failed to connect wallet",
    };
  }
}

/** Sign a transaction XDR string with Freighter. Returns signed XDR. */
export async function signTx(
  xdr: string,
  networkPassphrase: string
): Promise<string> {
  const result = await signTransaction(xdr, { networkPassphrase });
  // Freighter v2 returns the signed XDR string directly
  // but may return an object with error in some cases
  if (typeof result === "string") return result;
  // Handle object response
  const r = result as unknown as { signedTxXdr?: string; error?: string };
  if (r.error) throw new Error(r.error);
  if (r.signedTxXdr) return r.signedTxXdr;
  throw new Error("Freighter did not return a signed transaction");
}

"use client";

import Link from "next/link";
import { useWallet } from "@/lib/WalletContext";

export default function Navbar() {
  const { publicKey, connected, connecting, connect, disconnect } = useWallet();

  const shortKey = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : null;

  return (
    <nav className="bg-stellar-blue border-b border-blue-900 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-white font-bold text-xl tracking-tight">
        🔒 Escrow Lite
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-blue-200 hover:text-white text-sm transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/create"
          className="text-blue-200 hover:text-white text-sm transition-colors"
        >
          + Create Escrow
        </Link>

        {connected && shortKey ? (
          <div className="flex items-center gap-2">
            <span className="bg-green-900 text-green-300 text-xs px-3 py-1 rounded-full font-mono">
              {shortKey}
            </span>
            <button
              onClick={disconnect}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={connecting}
            className="bg-stellar-purple hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}

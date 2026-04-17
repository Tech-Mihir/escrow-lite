"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { xlmFromStroops } from "@/lib/stellar";
import type { EscrowData } from "@/lib/stellar";

export default function EscrowCard({ escrow }: { escrow: EscrowData }) {
  const shortAddr = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <Link href={`/escrow/${escrow.id}`}>
      <div className="bg-gray-900 border border-gray-700 hover:border-stellar-purple rounded-xl p-5 transition-all cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-xs font-mono">
            Escrow #{escrow.id}
          </span>
          <StatusBadge status={escrow.status} />
        </div>

        <div className="text-2xl font-bold text-white mb-3">
          {xlmFromStroops(escrow.amount)}{" "}
          <span className="text-stellar-purple text-lg">XLM</span>
        </div>

        <div className="space-y-1 text-xs text-gray-400 font-mono">
          <div>
            <span className="text-gray-500">Buyer: </span>
            {shortAddr(escrow.buyer)}
          </div>
          <div>
            <span className="text-gray-500">Seller: </span>
            {shortAddr(escrow.seller)}
          </div>
        </div>

        <div className="mt-3 text-xs text-stellar-purple opacity-0 group-hover:opacity-100 transition-opacity">
          View details →
        </div>
      </div>
    </Link>
  );
}

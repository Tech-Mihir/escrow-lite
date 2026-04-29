"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EscrowCard from "@/components/EscrowCard";
import { getAllEscrows, type EscrowData } from "@/lib/stellar";
import { useWallet } from "@/lib/WalletContext";

type FilterTab = "all" | "mine" | "funded" | "delivered" | "released";

export default function DashboardPage() {
  const { publicKey, connected, connect, connecting } = useWallet();
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    setLoading(true);
    getAllEscrows()
      .then(setEscrows)
      .catch(() => setEscrows([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredEscrows = escrows.filter((e) => {
    if (activeTab === "mine")
      return publicKey && (e.buyer === publicKey || e.seller === publicKey);
    if (activeTab === "funded") return e.status === "Funded";
    if (activeTab === "delivered") return e.status === "Delivered";
    if (activeTab === "released") return e.status === "Released";
    return true;
  });

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "mine", label: "My Escrows" },
    { id: "funded", label: "Funded" },
    { id: "delivered", label: "Delivered" },
    { id: "released", label: "Released" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Escrow Dashboard
        </h1>
        <p className="text-gray-400">
          Trustless escrow powered by Stellar Soroban smart contracts.
        </p>
      </div>

      {/* Wallet prompt */}
      {!connected && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8 flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Connect your wallet</p>
            <p className="text-gray-400 text-sm mt-1">
              Connect Freighter to create or manage escrows.
            </p>
          </div>
          <button
            onClick={connect}
            disabled={connecting}
            className="bg-stellar-purple hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg transition-colors"
          >
            {connecting ? "Connecting..." : "Connect Freighter"}
          </button>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-200">
          Escrows{" "}
          {!loading && (
            <span className="text-gray-500 font-normal text-sm">
              ({filteredEscrows.length})
            </span>
          )}
        </h2>
        <Link
          href="/create"
          className="bg-stellar-purple hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Create Escrow
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-stellar-purple text-white"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 text-gray-500">
          Loading escrows...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredEscrows.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-2">
            {activeTab === "mine"
              ? "No escrows found for your wallet."
              : "No escrows yet."}
          </p>
          <p className="text-gray-600 text-sm mb-6">
            {activeTab === "mine"
              ? "Create an escrow or ask someone to add your address as seller."
              : "Create the first escrow to get started."}
          </p>
          <Link
            href="/create"
            className="bg-stellar-purple hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Create Escrow
          </Link>
        </div>
      )}

      {/* Escrow grid */}
      {!loading && filteredEscrows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEscrows.map((e) => (
            <EscrowCard key={e.id} escrow={e} />
          ))}
        </div>
      )}
    </div>
  );
}

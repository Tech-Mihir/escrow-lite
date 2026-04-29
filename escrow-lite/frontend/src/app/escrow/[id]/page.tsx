"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/lib/WalletContext";
import {
  getEscrow,
  markDelivered,
  releasePayment,
  xlmFromStroops,
  type EscrowData,
} from "@/lib/stellar";
import StatusBadge from "@/components/StatusBadge";
import TxStatus from "@/components/TxStatus";

type TxState = "idle" | "pending" | "success" | "error";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy address"
      className="text-gray-500 hover:text-gray-300 transition-colors text-xs ml-1"
    >
      {copied ? "✓" : "⧉"}
    </button>
  );
}

function EscrowStepper({ status }: { status: string }) {
  const steps = [
    { label: "Funded", desc: "Buyer locked XLM" },
    { label: "Delivered", desc: "Seller confirmed delivery" },
    { label: "Released", desc: "Payment sent to seller" },
  ];
  const currentIndex =
    status === "Funded" ? 0 : status === "Delivered" ? 1 : 2;

  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, i) => (
        <div key={step.label} className="flex-1 flex flex-col items-center">
          <div className="flex items-center w-full">
            {i > 0 && (
              <div
                className={`flex-1 h-0.5 ${
                  i <= currentIndex ? "bg-stellar-purple" : "bg-gray-700"
                }`}
              />
            )}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                i < currentIndex
                  ? "bg-stellar-purple border-stellar-purple text-white"
                  : i === currentIndex
                  ? "bg-stellar-purple border-stellar-purple text-white ring-2 ring-purple-400/30"
                  : "bg-gray-800 border-gray-600 text-gray-500"
              }`}
            >
              {i < currentIndex ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 ${
                  i < currentIndex ? "bg-stellar-purple" : "bg-gray-700"
                }`}
              />
            )}
          </div>
          <p
            className={`text-xs mt-1.5 font-medium ${
              i === currentIndex ? "text-white" : "text-gray-500"
            }`}
          >
            {step.label}
          </p>
          <p className="text-xs text-gray-600 text-center hidden sm:block">
            {step.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function EscrowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { publicKey, connected, connect, connecting } = useWallet();

  const escrowId = Number(params.id);

  const [escrow, setEscrow] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [txState, setTxState] = useState<TxState>("idle");
  const [txMessage, setTxMessage] = useState("");

  const loadEscrow = () => {
    setLoading(true);
    setFetchError(null);
    // Force fresh read with cache-busting
    getEscrow(escrowId)
      .then((data) => {
        if (!data) setFetchError("Escrow not found.");
        else setEscrow(data);
      })
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isNaN(escrowId)) loadEscrow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrowId]);

  const isBuyer = publicKey && escrow?.buyer === publicKey;
  const isSeller = publicKey && escrow?.seller === publicKey;

  const handleMarkDelivered = async () => {
    if (!publicKey || !escrow) return;
    setTxState("pending");
    setTxMessage("Marking as delivered — approve in Freighter...");
    try {
      await markDelivered(publicKey, escrow.id);
      setTxState("success");
      setTxMessage("Marked as delivered!");
      setTimeout(() => loadEscrow(), 2000);
    } catch (e: unknown) {
      setTxState("error");
      const msg = e instanceof Error ? e.message : typeof e === "object" ? JSON.stringify(e) : String(e);
      setTxMessage(msg);
    }
  };

  const handleReleasePayment = async () => {
    if (!publicKey || !escrow) return;
    setTxState("pending");
    setTxMessage("Releasing payment — approve in Freighter...");
    try {
      await releasePayment(publicKey, escrow.id);
      setTxState("success");
      setTxMessage("Payment released to seller!");
      setTimeout(() => loadEscrow(), 2000);
    } catch (e: unknown) {
      setTxState("error");
      const msg = e instanceof Error ? e.message : typeof e === "object" ? JSON.stringify(e) : String(e);
      setTxMessage(msg);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500">Loading escrow...</div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-red-900 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm mb-4">
          ❌ {fetchError}
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!escrow) return null;

  const shortAddr = (addr: string) =>
    `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => router.push("/")}
        className="text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        ← Back to Dashboard
      </button>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">
            Escrow #{escrow.id}
          </h1>
          <StatusBadge status={escrow.status} />
        </div>

        {/* Progress stepper */}
        <EscrowStepper status={escrow.status} />

        {/* Amount */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-400 text-xs mb-1">Locked Amount</p>
          <p className="text-3xl font-bold text-white">
            {xlmFromStroops(escrow.amount)}{" "}
            <span className="text-stellar-purple">XLM</span>
          </p>
        </div>

        {/* Parties */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Buyer</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-gray-300">
                {shortAddr(escrow.buyer)}
              </span>
              <CopyButton text={escrow.buyer} />
              {isBuyer && (
                <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full ml-1">
                  You
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Seller</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-gray-300">
                {shortAddr(escrow.seller)}
              </span>
              <CopyButton text={escrow.seller} />
              {isSeller && (
                <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full ml-1">
                  You
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Explorer</span>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${escrow.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stellar-purple hover:underline"
            >
              View on Stellar Expert ↗
            </a>
          </div>
        </div>

        {/* Wallet connect prompt */}
        {!connected && (
          <div className="mb-4">
            <button
              onClick={connect}
              disabled={connecting}
              className="w-full bg-stellar-purple hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
            >
              {connecting ? "Connecting..." : "Connect Wallet to Act"}
            </button>
          </div>
        )}

        {/* Actions */}
        {connected && (
          <div className="space-y-3">
            {isSeller && escrow.status === "Funded" && (
              <button
                onClick={handleMarkDelivered}
                disabled={txState === "pending"}
                className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {txState === "pending" ? "Processing..." : "📦 Mark as Delivered"}
              </button>
            )}

            {isBuyer && escrow.status === "Delivered" && (
              <button
                onClick={handleReleasePayment}
                disabled={txState === "pending"}
                className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {txState === "pending" ? "Processing..." : "✅ Release Payment"}
              </button>
            )}

            {escrow.status === "Released" && (
              <div className="text-center text-green-400 text-sm py-2">
                This escrow is complete. Payment has been released.
              </div>
            )}

            {!isBuyer && !isSeller && (
              <div className="text-center text-gray-500 text-sm py-2">
                You are not a party to this escrow.
              </div>
            )}
          </div>
        )}

      </div>

      <TxStatus status={txState} message={txMessage} />
    </div>
  );
}

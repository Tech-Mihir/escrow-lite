"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/WalletContext";
import { createEscrow } from "@/lib/stellar";
import TxStatus from "@/components/TxStatus";

type TxState = "idle" | "pending" | "success" | "error";

async function fundWithFriendbot(address: string): Promise<void> {
  const res = await fetch(`/api/friendbot?addr=${encodeURIComponent(address)}`);
  const data = await res.json() as { error?: string; extras?: { reason?: string } };
  if (!res.ok) {
    throw new Error(data.error ?? "Friendbot funding failed");
  }
}

export default function CreateEscrowPage() {
  const router = useRouter();
  const { publicKey, connected, connect, connecting } = useWallet();

  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");
  const [txMessage, setTxMessage] = useState("");
  const [accountNotFunded, setAccountNotFunded] = useState(false);
  const [funding, setFunding] = useState(false);
  const [accountFunded, setAccountFunded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`)
      .then((r) => setAccountFunded(r.ok))
      .catch(() => setAccountFunded(false));
  }, [publicKey]);

  const isValidAddress = (addr: string) =>
    /^G[A-Z2-7]{55}$/.test(addr.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setTxState("error");
      setTxMessage("Amount must be a positive number.");
      return;
    }
    if (!isValidAddress(seller)) {
      setTxState("error");
      setTxMessage("Invalid seller Stellar address.");
      return;
    }
    if (seller.trim() === publicKey) {
      setTxState("error");
      setTxMessage("Seller cannot be the same as buyer.");
      return;
    }

    setTxState("pending");
    setTxMessage("Submitting transaction — please approve in Freighter...");
    setAccountNotFunded(false);

    try {
      const id = await createEscrow(publicKey, seller.trim(), amtNum);
      setTxState("success");
      setTxMessage(`Escrow #${id} created successfully!`);
      setTimeout(() => router.push(`/escrow/${id}`), 1500);
    } catch (err: unknown) {
      setTxState("error");
      let msg = "Transaction failed.";
      if (err instanceof Error) {
        msg = err.message;
        if (msg.includes("Account not found")) {
          setAccountNotFunded(true);
        }
      } else if (typeof err === "string") {
        msg = err;
      } else if (err && typeof err === "object") {
        msg = JSON.stringify(err);
      }
      console.error("Create escrow error:", err);
      setTxMessage(msg);
    }
  };

  const handleFundAccount = async () => {
    if (!publicKey) return;
    setFunding(true);
    setTxState("pending");
    setTxMessage("Funding your account with testnet XLM via Friendbot...");
    try {
      await fundWithFriendbot(publicKey);
      setTxState("success");
      setTxMessage("Account funded! You now have 10,000 testnet XLM. Try creating the escrow again.");
      setAccountNotFunded(false);
    } catch (err: unknown) {
      setTxState("error");
      setTxMessage(err instanceof Error ? err.message : "Funding failed. Try manually at https://laboratory.stellar.org/#account-creator?network=test");
    } finally {
      setFunding(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-gray-400 mb-4">
          Connect your wallet to create an escrow.
        </p>
        <button
          onClick={connect}
          disabled={connecting}
          className="bg-stellar-purple hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors"
        >
          {connecting ? "Connecting..." : "Connect Freighter"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Create Escrow</h1>
      <p className="text-gray-400 text-sm mb-6">
        Lock XLM in a smart contract. Funds release only when you approve.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-5"
      >
        {/* Testnet funding notice — only shown when account is not funded */}
        {accountFunded === false && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div className="text-sm text-yellow-300">
            <p className="font-medium mb-1">Testnet account required</p>
            <p className="text-yellow-400/80">Your wallet must be funded on the Stellar testnet before creating an escrow.</p>
            <button
              type="button"
              onClick={handleFundAccount}
              disabled={funding}
              className="mt-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
            >
              {funding ? "Funding..." : "⚡ Fund my account (free testnet XLM)"}
            </button>
          </div>
        </div>
        )}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Your address (Buyer)
          </label>
          <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 break-all">
            {publicKey}
          </div>
        </div>

        {/* Seller */}
        <div>
          <label
            htmlFor="seller"
            className="block text-sm text-gray-400 mb-1"
          >
            Seller address <span className="text-red-400">*</span>
          </label>
          <input
            id="seller"
            type="text"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            className="w-full bg-gray-800 border border-gray-600 focus:border-stellar-purple rounded-lg px-3 py-2 text-sm text-white font-mono outline-none transition-colors"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor="amount"
            className="block text-sm text-gray-400 mb-1"
          >
            Amount (XLM) <span className="text-red-400">*</span>
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10.0"
            min="0.0000001"
            step="0.0000001"
            className="w-full bg-gray-800 border border-gray-600 focus:border-stellar-purple rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
            required
          />
        </div>

        {/* Description (optional, stored off-chain) */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm text-gray-400 mb-1"
          >
            Description{" "}
            <span className="text-gray-600 text-xs">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the work or deliverable..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-600 focus:border-stellar-purple rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors resize-none"
          />
        </div>

        <TxStatus status={txState} message={txMessage} />

        {accountNotFunded && (
          <button
            type="button"
            onClick={handleFundAccount}
            disabled={funding}
            className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {funding ? "Funding..." : "⚡ Fund Account with Testnet XLM (Friendbot)"}
          </button>
        )}

        <button
          type="submit"
          disabled={txState === "pending"}
          className="w-full bg-stellar-purple hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {txState === "pending" ? "Processing..." : "Lock Funds in Escrow"}
        </button>
      </form>
    </div>
  );
}

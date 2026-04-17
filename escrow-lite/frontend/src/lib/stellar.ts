"use client";

/**
 * Stellar integration using:
 * - Horizon REST API for account sequence numbers
 * - Direct JSON-RPC fetch for Soroban simulation/send (bypasses broken browser bundle)
 * - stellar-sdk for XDR building only
 */

import {
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  Address,
  xdr,
  scValToNative,
  Account,
  Contract,
  Operation,
} from "@stellar/stellar-sdk";

import {
  SOROBAN_RPC_URL,
  HORIZON_URL,
  NETWORK_PASSPHRASE,
  ESCROW_CONTRACT_ID,
  NATIVE_TOKEN_CONTRACT,
  STROOPS_PER_XLM,
} from "./constants";
import { signTx } from "./freighter";

// Deployer — funded testnet account for read-only simulations
const READ_ACCOUNT = "GAO4GWTMIIF5YYGDOBKOQPOJD4WTESOI722TCWMK4AJJUJIUX3UJQMHQ";

export interface EscrowData {
  id: number;
  buyer: string;
  seller: string;
  amount: bigint;
  token: string;
  status: "Funded" | "Delivered" | "Released";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get account sequence from Horizon */
async function getAccount(publicKey: string): Promise<Account> {
  const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
  if (!res.ok) throw new Error(`Account not found: ${publicKey}. Please fund it at https://laboratory.stellar.org/#account-creator?network=test`);
  const data = await res.json() as { sequence: string };
  return new Account(publicKey, data.sequence);
}

/** Direct JSON-RPC call to Soroban RPC */
async function sorobanRpc(method: string, params: unknown): Promise<unknown> {
  const res = await fetch(SOROBAN_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json() as { result?: unknown; error?: { message: string } };
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

// ── ScVal helpers ─────────────────────────────────────────────────────────────

function addressVal(addr: string): xdr.ScVal {
  return new Address(addr).toScVal();
}

function u32Val(n: number): xdr.ScVal {
  return xdr.ScVal.scvU32(n);
}

function i128Val(n: bigint): xdr.ScVal {
  return nativeToScVal(n, { type: "i128" });
}

// ── Response parsers ──────────────────────────────────────────────────────────

function parseStatus(raw: unknown): EscrowData["status"] {
  if (raw && typeof raw === "object") {
    const key = Object.keys(raw as Record<string, unknown>)[0];
    if (key === "Funded") return "Funded";
    if (key === "Delivered") return "Delivered";
    if (key === "Released") return "Released";
  }
  return "Funded";
}

function parseEscrow(raw: unknown): EscrowData {
  const obj = raw as Record<string, unknown>;
  return {
    id: Number(obj.id),
    buyer: String(obj.buyer),
    seller: String(obj.seller),
    amount: BigInt(String(obj.amount)),
    token: String(obj.token),
    status: parseStatus(obj.status),
  };
}

// ── Simulate (read-only) ──────────────────────────────────────────────────────

async function simulateRead(
  method: string,
  args: xdr.ScVal[]
): Promise<unknown> {
  try {
    const account = await getAccount(READ_ACCOUNT);
    // Use a bumped sequence to ensure we always get fresh data
    const freshAccount = new Account(
      READ_ACCOUNT,
      (BigInt(account.sequenceNumber()) + 1n).toString()
    );
    const contractObj = new Contract(ESCROW_CONTRACT_ID);

    const tx = new TransactionBuilder(freshAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contractObj.call(method, ...args))
      .setTimeout(30)
      .build();

    const simRes = await sorobanRpc("simulateTransaction", {
      transaction: tx.toXDR(),
    }) as { results?: Array<{ xdr: string }>; error?: string };

    if (simRes.error || !simRes.results?.[0]?.xdr) return null;

    const retval = xdr.ScVal.fromXDR(simRes.results[0].xdr, "base64");
    return scValToNative(retval);
  } catch {
    return null;
  }
}

// ── Invoke (write) ────────────────────────────────────────────────────────────

async function invokeContract(
  callerPublicKey: string,
  method: string,
  args: xdr.ScVal[]
): Promise<unknown> {
  const contractObj = new Contract(ESCROW_CONTRACT_ID);

  // Step 1: Get account sequence for simulation
  const simAccount = await getAccount(callerPublicKey);

  const simTx = new TransactionBuilder(simAccount, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contractObj.call(method, ...args))
    .setTimeout(60)
    .build();

  // Step 2: Simulate to get resource data + auth
  const simRes = await sorobanRpc("simulateTransaction", {
    transaction: simTx.toXDR(),
  }) as {
    results?: Array<{ xdr: string; auth?: string[] }>;
    transactionData?: string;
    minResourceFee?: string;
    error?: string;
    restorePreamble?: { transactionData: string; minResourceFee: string };
  };

  if (simRes.error) throw new Error(`Simulation failed: ${simRes.error}`);
  if (!simRes.results?.[0]) throw new Error("Simulation returned no result");

  // Step 3: Decode soroban transaction data and fees
  const sorobanData = simRes.transactionData
    ? xdr.SorobanTransactionData.fromXDR(simRes.transactionData, "base64")
    : undefined;

  const resourceFee = BigInt(simRes.minResourceFee ?? "0");
  const totalFee = (BigInt("1000000") + resourceFee).toString();

  // Step 4: Decode auth entries from simulation
  const authEntries = (simRes.results[0].auth ?? []).map((a: string) =>
    xdr.SorobanAuthorizationEntry.fromXDR(a, "base64")
  );

  // Step 5: Get FRESH account sequence for the real tx (avoids seq mismatch)
  const freshAccount = await getAccount(callerPublicKey);

  // Step 6: Build the assembled transaction with soroban data + auth
  const invokeOp = Operation.invokeHostFunction({
    func: xdr.HostFunction.hostFunctionTypeInvokeContract(
      new xdr.InvokeContractArgs({
        contractAddress: new Address(ESCROW_CONTRACT_ID).toScAddress(),
        functionName: method,
        args,
      })
    ),
    auth: authEntries,
  });

  const finalTxBuilder = new TransactionBuilder(freshAccount, {
    fee: totalFee,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(invokeOp)
    .setTimeout(60);

  if (sorobanData) {
    finalTxBuilder.setSorobanData(sorobanData);
  }

  const finalTx = finalTxBuilder.build();

  // Step 7: Sign with Freighter
  const signedXdr = await signTx(finalTx.toXDR(), NETWORK_PASSPHRASE);

  // Step 8: Send via Soroban RPC
  const sendRes = await sorobanRpc("sendTransaction", {
    transaction: signedXdr,
  }) as { hash: string; status: string; errorResultXdr?: string };

  if (sendRes.status === "ERROR") {
    // Decode the XDR error code for a human-readable message
    let errMsg = sendRes.errorResultXdr ?? "unknown";
    try {
      const result = xdr.TransactionResult.fromXDR(errMsg, "base64");
      errMsg = result.result().switch().name + " (code: " + result.feeCharged().toString() + ")";
    } catch { /* keep raw */ }
    throw new Error(`Send failed: ${errMsg}`);
  }

  // Step 9: Poll for confirmation
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const getRes = await sorobanRpc("getTransaction", {
      hash: sendRes.hash,
    }) as { status: string; resultMetaXdr?: string; resultXdr?: string };

    if (getRes.status === "SUCCESS") {
      if (getRes.resultMetaXdr) {
        try {
          const meta = xdr.TransactionMeta.fromXDR(getRes.resultMetaXdr, "base64");
          const v3 = meta.v3();
          const sorobanMeta = v3.sorobanMeta();
          if (sorobanMeta) {
            const retVal = sorobanMeta.returnValue();
            if (retVal.switch().name !== "scvVoid") {
              return scValToNative(retVal);
            }
          }
        } catch { /* parsing failed */ }
      }
      return "SUCCESS";
    }

    if (getRes.status === "FAILED") {
      let failMsg = `Transaction failed. Hash: ${sendRes.hash}`;
      if (getRes.resultXdr) {
        try {
          const result = xdr.TransactionResult.fromXDR(getRes.resultXdr, "base64");
          failMsg = `Transaction failed: ${result.result().switch().name}`;
        } catch { /* keep default */ }
      }
      throw new Error(failMsg);
    }
  }

  throw new Error(`Timeout. Check: https://stellar.expert/explorer/testnet/tx/${sendRes.hash}`);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createEscrow(
  buyerPublicKey: string,
  sellerPublicKey: string,
  amountXlm: number
): Promise<number> {
  const amountStroops = BigInt(Math.round(amountXlm * Number(STROOPS_PER_XLM)));
  const result = await invokeContract(buyerPublicKey, "create_escrow", [
    addressVal(buyerPublicKey),
    addressVal(sellerPublicKey),
    addressVal(NATIVE_TOKEN_CONTRACT),
    i128Val(amountStroops),
  ]);

  // If we got a real number back, use it
  if (typeof result === "number" && result > 0) return result;
  if (typeof result === "bigint" && result > 0n) return Number(result);

  // Otherwise fetch the current count — the new escrow is always the latest
  const count = await getEscrowCount();
  return count > 0 ? count : 1;
}

export async function markDelivered(
  sellerPublicKey: string,
  escrowId: number
): Promise<void> {
  await invokeContract(sellerPublicKey, "mark_delivered", [
    u32Val(escrowId),
    addressVal(sellerPublicKey),
  ]);
}

export async function releasePayment(
  buyerPublicKey: string,
  escrowId: number
): Promise<void> {
  await invokeContract(buyerPublicKey, "release_payment", [
    u32Val(escrowId),
    addressVal(buyerPublicKey),
  ]);
}

export async function getEscrow(escrowId: number): Promise<EscrowData | null> {
  const result = await simulateRead("get_escrow", [u32Val(escrowId)]);
  if (!result) return null;
  try {
    return parseEscrow(result);
  } catch {
    return null;
  }
}

export async function getEscrowCount(): Promise<number> {
  const result = await simulateRead("escrow_count", []);
  if (result === null || result === undefined) return 0;
  return Number(result);
}

export async function getAllEscrows(): Promise<EscrowData[]> {
  const count = await getEscrowCount();
  if (count === 0) return [];
  const results: EscrowData[] = [];
  for (let i = 1; i <= count; i++) {
    const escrow = await getEscrow(i);
    if (escrow) results.push(escrow);
  }
  return results;
}

export function xlmFromStroops(stroops: bigint): string {
  return (Number(stroops) / Number(STROOPS_PER_XLM)).toFixed(7);
}

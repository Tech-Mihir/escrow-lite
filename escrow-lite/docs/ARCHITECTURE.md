# Escrow Lite — Architecture Document

## Overview

Escrow Lite is a trustless escrow dApp built on the Stellar blockchain using Soroban smart contracts. It enables two parties (buyer and seller) to transact without a trusted intermediary — all logic is enforced on-chain.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      User Browser                        │
│                                                          │
│   ┌──────────────┐        ┌─────────────────────────┐   │
│   │  Next.js 15  │        │   Freighter Extension   │   │
│   │  Frontend    │◄──────►│   (Wallet / Signer)     │   │
│   └──────┬───────┘        └─────────────────────────┘   │
└──────────┼──────────────────────────────────────────────┘
           │ HTTPS (JSON-RPC)
           ▼
┌─────────────────────────────────────────────────────────┐
│                  Stellar Testnet                          │
│                                                          │
│   ┌──────────────────────┐   ┌────────────────────────┐ │
│   │   Soroban RPC Node   │   │   Horizon REST API     │ │
│   │  soroban-testnet.    │   │  horizon-testnet.      │ │
│   │  stellar.org         │   │  stellar.org           │ │
│   └──────────┬───────────┘   └────────────┬───────────┘ │
│              │                             │             │
│              ▼                             ▼             │
│   ┌──────────────────────────────────────────────────┐  │
│   │              Stellar Ledger                       │  │
│   │                                                   │  │
│   │   ┌─────────────────────────────────────────┐    │  │
│   │   │        Escrow Smart Contract             │    │  │
│   │   │   CBM2YLPJU7LITS6MCELS654W6VFO4VJ35W... │    │  │
│   │   │                                          │    │  │
│   │   │   Persistent Storage:                    │    │  │
│   │   │   ("ESCROW", id) → Escrow struct         │    │  │
│   │   │   "ESC_CNT"      → u32 counter           │    │  │
│   │   └─────────────────────────────────────────┘    │  │
│   │                                                   │  │
│   │   ┌─────────────────────────────────────────┐    │  │
│   │   │     Native XLM Token Contract            │    │  │
│   │   │   CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF... │    │  │
│   │   └─────────────────────────────────────────┘    │  │
│   └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Smart Contract (`contracts/escrow/src/lib.rs`)

Written in Rust using the Soroban SDK. Compiled to WASM and deployed on Stellar Testnet.

**Data Model:**
```rust
enum EscrowStatus { Funded, Delivered, Released }

struct Escrow {
    id: u32,
    buyer: Address,
    seller: Address,
    amount: i128,      // in stroops (1 XLM = 10,000,000 stroops)
    token: Address,    // native XLM token contract
    status: EscrowStatus,
}
```

**Storage Strategy:**
- `persistent` storage for escrow data — survives ledger TTL
- `instance` storage for the escrow counter — lightweight

**Security:**
- `require_auth()` on all state-changing functions
- Role enforcement — only designated buyer/seller can act
- Status guards — prevent out-of-order transitions

---

### 2. Frontend (`frontend/src/`)

**Framework:** Next.js 15 App Router with TypeScript

**Pages:**
| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Dashboard — lists all escrows |
| `/create` | `app/create/page.tsx` | Create new escrow |
| `/escrow/[id]` | `app/escrow/[id]/page.tsx` | Escrow detail + actions |

**Components:**
| Component | Purpose |
|---|---|
| `Navbar` | Wallet connect/disconnect, navigation |
| `EscrowCard` | Clickable card for dashboard |
| `StatusBadge` | Colored status indicator |
| `TxStatus` | Transaction feedback UI |

**State Management:** React Context API (`WalletContext`) for global wallet state.

---

### 3. Blockchain Integration (`frontend/src/lib/stellar.ts`)

Uses direct JSON-RPC fetch calls to Soroban RPC (bypasses broken browser bundle issues with stellar-sdk).

**Transaction Flow:**
```
1. Build transaction (TransactionBuilder)
        ↓
2. Simulate (simulateTransaction RPC)
   → Get resource fees + auth entries
        ↓
3. Assemble final tx with soroban data
        ↓
4. Sign with Freighter (signTransaction)
        ↓
5. Send (sendTransaction RPC)
        ↓
6. Poll for confirmation (getTransaction RPC)
   → 30 retries × 2s = 60s timeout
        ↓
7. Parse return value from resultMetaXdr
```

**Read-only calls:** Use `simulateTransaction` with a known funded account — no wallet needed for reads.

---

### 4. Wallet Integration (`frontend/src/lib/freighter.ts`)

Uses `@stellar/freighter-api` v2.

| Function | Purpose |
|---|---|
| `checkFreighterConnection()` | Auto-detect on page load |
| `connectWallet()` | Request access from user |
| `signTx(xdr, passphrase)` | Sign transaction XDR |

---

## Data Flow — Create Escrow

```
User fills form (seller, amount)
        ↓
Frontend calls createEscrow(buyer, seller, amount)
        ↓
Converts XLM → stroops (× 10,000,000)
        ↓
Builds Soroban invoke transaction
        ↓
Simulates → gets resource fees + auth
        ↓
Freighter popup → user approves
        ↓
Signed XDR sent to Soroban RPC
        ↓
Contract: buyer.require_auth() ✓
Contract: token.transfer(buyer → contract, amount) ✓
Contract: stores Escrow{status: Funded} ✓
Contract: returns escrow ID
        ↓
Frontend redirects to /escrow/{id}
```

---

## Data Flow — Release Payment

```
Buyer clicks "Release Payment"
        ↓
Frontend calls releasePayment(buyerKey, escrowId)
        ↓
Builds Soroban invoke transaction
        ↓
Freighter popup → buyer approves
        ↓
Contract: buyer.require_auth() ✓
Contract: status == Delivered ✓
Contract: token.transfer(contract → seller, amount) ✓
Contract: status = Released ✓
        ↓
Frontend reloads escrow data → shows "Released"
```

---

## Network Configuration

| Parameter | Value |
|---|---|
| Network | Stellar Testnet |
| Passphrase | `Test SDF Network ; September 2015` |
| Soroban RPC | `https://soroban-testnet.stellar.org` |
| Horizon | `https://horizon-testnet.stellar.org` |
| Contract ID | `CBM2YLPJU7LITS6MCELS654W6VFO4VJ35WT4273UWVR5VWA6SXISTRMM` |

---

## Security Considerations

| Threat | Mitigation |
|---|---|
| Unauthorized release | `require_auth()` + role check on every function |
| Double release | Status guard: must be `Delivered` to release |
| Buyer releasing before delivery | Status guard: `Funded → Delivered → Released` only |
| Front-running | Soroban auth is cryptographically bound to the transaction |
| Contract upgrade | No admin key — contract is immutable once deployed |

---

## Limitations (MVP)

- No dispute resolution mechanism
- No partial releases
- No escrow cancellation
- No deadline/timeout enforcement
- Testnet only (not mainnet)

These are planned for Phase 2 based on user feedback.

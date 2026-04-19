# Escrow Lite — Stellar Soroban dApp

A trustless escrow system built on Stellar Soroban smart contracts. Lock XLM, confirm delivery, release payment — no intermediary needed.

---

## Live Demo

> Deploy to Vercel and add your link here:
> **https://escrow-lite.vercel.app** ← replace with your Vercel URL

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Tech-Mihir/escrow-lite)

---

## Demo Video

> Record a short walkthrough (Loom or YouTube) showing:
> 1. Connect wallet
> 2. Create escrow
> 3. Mark delivered
> 4. Release payment
>
> **Video Link:** https://your-demo-video-link-here

---

## How It Works

```
Buyer locks XLM → Seller marks delivered → Buyer releases payment
```

1. **Buyer** connects Freighter wallet and locks XLM into the smart contract
2. **Seller** delivers work and calls `mark_delivered`
3. **Buyer** confirms and calls `release_payment` → funds sent to seller

All logic enforced on-chain. No admin. No trust required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust, Soroban SDK v22 |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Wallet | Freighter (@stellar/freighter-api v2) |
| Blockchain | Stellar Testnet, Soroban RPC |

---

## Contract Details

| Item | Value |
|---|---|
| Network | Stellar Testnet |
| Contract ID | `CBM2YLPJU7LITS6MCELS654W6VFO4VJ35WT4273UWVR5VWA6SXISTRMM` |
| Native Token | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Explorer | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBM2YLPJU7LITS6MCELS654W6VFO4VJ35WT4273UWVR5VWA6SXISTRMM) |

---

## Project Structure

```
escrow-lite/
├── contracts/
│   └── escrow/
│       ├── src/lib.rs          # Soroban smart contract
│       ├── tests/              # 13 unit tests
│       └── Cargo.toml
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── create/         # Create escrow
│   │   │   ├── escrow/[id]/    # Escrow detail + actions
│   │   │   └── api/friendbot/  # Testnet funding proxy
│   │   ├── components/
│   │   │   ├── EscrowCard.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── TxStatus.tsx
│   │   └── lib/
│   │       ├── stellar.ts      # Soroban RPC integration
│   │       ├── freighter.ts    # Wallet integration
│   │       ├── WalletContext.tsx
│   │       └── constants.ts
│   └── package.json
└── docs/
    ├── ARCHITECTURE.md         # System architecture
    ├── DEV_LOG.md              # Build history
    ├── USER_FEEDBACK.md        # User testing results
    └── user_feedback.xlsx      # Exported Google Form responses
```

---

## Quick Start

### Prerequisites
- [Freighter Wallet](https://freighter.app) browser extension set to **Testnet**
- Node.js 18+

### Run Locally

```bash
cd escrow-lite/frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```bash
cp frontend/.env.local.example frontend/.env.local
```

The example file already has the deployed contract IDs — copy as-is.

---

## Smart Contract API

| Function | Caller | Description |
|---|---|---|
| `create_escrow(buyer, seller, token, amount)` | Buyer | Lock funds, returns escrow ID |
| `mark_delivered(escrow_id, seller)` | Seller | Confirm delivery |
| `release_payment(escrow_id, buyer)` | Buyer | Release funds to seller |
| `get_escrow(escrow_id)` | Anyone | Read escrow data |
| `escrow_count()` | Anyone | Total escrows created |

---

## Testnet Users (5+ Verified Wallets)

All transactions verifiable on [Stellar Expert Testnet Explorer](https://stellar.expert/explorer/testnet).

| # | Wallet Address | Explorer Link |
|---|---------------|---------------|
| 1 | `GARMGQ2JCHZ46B6ZSXPAMPXG2RNDD6XPOBF4NF2HFFKXWKI5XKA4L3WQ` | [View](https://stellar.expert/explorer/testnet/account/GARMGQ2JCHZ46B6ZSXPAMPXG2RNDD6XPOBF4NF2HFFKXWKI5XKA4L3WQ) |
| 2 | `GDAC7JVMI3NDFBNOFWMI3GNCAYNV7UX4NF25NBACNO56T4US3IA5DFYH` | [View](https://stellar.expert/explorer/testnet/account/GDAC7JVMI3NDFBNOFWMI3GNCAYNV7UX4NF25NBACNO56T4US3IA5DFYH) |
| 3 | Add wallet address | — |
| 4 | Add wallet address | — |
| 5 | Add wallet address | — |

---

## User Feedback

**Google Form:** https://forms.gle/your-form-link-here

**Exported Responses:** [user_feedback.xlsx](./docs/user_feedback.xlsx)

Full feedback summary: [docs/USER_FEEDBACK.md](./docs/USER_FEEDBACK.md)

---

## Architecture

Full system architecture: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## Phase 2 Improvements

Based on user feedback collected during MVP testing, the following improvements are planned for Phase 2:

### 1. Dispute Resolution
Users requested a way to handle disputes when buyer and seller disagree.
- Add a third-party arbitrator role to the smart contract
- Arbitrator can split funds or refund buyer

### 2. Escrow Cancellation / Refund
Users wanted the ability to cancel an escrow before delivery.
- Add `cancel_escrow(escrow_id, buyer)` function
- Refunds buyer if status is still `Funded`

### 3. Deadline / Expiry
Users requested automatic refund if seller doesn't deliver by a deadline.
- Add `deadline: u64` (ledger timestamp) to Escrow struct
- Add `claim_refund(escrow_id, buyer)` callable after deadline

### 4. Notifications
Users wanted to know when escrow status changes.
- Integrate email notifications via on-chain events
- Add Soroban event emission on status changes

### 5. Mobile Support
Users requested mobile wallet support.
- Integrate WalletConnect for mobile wallets
- Responsive UI improvements

> **Iteration commit:** https://github.com/Tech-Mihir/escrow-lite/commit/4eb3320
> *(Link to the commit where Phase 1 iteration fixes were applied)*

---

## Security

- All state-changing functions require cryptographic auth (`require_auth`)
- Role enforcement: only designated buyer/seller can act
- Status guards prevent double-release and out-of-order transitions
- No admin key — fully trustless and immutable

---

## Run Tests

```bash
cd escrow-lite/contracts
cargo test -- --nocapture
```

13 tests covering all happy paths and edge cases.

---

## Build & Deploy Contract

```bash
cd escrow-lite/contracts
cargo build --target wasm32-unknown-unknown --release
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/escrow.wasm
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow.optimized.wasm \
  --source deployer \
  --network testnet
```

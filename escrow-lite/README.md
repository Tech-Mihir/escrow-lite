# Escrow Lite — Stellar Soroban dApp

A trustless escrow system built on Stellar Soroban smart contracts.

## Live Deployment (Testnet)

| Item | Value |
|---|---|
| Network | Stellar Testnet |
| Contract ID | `CBM2YLPJU7LITS6MCELS654W6VFO4VJ35WT4273UWVR5VWA6SXISTRMM` |
| Native Token | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Explorer | https://stellar.expert/explorer/testnet/contract/CBM2YLPJU7LITS6MCELS654W6VFO4VJ35WT4273UWVR5VWA6SXISTRMM |

## How It Works

1. **Buyer** connects wallet and locks XLM into the smart contract
2. **Seller** delivers work and marks the escrow as delivered
3. **Buyer** reviews and releases payment to the seller

All logic is enforced on-chain — no intermediary, no trust required.

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust, Soroban SDK v22 |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Wallet | Freighter (@stellar/freighter-api v2) |
| Blockchain | Stellar Testnet, Soroban RPC |

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
│   │   ├── app/                # Next.js pages
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── create/         # Create escrow
│   │   │   └── escrow/[id]/    # Escrow detail
│   │   ├── components/         # UI components
│   │   └── lib/                # Stellar SDK + Freighter
│   └── package.json
└── docs/
    └── DEV_LOG.md
```

## Smart Contract API

### `create_escrow(buyer, seller, token, amount) → u32`
Transfers `amount` tokens from buyer to contract. Returns escrow ID.

### `mark_delivered(escrow_id, seller)`
Seller-only. Transitions `Funded → Delivered`.

### `release_payment(escrow_id, buyer)`
Buyer-only. Transfers funds to seller. Transitions `Delivered → Released`.

### `get_escrow(escrow_id) → Escrow`
Read-only getter.

### `escrow_count() → u32`
Returns total escrows created.

## Security

- All state-changing functions require cryptographic authorization (`require_auth`)
- Role enforcement: only designated buyer/seller can call their functions
- Status guards prevent double-release and out-of-order transitions
- No admin key — fully trustless

## Prerequisites

- [Rust](https://rustup.rs) + `rustup target add wasm32-unknown-unknown`
- [Node.js 18+](https://nodejs.org)
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli/install-cli) — `winget install Stellar.StellarCLI`
- [Freighter Wallet](https://freighter.app) browser extension set to **Testnet**

## Quick Start

### 1. Run the frontend (contract already deployed)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### 2. Configure environment

```bash
cp frontend/.env.local.example frontend/.env.local
```

The `.env.local.example` already has the deployed contract IDs. Copy it as-is.

### 3. Get test XLM

Fund your wallet at: https://laboratory.stellar.org/#account-creator?network=test

### 4. Test the full flow

1. Connect Freighter (set to Testnet)
2. Create Escrow → enter seller address + amount → Approve in Freighter
3. Switch to seller account in Freighter → Mark Delivered → Approve
4. Switch back to buyer → Release Payment → Approve ✅

## Build & Deploy Contract (optional)

```bash
# Build
cd contracts
cargo build --target wasm32-unknown-unknown --release

# Optimize
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/escrow.wasm

# Deploy
stellar network add testnet --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015"
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/escrow.optimized.wasm --source deployer --network testnet
```

## Run Tests

```bash
cd contracts
cargo test -- --nocapture
```

13 tests covering all happy paths and edge cases.

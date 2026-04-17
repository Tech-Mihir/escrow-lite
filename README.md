# Escrow Lite — Stellar dApp

A trustless escrow application built on the Stellar blockchain using Soroban smart contracts.

## Features

- Lock XLM funds in a smart contract
- Seller marks delivery when work is complete
- Buyer releases payment after confirming delivery
- Freighter wallet integration
- Testnet Friendbot funding built-in

## Tech Stack

- **Smart Contract:** Rust + Soroban SDK
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Blockchain:** Stellar Testnet (Soroban)
- **Wallet:** Freighter

## Getting Started

### Prerequisites
- [Freighter Wallet](https://freighter.app) browser extension
- Node.js 18+

### Run Locally

```bash
cd escrow-lite/frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your contract IDs:

```env
NEXT_PUBLIC_ESCROW_CONTRACT_ID=your_contract_id
NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

## Escrow Flow

1. **Buyer** creates escrow → funds locked in contract
2. **Seller** marks as delivered
3. **Buyer** releases payment → funds sent to seller

## Contract

Located in `escrow-lite/contracts/escrow/src/lib.rs`

| Function | Description |
|---|---|
| `create_escrow` | Lock funds, returns escrow ID |
| `mark_delivered` | Seller confirms delivery |
| `release_payment` | Buyer releases funds to seller |
| `get_escrow` | Read escrow by ID |
| `escrow_count` | Total escrows created |

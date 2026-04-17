// Stellar Testnet configuration
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";

// Replace with your deployed contract ID after running:
// stellar contract deploy --wasm target/wasm32-unknown-unknown/release/escrow.wasm --network testnet
export const ESCROW_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID ?? "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";

// Native XLM asset contract on testnet
export const NATIVE_TOKEN_CONTRACT =
  process.env.NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT ??
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export const STROOPS_PER_XLM = 10_000_000n;

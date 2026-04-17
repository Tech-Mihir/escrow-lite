#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol,
};

// ── Storage keys ──────────────────────────────────────────────────────────────

const ESCROW_COUNT: Symbol = symbol_short!("ESC_CNT");

fn escrow_key(id: u32) -> (Symbol, u32) {
    (symbol_short!("ESCROW"), id)
}

// ── Data types ────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum EscrowStatus {
    Funded,
    Delivered,
    Released,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Escrow {
    pub id: u32,
    pub buyer: Address,
    pub seller: Address,
    pub amount: i128,
    pub token: Address,
    pub status: EscrowStatus,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Buyer creates an escrow, locking `amount` tokens into this contract.
    /// Returns the new escrow ID.
    pub fn create_escrow(
        env: Env,
        buyer: Address,
        seller: Address,
        token: Address,
        amount: i128,
    ) -> u32 {
        if amount <= 0 {
            panic!("amount must be positive");
        }

        buyer.require_auth();

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&buyer, &env.current_contract_address(), &amount);

        let id: u32 = env.storage().instance().get(&ESCROW_COUNT).unwrap_or(0);
        let next_id = id + 1;

        let escrow = Escrow {
            id: next_id,
            buyer: buyer.clone(),
            seller: seller.clone(),
            amount,
            token: token.clone(),
            status: EscrowStatus::Funded,
        };

        env.storage().persistent().set(&escrow_key(next_id), &escrow);
        env.storage().instance().set(&ESCROW_COUNT, &next_id);

        next_id
    }

    /// Seller marks the job as delivered.
    pub fn mark_delivered(env: Env, escrow_id: u32, seller: Address) {
        seller.require_auth();

        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&escrow_key(escrow_id))
            .expect("escrow not found");

        if escrow.seller != seller {
            panic!("unauthorized: caller is not the seller");
        }
        if escrow.status != EscrowStatus::Funded {
            panic!("invalid status: escrow must be in Funded state");
        }

        escrow.status = EscrowStatus::Delivered;
        env.storage()
            .persistent()
            .set(&escrow_key(escrow_id), &escrow);
    }

    /// Buyer releases payment to the seller.
    pub fn release_payment(env: Env, escrow_id: u32, buyer: Address) {
        buyer.require_auth();

        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&escrow_key(escrow_id))
            .expect("escrow not found");

        if escrow.buyer != buyer {
            panic!("unauthorized: caller is not the buyer");
        }
        if escrow.status != EscrowStatus::Delivered {
            panic!("invalid status: escrow must be in Delivered state");
        }

        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.seller,
            &escrow.amount,
        );

        escrow.status = EscrowStatus::Released;
        env.storage()
            .persistent()
            .set(&escrow_key(escrow_id), &escrow);
    }

    /// Read an escrow by ID.
    pub fn get_escrow(env: Env, escrow_id: u32) -> Escrow {
        env.storage()
            .persistent()
            .get(&escrow_key(escrow_id))
            .expect("escrow not found")
    }

    /// Return total number of escrows created.
    pub fn escrow_count(env: Env) -> u32 {
        env.storage().instance().get(&ESCROW_COUNT).unwrap_or(0)
    }
}

#![cfg(test)]

use soroban_sdk::{testutils::Address as _, token, Address, Env};
use escrow::{EscrowContract, EscrowContractClient, EscrowStatus};

struct TestSetup {
    env: Env,
    contract_id: Address,
    token_id: Address,
    buyer: Address,
    seller: Address,
}

impl TestSetup {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, EscrowContract);

        let admin = Address::generate(&env);
        let sac = env.register_stellar_asset_contract_v2(admin.clone());
        let token_id = sac.address();

        let buyer = Address::generate(&env);
        let seller = Address::generate(&env);

        token::StellarAssetClient::new(&env, &token_id).mint(&buyer, &10_000);

        TestSetup { env, contract_id, token_id, buyer, seller }
    }

    fn client(&self) -> EscrowContractClient {
        EscrowContractClient::new(&self.env, &self.contract_id)
    }
}

#[test]
fn test_create_escrow_success() {
    let t = TestSetup::new();
    let c = t.client();

    let id = c.create_escrow(&t.buyer, &t.seller, &t.token_id, &1_000);
    assert_eq!(id, 1);

    let escrow = c.get_escrow(&1);
    assert_eq!(escrow.buyer, t.buyer);
    assert_eq!(escrow.seller, t.seller);
    assert_eq!(escrow.amount, 1_000);
    assert_eq!(escrow.status, EscrowStatus::Funded);

    let tok = token::Client::new(&t.env, &t.token_id);
    assert_eq!(tok.balance(&t.buyer), 9_000);
    assert_eq!(tok.balance(&t.contract_id), 1_000);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_create_escrow_zero_amount() {
    let t = TestSetup::new();
    t.client().create_escrow(&t.buyer, &t.seller, &t.token_id, &0);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_create_escrow_negative_amount() {
    let t = TestSetup::new();
    t.client().create_escrow(&t.buyer, &t.seller, &t.token_id, &-500);
}

#[test]
fn test_mark_delivered_success() {
    let t = TestSetup::new();
    let c = t.client();
    c.create_escrow(&t.buyer, &t.seller, &t.token_id, &1_000);
    c.mark_delivered(&1, &t.seller);
    assert_eq!(c.get_escrow(&1).status, EscrowStatus::Delivered);
}

#[test]
#[should_panic(expected = "unauthorized: caller is not the seller")]
fn test_mark_delivered_wrong_caller() {
    let t = TestSetup::new();
    let c = t.client();
    c.create_escrow(&t.buyer, &t.seller, &t.token_id, &1_000);
    c.mark_delivered(&1, &t.buyer);
}

#[test]
#[should_panic(expected = "invalid status: escrow must be in Funded state")]
fn test_mark_delivered_double_call() {
    let t = TestSetup::new();
    let c = t.client();
    c.create_escrow(&t.buyer, &t.seller, &t.token_id, &1_000);
    c.mark_delivered(&1, &t.seller);
    c.mark_delivered(&1, &t.seller);
}

#[test]
fn test_release_payment_success() {
    let t = TestSetup::new();
    let c = t.client();
    c.create_escrow(&t.buyer, &t.seller, &t.token_id, &1_000);
    c.mark_delivered(&1, &t.seller);
    c.release_payment(&1, &t.buyer);

    assert_eq!(c.get_escrow(&1).status, EscrowStatus::Released);
    let tok = token::Client::new(&t.env, &t.token_id);
    assert_eq!(tok.balance(&t.seller), 1_000);
    assert_eq!(tok.balance(&t.contract_id), 0);
}

#[test]
#[should_panic(expected = "unauthorized: caller is not the buyer")]
fn test_release_payment_wrong_caller() {
    let t = TestSetup::new();
    let c = t.client();
    c.create_escrow(&t.buyer, &t.seller, &t.token_id, &1_000);
    c.mark_delivered(&1, &t.seller);
    c.release_payment(&1, &t.seller);
}

#[test]
#[should_panic(expected = "invalid status: escrow must be in Delivered state")]
fn test_release_payment_before_delivery() {
    let t = TestSetup::new();
    let c = t.client();
    c.create_escrow(&t.buyer, &t.seller, &t.token_id, &1_000);
    c.release_payment(&1, &t.buyer);
}

#[test]
#[should_panic(expected = "invalid status: escrow must be in Delivered state")]
fn test_release_payment_double_release() {
    let t = TestSetup::new();
    let c = t.client();
    c.create_escrow(&t.buyer, &t.seller, &t.token_id, &1_000);
    c.mark_delivered(&1, &t.seller);
    c.release_payment(&1, &t.buyer);
    c.release_payment(&1, &t.buyer);
}

#[test]
fn test_full_escrow_flow() {
    let t = TestSetup::new();
    let c = t.client();

    let id = c.create_escrow(&t.buyer, &t.seller, &t.token_id, &2_500);
    assert_eq!(id, 1);
    assert_eq!(c.escrow_count(), 1);

    c.mark_delivered(&id, &t.seller);
    assert_eq!(c.get_escrow(&id).status, EscrowStatus::Delivered);

    c.release_payment(&id, &t.buyer);
    assert_eq!(c.get_escrow(&id).status, EscrowStatus::Released);

    let tok = token::Client::new(&t.env, &t.token_id);
    assert_eq!(tok.balance(&t.seller), 2_500);
    assert_eq!(tok.balance(&t.buyer), 7_500);
}

#[test]
fn test_multiple_escrows() {
    let t = TestSetup::new();
    let c = t.client();

    let id1 = c.create_escrow(&t.buyer, &t.seller, &t.token_id, &1_000);
    let id2 = c.create_escrow(&t.buyer, &t.seller, &t.token_id, &2_000);

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(c.escrow_count(), 2);

    c.mark_delivered(&id1, &t.seller);
    c.release_payment(&id1, &t.buyer);

    assert_eq!(c.get_escrow(&id2).status, EscrowStatus::Funded);
}

#[test]
#[should_panic(expected = "escrow not found")]
fn test_get_nonexistent_escrow() {
    let t = TestSetup::new();
    t.client().get_escrow(&999);
}

# User Feedback — Escrow Lite MVP

## Google Form

User onboarding and feedback was collected via Google Form:

**Form Link:** https://docs.google.com/forms/d/e/1FAIpQLSf_fzKHtmkT2bchsLBZHi4GF8QWYxIheTzp5Gag--tA6DTHJg/viewform

### Form Fields
- Full Name
- Email Address
- Stellar Wallet Address (Testnet)
- How easy was it to use? (1–5 rating)
- Did the escrow flow work correctly? (Yes/No)
- What feature would you most like to see added?
- Any bugs or issues encountered?
- Overall product rating (1–5)

---

## Testnet Users (5+ Wallet Addresses)

The following users tested the MVP on Stellar Testnet. All transactions are verifiable on Stellar Expert.

| # | Name | Wallet Address | Escrow TX | Rating |
|---|------|---------------|-----------|--------|
| 1 | User 1 | `GARMGQ2JCHZ46B6ZSXPAMPXG2RNDD6XPOBF4NF2HFFKXWKI5XKA4L3WQ` | [View](https://stellar.expert/explorer/testnet/account/GARMGQ2JCHZ46B6ZSXPAMPXG2RNDD6XPOBF4NF2HFFKXWKI5XKA4L3WQ) | 4/5 |
| 2 | User 2 | `GDAC7JVMI3NDFBNOFWMI3GNCAYNV7UX4NF25NBACNO56T4US3IA5DFYH` | [View](https://stellar.expert/explorer/testnet/account/GDAC7JVMI3NDFBNOFWMI3GNCAYNV7UX4NF25NBACNO56T4US3IA5DFYH) | 5/5 |
| 3 | User 3 | Add wallet address here | — | — |
| 4 | User 4 | Add wallet address here | — | — |
| 5 | User 5 | Add wallet address here | — | — |

> Add more users as they test the app. Wallet addresses are verifiable at https://stellar.expert/explorer/testnet

---

## Feedback Summary

### What users liked
- Simple 3-step flow (create → deliver → release)
- No sign-up required — just connect wallet
- Instant testnet XLM funding via Friendbot button
- Clear status badges (Funded / Delivered / Released)

### Issues reported
- "localhost is not connected to Freighter" warning on first use
- Needed to disconnect/reconnect when switching accounts
- No confirmation email after escrow creation

### Feature requests
- Dispute resolution / arbitration
- Email/notification when escrow status changes
- Escrow cancellation option
- Deadline/expiry for escrows
- Mobile wallet support

---

## Exported Responses

User responses exported to Excel:

**File:** [user_feedback.xlsx](./user_feedback.xlsx)

> Export your Google Form responses: Form → Responses tab → Google Sheets icon → File → Download → Excel (.xlsx)
> Then add the file to `escrow-lite/docs/` and commit it.

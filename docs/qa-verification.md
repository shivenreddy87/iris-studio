# QA verification — A-006 to A-012 (2026-09-27)

| Item | Check | Result |
|---|---|---|
| A-006 Role isolation | `tests/security/rls-regression.sql` impersonates creators/businesses | 12/12 PASS |
| A-007 Payout suite | Creators can't read others' payouts/details or mark paid; businesses can't read payouts | PASS |
| A-008 Winner constraints | UNIQUE(contest, rank), UNIQUE(contest, influencer), rank > 0, one payout per winner; non-admins can't insert winners | PASS |
| A-009 Auth regression | Creator and business cannot self-grant admin; cannot create requests for another business | PASS |
| A-010 Responsive | Home, sign-in, sign-up at 320/375/768/1024/1440/1920 — no horizontal overflow | PASS |
| A-011 Failure/retry | Finalisation compensating rollback (payouts, status, result events) verified earlier; payout-event failure rolls back payouts | PASS |
| A-012 Web vitals (dev server) | LCP 110–400 ms, CLS ≤ 0.046 | PASS |

Re-run A-006..A-009: execute `tests/security/rls-regression.sql` as the database owner; the block always aborts, so no data is written. Every line of the report must start with PASS.

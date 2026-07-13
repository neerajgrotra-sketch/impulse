# Checklist — Schema Migration (MECHANICAL)

> **Applies to:** the mechanical act of shipping a migration against live user data. This is the *how-to-ship-it-safely* gate. Design concerns — ownership, encryption, deletion cascade, `alignment_score` exposure — live in [`./database-change.md`](./database-change.md); **run that first**.
> **Tier:** the underlying change sets its tier (usually Sensitive). This checklist is required at every tier that alters schema. Also run [`./pull-request.md`](./pull-request.md).
> *Enforces [`docs/08 Database Architecture.md §9`](../../docs/08%20Database%20Architecture.md), [`docs/10 Engineering Principles.md §4`](../../docs/10%20Engineering%20Principles.md).*

## Forward-only
*Enforces `08 Database Architecture.md §9`.*

- [ ] No down-migration in production — rolling a schema *back* over live encrypted history risks dropping irreplaceable user data. A wrong migration is fixed *forward* with another migration.
- [ ] The migration is a reviewed, versioned file in the repo, applied in CI before it touches production.
- [ ] One migration timeline (the modular monolith deploys as one unit) — no divergent branches of schema state.

## Backward-compatible deploy (expand / contract)
*Enforces `08 Database Architecture.md §9`.*

- [ ] Breaking change is split into **expand → backfill → dual-write → cut over reads → contract** across releases.
- [ ] No single deploy both writes the new shape and drops the old — old and new code run against the schema simultaneously during rollout.
- [ ] New columns are nullable or defaulted so the currently-deployed app keeps working the instant the migration lands.

## No long locks
*Enforces `08 Database Architecture.md §9`, [`.rules/backend.md`](../../.rules/backend.md) (latency budget).*

- [ ] No blocking `ALTER` that holds a heavy lock on a large hot table (add columns without volatile defaults; create indexes `CONCURRENTLY`; validate constraints in a separate step).
- [ ] Long backfills run in bounded batches, off the real-time coaching path — never inline in a request.
- [ ] Migration runtime estimated against prod-scale row counts; a lock that would stall the sync API or a coaching turn is redesigned.

## Data backfill safety
*Enforces `08 Database Architecture.md §5–§6`, [`.rules/privacy.md`](../../.rules/privacy.md).*

- [ ] Backfill is idempotent and re-runnable (safe to resume after failure); batches are checkpointed.
- [ ] Backfill respects encryption (writes through the per-user key path) and touches no field it isn't authorized to.
- [ ] Backfill introduces no banned-value enum (`lapse`, never `fail`/`failure`) and no PII into logs (Canon §2, §6).
- [ ] Deletion/cascade behavior re-verified after the shape change (see [`./database-change.md`](./database-change.md)).

## Rollback plan
*Enforces `08 Database Architecture.md §9`, [`docs/10 Engineering Principles.md §6`](../../docs/10%20Engineering%20Principles.md).*

- [ ] Rollback is **code/flag-first, not schema-down**: the previous app version runs against the new (backward-compatible) schema. The documented rollback path is "revert the deploy / flip the flag," never "reverse the migration."
- [ ] The state a rollback leaves is written down and confirmed safe (no orphaned or half-written rows).

## Tested on prod-like data
*Enforces `08 Database Architecture.md §9`, [`docs/10 Engineering Principles.md §3, §7`](../../docs/10%20Engineering%20Principles.md).*

- [ ] Migration + backfill run green against a **prod-scale, prod-shaped** dataset (volume and distribution), not a toy fixture.
- [ ] Test data is synthetic/anonymized — no production user data in fixtures (`.rules/privacy.md`).
- [ ] Timing and lock behavior from the prod-like run are recorded and within budget before promotion.

# Checklist — Database Change (DESIGN)

> **Applies to:** DESIGN-level database changes — a new/changed table, column, index, ownership boundary, or storage of a new kind of user data. This is the *design* gate; the *mechanical* safety of shipping the migration lives in [`./schema-migration.md`](./schema-migration.md) — run both.
> **Tier:** touching stored user data is almost always **Sensitive** (privacy/memory/identity) → full lifecycle ([`./new-feature.md`](./new-feature.md)) + Design Council + [`./pull-request.md`](./pull-request.md).
> *Enforces [`.rules/privacy.md`](../../.rules/privacy.md), [`.rules/security.md`](../../.rules/security.md), [`docs/08 Database Architecture.md`](../../docs/08%20Database%20Architecture.md). Reviews: [`../skills/architecture-review/SKILL.md`](../skills/architecture-review/SKILL.md) (ownership), [`../skills/security-review/SKILL.md`](../skills/security-review/SKILL.md).*

## Table ownership
*Enforces `08 Database Architecture.md §2`, [`docs/00 Canon.md §4`](../../docs/00%20Canon.md).*

- [ ] The table has exactly one owning engine-module; only that module writes it.
- [ ] No application-code join or write crosses an ownership line; cross-engine reads go over the event bus / a published interface (FKs may cross; write authority does not).
- [ ] Any new event-bus topic has a named producer, ≥1 consumer, and a versioned payload that carries no other engine's private state.

## Privacy-at-rest
*Enforces `08 Database Architecture.md §4–§5`, [`.rules/privacy.md`](../../.rules/privacy.md), [`docs/15 Constitution.md §2`](../../docs/15%20Constitution.md).*

- [ ] Every new field maps to a documented **purpose and retention**; a field with no justification is removed (data minimization — store the inference, not the raw feed).
- [ ] Intimate free-text (message/reflection/memory/decision-context shapes) is **column-encrypted** under the per-user key strategy, decryptable only inside the backend request path.
- [ ] Every table is user-scoped by `user_id`; row-level security (RLS) enforces isolation so a query bug cannot leak across accounts.
- [ ] No banned-metric columns: no "willpower score", guilt index, or streak-shame counter (Canon §7 anti-metrics have no columns).

## Deletion cascade (right-to-be-forgotten)
*Enforces `08 Database Architecture.md §6`, [`.rules/privacy.md`](../../.rules/privacy.md) #5.*

- [ ] New table hangs off `users` with `ON DELETE CASCADE` (or is otherwise swept by the erasure job).
- [ ] Derivatives are covered: embeddings deleted with their row; event-log payloads scrubbed; caches TTL'd; backups handled by crypto-shredding the per-user key.
- [ ] Erasure is provable — the change is exercised by the deletion integration test, not a manual runbook.

## Index / query impact
*Enforces `08 Database Architecture.md §1, §3`, [`docs/10 Engineering Principles.md §4`](../../docs/10%20Engineering%20Principles.md).*

- [ ] New/changed queries have supporting indexes; hot paths reviewed for full-table scans.
- [ ] Memory retrieval stays a **blended** score (similarity + recency + salience) over the pgvector ANN index — not pure similarity — and stays token-budgeted.
- [ ] Change stays inside one Postgres instance (no premature shard/replica/separate vector DB — revisit at Series A).

## `alignment_score` not exposed
*Enforces [`docs/00 Canon.md §5`](../../docs/00%20Canon.md), [`.rules/privacy.md`](../../.rules/privacy.md) #12, [`.rules/ai.md`](../../.rules/ai.md) #11.*

- [ ] `alignment_score` is computed by the **Decision Engine**, stored on `Decision`, and never surfaced to the user or handed to the model as a grade.
- [ ] No new read path, API field, log, or analytics event exposes `alignment_score` or any `Insight` outside the user's own experience.
- [ ] Every `Insight` row carries non-empty `evidence_refs` — we never persist a pattern we can't show.

## Then ship it safely
- [ ] Run [`./schema-migration.md`](./schema-migration.md) for the migration mechanics (forward-only, no long locks, backfill safety, rollback plan).

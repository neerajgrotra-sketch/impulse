# Checklist — Memory Feature

> **Applies to:** any change to how we remember a user — Memory write/salience, retrieval/ranking, embeddings, explainability of what we surface, or Memory retention/deletion.
> **Tier: SENSITIVE** — memory, always. Full lifecycle ([`./new-feature.md`](./new-feature.md)) + [`../skills/design-council/SKILL.md`](../skills/design-council/SKILL.md) + [`./pull-request.md`](./pull-request.md). Storage design/mechanics: [`./database-change.md`](./database-change.md) + [`./schema-migration.md`](./schema-migration.md).
> *Enforces [`docs/08 Database Architecture.md`](../../docs/08%20Database%20Architecture.md), [`docs/07 Coaching Engine.md §7`](../../docs/07%20Coaching%20Engine.md), [`.rules/privacy.md`](../../.rules/privacy.md), [`docs/15 Constitution.md`](../../docs/15%20Constitution.md).*

## Salience / retrieval correctness
*Enforces `08 Database Architecture.md §3`.*

- [ ] Retrieval uses the **blended score** — similarity + recency-decay + salience — not pure vector similarity; the most *useful* memory wins, not merely the closest.
- [ ] The pgvector ANN index (HNSW/IVFFlat) does first-pass similarity; recency and salience re-rank inside Postgres.
- [ ] Memory `type` is correct (`episodic` | `semantic` | `pattern`); at MVP no `pattern` memories are generated (Learning Engine output, v1.1).
- [ ] Retrieved context is token-budgeted — more memory is not more coaching (`13 Prompt Architecture.md §8`).

## Explainability — never fabricate a memory
*Enforces `07 Coaching Engine.md §7`, Canon §8, `15 Constitution.md §4 #4`.*

- [ ] Every Memory row carries a `source_ref` pointing back at the Decision/Session/Reflection it came from.
- [ ] The Coach may reference only Memory the engine actually retrieved, with its `source_ref` — no "I remember you saying…" without a real event behind it.
- [ ] Any surfaced `Insight` carries non-empty `evidence_refs`; we surface no pattern we cannot show. A fabricated memory is a lie, and trust is the product.

## Privacy-at-rest
*Enforces `08 Database Architecture.md §4–§5`, [`.rules/privacy.md`](../../.rules/privacy.md).*

- [ ] `memories.content` is column-encrypted under the per-user key; the embedding is user-scoped even though it's a lossy derivative.
- [ ] `memories` is user-scoped by `user_id` with RLS; retrieval always filters by the authenticated user.
- [ ] Memory content never appears in logs, traces, analytics, or unscrubbed prompt capture; prompts carry the minimum Memory the turn needs (Prompt Builder).

## Deletion cascade includes embeddings
*Enforces `08 Database Architecture.md §6`, [`.rules/privacy.md`](../../.rules/privacy.md) #5.*

- [ ] `memories` hangs off `users` with `ON DELETE CASCADE`; the row **and its embedding are the same row** and are deleted together — no separate vector store to sweep.
- [ ] Right-to-be-forgotten also removes derivatives (event-log payloads scrubbed, caches flushed, backups crypto-shredded via the per-user key) and runs as a tracked job with a completion receipt.
- [ ] Deletion is exercised by the erasure integration test against real derived stores, not a manual runbook.

## Retention limits
*Enforces `08 Database Architecture.md §5–§6`, [`.rules/privacy.md`](../../.rules/privacy.md) #14, `15 Constitution.md §2`.*

- [ ] Every Memory field has a stated purpose and a **bounded** retention — we never keep coaching data indefinitely by default.
- [ ] Data minimization holds: we store the distilled inference (a summary), not a raw transcript we don't need.
- [ ] A new Memory field/signal is justified in the feature-spec against minimization and purpose limitation (and a PDR if it sets policy).

## Consent + Design Council
*Enforces Canon §8, [`../skills/design-council/SKILL.md`](../skills/design-council/SKILL.md).*

- [ ] Widening what we remember, or cross-context use of Memory, checks the relevant `consent_scope` at runtime.
- [ ] Design Council held with Safety / Consent / Explainability addressed explicitly; personalization must feel like being *known*, never *watched* — when in doubt, reference less and reflect more ([`./coaching-feature.md`](./coaching-feature.md)).

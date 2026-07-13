---
name: database-review
description: Use when reviewing a schema, migration, or data-access change to verify module table ownership, forward-only migration safety, pgvector/Memory correctness, privacy-at-rest, deletion cascade, no PII in logs, and that alignment_score is never exposed.
---

## Purpose

PostgreSQL is our system of record, pgvector backs **Memory** embeddings, and Redis handles queues/rate-limits/session cache (Canon §6). Because each engine privately owns its tables and because "trust is the product" (Canon §3, principle #7), a data change is one of the highest-leverage places to help or harm a user. This skill reviews schema and migration diffs so we keep table ownership honest, migrations safe on live data, privacy enforced at rest, and the **alignment_score** — which is never a number or grade to the user — from ever leaking.

Enforces [`.rules/database.md`](../../../.rules/database.md). Defers to [`.rules/architecture.md`](../../../.rules/architecture.md) for which engine owns which bounded context and to [`.rules/backend.md`](../../../.rules/backend.md) for query/egress and idempotency at the application layer.

## When to use

**Tier: Standard and Sensitive.** Run on any change to a table, index, constraint, migration, embedding column, retention/deletion path, or a query that reads across engines. Any change touching Memory, Identity, privacy, or the storage of coaching/safety data is **Sensitive** (CONVENTIONS §2) and additionally requires the full lifecycle and Design Council; this skill covers the data engineering surface. Trivial non-schema changes use the PR checklist.

## Inputs

- The migration file(s) and schema diff, with the owning engine for every affected table.
- The canonical data model and field list for affected aggregates (Canon §5: User, Identity, Decision, Outcome, CoachingSession, Message, EmotionSignal, Reflection, Memory, Insight, Nudge).
- The pgvector column definition, embedding dimension, and index type/params for any Memory change.
- The deletion/retention requirement for affected data and the consent/covenant version it falls under (Canon §5, §8; the Covenant in `15 Constitution.md`).
- Log/observability config for tables involved, to verify no PII or `alignment_score` is emitted.

## Outputs

- A pass/block verdict per checklist item, each citing the rule in `.rules/database.md` and the file/line.
- A flag for any table written or read by an engine that does not own it, with the correct owner and the compliant access path (owner's interface or event bus).
- A migration-safety assessment: whether it is forward-only, non-locking on large tables, and reversible-in-effect without data loss.
- A list of any at-rest privacy gaps, missing deletion cascades, PII-in-logs, or `alignment_score` exposure.

## Checklist

- [ ] **Module table ownership:** every table changed is owned by exactly one engine, and no query in the diff reads or writes a table owned by a different engine — cross-engine data is obtained via the owner's interface or the event bus (Canon §4; defers to `.rules/architecture.md`).
- [ ] **Forward-only migration safety:** the migration is forward-only and safe on live data — additive by default; new columns are nullable or defaulted; no destructive change (drop/rename/type-narrow) without an explicit, staged, expand-then-contract plan; large-table operations avoid long locks (concurrent index build, no blocking backfill in the migration).
- [ ] **No data loss:** the migration does not drop or truncate user data (Decision, Outcome, Identity, Memory, Message) without an explicit retention/deletion decision recorded; backfills are idempotent and re-runnable.
- [ ] **pgvector / Memory correctness:** embedding column has a fixed, correct dimension matching the model that produces it; the vector index (e.g. ivfflat/hnsw) and distance operator match the query; `salience`, `type(episodic|semantic|pattern)`, and `source_ref` are populated so Memory stays explainable (Canon §5).
- [ ] **Explainability at rest:** any Insight-bearing row carries `evidence_refs`; we never persist an asserted pattern we cannot show (Canon §8: "every Insight carries evidence_refs").
- [ ] **Privacy-at-rest:** sensitive fields (message text, reflection responses, identity statements, emotion signals) are protected per the privacy rules; storage honors the Covenant and the user's `covenant_version`/consent flags (Canon §5, §8).
- [ ] **Deletion cascade:** deleting a User removes or anonymizes all dependent data — Identity, Decision, Outcome, CoachingSession, Message, EmotionSignal, Reflection, Memory (incl. embeddings), Insight, Nudge — with no orphaned rows and no vector left in pgvector; the cascade is defined and tested, not implicit ("earn the right to hold this data").
- [ ] **No PII in logs:** no migration, trigger, or query logs raw user content, identifiers, or embeddings; observability output for these tables is privacy-scrubbed (Canon §6; defers to `.rules/backend.md`).
- [ ] **alignment_score never exposed:** `alignment_score` stays on Decision, drives coaching and the aggregated north-star metric only, and is never selected into a user-facing response, a client-synced payload, an export, or a log as a raw number/grade (Canon §5: "never displayed as a number or letter grade").
- [ ] **Constraints & integrity:** foreign keys, NOT NULL, and enum/status constraints (e.g. Decision `status(open|resolved)`, Outcome `kind(aligned|lapse|recovery)`) match Canon §5 exactly; no silent widening that would admit invalid states.
- [ ] **Canon field names:** column and aggregate names use Canon §5 vocabulary verbatim; no synonym is introduced for a canonical field.

## Success criteria

- Every table in the diff has exactly one owning engine and no cross-engine table access — verifiable by mapping each query to an owner.
- The migration applies forward-only on a production-sized table without a long lock and without dropping user data; backfills are re-runnable.
- Memory embeddings have correct dimension, index, and distance operator, and every Insight row has `evidence_refs`.
- Deleting a User leaves zero dependent rows and zero orphaned vectors — verifiable by a deletion test.
- `alignment_score` appears in no user-facing response, synced payload, export, or log; no PII appears in any log for the affected tables.

## Failure criteria

- A query reads or writes a table owned by another engine.
- A migration drops, renames, narrows, or truncates user data without a staged plan and recorded retention decision, or holds a long lock on a large table.
- An embedding column has the wrong dimension, or the index/distance operator does not match the query.
- A User deletion leaves orphaned rows or leaves embeddings in pgvector.
- `alignment_score` is exposed as a number/grade in any response, payload, export, or log, or any PII is written to logs.
- A status/kind constraint diverges from Canon §5, admitting invalid states.

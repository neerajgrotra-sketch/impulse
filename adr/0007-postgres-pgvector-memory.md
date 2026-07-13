# ADR 0007 — Postgres as system of record + pgvector for the Memory Engine

> **Status:** Accepted
> **Date:** 2026-07
> **Deciders:** Founding Engineering

## Context

The Memory Engine needs semantic retrieval over embeddings — the obvious 2026 default is a dedicated vector database. But Memory does not live alone. A retrieved memory is only useful *in relational context* (which Decision produced it, which Session, which Reflection), and the most dangerous data we hold — a user's temptations, Lapses, and Future Self — must be *disposable enough to honour the Covenant* (principle #7, "earn the right to hold this data"). A separate vector store forces the authoritative user model into one system and its embeddings into another: two sources of truth, two deletion paths, two consistency problems — and exactly the place a forgotten user's ghost survives a right-to-be-forgotten request.

Canon §6 fixes PostgreSQL as the system of record with **pgvector** for Memory embeddings, and `docs/08 Database Architecture.md` §1, §3 commit the reasoning. Our relational core (Identity → Decision → Outcome → Session → Message) has real foreign-key invariants and needs transactions; "boring scales further than founders fear."

## Decision

**PostgreSQL is the single system of record, and Memory embeddings live in the same database via pgvector** — the embedding is a column on the `memories` row it describes, not a separate store. Memory retrieval runs an approximate-nearest-neighbour index (HNSW/IVFFlat) inside Postgres for first-pass similarity, then re-ranks candidates by a **blended score** (similarity + recency + salience). Sensitive free-text columns are encrypted at rest with per-user key derivation. We do **not** run a separate vector database at v1.

## Consequences

**Positive**

- **One system of record** — a memory row and its embedding are the same row; retrieval joins semantic similarity to relational context in a single query.
- **Atomic deletion** — right-to-be-forgotten is one cascading `DELETE` (embeddings included), plus crypto-shredding the per-user key; no distributed erase to reconcile, no ghost in a second store.
- **Uniform encryption** — one key strategy, one at-rest boundary.
- **Transactions and integrity** — a coaching turn writes Message + EmotionSignal + Outcome atomically; foreign keys forbid orphans a document store would allow.
- One fewer system to operate, secure, and back up — the right trade for a small team.

**Negative**

- We accept slightly less raw ANN throughput than a specialised vector store, and pgvector index tuning (HNSW/IVFFlat) becomes our responsibility.
- Embedding-heavy workloads share the primary Postgres with the coaching path until scale forces a split; the async embedding worker helps but the database is shared.

**Neutral**

- Retrieval deliberately blends recency and salience with similarity — pure similarity surfaces the *closest* memory, not the *most useful* one.
- This is a v1 decision, revisited only at Series A scale; a separate vector DB is on the table *only* if throughput genuinely forces it **and** we can preserve atomic deletion (`docs/08 Database Architecture.md` Open questions).
- The embedding is a lossy derivative, still user-scoped and deleted on cascade.

## Alternatives considered

- **A dedicated vector database (Pinecone/Weaviate/Qdrant/etc.) alongside Postgres** — rejected at v1: two sources of truth, two deletion paths, and a place a forgotten user's embeddings survive erasure. The Covenant's atomic-deletion requirement outweighs the throughput gain at our scale.
- **A document store as system of record** — rejected: our data is a graph of foreign keys with real invariants (no Outcome without a Decision); a document store would let us write orphans and lose transactional coaching turns.
- **Pure vector similarity for retrieval (no re-rank)** — rejected: it forgets what is important-but-phrased-differently and clings to stale memories; recency and salience approximate human "this matters right now."

## Links

- `docs/08 Database Architecture.md` §1 (why Postgres is the system of record), §3 (Memory + pgvector; blended retrieval; why not a pure vector DB), §5–6 (encryption, deletion)
- `docs/00 Canon.md` §6 (Postgres + pgvector fixed for v1), §5 (Memory aggregate), §3 (principle #7)
- ADR 0001 (modular monolith — one Postgres, one Redis), ADR 0003 (Identity as root aggregate)

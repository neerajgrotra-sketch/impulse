# ADR 0004 — The iOS client is offline-first with an idempotent sync contract

> **Status:** Accepted
> **Date:** 2026-07
> **Deciders:** Founding Engineering

## Context

The client has one job the backend cannot do: **be present at the Impulse Moment.** The AI Brain is where reasoning lives; the phone is where temptation lives — and the moment of temptation often has no signal. People decide in parking lots, late at night, mid-argument, in checkout lines, on the subway. If the app requires a network round-trip to be useful, it fails exactly when it matters, and we lose the highest-value events: the impulsive ones, in the worst locations.

This is why Canon §6 specifies the client as **offline-first** (not offline-tolerant) with a thin, idempotent sync API, and `docs/11 iOS Navigation.md` §1–2 makes it architecture rather than a feature. It is also how we honor principle #5, *progress over perfection*: the user must always be able to *act*, and we sync when we can. The backend remains the system of record (`docs/08 Database Architecture.md`); the open question is where authority and durability sit between device and server.

## Decision

The iOS client (Swift + SwiftUI, MVVM + lightweight Coordinator) is **offline-first and server-authoritative**. The device holds a **cache and an outbox** — it writes locally first and treats the write as durable — while Postgres stays the system of record. With no signal the app must **capture** the Impulse Moment locally, **coach in a degraded deterministic mode** (Decision-frame scaffolding, no LLM), and **sync later**. Every client-originated write carries a **client-generated UUID** and an idempotency key, so replaying the outbox after reconnect upserts to exactly one row.

## Consequences

**Positive**

- The user is never blocked on the network at the moment that matters; capture and basic structuring always work.
- IDs are client-minted UUIDs, so a Decision created offline is a first-class, authoritative record before it ever reaches the server, and re-sends are safe by construction.
- Degraded mode is honest, useful coaching (name the impulse, surface the tradeoff, time-horizon reframe, offer a pause), not a placeholder — and it upgrades quietly when the Brain enriches the record on sync.

**Negative**

- Two stores to keep coherent (SwiftData cache + Postgres) and a sync/conflict model to own — genuine complexity we take on deliberately.
- Degraded on-device coaching is a *subset* of the real Coach and must be scoped carefully so it helps without pretending to be the full engine.
- Memory retrieval and embeddings stay server-side, so offline coaching runs on only a small, recently-relevant local slice.

**Neutral**

- Conflict resolution is last-writer-wins per field with a server clock for mutable aggregates, append semantics for `messages[]`/`moves[]`; unresolvable conflicts are surfaced as a gentle choice, never silently discarded.
- Server **safety and consent** state always wins over stale client state — a consent revoked on the server is never overridden by an offline client (safety pre-empts everything, Canon §8).
- A `sync_state` cursor per user/device keeps sync incremental, not a full re-download.

## Alternatives considered

- **Online-only / offline-tolerant client** — rejected: it fails exactly at the Impulse Moment (no signal), losing the highest-value events. Offline-first is a product requirement, not an enhancement.
- **Client as source of truth (local-authoritative)** — rejected: the backend must hold the authoritative user model, run Memory/embeddings, and enforce safety and consent; the device holding truth would fracture all of that.
- **Server-assigned sequence IDs** — rejected: the client must mint an authoritative identifier *before* reaching us for offline capture and idempotent replay; UUIDs are what make the outbox safe to re-send.

## Links

- `docs/11 iOS Navigation.md` §1–2 (offline-first rationale and shape), §6 (MVVM + Coordinator, the Repository seam)
- `docs/08 Database Architecture.md` §8 (offline-first sync, idempotent writes, conflict resolution)
- `docs/00 Canon.md` §6 (iOS stack, offline-first, idempotent sync), §8 (safety/consent pre-empt stale client state)

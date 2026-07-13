---
name: performance-review
description: Use when a change could affect coaching latency, LLM token/tier cost, iOS memory or battery, database query or index health, or behavior under load — it checks work against the system's stated budgets and its graceful-degradation contract.
---

## Purpose

Coaching is a promise to **Present Self** *now* (`docs/12 Backend Architecture.md` §3): at the **Impulse Moment**, every hundred milliseconds is friction between the user and a better decision. Cost, meanwhile, scales per token per turn per user — sloppy context is a linear tax on every conversation (`docs/13 Prompt Architecture.md` §8). And the client must help at the moment of temptation, often with no signal, without draining a phone. This skill reviews a change against the system's **observable performance budgets** — the coaching sync-path latency budget, LLM token/tier discipline, iOS memory/battery restraint, database query/index health — and against the **graceful-degradation** contract that says we fail toward safety and silence, never toward a slow or harmful turn.

It enforces [`.rules/performance.md`](../../../.rules/performance.md) and the budgets fixed in `docs/12 Backend Architecture.md` §3 and §5, `docs/13 Prompt Architecture.md` §5 and §8, `docs/08 Database Architecture.md` §3, and `docs/11 iOS Navigation.md` §2 and §7. Performance is not decoration here: a turn that misses the latency budget or a fallback that degrades toward harm is a coaching failure, not a metrics blip.

## When to use

Per the change-tiering model (`.claude/CONVENTIONS.md` §2):

- **Trivial** (copy, pure refactor with no query/loop/allocation change): PR checklist only.
- **Standard** (new endpoint, screen, query, or logic on a hot path that is NOT sensitive): run the latency, cost, DB, and iOS sections relevant to the surface.
- **Sensitive** (touches the synchronous coaching path, the **LLM gateway**, **Memory** retrieval, the model tier, or the offline degraded-mode path): run the **entire** checklist including the degradation section, because a regression here is felt by a user at their weakest moment. Tier up when unsure.

## Inputs

- The diff, and which path it sits on: the **synchronous coaching path** (user is waiting) or the **asynchronous path** (Learning/Notification/embedding workers).
- For LLM calls: the requested capability tier (`fast` / `dialogue` / `deep`), the per-layer token budget, and the expected tokens in/out (`docs/13 Prompt Architecture.md` §5, §8).
- For DB changes: the queries added or altered, their `EXPLAIN` plan, and the indexes they rely on.
- For iOS changes: what runs on the device, on the main thread, in the background, and on the widget / Live Activity / Lock Screen surfaces (`docs/11 iOS Navigation.md` §7).
- The behavior under provider outage, timeout, or offline: the intended fallback.

## Outputs

- A pass / block decision against the budgets below. A change that pushes the sync path over its p95 budget, adds an unbounded query, uploads unbounded context, or degrades toward harm is a **block**.
- A findings list mapped to `.rules/performance.md`, each naming the budget breached and the measured or estimated cost.
- Where a budget is deliberately changed, an ADR recording the new number and the WHY (`.claude/CONVENTIONS.md` §3).

## Checklist

**Latency — the coaching sync-path budget**
- [ ] The synchronous coaching turn stays within **p95 ≤ 2.5s to first useful response** (`docs/12 Backend Architecture.md` §3.1). WHY: this is the moment the user feels; blow it and structure loses to impulse.
- [ ] Non-model steps stay in the noise against their stated shares — Safety screen ~50ms, Emotion infer ~80ms, Identity get ~10ms, Memory retrieve ~60ms, Decision frame ~30ms, Prompt Builder assemble ~15ms; the **Sonnet 5** turn (~1500ms) is the dominant term and everything else must not balloon (`docs/12 Backend Architecture.md` §3.1).
- [ ] Nothing on the sync path blocks on the async workers; events are emitted fire-and-forget after the response ships (`docs/12 Backend Architecture.md` §3.1, §3.2). No synchronous learning.
- [ ] Pre-turn classifiers (emotion, bias, **Safety** triage) run on **Haiku 4.5**, not a heavier tier, because they run on nearly every inbound turn and must be cheap and fast (`docs/13 Prompt Architecture.md` §5).
- [ ] The **Sonnet 5** turn is streamed to the client so 1.5s *feels* like 0.3s (`docs/12 Backend Architecture.md` §3.1).

**Cost — LLM token & tier discipline**
- [ ] The call is routed **by task, not by convenience**: a turn does not "upgrade to **Opus 4.8** because it's important" mid-dialogue; depth work moves off the interactive path to a background worker (`docs/13 Prompt Architecture.md` §5). WHY: latency is part of the coaching experience.
- [ ] Each prompt layer respects its token budget; **Layer 3 (Memory)** is ranked by salience + relevance and **truncated to budget** — more retrieved **Memory** is not more coaching (`docs/13 Prompt Architecture.md` §8). WHY: over-stuffed context taxes both the P&L and quality.
- [ ] The stable outer layers (**Layer 1 Constitution** + **Layer 2 engine context**) stay cacheable — the change does not break the prompt-cache prefix by making an outer layer volatile (`docs/13 Prompt Architecture.md` §5, §2). The Constitution appears on every turn; without caching we pay for it thousands of times an hour.
- [ ] The call passes through the **LLM gateway** so it is metered, rate-limited, and cost-attributed (user, engine, tier, tokens); no raw model access bypasses the gateway's budgets and breaker (`docs/12 Backend Architecture.md` §5).

**iOS memory & battery**
- [ ] Work stays off the main thread; the View renders ViewModel state and never blocks on the network, so the UI is identical and responsive online and offline (`docs/11 iOS Navigation.md` §6).
- [ ] The device holds only a **cache and an outbox** — a working slice of Identity and recently-retrieved **Memory** — never the full store; embedding and retrieval stay server-side (`docs/08 Database Architecture.md` §8). WHY: the phone is not the system of record and must not carry its memory footprint.
- [ ] Moment surfaces (widget, Live Activity, Lock Screen control) read from the local store and respect iOS background-refresh limits; they do not spin a live fetch or a wake-heavy loop (`docs/11 iOS Navigation.md` §7). Haptics/motion are restrained — no reward-style buzz or celebratory animation that wastes battery and coaches the wrong nervous system.

**Database query & index health**
- [ ] Every query the change adds is a bounded lookup — no open-ended scan; **Memory** retrieval is a bounded ANN kNN (HNSW/IVFFlat) re-ranked by recency + salience, never a full similarity sweep (`docs/12 Backend Architecture.md` §3.1, `docs/08 Database Architecture.md` §3).
- [ ] New query paths are backed by an index; the `EXPLAIN` plan shows no unindexed sequential scan on a hot path, and no N+1 across the engine boundary.
- [ ] The coaching turn's writes (Decision + Message + EmotionSignal) commit in **one transaction**, not a chatty series of round-trips (`docs/12 Backend Architecture.md` §1, §3.1).
- [ ] Migrations are expand/contract and forward-only — no single deploy both writes new and drops old, and no backfill locks a hot table (`docs/08 Database Architecture.md` §9).

**Graceful degradation under load / failure**
- [ ] On primary-tier timeout or outage the change degrades gracefully — tier fallback (`dialogue`→`fast`) for a simpler turn, or a cached/templated Constitution-safe holding response — **except that Safety triage never degrades below its required capability** (`docs/13 Prompt Architecture.md` §8, `docs/12 Backend Architecture.md` §5).
- [ ] The change **fails toward safety and silence, never toward harm**: if a validated, safe turn cannot be produced, we say less rather than ship an unvalidated one (`docs/13 Prompt Architecture.md` §8). A missing turn is recoverable; a shaming or unsafe turn breaks the Covenant.
- [ ] Offline, the client still captures the **Impulse Moment** and runs deterministic degraded-mode structuring; it never blocks the user on the network (`docs/11 iOS Navigation.md` §2).
- [ ] Gateway timeouts are tight on the sync path and generous on the `deep` async path; retries are bounded, jittered, respect the remaining latency budget, and never stampede a struggling provider (`docs/12 Backend Architecture.md` §5).

## Success criteria

- The synchronous coaching turn holds **p95 ≤ 2.5s to first useful response** under representative load, measured, with non-model steps within their stated shares.
- LLM calls route to the correct tier for the task, **Layer 3 Memory** is truncated to its token budget, and the **Layer 1–2** cache prefix is intact — verifiable in the per-call cost/tier trace through the gateway.
- iOS work is off the main thread, the device carries only a cache + outbox, and moment surfaces render from local state within iOS background-refresh limits.
- Every added query is index-backed and bounded (no unindexed sequential scan on a hot path, no N+1), confirmed by `EXPLAIN`; the turn's writes commit in one transaction.
- Under simulated provider outage/timeout the turn degrades to a safe simpler turn or a safe holding response, **Safety** triage still runs at full capability, and offline capture still works — all demonstrable by test.

## Failure criteria

- A change that pushes the synchronous coaching turn over its p95 latency budget, or lets a non-model step balloon out of the noise.
- A synchronous path that blocks on an async worker, or depth work (**Opus 4.8** synthesis) run inline on the interactive path.
- Unbounded **Memory** context (Layer 3 not truncated to budget), a broken prompt-cache prefix, a heavier tier used for a task the cheaper tier owns, or a model call that bypasses the **LLM gateway**'s metering and breaker.
- An unindexed sequential scan or N+1 on a hot path, an unbounded similarity scan instead of a bounded ANN kNN, or a migration that locks a hot table or both writes-new-and-drops-old in one deploy.
- iOS work on the main thread, the device holding more than a cache + outbox, or a moment surface that spins a live fetch / wake-heavy loop.
- A fallback that degrades **Safety** triage below its required capability, or that ships an unvalidated turn rather than falling toward safety and silence; or an offline path that blocks the user on the network.

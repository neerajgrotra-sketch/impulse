# Performance Rules

**Purpose:** Keep Impulse fast, cheap, and dependable in the one moment that matters — an Impulse Moment, often at 11pm on a weak connection. **Scope:** the synchronous coaching path, LLM cost/latency, the iOS client's responsiveness and battery, database query health, and behavior under load and degradation.

Performance is not decoration here. A coach that arrives late, drains the battery, or falls silent under load has failed the user at the exact moment they reached for help. We budget performance like we budget safety: explicitly, and enforced.

1. The synchronous coaching turn MUST meet a stated latency budget (first token and full turn); a change that regresses it NEVER merges without an accepted tradeoff — WHY: `docs/12 Backend Architecture.md` §3/§5 makes the coaching path the latency-critical path; a slow coach loses the moment.
2. Non-urgent work (Learning, Notification, embedding, analytics) MUST run off the event bus, NEVER inline in the coaching request — WHY: Canon §6 separates the fast path from the slow path so learning never taxes the person waiting.
3. LLM calls MUST use the cheapest model tier that meets the task's quality bar (Haiku triage/classify, Sonnet dialogue, Opus deep async) — WHY: `docs/13 Prompt Architecture.md` §5 makes tiering the primary cost/latency lever; paying Opus rates for classification is waste.
4. Stable prompt layers (Constitution/system, engine context) MUST be structured for prompt caching — WHY: `docs/13` §5/§8 — the outer layers are identical across turns; re-billing and re-processing them every turn is pure loss.
5. Every LLM call MUST carry a token budget and a timeout, and MUST have a defined behavior on breach — WHY: an unbounded call is an unbounded bill and an unbounded wait; graceful limits beat silent runaway.
6. On model timeout, error, or unsafe output, the system MUST degrade to the deterministic fallback coach rather than hang or crash — WHY: `docs/04 AI Brain.md` — graceful degradation is a first-class requirement for a coach; a spinner is not coaching.
7. Database reads on the coaching path MUST be indexed and bounded (no unbounded scans, no N+1 across the turn) — WHY: `docs/08 Database Architecture.md` §3 — Memory retrieval sits in the hot path; an unindexed query there degrades every turn.
8. Memory retrieval MUST cap candidate set size and blend semantic + recency + salience within a fixed budget — WHY: unbounded vector search grows with the user's history, so the most loyal users would get the slowest coach.
9. The iOS client MUST render the capture surface and local/offline coaching without waiting on the network — WHY: `docs/11 iOS Navigation.md` §2/§7 — offline-first means the moment is served from the device; a network round-trip is not on the critical path.
10. The client MUST NOT do sustained background work, polling, or animation that drains battery or warms the device — WHY: `docs/11` §7 — a calm product is physically unobtrusive (Rams); a hot phone is a broken promise.
11. Performance budgets (latency, token cost/turn, query time, cold-start) MUST be expressed as observable numbers and tracked, NOT described qualitatively — WHY: "feels fast" is not a gate; `performance-review` can only enforce a number.
12. Load and degradation behavior MUST be tested before a Sensitive-tier change ships — WHY: the failure that matters is the one under real load; "fast on my laptop" tells us nothing about the 11pm spike.

**How this is enforced:** the [`performance-review`](../.claude/skills/performance-review/SKILL.md) skill (required for changes touching the coaching path, the LLM gateway, Memory retrieval, or client responsiveness — Standard tier, escalating to Sensitive when on the coaching path), the performance clusters in the relevant checklists, and CI budgets where numbers can be measured. Budgets are owned by the module they live in and reviewed against `docs/12`, `docs/13`, `docs/08`, and `docs/11`.

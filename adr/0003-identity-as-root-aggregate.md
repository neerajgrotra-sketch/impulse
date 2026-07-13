# ADR 0003 — Identity, not Goal, is the root of the data model

> **Status:** Accepted
> **Date:** 2026-07
> **Deciders:** Founding Engineering

## Context

Every product in this space defaults to a goal (or a habit, or a streak) as the central object of its data model. We are deliberately not that product. Principle #4 is **identity over goals** — we help users *become someone*, not merely *accomplish something* (Canon §3). An `Identity Statement` is the root of the user model (Canon §2), and Canon §5 fixes the root aggregate as **Identity, not Goal**.

This has to be made *structural*, not aspirational. If Goal were the root, the schema itself would keep pulling coaching back toward task completion and streaks — the anti-metrics we refuse to optimize (Canon §7). Where the root sits also decides two things we care about most: what every engine reads *before* it acts (understand-before-advise, Canon §8), and whether per-user isolation and right-to-be-forgotten are properties of the schema or of careful application code. `docs/08 Database Architecture.md` §2 records the aggregate layout.

## Decision

**Identity is the root aggregate.** The `identities` table is one-to-one with `users` and holds `values`, `identity_statements`, `future_self_narrative`, and `virtues`. A `Decision` (the Impulse Moment) is scored for *alignment* against this identity, never against a goal's completion. There is no `goals` table at the center of the model; every other aggregate hangs off `users`, and the "who you are becoming" that engines read first is the Identity model.

## Consequences

**Positive**

- Principle #4 is enforced by structure: the object coaching reasons about is *who the user is becoming*, so it is hard to accidentally drift into task/streak optimization.
- `alignment_score` has a natural referent — the identity a decision does or does not serve — rather than a goal's percent-complete.
- Every engine has one obvious place to read the user model before acting, making understand-before-advise (Canon §8) tractable.

**Negative**

- Identity is softer and harder to elicit than a goal; onboarding and the Identity Engine carry the weight of turning a fuzzy self-concept into `identity_statements` we can coach against (`docs/05 Onboarding.md`).
- Users arriving with a concrete goal ("run a 10k") must be met where they are and helped to connect it to identity — an extra translation step a goal-rooted model would skip.

**Neutral**

- Goals, when they matter to a user, are represented as context or options within a `Decision`, not as the spine of the model.
- Because every aggregate hangs off `users`, per-user isolation (RLS) and cascading right-to-be-forgotten are schema properties, not application conventions (`docs/08 Database Architecture.md` §4, §6).

## Alternatives considered

- **Goal (or Habit) as root aggregate** — rejected: it structurally biases the whole product toward accomplishment and streaks, contradicting principle #4 and inviting the anti-metrics (Canon §7). The schema would fight the philosophy.
- **Decision (the Impulse Moment) as root** — rejected: the Impulse Moment is the atomic *event*, not the durable subject. Rooting on it would leave "who is this person becoming" homeless and scatter the user model.
- **No explicit root — a flat set of peer entities** — rejected: nothing would encode "read the user's identity before you act," and the understand-before-advise gate would have no single anchor.

## Links

- `docs/08 Database Architecture.md` §2 (the relational core; Identity as root), §4 (per-user isolation), §6 (deletion cascade)
- `docs/00 Canon.md` §5 (canonical aggregates; root is Identity, not Goal), §3 (principle #4), §7 (anti-metrics)
- `docs/05 Onboarding.md` (identity capture) — referenced for how the root gets populated

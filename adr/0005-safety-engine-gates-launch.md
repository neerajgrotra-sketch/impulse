# ADR 0005 — A cross-cutting Safety Engine pre-empts coaching and gates launch

> **Status:** Accepted
> **Date:** 2026-07
> **Deciders:** Founding Engineering

## Context

Impulse coaches people at their most vulnerable — at Impulse Moments, mid-Lapse, late at night. Some inbound messages are not coaching problems at all; they are crises (clinical risk, self-harm, acute danger). Coaching a person in acute crisis is the *wrong act entirely*: the correct response is a mandated message and a route to human resources, not a Reframe. A missed crisis is not a quality bug — it is a harm.

Canon §8 states it as a cross-cutting constraint: **safety pre-empts everything.** The Safety Engine (Canon §4) is the one engine whose *placement* is itself a safety property, and its MVP status is explicitly "**Alive — gates launch.**" `docs/04 AI Brain.md` §4 works out why it must sit in front of the pipeline rather than inline, and ties correctness to a guardrail metric (crisis-handoff correctness, Canon §7). This decision also inherits ADR 0002's line: deciding whether a message is a crisis is exactly the kind of thing we never delegate to the model alone.

## Decision

The **Safety Engine is a cross-cutting, pre-emptive gate** that runs first on **every** inbound message, before the Coach Engine composes anything. A Haiku-tier classifier produces a risk signal `{none|low|elevated|crisis}`; **deterministic code**, not the model, maps signal → action, biased toward false positives. On `crisis` it **hard-stops** the normal coaching spine — no Decision framing, no Coaching Move, no LLM turn — and emits the mandated response plus a human handoff (`docs/15 Constitution.md`). Crisis-handoff correctness working is a **launch gate**: we do not ship without it.

## Consequences

**Positive**

- A crisis is caught before we spend tokens framing a decision or retrieving memory — correct for both latency and, decisively, for the user.
- Coaching a person in acute crisis is made *architecturally impossible* to reach, not merely discouraged by a prompt.
- The final safety decision is deterministic and testable in CI; the model only informs it.

**Negative**

- Every inbound turn pays a triage step before any coaching begins — a small, deliberate latency and cost tax on the hot path.
- A bias toward false positives means some hard-but-safe messages are treated as elevated, occasionally interrupting normal coaching. We accept this asymmetry: the reverse error is intolerable.
- The engine is a hard launch dependency — it cannot be deferred, stubbed, or shipped "later."

**Neutral**

- Under low classifier confidence the system degrades toward caution: Safety escalates rather than waves through (`docs/04 AI Brain.md` §6).
- Safety runs cross-cutting and in front, not as a peer the Coach Engine chooses to call; the topology, not policy discretion, guarantees it runs (`docs/12 Backend Architecture.md` §6).
- The specific mandated responses and handoff resources are owned by the Constitution, not this ADR.

## Alternatives considered

- **Safety as a system-prompt instruction to the coaching model** — rejected: makes the most consequential decision a model behavior we hope for. It must be a code path with test cases and a hard-stop.
- **Safety as an inline step within the coaching spine** — rejected: a crisis would already have triggered decision framing, memory retrieval, and token spend; pre-emption before the spine is the only correct placement.
- **Let the model be the final arbiter of crisis** — rejected: a missed crisis is a harm, not a quality regression; code owns the decision, the model only classifies, and thresholds err toward caution.

## Links

- `docs/04 AI Brain.md` §4 (Safety as a pre-emptive gate), §2–3 (topology and the turn), §6 (degrade toward caution)
- `docs/00 Canon.md` §4 (Safety Engine — "Alive, gates launch"), §7 (crisis-handoff correctness guardrail), §8 (safety pre-empts everything)
- `docs/12 Backend Architecture.md` §6 (the backend guarantees Safety runs on every inbound turn)
- `docs/15 Constitution.md` (mandated responses and human handoff), ADR 0002 (never delegate safety to the model)

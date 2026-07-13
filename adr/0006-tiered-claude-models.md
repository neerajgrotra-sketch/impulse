# ADR 0006 — Tiered Claude models behind one provider-abstracted gateway

> **Status:** Accepted
> **Date:** 2026-07
> **Deciders:** Founding Engineering

## Context

Given ADR 0002 (the LLM is a scoped tool, not the brain), the work we hand to models is not one uniform thing. It ranges from high-volume, latency-critical classification (safety triage, emotion, bias detection) through the real-time coaching turn the user waits on, to latency-tolerant deep synthesis run off the event bus. Using one model for all of it means either overpaying a frontier model for a classification, or underpowering the reasoning where reasoning is the actual product. If the model were "the brain," every keystroke would invoke one expensive model and the unit economics would collapse.

Canon §6 fixes the default reasoning engine as the **Claude model family**, tiered by cost/latency, with all calls routed through the Prompt Builder and a structured-output layer and **no raw model access from feature code**. `docs/04 AI Brain.md` §5 and `docs/12 Backend Architecture.md` §5 record the tier table and the single-egress gateway. Our moat is not the model (ADR 0002), so the gateway must keep the model swappable.

## Decision

All model access goes through **one provider-abstracted LLM gateway**; callers request a **capability tier and a task, never a model string**. We tier by matching model to job, defaulting to Claude:

| Tier | Model | Where it runs |
|---|---|---|
| Triage / classify (`fast`) | **Haiku 4.5** | Safety triage, Emotion classify, bias detection — high-volume, tight latency |
| Dialogue (`dialogue`) | **Sonnet 5** | the live coaching turn on the synchronous path — the user is waiting, words matter |
| Deep synthesis (`deep`) | **Opus 4.8** | weekly Reflection synthesis / hard look-backs on the async path — latency-tolerant, reasoning-heavy |

The gateway owns rate limiting, timeouts, retries, cost attribution/ceilings, and provider/tier fallback. No feature code holds a provider SDK or key.

## Consequences

**Positive**

- Spend matches value: cheap, fast classification on the high-volume path; frontier reasoning only where nobody is waiting and the output compounds. This is how "cheap" from ADR 0002 becomes operational reality.
- Re-tiering or swapping providers is a config change in one place — engines compose interfaces, never a model name.
- One throat to choke for cost, latency, safety, and provider risk: rate limits, budgets, timeouts, and fallback all live at a single egress.

**Negative**

- The gateway is a critical central dependency and a potential bottleneck; it must be robust and well-instrumented.
- Provider/tier fallback (e.g. degrading `dialogue`→`fast` in an outage) keeps us up but changes coaching quality — an acceptable-degradation policy we still owe (`docs/12 Backend Architecture.md` Open questions).
- Choosing the right tier per task is a design responsibility; a mis-tiered call is either wasteful or under-powered.

**Neutral**

- Every call is tagged (user, engine, tier, tokens, cost) for per-engine attribution and hard per-user daily ceilings; runaway loops trip a breaker, not a bill.
- Streaming the `dialogue` turn is how ~1.5s of Sonnet feels like ~0.3s; the gateway supports it.
- The specific model IDs in the table are expected to change over time — the tier abstraction exists precisely so they can, without touching an engine.

## Alternatives considered

- **One frontier model for everything** — rejected: overpays for classification, collapses unit economics, and puts a slow model on the latency-critical triage path.
- **One small model for everything** — rejected: underpowers the real-time coaching turn and deep synthesis, where reasoning quality *is* the product.
- **Feature code calls provider SDKs directly (no gateway)** — rejected: scatters keys and cost/rate/safety controls, couples engines to a vendor, and violates "no raw model access from feature code" (Canon §6).
- **Multi-provider blend at v1** — rejected as premature: we default to Claude and keep the gateway provider-abstracted so a second provider is a later adapter change, not a v1 requirement.

## Links

- `docs/04 AI Brain.md` §5 (tiered-model strategy), §1 (thesis applied to spend)
- `docs/12 Backend Architecture.md` §5 (the LLM gateway as single egress), §3 (sync vs async paths the tiers map onto)
- `docs/00 Canon.md` §6 (Claude family, tiered; no raw model access)
- ADR 0002 (LLM as scoped tool — the premise this tiering rests on)

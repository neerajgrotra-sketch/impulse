# ADR 0002 — The backend owns state, policy, and safety; the LLM is a scoped tool

> **Status:** Accepted
> **Date:** 2026-07
> **Deciders:** Founding Engineering

## Context

Impulse is an AI decision coach, so the tempting architecture is "the LLM *is* the brain": route the user's message to a frontier model with a big system prompt and let it remember, decide, and respond. That architecture fails us on exactly the things we most care about. An LLM is genuinely good at two things we cannot cheaply build — understanding messy human language and reasoning fluently over context we hand it — and genuinely *unaccountable* at the rest: remembering a specific user correctly, obeying a consent scope, refusing to shame, escalating a crisis, and doing the same safe thing twice.

Our principles make these non-negotiable. "Understand before advising" and "no shaming, ever" are enforced *in code* (Canon §8); "safety pre-empts everything" cannot be a paragraph we hope a prompt honors. And our moat is not the model — anyone can call the same API — it is the accumulated, structured understanding of a user (Identity, Memory, Insights) and the policy that turns it into good coaching. `docs/04 AI Brain.md` §1 states the thesis and names the seam.

## Decision

We split the system along one fault line: **the backend owns state, policy, and safety; the model owns language and reasoning.** Deterministic code decides **what is allowed, what is remembered, and what is safe**, and *chooses the Coaching Move*; the LLM only decides **how to say the next thing** and *performs the chosen move*. The LLM is a scoped tool that engines call through the Prompt Builder and a structured-output layer — never the decision-maker, never accessed raw from feature code (Canon §6).

## Consequences

**Positive**

- **Testable** — policy lives in code, so "the Coach cannot advise before it understands the user" is an assertion we run in CI, not a prompt we cross our fingers on.
- **Cheap** — most turns are triage, classification, and retrieval; we spend a frontier model only where reasoning is the actual product (see ADR 0006). If the LLM were the brain, every trivial state transition would cost a frontier-model call.
- **Safe** — the one thing that must never be delegated, deciding whether a message is a crisis, is never left to the model alone (ADR 0005).
- **Defensible** — swap the model vendor and the product still knows the user; durable value accretes in engines we own, behind the gateway.

**Negative**

- More engineering than "prompt-and-pray": we build and maintain deterministic orchestration, classifiers, retrieval, and validation instead of offloading to one model call.
- A real seductive failure mode sits on each side — over-delegating (policy leaking into the prompt) or over-coding (hand-writing decision trees for empathy, the "worse LLM in Python"). The line in §1 has to be actively held.

**Neutral**

- Every model call is mediated: Prompt Builder assembles context, the gateway is the single egress, post-validation checks tone/schema/move-adherence before anything reaches the user.
- Coaching Move *selection* is code; move *rendering* is the model — this division is drawn through every live turn (`docs/04 AI Brain.md` §3).

## Alternatives considered

- **LLM-as-brain (agentic, model owns state and decisions)** — rejected: unaccountable on memory, consent, shaming, and crisis; couples the product to one vendor; makes our safety and understand-before-advise rules unenforceable and our unit economics collapse.
- **All reasoning in code (rule tables for empathy, regex for nuance)** — rejected: the over-reading of the thesis. You rebuild a worse, brittle LLM in Python that is permanently behind the frontier. Fluency and contextual judgment must stay in the model.
- **Autonomous multi-agent society of engines** — rejected: reintroduces exactly the unaccountability we are refusing; we keep one orchestrator (the Coach Engine) making scoped tool calls (`docs/04 AI Brain.md` Open questions).

## Links

- `docs/04 AI Brain.md` §1 (the core thesis and the precise line), §3 (the line drawn through one turn), §7 (why bounded contexts)
- `docs/00 Canon.md` §4 (engine contracts), §6 (no raw model access), §8 (understand-before-advise enforced in code)
- ADR 0005 (Safety Engine gates launch), ADR 0006 (tiered Claude models behind one gateway)

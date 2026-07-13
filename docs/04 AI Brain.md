# 04 · AI Brain — Engine Topology, Orchestration & the LLM-as-Tool Principle

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Define how Impulse thinks. This document owns the *shape* of the AI Brain — the nine engines as bounded contexts, how the Coach Engine orchestrates one coaching turn, the tiered-model strategy, and the single load-bearing principle that everything else hangs from: **the backend owns state, policy, and safety; the model owns language and reasoning.** It defers schema to `08 Database Architecture.md`, infrastructure to `12 Backend Architecture.md`, and prompt internals to `13 Prompt Architecture.md`.

This is an architecture document, not a manifesto. Where it draws a line, it says *why* the line is there and *what breaks* if you cross it.

---

## 1. The core thesis

> **The backend owns state, policy, and safety; the model owns language and reasoning.**

Read that as a division of labour, not a demotion. The LLM is genuinely good at exactly two things we cannot cheaply build ourselves: understanding messy human language, and reasoning fluently over context we hand it. It is genuinely bad — or at least *unaccountable* — at everything we most care about: remembering a specific user correctly, obeying a consent scope, refusing to shame, escalating a crisis, and doing the same safe thing twice. So we split the system along that fault line. Deterministic code holds what must be **correct, auditable, and repeatable**. The model holds what must be **fluent, empathic, and context-sensitive.**

**Why this is the right seam — four consequences we are buying deliberately:**

- **Testable.** Policy lives in code, so policy has unit tests. "The Coach cannot give advice before it understands the user" (`00 Canon.md` §8) is an assertion we can *run in CI*, not a phrase we hope the prompt honours. The Safety hard-stop is a code path with test cases, not a model behaviour we cross our fingers on.
- **Cheap.** Most turns are triage, classification, and retrieval — work a small model or plain code does for a fraction of a cent. We spend the expensive model only where reasoning is the actual product (see §5). If the LLM were "the brain," every trivial state transition would cost a frontier-model call.
- **Safe.** The one thing that must never be delegated — deciding whether a message is a crisis — is the one thing we never let the model decide alone. Safety is code that *gates* the model (§4), not a system-prompt paragraph we trust.
- **Defensible.** Our moat is not the model; anyone can call the same API. Our moat is the accumulated, structured understanding of a user — the Identity model, the Memory, the learned Insights — and the policy that turns that understanding into good coaching. That lives in *our* engines. Swap the underlying model vendor and the product still knows the user.

### The failure mode: taking "the LLM is not the brain" too literally

The thesis has a dangerous over-reading: *"if the model isn't the brain, then reasoning must live in code."* Follow that and you start hand-writing decision trees for empathy, regex for emotional nuance, and rule tables for when to Reframe versus Question. You will have rebuilt a worse LLM in Python — brittle, joyless, and permanently behind the frontier. That is the opposite failure, and it is the more seductive one because it *feels* like rigour.

**The precise line:**

- Code decides **what is allowed, what is remembered, and what is safe.** These are policy and state. They must be deterministic.
- The model decides **how to say the next thing, and how to reason about this specific human's situation.** This is language and judgment. It must be fluent.
- **The Coach Engine chooses the *move*; the model performs it.** Selecting a Coaching Move (Reflect, Reframe, Question, Contrast, Commit, Affirm, Hold-Silence) is a policy decision constrained by understand-before-advise — that is code. Turning "Reframe" into warm, specific, non-shaming English for *this* user is language — that is the model.

If you are ever unsure which side a task belongs to, ask: *"Must this be correct and repeatable, or must it be fluent and contextual?"* Correctness lives in code. Fluency lives in the model. When both are required, code sets the guardrail and the model fills the lane.

---

## 2. Engine topology

The AI Brain is nine engines (`00 Canon.md` §4), each a **bounded context** with a stable interface and private storage. No engine reaches into another's data; they communicate over the internal **event bus** (`12 Backend Architecture.md`). Only the **Coach Engine orchestrates** — it composes the others per turn. **Safety is cross-cutting and pre-emptive** — it sits in front of every inbound message and can hard-stop the pipeline before any other engine runs.

```
                          ┌───────────────────────────────────────────────┐
   inbound message  ─────▶│  SAFETY ENGINE  (cross-cutting, pre-emptive)   │
   (from iOS client)      │  triage EVERY message · risk level · hard-stop │
                          └───────────────┬───────────────────────────────┘
                                           │ safe ↓            crisis ↘ (mandated response + human handoff)
                                           ▼
                          ┌───────────────────────────────────────────────┐
                          │            COACH ENGINE (orchestrator)         │
                          │   the ONLY engine that composes the others     │
                          └──┬─────────┬──────────┬──────────┬─────────────┘
             synchronous     │         │          │          │
             read/compose    ▼         ▼          ▼          ▼
                        ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
                        │EMOTION │ │IDENTITY│ │ MEMORY │ │ DECISION │
                        │signal  │ │model   │ │retrieve│ │ frame    │
                        └────────┘ └────────┘ └────────┘ └──────────┘
                                           │
                                           ▼
                          ┌───────────────────────────────────────────────┐
                          │  PROMPT BUILDER  → LLM gateway → post-validate  │
                          └───────────────┬───────────────────────────────┘
                                           │ coach turn ↩ (to client)
                                           │
             ═══════════════ EVENT BUS ════╪═══════════════════════════════════
             asynchronous, off the hot path│  (turn.completed, outcome.recorded)
                          ┌────────────────┴───────────────┐
                          ▼                                 ▼
                  ┌───────────────┐                 ┌────────────────┐
                  │ LEARNING      │                 │ NOTIFICATION   │
                  │ Insights,     │                 │ when/whether   │
                  │ updated priors│                 │ to Nudge       │
                  └───────────────┘                 └────────────────┘
```

**Why this shape:**

- **One orchestrator.** If any engine could call any other, "when does the Coach understand enough to advise?" would have no single home and the understand-before-advise gate would be unenforceable. Centralising composition in the Coach Engine gives that rule exactly one place to live.
- **Safety in front, not inline.** A crisis must be caught *before* we spend tokens framing a decision or retrieving memory — both for latency and because coaching a person in crisis is the wrong act entirely. Pre-emption is the only correct topology (`00 Canon.md` §8: "Safety pre-empts everything").
- **Learning and Notification hang off the bus.** Nothing the user waits on depends on them. They consume events (a completed turn, a recorded Outcome) and act later — updating priors, scheduling a Nudge, or deciding to stay silent. Keeping them off the synchronous path means a slow Insight computation can never slow a live conversation.

---

## 3. Anatomy of one coaching turn

A single turn — one user Message in, one Coach Message out — runs the synchronous spine below. The numbered steps happen in order on the hot path; the bus steps happen after the user already has their reply.

```
 USER
  │  "I'm about to order takeout again. Third time this week. I don't even care anymore."
  ▼
 (1) SAFETY TRIAGE ───────────── Haiku · classify risk level {none|low|elevated|crisis}
  │   → "none". Proceed. (On "crisis": abort spine, emit mandated response + handoff.)
  ▼
 (2) EMOTION CLASSIFY ────────── Haiku · EmotionSignal{valence:-0.6, arousal:0.4,
  │                              labels:[defeat, apathy], confidence:0.71}
  ▼
 (3) MEMORY RETRIEVE ─────────── code + pgvector · episodic (past takeout Lapses),
  │                              semantic (Identity: "I am someone who cooks for myself"),
  │                              pattern (Insight: "lapses cluster on low-sleep days")
  ▼
 (4) DECISION FRAME ──────────── Decision Engine · Impulse Moment structured:
  │                              options, tradeoffs, bias_flags:[present-bias],
  │                              time-horizon reframe. Alignment scored (never shown).
  ▼
 (5) COACH CHOOSES A MOVE ────── code/policy · completeness threshold met? YES.
  │                              Emotion=defeat + Recovery context ⇒ Move = Reflect,
  │                              not Question. (Advice-type moves gated until threshold.)
  ▼
 (6) PROMPT BUILDER ──────────── assemble layered prompt: Constitution + Identity +
  │                              EmotionSignal + retrieved Memory + Decision frame +
  │                              chosen Move + output schema. (detail → 13 Prompt Arch.)
  ▼
 (7) LLM ─────────────────────── Sonnet · dialogue turn, constrained to the Move,
  │                              structured output (text + metadata)
  ▼
 (8) POST-VALIDATION ─────────── code · tone/lint pass (no banned words), schema check,
  │                              move-adherence check. Fail ⇒ repair or fallback (§6).
  ▼
 COACH MESSAGE → client
  │
  ╘════ (9) EVENT BUS: emit `turn.completed`  ──▶  Learning Engine (async: update priors,
                                                   mine Insights), Notification Engine
                                                   (async: should a Recovery Nudge follow?)
```

**Synchronous vs. async — and why the split is deliberate.** Steps 1–8 are the turn the user is waiting for; every one either gates safety, gathers the context the model needs, or validates what it produced. Step 9 is fire-and-forget: the user already has their reply. **Learning** and **Notification** never block a turn — a person mid-Impulse-Moment cannot wait on Insight mining, and a Nudge that should fire *later* has no business on the hot path. This is the topology of §2 expressed in time: the spine is fast and bounded; the bus absorbs everything latency-tolerant.

Note what steps 5 and 7 make concrete: **the Coach Engine picks `Reflect` (policy, in code); the model renders `Reflect` into words (language, in the model).** That is §1's line, drawn through a live turn.

---

## 4. Safety as a pre-emptive gate

Safety earns its own section because it is the one engine whose *placement* is a safety property. It runs first, on **every** inbound message, before the Coach Engine composes anything.

- **It classifies, code decides.** Haiku produces a risk signal; deterministic policy maps signal → action. We never let a model's free-text judgment be the final arbiter of "is this person in danger" — a missed crisis is not a quality bug, it is a harm. Code owns the decision; the model only informs it, and thresholds err toward caution.
- **It can hard-stop.** On `crisis`, the normal spine (§3 steps 2–8) does not run. We do not frame a Decision or choose a Coaching Move; we emit the mandated response and route to human resources (`15 Constitution.md`). Coaching a person in acute crisis is the wrong action, so we make it *architecturally impossible* to reach.
- **Bias toward false positives.** Occasionally treating a hard-but-safe message as elevated is a tolerable cost; the reverse is not. Guardrail metrics track crisis-handoff correctness (`00 Canon.md` §7).

---

## 5. Tiered-model strategy

All model access goes through the LLM gateway and the Prompt Builder — no feature code touches a raw model (`00 Canon.md` §6). Within that, we tier by matching model capability to the job, defaulting to the **Claude model family**:

| Tier | Model | Where it runs | Why this tier |
|---|---|---|---|
| **Triage / classify** | **Haiku 4.5** | Safety triage, Emotion classify, bias detection | High volume, tight latency budget, narrow structured output. Cheap and fast is exactly right; a frontier model here is waste. |
| **Dialogue** | **Sonnet 5** | The live coaching turn (§3 step 7) | The user is waiting and the words matter. Sonnet is the sweet spot of quality and responsiveness for real-time empathy. |
| **Deep synthesis** | **Opus 4.8** | Weekly Reflection synthesis, hard look-backs (Learning Engine, async) | Latency-tolerant, reasoning-heavy, run off the bus. Here we pay for depth because nobody is waiting and the output compounds. |

**Why tiering matters — it is the thesis applied to spend.** If the model were "the brain," every keystroke would invoke one expensive model and the unit economics would collapse. Because policy and state live in code, most turns need only a small classifier; we reserve real reasoning for the moments that are *actually* reasoning. Tiering is how "cheap" and "safe" from §1 become an operational reality rather than an aspiration. The gateway is provider-abstracted (`12 Backend Architecture.md`) precisely so this table can change without touching an engine — see §7.

---

## 6. Degradation & failure modes

A coach that goes silent when a model is slow, down, or misbehaving is a coach that abandons the user at the moment of temptation — often offline, often at 11pm. **Graceful degradation is therefore a first-class requirement, not an ops afterthought.** Every failure mode has a *defined, safe* behaviour.

| Failure | Detection | Response |
|---|---|---|
| **Model down / gateway error** | call fails / times out | Fall back to the **deterministic fallback coach**: a small library of safe, move-appropriate responses driven by the *already-chosen* Coaching Move and EmotionSignal. Never a dead end. |
| **Model too slow** | latency budget exceeded | Return a brief holding reflection from the fallback coach; optionally finish the richer turn async. A late-but-present coach beats a spinner. |
| **Unsafe / off-tone output** | post-validation (§3 step 8): banned words, tone lint, move violation | Attempt one constrained repair; on repeat failure, drop to the fallback coach. We ship the safe deterministic line, never the unsafe fluent one. |
| **Classifier low-confidence** | confidence below threshold | Degrade toward caution: Safety escalates; Emotion widens; Coach prefers a gentle understanding move (Reflect/Question) over anything advice-shaped. |

**Why defaults are safe, not smart.** Under degradation we optimise for *doing no harm*, not for being impressive. The fallback coach's lines are validated, on-tone, and always move-consistent — a smaller coach, never a broken or shaming one. This is the thesis paying off under stress: because policy and safety live in code, **the product degrades to code and stays safe** even when the model — the part we don't fully control — is unavailable.

---

## 7. Why bounded contexts + an event bus

The topology in §2 is not decoration; it is what lets a small team change the system quickly without breaking it.

- **Change internals freely.** Because each engine is a bounded context behind a stable interface, we can swap Memory's retrieval strategy, retrain the Emotion classifier, or re-tier a model (§5) without any other engine noticing. The Coach composes *interfaces*, never implementations.
- **Only the Coach composes.** Orchestration logic — the part most likely to grow subtle and wrong — lives in exactly one engine. Every other engine answers a narrow question and owns its own storage. This is what makes understand-before-advise, no-shaming, and safety-pre-empts enforceable rather than aspirational: each is a rule in a single known place.
- **The bus decouples time.** Synchronous composition (the turn) and asynchronous reaction (learning, notifying) share no code path. Slow, latency-tolerant work can never intrude on the moment the user is living through.

Together these give us the defensibility of §1: the model is a replaceable tool behind the gateway, while the durable value — understanding, policy, safety — accretes inside engines we own.

---

## Open questions / What we're deliberately NOT doing

**Open questions:**

- **Who arbitrates conflicting signals?** When Emotion says *calm* but Memory shows a strong Lapse pattern, does the Coach's move-selection policy weight one over the other, or ask? Belongs to `07 Coaching Engine.md` to resolve.
- **Fallback coach coverage.** How wide must the deterministic response library be before it degrades *gracefully* rather than *obviously*? Needs eval data.
- **Async → sync bleed-through.** Can a fresh Insight influence the *current* turn, or only future ones? Today: future only. Revisit once Learning is past stub.
- **Re-tiering triggers.** What signal promotes a turn from Sonnet to Opus mid-session (e.g., a Reflection that turns hard)? Undefined for v1.

**What we're deliberately NOT doing:**

- **No autonomous multi-agent society.** One orchestrator (Coach), scoped tool calls. We are not letting engines converse freely as agents — that reintroduces exactly the unaccountability §1 rejects.
- **No reasoning in the LLM that belongs in code.** State, policy, consent, and safety are never delegated to a prompt, however tempting.
- **No hand-built empathy engine.** We do not rebuild language understanding or tone in rule tables — that is the "worse LLM in code" failure mode.
- **No model-specific coupling.** Feature code never names a model or a provider; the gateway does. The thesis requires the model stay swappable.
- **No raw model access from feature code** (`00 Canon.md` §6) — every call goes through the Prompt Builder and structured-output layer.

**See also:** `00 Canon.md` (vocabulary, engine contracts §4, stack §6), `03 Human Model.md` (Identity/Emotion representation), `06 Decision Engine.md` (the decision frame), `07 Coaching Engine.md` (moves, tone, dialogue), `12 Backend Architecture.md` (modular monolith, event bus, gateway), `13 Prompt Architecture.md` (layered prompts, structured output), `15 Constitution.md` (the Covenant, safety mandates).

# 13 · Prompt Architecture — Layered Prompts, Structured Output, Evals

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Define how the **Prompt Builder** (`00 Canon.md` §4) turns engine outputs into a single safe, layered, cacheable prompt; how the model must reply in a validated schema; how we guard the input and the output; how we tier and route Claude models; how we prove quality with evals before shipping; and how a prompt change is treated as a deploy. This is the one place that owns **layered prompts, structured output, and evals**.

The reasoning here is downstream of a single sentence in `00 Canon.md` §4: *the backend owns state, policy, and safety; the model owns language and reasoning.* Everything below is that sentence made operational. If this document and Canon disagree, Canon wins.

---

## 1. Why the Prompt Builder is the only path to the model

Every LLM call in Impulse — a Haiku 4.5 classification, a Sonnet 5 coaching turn, an Opus 4.8 weekly synthesis — is assembled by the **Prompt Builder** and no one else. Feature code, engines, and workers hand the Prompt Builder *structured inputs* and receive *structured outputs*. They never see a raw string prompt and never call the LLM gateway directly.

WHY a single chokepoint:

- **Safety is not optional per-caller.** The Constitution layer (`15 Constitution.md`) must be present on *every* turn. A single path means it cannot be forgotten, reordered, or "temporarily removed for debugging."
- **Auditability.** One assembler means one place to log (privacy-scrubbed, per Canon §6), one place to attach a prompt version, one place to reconstruct exactly what the model saw when something goes wrong.
- **Consistency.** Tone, banned words, and output schemas are enforced identically whether the caller is the Coach Engine or a background reflection job.
- **Change control.** A prompt is a deploy artifact (§8). You cannot version what you cannot centralize.

This is the same "one orchestrator" discipline Canon applies to the Coach Engine — narrow interfaces, no back doors.

---

## 2. The layered prompt, outer → inner

The prompt is built in five ordered layers. Order is load-bearing: the outermost layers are the most stable and the highest authority; the innermost is the most volatile and the *least* trusted. We assemble outer-first so that (a) the stable prefix can be **prompt-cached**, and (b) the model reads its non-negotiable constraints *before* it reads anything a user could try to override them with.

```
┌───────────────────────────────────────────────────────────────┐
│ LAYER 1 · CONSTITUTION / SYSTEM   (most stable · highest auth)  │
│   Non-negotiables from 15 Constitution.md:                      │
│   • Safety pre-empts everything (Safety Engine can hard-stop)   │
│   • No shaming, ever — banned words (Canon §2)                  │
│   • Coach, never parent — never decide FOR the user             │
│   • Understand before advising                                  │
│   → CACHEABLE. Changes only via a Constitution deploy.          │
├───────────────────────────────────────────────────────────────┤
│ LAYER 2 · ENGINE CONTEXT          (stable within a session)     │
│   • Identity model (Identity Engine): statements, values,       │
│     Future Self narrative                                       │
│   • EmotionSignal (Emotion Engine): valence, arousal, labels    │
│   • Current Coaching Move (Coach Engine): e.g. Reflect / Contrast│
│   → PARTIALLY CACHEABLE per session.                            │
├───────────────────────────────────────────────────────────────┤
│ LAYER 3 · RETRIEVED MEMORY        (per-turn, bounded)           │
│   • Top-k episodic + semantic Memory (Memory Engine, pgvector)  │
│     ranked by salience + relevance, token-budgeted              │
│   → NOT cached. Fresh each turn.                                │
├───────────────────────────────────────────────────────────────┤
│ LAYER 4 · DECISION FRAME          (per-turn, structured)        │
│   • From 06 Decision Engine.md: options[], tradeoffs,           │
│     bias_flags[], time-horizon reframe                          │
│   → NOT cached. This is the substance the Coach reasons over.   │
├───────────────────────────────────────────────────────────────┤
│ LAYER 5 · USER TURN               (most volatile · LEAST trusted)│
│   • The raw user message for this turn                          │
│   → Treated as untrusted input, quoted/fenced, never as         │
│     instruction. Prompt-injection defense lives here.           │
└───────────────────────────────────────────────────────────────┘
                          ↓
              Prompt Builder → LLM gateway (tiered)
                          ↓
              Structured output (tool-call / JSON schema)
```

WHY this specific ordering:

- **Safety-first ordering.** Constitution is first because it frames everything the model reads after it. A constraint stated after the user's message is a constraint the user's message has already had a chance to argue with.
- **Trust decreases inward.** By the time the model reaches Layer 5 it already holds its rules, the user's identity, the relevant history, and a structured frame. The user turn is the *subject* of reasoning, never a source of *instructions*. This is our primary structural defense against prompt injection — Layer 5 is explicitly fenced and labeled as content, not commands.
- **Cache boundary follows the stability gradient.** Layers 1–2 change rarely; Layers 3–5 change every turn. Assembling stable-first lets the gateway reuse a cached prefix (§7).

Every layer is labeled in the assembled prompt so the model — and our audit log — can tell whose words are whose.

---

## 3. Structured output: we never trust free text in control flow

The model does not reply with prose that we then parse. It replies with a **tool call / JSON object** validated against a schema before any field is used. A coaching turn returns something shaped like:

```
CoachTurnOutput {
  chosen_move   : enum(Reflect|Reframe|Question|Contrast|Commit|Affirm|HoldSilence)
  message       : string        // the words shown to the user
  alignment_note: string?       // rationale, internal
  flags         : [enum(safety_concern|needs_more_context|
                        low_confidence|user_distress)]
  confidence    : float 0..1
}
```

WHY structured output is mandatory:

- **Control flow must not depend on phrasing.** The chosen **Coaching Move** (Canon §2) drives what the app does next — whether we may emit advice, whether we log a Commit, whether we hold silence. If we inferred that from free text ("it sounds like the model wants to affirm…") we would be one paraphrase away from a wrong action. The move is a typed field, not an interpretation.
- **Separation of the shown message from the machine decision.** `message` is language (the model's job); `chosen_move`, `flags`, and `confidence` are machine-readable decisions the backend acts on. Mixing them invites the model's prose to smuggle in control signals.
- **Fail closed.** If the output fails schema validation, we do not "best-effort" it. We retry once, then fall back (§9). An unvalidated blob never reaches the user or the state machine.
- **`flags` is a first-class channel.** It lets the model raise `safety_concern` or `needs_more_context` *inside the schema*, which we then route deterministically — the model advises, the backend decides.

The rule, stated plainly: **the LLM owns `message`; the backend owns every branch.** Canon §4's "LLM is a scoped tool, never the decision-maker" is enforced here, in the schema boundary.

---

## 4. Guardrails in two places (belt and suspenders)

We guard both the input to the model and the output from it, because either guard alone is insufficient and the two fail in different ways.

**IN-prompt guardrails (Layer 1, prevention):**

- The full **banned-word list** from Canon §2 — *fail, failure, cheat, streak-broken, bad, weak, should have, guilt* — stated as prohibitions with the reason ("progress over perfection; coach, never parent").
- Positive constraints: coach-not-parent, understand-before-advise, no diagnosis, no decisions made on the user's behalf.
- The output schema itself, described so the model aims at valid structure.

**OUT-of-prompt guardrails (post-generation, verification):**

1. **Schema check** — does the output validate? (§3) Fail → retry → fallback.
2. **Tone / no-shaming lint** — a deterministic pass over `message`: banned-word scan (Canon §2), plus a Haiku 4.5 tone grader for subtler shaming, condescension, or parenting. This is the code-enforced "no shaming, ever" from Canon §8.
3. **Safety re-check** — the Safety Engine re-inspects the outbound message and the inbound turn. It can hard-stop the turn and substitute the mandated crisis response regardless of what the model produced (Canon §4, §8).

WHY belt-and-suspenders:

- **The two guards catch different failures.** In-prompt guidance shapes the *distribution* of outputs but cannot guarantee any single one; a model can still produce a banned word or a subtly parental tone. Out-of-prompt validation is deterministic and does not depend on the model having cooperated.
- **Defense in depth around the highest-stakes property.** Shaming and missed crisis signals are Canon guardrail metrics that *must not degrade*. We are willing to pay two passes to protect them.
- **The out-of-prompt safety re-check is authoritative.** If in-prompt and out-of-prompt disagree, out-of-prompt wins — the model's cooperation is never assumed.

---

## 5. Model tiering and routing

Per Canon §6, the Claude family is tiered by cost/latency/quality, and the Prompt Builder routes each task to the right tier.

| Layer / task | Tier | WHY |
|---|---|---|
| Emotion classification, bias detection, **safety triage** | **Haiku 4.5** | High volume, latency-critical, narrow. Runs on nearly every inbound turn; must be cheap and fast. |
| Tone / no-shaming lint (Layer §4 grader) | **Haiku 4.5** | Cheap classifier over one short message; belt-and-suspenders should not cost dialogue latency. |
| Real-time **Coaching Session** turns | **Sonnet 5** | The dialogue itself: strong reasoning at interactive latency. The quality the user feels. |
| Weekly synthesis, hard **Reflections**, **Insight** generation | **Opus 4.8** | Async, latency-tolerant, deep. Worth the cost where synthesis quality dominates and no one is waiting. |

Routing rules:

- **Route by task, not by convenience.** A turn does not "upgrade to Opus because it's important" mid-dialogue; latency is part of the coaching experience. Depth work is moved *off* the interactive path into background workers (Canon §6 async/eventing).
- **Triage before dialogue.** Haiku 4.5 safety triage runs *before* a Sonnet 5 turn is built. Cheap classification gates expensive generation, and a crisis is handled without ever entering coaching.
- **Provider-abstracted.** Canon §6 fixes the Claude family but keeps the gateway provider-abstracted; tiers are configuration, not hard-coded call sites.

**Prompt caching of stable outer layers.** Layers 1–2 (Constitution + engine context) are stable across a session and often across users (Layer 1 is nearly constant). We structure the prompt so this prefix is cached at the gateway: we pay full price to establish it, then reuse it across turns. WHY it matters: the Constitution is large and appears on every single turn — without caching we would pay for it thousands of times an hour, and it would add latency to every dialogue turn. The cache boundary is exactly the stability boundary drawn in §2.

---

## 6. The eval harness — "sounds good in a demo" is not acceptance

A prompt that produces one delightful reply in a demo has proven nothing. We gate prompt changes on an eval harness (Canon §6, §10 in `10 Engineering Principles.md`) with four components:

1. **Golden coaching conversations.** A curated set of multi-turn **Coaching Sessions** with known-good behavior: the right **Coaching Move** at the right time, understand-before-advise respected, recovery coached well. Regression here means the change made coaching *worse*, even if it reads nicely in isolation.
2. **Tone / no-shaming grader.** Automated grading of outputs for shaming, condescension, and parental tone across a large sample — the eval-time twin of the runtime lint (§4). Target, from Canon §7: **zero shaming-language incidents.**
3. **Safety red-team suite.** Adversarial inputs — crisis and self-harm signals, disguised distress, prompt-injection attempts in Layer 5, jailbreaks aimed at the Constitution. Acceptance is not "usually safe"; the safety suite is a **hard gate** because Safety gates launch (Canon §4).
4. **Regression gating in CI.** Evals run in CI on every prompt or model change. A change that regresses golden conversations, raises shaming incidents above zero, or fails any safety case **does not merge.**

WHY this is non-negotiable:

- **LLM behavior is not stable under edits.** A one-word prompt tweak, or a model version bump, can shift behavior on inputs no human re-checked. Evals are how we notice.
- **Our guardrail metrics are behavioral.** Canon §7's guardrails (trust, "the app gets me," crisis-handoff correctness, zero shaming) can only be defended by measuring behavior on held-out cases, not by reading the prompt.
- **The demo is a biased sample of one.** CI evals are the many, adversarial, boring cases the demo skips — which is exactly where coaching harms people.

Graders that are themselves LLMs (tone, some safety) run on Haiku/Sonnet and are periodically checked against human labels so the grader itself does not silently drift.

---

## 7. Prompt versioning and safe rollout

**A prompt change is a deploy.** It ships like code, not like a config tweak someone edits in production.

- **Versioned artifacts.** Every layer template carries a version. The Prompt Builder stamps the composed `prompt_version` (and model tier) onto every logged call, so any past turn is reconstructable.
- **Eval-gated.** No prompt version reaches production without passing the §6 harness in CI. The eval gate is the release gate.
- **Flagged rollout.** Prompt changes ship behind a flag and roll out progressively (internal → small cohort → all), watching the Canon §7 guardrails — shaming incidents, trust, crisis-handoff correctness — the whole way. Instant rollback to the previous pinned version.
- **Model version is part of the prompt version.** A Sonnet 5 → future-Sonnet bump is a prompt change: it must clear the same evals, because the same template behaves differently on a different model.

WHY: an unversioned, ungated prompt edit is an unreviewed production change to the part of the system that speaks directly to a vulnerable user. Treating it as a deploy gives us review, evals, staged exposure, and rollback — the same safety net we demand of code.

---

## 8. Token budget, cost discipline, and fallbacks

**Token budget.** Each layer has a budget, enforced by the Prompt Builder:

- Layer 1 (Constitution): fixed, and amortized by caching (§5).
- Layer 3 (Memory): the hard variable cost. Top-k retrieval is ranked by salience + relevance and **truncated to budget** — more memory is not more coaching, and unbounded context is unbounded spend and latency. The Memory Engine returns the *most useful* k, not all matches.
- Layers 4–5: bounded by the decision frame and one user turn.

WHY discipline: cost scales per token per turn per user; sloppy context is a linear tax on every conversation. And beyond cost, over-stuffed context degrades quality — the model reasons better over a tight, relevant frame than a bloated one. Budgeting serves both the P&L and the coaching.

**Fallbacks when the model is unavailable** (align with degradation in `04 AI Brain.md`):

- **Tier fallback.** If the primary tier is unavailable or times out, we may drop to a lower tier for a graceful (if simpler) turn rather than failing — except that safety triage never degrades below its required capability.
- **Cached / templated safe responses.** For total LLM unavailability we serve a small set of pre-approved, Constitution-safe holding responses ("I'm here — tell me more about what's going on") that keep the session alive without inventing coaching.
- **Fail toward safety and silence, never toward harm.** If we cannot generate a validated, safe turn, we say less — we do not ship an unvalidated one. A missing turn is recoverable; a shaming or unsafe turn is a broken Covenant.
- **Offline client.** Per Canon §6 the iOS client is offline-first; when the backend/model is unreachable the app degrades to local capture (log the Impulse Moment now, coach when connectivity returns) rather than blocking the user at the moment of temptation.

---

## 9. Why we do NOT fine-tune yet

We deliberately ship on **prompting + retrieval**, not a fine-tuned model, for v1.

- **Data.** Fine-tuning needs a large, clean, well-labeled corpus of *good coaching*. We don't have it yet, and the data we most want (real Coaching Sessions) is the most sensitive data we hold — training on it is a Covenant question (`15 Constitution.md`), not just an ML one.
- **Cost & speed.** Prompt + retrieval iterates in hours behind a flag (§7). Fine-tuning is a slow, expensive loop that would throttle exactly the learning we need most in year one.
- **Lock-in & agility.** A fine-tune couples us to one model and freezes behavior we're still discovering. Canon §6 keeps the gateway provider-abstracted and tiered; fine-tuning would trade that flexibility away before we've earned the certainty to justify it.
- **The layered prompt already gives us personalization.** Identity, emotion, memory, and the decision frame (Layers 2–4) adapt each turn to the individual — the thing fine-tuning is often reached for — without baking anything into weights.

We revisit this when (a) we have consented, high-quality coaching data at volume, (b) prompt + retrieval has a clear, measured ceiling, and (c) the eval harness is mature enough to prove a fine-tune is *safer*, not just cheaper.

---

## 10. Open questions / What we're deliberately NOT doing

**Open questions:**

- **Grader trust.** How often, and against how many human labels, must we recalibrate the LLM tone/safety graders before we trust them to gate CI unattended?
- **Cache invalidation of Layer 2.** Identity and emotion drift within a session; what is the right freshness policy for the "stable" engine-context cache before staleness hurts coaching?
- **Memory budget vs. depth.** What is the empirically right `k` and salience threshold for Layer 3 — where does more retrieved Memory stop improving Alignment and start costing money and focus?
- **Injection surface beyond Layer 5.** Retrieved Memory (Layer 3) is user-derived; do we need injection defenses there too, not only on the live user turn?
- **Fallback tier boundaries.** Exactly which tasks may degrade a tier under load, and which (safety triage) never may?

**What we're deliberately NOT doing:**

- **Not fine-tuning in v1** (§9).
- **Not giving any code a raw path to the model** — the Prompt Builder is the only path (Canon §4, §1 above).
- **Not trusting free-text model output in control flow** — typed schema only (§3).
- **Not shipping a prompt change without an eval gate** (§6, §7).
- **Not degrading toward a risky turn under failure** — we fall toward safety and silence (§8).
- **Not exposing the Alignment score, or any internal field, through `message`** — the shown message is coaching, never a dashboard (Canon §5).

---

*Cross-links: `00 Canon.md` (definitions, tiers, contracts), `04 AI Brain.md` (engine topology, degradation), `06 Decision Engine.md` (the decision frame), `07 Coaching Engine.md` (Coaching Moves, tone), `10 Engineering Principles.md` (testing & evals), `15 Constitution.md` (the Covenant, safety non-negotiables).*

# 00 · Canon — Shared Definitions & Architectural Truth

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** The single source of truth for terminology, engine contracts, the data model, the stack, and the metrics that every other document depends on. If two documents disagree, this one wins. Nothing here is prose for its own sake — it exists so fifteen documents (and eventually fifteen engineers) describe the *same* system.

This document is deliberately terse. The reasoning lives in the numbered documents; the definitions live here.

---

## 1. The product, in one sentence

**Impulse is an AI decision coach that helps a person close the gap between the choice their Present Self wants to make and the life their Future Self wants to live.**

Not a chatbot. Not a habit tracker. A coach that understands you, then helps you think — in the moment that matters.

---

## 2. Vocabulary (use these words, exactly, everywhere)

| Term | Definition |
|---|---|
| **Present Self** | The user *right now*, subject to emotion, temptation, and hyperbolic discounting. Holds the phone. |
| **Future Self** | The person the user is trying to become. Experiences the consequences of today's choices. The party the Coach protects — *with Present Self's consent*. |
| **The Gap** | The measurable distance between how the user is behaving and the identity they've claimed. Coaching reduces the Gap. |
| **Alignment** | The degree to which a specific decision serves Future Self. Our core unit of value. Scored 0–1, never shown as a grade. |
| **Impulse Moment** | A decision point the user brings to us (or we detect) where Present and Future Self are in tension. The atomic event of the product. |
| **Identity Statement** | A first-person, present-tense claim the user makes about who they are becoming ("I am someone who…"). The root of the user model. |
| **Lapse** | A single decision misaligned with the user's identity. Expected. Not a failure. |
| **Recovery** | The decision *after* a lapse. The most important moment we coach. Weighted heaviest in our metrics. |
| **Nudge** | A proactive, permissioned message that helps at the right time. Never a guilt-trip. (Thaler/Sunstein sense.) |
| **Coaching Move** | A single deliberate action the Coach takes in dialogue (Reflect, Reframe, Question, Contrast, Commit, Affirm, Hold-Silence). |
| **Coaching Session** | A bounded dialogue, usually anchored to one Impulse Moment or Reflection. |
| **Reflection** | A structured look-back (daily/weekly) that feeds the Learning Engine. |
| **Insight** | A learned, evidenced pattern about the user ("You lapse most on low-sleep evenings"). Surfaced only when useful. |
| **The Covenant** | Our binding promise to the user about how we treat their data and their dignity. See `15 Constitution.md`. |

**Banned words in product surface:** *fail, failure, cheat, streak-broken, bad, weak, should have, guilt.* They contradict "progress over perfection" and "coach, never parent."

---

## 3. The six principles (verbatim — do not paraphrase in docs)

1. **Future Self is our customer** — Present Self feels temptation; Future Self pays the cost; we protect Future Self.
2. **Coach, never parent** — we never decide *for* the user; we help them think better.
3. **Understand before advising** — never coach before understanding.
4. **Identity over goals** — help users *become someone*, not merely *accomplish something*.
5. **Progress over perfection** — recovery matters more than streaks.
6. **Alignment over discipline** — the goal is that today's decisions align with tomorrow's life.

**Added as a seventh, load-bearing principle (see rationale in `15 Constitution.md`):**

7. **Earn the right to hold this data** — trust is the product; privacy and safety are architecture, not features.

---

## 4. The AI Brain: engine contracts

> Principle: **the backend owns state, policy, and safety; the model owns language and reasoning.** Engines are mostly deterministic orchestration + small classifiers + retrieval. The LLM is a scoped tool they call, never the decision-maker. Each engine is a bounded context with a stable interface; internals may change freely.

| Engine | One-line job | Primary inputs | Primary outputs | MVP status |
|---|---|---|---|---|
| **Identity Engine** | Model who the user is becoming | onboarding, reflections, decisions | Identity model (values, statements, Future Self narrative) | **Alive** |
| **Emotion Engine** | Infer the user's emotional state | message text, time, context signals | EmotionSignal (valence, arousal, labels, confidence) | **Alive (classifier)** |
| **Decision Engine** | Structure a decision & expose bias | Impulse Moment, identity, memory | Decision frame (options, tradeoffs, bias flags, time-horizon reframe) | **Alive** |
| **Memory Engine** | Remember the user over time | all events | Retrieved episodic + semantic memory | **Alive (basic)** |
| **Coach Engine** | Orchestrate the coaching dialogue | frame, identity, emotion, memory | Chosen Coaching Move + LLM turn | **Alive** |
| **Learning Engine** | Learn from outcomes, update the model | outcomes, reflections, lapses/recoveries | Insights, updated user priors | Stub → v1.1 |
| **Notification Engine** | Decide *when/whether* to reach out | patterns, calendar, consent | Scheduled Nudge or silence | Stub → v1.1 |
| **Prompt Builder** | Assemble context into a safe, scoped prompt | engine outputs + Constitution | Layered prompt + output schema | **Alive** |
| **Safety Engine** *(cross-cutting, added)* | Detect crisis/clinical risk; route to human resources; hard-stop coaching | every inbound message | risk level + mandated response/handoff | **Alive — gates launch** |

Engines communicate over an internal **event bus** (see `12 Backend Architecture.md`); they never reach into each other's storage. The **Coach Engine is the only orchestrator** that composes the others per turn.

---

## 5. The data model (canonical aggregates & key fields)

Root aggregate is **Identity**, not Goal — this is principle #4 made structural.

- **User** — id, auth, locale, consent flags, covenant_version.
- **Identity** *(root)* — user_id, values[], identity_statements[], future_self_narrative, virtues[], updated_at.
- **Decision** *(the Impulse Moment)* — id, user_id, trigger, context, options[], chosen_option, alignment_score, bias_flags[], emotion_signal_id, status(open|resolved), created_at, resolved_at.
- **Outcome** — decision_id, kind(aligned|lapse|recovery), reflection_note, felt_after, created_at.
- **CoachingSession** — id, user_id, anchor(decision_id|reflection_id|null), messages[], moves[], created_at.
- **Message** — session_id, role(user|coach), text, emotion_signal_id, tokens, created_at.
- **EmotionSignal** — id, valence(-1..1), arousal(0..1), labels[], confidence, source.
- **Reflection** — id, user_id, period(daily|weekly), prompts[], responses[], created_at.
- **Memory** — id, user_id, type(episodic|semantic|pattern), content, embedding, salience, source_ref, created_at.
- **Insight** — id, user_id, statement, evidence_refs[], confidence, surfaced_at?, dismissed?.
- **Nudge** — id, user_id, kind, scheduled_for, sent_at?, consent_scope, outcome(opened|acted|ignored).

**Alignment score** is computed by the Decision Engine, stored on Decision, and never displayed as a number or letter grade — it drives coaching and (aggregated) the north-star metric only.

---

## 6. Technology decisions (fixed for v1; revisit at Series A scale)

- **iOS client:** Swift + SwiftUI, MVVM + lightweight Coordinator navigation, **offline-first**. Local store: SwiftData (fallback GRDB if we hit limits). Sync via a thin, idempotent sync API. The moment of temptation often has no signal — the app must work offline.
- **Backend:** **Modular monolith** (not microservices) in Python + FastAPI. Each engine is a module with a hard interface, deployable together, splittable later. Startup discipline: one deployable until pain demands otherwise.
- **Data:** PostgreSQL as system of record; **pgvector** for Memory embeddings; Redis for queues, rate limits, and short-term session cache.
- **Async/eventing:** internal event bus (Redis streams at v1; abstracted so we can move to a real broker). Background workers for Learning, Notification, embedding.
- **LLM gateway:** provider-abstracted. Default reasoning engine is the **Claude model family**, tiered by cost/latency:
  - **Haiku 4.5** — fast, cheap classification (emotion, bias detection, safety triage).
  - **Sonnet 5** — real-time coaching dialogue.
  - **Opus 4.8** — deep weekly synthesis / hard reflections (async, latency-tolerant).
  - All calls go through the Prompt Builder + a structured-output (tool/JSON-schema) layer. No raw model access from feature code.
- **Observability:** structured logs, per-engine tracing, prompt/response capture (privacy-scrubbed), eval harness in CI.

---

## 7. Metrics (embody the philosophy or don't ship them)

- **North Star:** **Aligned Decision Rate, recovery-weighted** — the share of Impulse Moments that end aligned with the user's identity, with post-lapse recoveries counted double. This operationalizes "progress over perfection."
- **Guardrail (must not degrade):** self-reported *trust* and *"the app gets me"*; crisis-handoff correctness; notification opt-out rate; zero shaming-language incidents.
- **Anti-metrics (we refuse to optimize):** raw streak length, daily active minutes, session count for its own sake. Engagement bought with anxiety is a loss.

---

## 8. Cross-cutting constraints (true in every document)

- **Consent is a gate, not a checkbox.** Every proactive action checks a consent scope.
- **Safety pre-empts everything.** The Safety Engine can hard-stop any coaching turn.
- **Understand-before-advise is enforced in code** — the Coach Engine cannot emit advice-type moves until the Decision + Identity context meets a completeness threshold.
- **No shaming, ever** — enforced by a tone/lint pass on Coach output and by the banned-word list.
- **Explainability** — every Insight carries evidence_refs; we never assert a pattern we can't show.

---

## 9. Document map (who owns what — avoid overlap)

| Doc | Owns | Defers to |
|---|---|---|
| 01 Vision | why we exist, the wedge, the 10-yr bet | — |
| 02 Product Philosophy | the 7 principles, the tensions we hold | 01, 15 |
| 03 Human Model | how we represent a person (Identity/Emotion/behavioral science) | 04, 06 |
| 04 AI Brain | engine topology, orchestration, LLM-as-tool | 12, 13 |
| 05 Onboarding | first-run: understand-before-advise, identity capture | 03, 07 |
| 06 Decision Engine | the decision-coaching flow, bias exposure | 03, 07 |
| 07 Coaching Engine | dialogue, Coaching Moves, tone | 04, 13 |
| 08 Database Architecture | schema, storage, privacy-at-rest | 05,06,12 |
| 09 Roadmap | sequencing, MVP scope, what's stubbed | all |
| 10 Engineering Principles | how we build (clean arch, testing, evals) | 12 |
| 11 iOS Navigation | client structure, screens, offline-first | 07 |
| 12 Backend Architecture | modular monolith, event bus, engines as modules | 04, 08 |
| 13 Prompt Architecture | layered prompts, structured output, evals | 04, 07 |
| 14 Notification Engine | when/whether to nudge, ethics of attention | 04 |
| 15 Constitution | the Covenant, safety, non-negotiables, ethics | all |

---

## 10. House style for all documents

- Voice: senior, calm, opinionated **with reasons**. First-person plural ("we"). Think a thoughtful CTO memo, not marketing.
- **Always explain WHY, not just WHAT.** A document that only says what to build has failed.
- Structure: short sections, meaningful headers, tables and ASCII/mermaid diagrams where they earn their place.
- Length: substantial but zero padding. Dieter Rams: *less, but better.*
- Every doc opens with a one-line **Purpose** and `Status: Draft v0.1 — 2026-07`, and closes with **"Open questions / What we're deliberately NOT doing."**
- Cross-link other docs by filename. Use the exact vocabulary in §2. Never introduce a synonym for a canon term.

# 10 · Engineering Principles — How We Build

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** The binding engineering values and practices for Impulse — how we structure code, where the LLM is allowed to live, how we test an AI product that has no obvious "correct answer," and how we ship changes to a system that talks to vulnerable people. This document owns *how we build*. It defers to `12 Backend Architecture.md` for the concrete module layout and to `13 Prompt Architecture.md` for prompt internals; it defers to `15 Constitution.md` for what we owe the user.

Every principle below is stated as **WHY → practice**. If a rule here has no reason attached, treat it as a bug in this document. We are building a coach that people will trust with their worst moments; the way we engineer it *is* the promise. This is principle #7 — **Earn the right to hold this data** — made operational.

---

## 1. Clean architecture: engines are modules with hard interfaces

**WHY.** The AI Brain is nine engines (see Canon §4). If any engine reaches into another's data or assumes another's internals, we lose the one property that lets a nine-engine system be built by a small team: the ability to change an engine's guts without a coordinated rewrite. The Canon already declares each engine a **bounded context** with a stable interface — this section is how we keep that true in code rather than in aspiration.

**Practices.**
- **Dependencies point inward.** Engine logic (domain) depends on nothing outward. FastAPI handlers, Postgres, Redis, and the LLM gateway are all *adapters* at the edge; the engine core imports interfaces, never concrete infrastructure. A unit test of Decision Engine logic must run with no database and no network.
- **No cross-module storage reach-in.** An engine touches only its own aggregate (Canon §5). The Coach Engine does not `SELECT` from the Memory table; it asks the Memory Engine. Enforced by module-boundary lint (import rules) in CI, not by good manners.
- **Communicate over the event bus or a published interface.** Engines emit and consume events (see `12 Backend Architecture.md`); the **Coach Engine is the only orchestrator** that composes others per turn. No engine calls another's private functions.
- **Interfaces are contracts, internals are free.** The shape of an engine's input/output (e.g. `EmotionSignal`, a Decision frame) is a versioned contract. Swapping the Emotion Engine from a classifier to a fine-tune is a non-event for everyone else — that is the whole point.

**What this buys us:** the modular monolith stays *splittable* (Canon §6). The day one engine needs its own deployable, we cut along a seam that already exists.

---

## 2. Determinism at the core, LLM at the edges

**WHY.** The Canon is explicit: *the backend owns state, policy, and safety; the model owns language and reasoning.* A large language model is non-deterministic, occasionally wrong, and impossible to unit-test in the classical sense. If our safety logic, our consent gates, or our alignment scoring lived *inside* a prompt, we could never prove they hold. So we don't. Business rules and safety are code; the model is a scoped tool that code calls.

The mental model is a hard core wrapped in a thin, replaceable shell:

```
        ┌───────────────────── deterministic core ─────────────────────┐
        │  consent gates · understand-before-advise threshold          │
inbound │  alignment scoring · bias logic · banned-word enforcement     │  outbound
  ─────▶ │  Safety routing · Coaching Move permission                   │ ─────▶
        │        │  proposes                    ▲ parsed, schema-checked │
        │        ▼                              │                       │
        │   ┌─────────────── Prompt Builder ───────────────┐            │
        │   │  layered prompt + output schema (the ONE door)│            │
        │   └───────────────────┬───────────────┬─────────┘            │
        └───────────────────────┼───────────────┼──────────────────────┘
                                 ▼               ▼
                         LLM (Haiku/Sonnet/Opus)   ← the edge: mockable
```

Everything inside the core is testable without a network. Everything at the edge is behind one interface we can fake.

**Practices.**
- **Deterministic business logic.** Consent scoping, the understand-before-advise completeness threshold (Canon §8), alignment scoring, banned-word enforcement, and Safety Engine routing are plain, testable code with no model in the path. These are the things that must never "sometimes" work.
- **The model is a mockable dependency behind the Prompt Builder.** Feature code never touches a raw model (Canon §6). It calls the Prompt Builder, which assembles a layered, scoped prompt + output schema (see `13 Prompt Architecture.md`). Because the LLM sits behind one interface, every engine's tests inject a fake that returns canned or schema-valid responses.
- **Structured output, always.** Model responses are parsed against a JSON/tool schema at the boundary. An unparseable or off-schema response is a handled error, not a surprise downstream. Free-text from the model is confined to the Coach turn itself, which is then tone-linted.
- **The model proposes; the backend disposes.** A model may *suggest* a Coaching Move; the Coach Engine decides whether that move is permitted given state and safety. Language and reasoning from the model, decisions from us.

---

## 3. Testing strategy for an AI product

**WHY "it usually sounds good" is not a test.** A coaching reply that reads well in a demo tells you nothing about the 1-in-500 conversation where the model shames a user recovering from a lapse, or misses a crisis signal. "Looks good" is anecdote; anecdote does not gate a release. For an AI product the risk lives in the *distribution* of behaviour, not the happy path — so we test the distribution, and we make regressions visible before they reach a person.

We test in three layers, cheapest and most deterministic first. The base is large, fast, and hermetic; the top is small, slower, and probabilistic — but it is the layer that actually catches "the coach was cruel."

```
              ┌───────────────────────────────┐
              │  Layer 3 · LLM EVALS (CI gate) │   golden convos · tone grader
              │  probabilistic · graded        │   · safety red-team  ← gates launch
              ├───────────────────────────────┤
              │  Layer 2 · CONTRACT tests       │   engine I/O shape & invariants
              │  deterministic · mocked LLM     │
              ├───────────────────────────────┤
              │  Layer 1 · UNIT tests           │   consent · thresholds · scoring
              │  deterministic · no I/O · fast  │   (most tests live here)
              └───────────────────────────────┘
```

**Layer 1 — Unit tests for engine logic (deterministic).** Every rule from §2 is unit-tested with no model and no I/O: consent gates, the completeness threshold, alignment computation, bias-flag logic, banned-word detection, Safety routing tables. Fast, hermetic, run on every commit. This is the majority of our tests by count.

**Layer 2 — Contract tests at engine boundaries.** For each engine interface we assert the shape and invariants of inputs/outputs (e.g. `EmotionSignal.valence ∈ [-1,1]`, a Decision frame always carries a time-horizon reframe, an `Insight` always carries `evidence_refs` — Canon §8 explainability). Contract tests let us change an engine's internals freely (§1) while guaranteeing consumers still get what the contract promised. They also run against the mocked LLM so they stay deterministic.

**Layer 3 — LLM evals in CI (the part most teams skip).** Because model output is non-deterministic, we treat it like a probabilistic system and grade it, in CI, as a release gate:
- **Golden coaching conversations.** A curated, versioned set of Impulse Moments and multi-turn dialogues with expected *qualities* (correct Coaching Move selected, understand-before-advise respected, appropriate Recovery framing). We assert on properties and graders, not exact strings — the wording will vary; the behaviour must not.
- **Tone / no-shaming grader.** An automated grader (a Haiku-tier classifier plus the banned-word list from Canon §2) scores every candidate Coach output for shaming, judgment, or parenting. **Zero shaming-language incidents** is a Canon §7 guardrail; a build that produces one fails.
- **Safety red-team suite.** An adversarial corpus of crisis, self-harm, clinical-risk, and boundary-probing messages. We assert the Safety Engine hard-stops and routes correctly (Canon §8, `15 Constitution.md`). Crisis-handoff correctness is a guardrail metric; this suite is non-negotiable and **gates launch**, matching the Safety Engine's status in Canon §4.

**Practices around evals.**
- Evals run in CI on any change to prompts, graders, engine orchestration, or model tier. A prompt change with no eval run does not merge.
- We track pass rates over time, not just pass/fail on one run, so slow drift is visible.
- Eval datasets are versioned artifacts with owners, reviewed like code. Adding a real failure to the golden set is the standard fix for an escaped bug.

---

## 4. Simplicity, YAGNI, and reversibility

**WHY.** We are pre-Series-A. The expensive mistake at this stage is not "too simple" — it is complexity we bought for a future that never arrives, or a decision we can't walk back. Speed comes from keeping most decisions cheap to reverse, and spending real deliberation only on the few that aren't. This is the Canon's startup discipline (§6) as an engineering value.

**Practices.**
- **Boring by default.** Postgres, Redis, FastAPI, a modular monolith (Canon §6). We do not adopt novel infrastructure for MVP problems. Novelty is a budget spent only where it is the product.
- **One deployable until pain demands otherwise.** No microservices, no premature service split. We keep the seams (§1) so splitting is *possible*; we don't split until scale or team topology *forces* it.
- **YAGNI.** Build for the roadmap in `09 Roadmap.md`, not for imagined scale. The Learning and Notification engines are deliberately stubbed to v1.1 (Canon §4) — we do not gold-plate them now.
- **Reversible decisions are made fast and locally.** A function name, a table column, an internal event shape — decide, ship, change later.
- **Irreversible decisions get a written WHY.** Anything hard to reverse — a data-model change to a canonical aggregate, an external API contract, a privacy-affecting default, a model-tier commitment — gets a short design doc / ADR stating the reasoning and the alternatives rejected. Canon §10: *a document that only says what has failed.* The same standard applies to a decision.

---

## 5. Observability

**WHY.** A distributed AI decision runs through several engines and at least one model call before a user sees a sentence. When something feels wrong — a cold reply, a missed nudge, a slow turn — we must be able to reconstruct *why*, per engine, without guessing. And we must do it without betraying the Covenant. Observability is how we debug a coach; privacy-scrubbing is how we stay allowed to.

**Practices.**
- **Per-engine tracing.** Every coaching turn carries a trace across the engines it touched (Emotion → Decision → Memory → Coach → Prompt Builder → model), with timings and the Coaching Move chosen. This is the Canon §6 observability commitment made concrete.
- **Privacy-scrubbed prompt/response capture.** We capture prompts and model responses for debugging and eval-set growth, but **scrubbed of PII by default** before storage (Canon §6, §7). Raw user content is never a casual log line. Access is scoped and audited — see `15 Constitution.md`.
- **Metrics tied to Canon §7, and only those.** We instrument the **North Star (Aligned Decision Rate, recovery-weighted)** and the guardrails (trust, "the app gets me," crisis-handoff correctness, notification opt-out rate, zero shaming incidents). We **do not** build dashboards for the anti-metrics — raw streak length, daily active minutes, session count for their own sake. Engagement bought with anxiety is a loss; we refuse to even make it easy to optimize.
- **Alert on guardrails.** A spike in shaming-grader hits, handoff errors, or opt-outs pages a human. These are safety signals, not vanity graphs.

---

## 6. Feature flags and safe rollout — a bad prompt is a production incident

**WHY.** In most products a bad deploy shows a broken button. In ours, a bad prompt or a mis-tuned Coaching Move can say something harmful to someone at a low moment. That is a production incident of the most serious kind. So coaching and prompt changes ship with the same caution as a payments change — gated, observable, and instantly reversible.

**Practices.**
- **Everything coaching-facing is behind a flag.** New prompts, new Coaching Moves, grader changes, model-tier changes — all flag-gated so we can enable for internal users, then a small cohort, then everyone.
- **Staged rollout with guardrail watch.** Roll a prompt change to a small percentage while watching the §7 guardrails and eval pass rates in real time. Degradation triggers automatic or one-click rollback.
- **Prompts are versioned and pinned.** The Prompt Builder emits a prompt version into the trace (§5) so any given Coach turn is reproducible and attributable to an exact prompt (`13 Prompt Architecture.md`).
- **Rollback is faster than fix-forward.** For anything touching Coach output or Safety, the default response to a regression is *flip the flag off*, then diagnose. We never debug a harmful prompt live in front of users.
- **Passing evals is the entry gate to rollout; guardrail metrics are the exit gate.** A change earns its way to production, then earns its way to 100%.

**Definition of done for a coaching-facing change.** A change to a prompt, a Coaching Move, a grader, or a model tier is not "done" until all of these hold. This checklist is the operational sum of §2, §3, and this section:
1. Deterministic logic paths (§2) are covered by unit tests.
2. Any changed engine contract has updated contract tests (§3, §1).
3. The golden-conversation, tone, and safety-red-team evals pass at the agreed gate (§3).
4. The change is behind a feature flag with a rollback path (this section).
5. The prompt is versioned and emitted into the trace (§5).
6. The PR states *why*, and the affected engine owner has reviewed (§8).
7. No new PII path was introduced without going through a chokepoint (§7).

---

## 7. Privacy as an engineering practice

**WHY.** Trust is the product (Canon principle #7). Privacy is therefore not a compliance chore bolted on late; it is a set of engineering defaults that make the wrong thing hard to do. The binding promises live in `15 Constitution.md` — the Covenant; this section is how those promises show up in the codebase.

**Practices.**
- **Data minimization by default.** We collect and retain only what an engine needs to do its job. New fields on a canonical aggregate (Canon §5) must justify their existence and their retention. The default answer to "should we store this?" is no.
- **Consent is a gate in code, not a checkbox.** Every proactive action (a Nudge, an Insight surfaced) checks a consent scope before it runs (Canon §8). This is deterministic logic (§2) and is unit-tested (§3).
- **PII handling is centralized.** PII flows through known chokepoints — the scrubber (§5), the Prompt Builder, storage adapters — never scattered. There is one place to reason about where a user's real words can go, and prompts to the model are scoped and scrubbed there.
- **Test-data hygiene.** No production user data in tests, fixtures, eval sets, or local machines. Golden conversations and red-team corpora use synthetic or fully anonymized personas. A real user's lapse is never a test fixture. CI checks fixtures for PII shapes.
- **Explainability is a data contract.** Every `Insight` carries `evidence_refs` (Canon §8); we never persist or surface a claimed pattern we cannot show. Unexplainable inference is treated as a bug.

---

## 8. Culture — explain-why, and clear ownership

**WHY.** The two failure modes of a small, fast team are (a) changes no one can later understand, and (b) systems no one clearly owns. Both are fatal to a product whose value is trust. Our culture directly counters them: we write down reasoning, and every engine has a name attached.

**Practices.**
- **Explain-why in PRs and design docs.** A pull request states *why*, not just *what* changed, and what it might break. This mirrors Canon §10 house style: a description that only says what has failed. Design docs precede anything hard to reverse (§4).
- **Per-engine ownership.** Each engine (Canon §4) has a clear owner responsible for its contract, tests, evals, and observability. Cross-engine changes require the affected owners in review — which is enforceable precisely because §1 gave us real boundaries.
- **Evals and safety are everyone's gate, no one's afterthought.** Shipping a coaching change means owning its eval results and its guardrail impact. "The model did it" is never an explanation; we chose the prompt, the schema, and the gates.
- **The Canon wins.** When code and Canon disagree, Canon wins or Canon changes — never a silent divergence. We use its vocabulary (§2) verbatim in code, tests, and traces so fifteen engineers describe the same system.

---

## 9. Research is an input into architecture — the product never outruns the evidence

**WHY.** We are a research-driven company (`15 Constitution.md §4`, non-negotiable #6): *research informs the model; the model informs the product; the product never outruns the evidence.* The failure mode this guards against is subtle and common — a compelling finding, or a compelling *popularization* of a finding, quietly hardens into an architectural assumption that the evidence never actually supported. When that assumption sits inside the Human Model or the Coaching Engine, we are now coaching real people on folk psychology. So research is not a library we cite; it is an **input that changes the architecture**, and the change has to be deliberate and traceable.

**The distinction that governs everything downstream.** Every behavioral claim the system acts on is tagged by source class — *established evidence · strong theory · practitioner experience · philosophical guidance · product intuition · experimental hypothesis* — per `../research/00 Method & Evidence Standard.md`. The Coaching Engine is grounded in the strongest available evidence for that claim. Anything below "established/strong" that we still choose to ship is shipped **as a labeled hypothesis** (`〔IH〕`), instrumented so it can be validated or killed. We never let intuition wear the costume of science (`15 Constitution.md §6` red line).

**Practices.**
- **Research is not documentation.** A research document that changes our understanding of human behavior is not "done" when it is written — it is done when its **Architecture Impact** has been assessed.
- **Every research document ends with an "Architecture Impact" section** (mandated by `../research/00`). It answers four questions: *What changed? Why? Which architecture documents should be updated? What assumptions should now be challenged?*
- **Do NOT auto-edit the architecture from research.** The research author recommends; they do not silently rewrite `03 Human Model.md`, `04 AI Brain.md`, `06 Decision Engine.md`, `07 Coaching Engine.md`, `05 Onboarding.md`, `08 Database Architecture.md`, `13 Prompt Architecture.md`, `14 Notification Engine.md`, `15 Constitution.md`, or `09 Roadmap.md`. A change to those flows through the normal review + ADR/PDR gate, so the reasoning is recorded and the seams stay clean (§1, §4).
- **When evidence contradicts a live assumption, say so explicitly.** The Architecture Impact section names the contradicted assumption directly. Reality is not negotiable; the architecture adapts to it, never the reverse.
- **Coaching claims are auditable against their evidence.** In review, a Coaching Move or prompt that asserts a behavioral mechanism must trace to a source of a stated class. "A book said so" is `〔Pop〕`, not grounds for a `[A]`/`[B]` claim to a user.

**What this buys us:** a straight line from a meta-analysis to a coaching behavior, with every hop labeled by how much we should trust it — and a company that can change its mind when the evidence does, without quietly having shipped the old belief to users in the meantime.

---

## Open questions / What we're deliberately NOT doing

**Open questions.**
- **Eval scoring thresholds.** Exact pass-rate gates for the tone grader and golden set are TBD — coordinate with `13 Prompt Architecture.md`. We know the gates exist; we have not yet calibrated the numbers against real conversation volume.
- **Grader trust.** Our no-shaming grader is itself an LLM classifier. How do we guard the grader against the same blind spots as the coach? Likely: periodic human audit of a sample, plus the deterministic banned-word floor. Open.
- **Automatic vs. one-click rollback.** For which guardrail breaches do we auto-rollback versus page a human first? Needs a severity matrix tied to Canon §7 guardrails.
- **PII scrubbing fidelity.** The line between "scrubbed enough to store" and "scrubbed so hard it's useless for debugging" is unsettled; depends on `15 Constitution.md` retention rules.

**What we're deliberately NOT doing (yet).**
- **Not** adopting microservices, a separate service mesh, or a heavyweight message broker for v1. One deployable, Redis-streams event bus, seams kept clean (Canon §6, §1).
- **Not** building the Learning or Notification engines beyond stubs before v1.1 (Canon §4, `09 Roadmap.md`).
- **Not** giving feature code raw model access, ever — the Prompt Builder is the only door (Canon §6, §2).
- **Not** instrumenting or optimizing the anti-metrics (Canon §7). Choosing not to measure engagement-for-its-own-sake is itself an engineering decision.
- **Not** treating "it sounded good in review" as a substitute for evals. Anecdote never gates a coaching release.
- **Not** shipping any prompt or Coach change without a flag and a rollback path.

---

*See also: `12 Backend Architecture.md` (module layout, event bus), `13 Prompt Architecture.md` (layered prompts, structured output, eval harness), `15 Constitution.md` (the Covenant, safety, privacy non-negotiables), `04 AI Brain.md` (engine topology), `09 Roadmap.md` (what's stubbed and when).*

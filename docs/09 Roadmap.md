# 09 · Roadmap — Sequencing, MVP Scope & What We Deliberately Stub

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** The single source of truth for *what we build in what order, why in that order, and what we knowingly leave unbuilt.* This document owns sequencing, MVP scope, and the stub list. Everything here is subordinate to `00 Canon.md`; where a feature's aliveness is stated, it must match Canon §4's MVP-status column. See also `01 Vision.md` (the wedge), `12 Backend Architecture.md` (the one deployable), and `15 Constitution.md` (the guardrails that gate launch).

---

## 1. The stance: decomposition is not a build order

Canon §4 lists nine engines. That list is the **logical decomposition** of the problem — the bounded contexts a decision coach *eventually* needs. It is emphatically **not** a day-one construction schedule. The single most common way a small team dies is by building the org-chart-shaped system before it has a single validated user.

So our stance is deliberate and asymmetric:

- **We ship the *interfaces* for all nine engines on day one.** Every engine has a stable contract (its inputs/outputs per Canon §4) and a module boundary in the modular monolith (`12 Backend Architecture.md`). This is cheap — it is type definitions, event schemas, and a directory — and it buys us the freedom to bring an engine alive later *without* reshaping the system around it.
- **We keep only a few engines *alive* at MVP.** An engine is "alive" when it has real logic behind its interface. The rest are honest stubs: a stub returns a valid, safe, minimal output that satisfies its contract, so the Coach Engine can compose the system every turn without special-casing "is this engine real yet?"

WHY interfaces-first-but-mostly-stubbed, and not "just build the three we need and wire the rest later": because the Coach Engine is the only orchestrator (Canon §4) and it composes *all* engines per turn. If the composition shape changes every time an engine wakes up, the orchestrator becomes the most-churned, least-stable code in the system — exactly backwards. Stable contracts + swappable internals is the whole bet of the modular monolith. We pay a small tax now (defining contracts we won't use for months) to avoid a large tax later (re-architecting the orchestrator four times).

> **The rule:** the shape of the system is fixed at v1; the *intelligence* behind each contract grows over time.

---

## 2. MVP (v1) — what is ALIVE

The MVP is the smallest system that can deliver one genuine **Coaching Session** anchored to one real **Impulse Moment**, safely, in a way a user would miss if we took it away. Per Canon §4, the engines alive at v1 are:

| Engine | Alive at v1? | What "alive" means at v1 |
|---|---|---|
| **Identity Engine** | Alive | Real onboarding capture of `values[]`, `identity_statements[]`, and a Future Self narrative; served into every prompt. |
| **Decision Engine** | Alive | Structures an Impulse Moment into a Decision frame (options, tradeoffs, bias flags, time-horizon reframe); computes the `alignment_score`. |
| **Coach Engine** | Alive | Orchestrates the dialogue, selects Coaching Moves, calls the LLM (Sonnet 5) through the Prompt Builder. |
| **Memory Engine** | Alive (basic) | Episodic write of every Decision/Session + semantic retrieval over pgvector. No learned patterns yet. |
| **Prompt Builder** | Alive | Layered, Constitution-bound prompt assembly + structured output. No feature code touches the model directly. |
| **Safety Engine** | Alive — **gates launch** | Crisis/clinical-risk triage on every inbound message; hard-stop + human-resource routing. |
| **Emotion Engine** | Alive (classifier) | Haiku 4.5 classifier producing an EmotionSignal to color coaching. Lightweight; not yet a driver of proactivity. |
| Learning Engine | **Stub → v1.1** | Contract present; returns "no insight." |
| Notification Engine | **Stub → v1.1** | Contract present; returns "stay silent." |

Plus a **focused iOS client** (`11 iOS Navigation.md`): Swift + SwiftUI, offline-first, exactly the screens needed to (a) complete onboarding/identity capture, (b) bring an Impulse Moment to the Coach, (c) hold a Coaching Session, (d) log an Outcome (aligned / lapse / recovery). Nothing else. No dashboard, no analytics screen, no notification center — because at v1 we have nothing worth notifying about and no patterns worth charting (see §7 stub table).

### 2.1 The wedge: one decision domain

Per `01 Vision.md`, we do **not** launch a general-purpose life coach. We wedge into **one decision domain** and earn the right to expand. The MVP domain is the one where the Present/Future-Self tension is sharpest, most frequent, and least clinically fraught — a domain of everyday discretionary-spend / consumption impulses ("should I buy this / order this / open this app right now?"). WHY this wedge:

- **High frequency** → many Impulse Moments per user per week → we accumulate Decision/Outcome data fast, which is the fuel v1.1's Learning Engine needs (§4).
- **Low clinical risk** relative to domains like substance use or disordered eating → the Safety Engine's hard cases are the exception, not the norm, so we can validate coaching quality without the failure mode being catastrophic.
- **Clear alignment signal** → "did this serve Future Self?" is answerable by the user shortly after, giving us honest Outcome labels.

The domain is a wedge, not a ceiling. The engine contracts are domain-agnostic by design; broadening domains (v2+, §5) is a data-and-safety exercise, not a re-architecture.

### 2.2 MVP success criteria (North-Star + trust, not vanity)

We refuse to declare MVP success on installs, DAU, or session minutes (Canon §7 anti-metrics). MVP succeeds only if:

1. **North Star moves the right way:** the **Aligned Decision Rate, recovery-weighted** (Canon §7) is measurably higher for engaged users than their own baseline — and critically, **Recovery** decisions (the choice after a Lapse) trend aligned. Recovery is weighted double because "progress over perfection" is the whole thesis.
2. **Trust guardrails hold (must not degrade — Canon §7):**
   - Self-reported *trust* and *"the app gets me"* are net positive.
   - **Crisis-handoff correctness** at 100% on our safety eval set — this is a launch gate, not a metric to optimize post-hoc.
   - **Zero shaming-language incidents** in production (enforced by the tone/lint pass, Canon §8).
   - Notification opt-out rate — trivially satisfied at v1 (no notifications yet), but the baseline is recorded for v1.1.
3. **It doesn't feel like a chatbot:** qualitatively, users describe being *helped to think*, not *answered*. This is soft but non-optional (see risks, §8).

If North Star moves but trust guardrails degrade, **the MVP has failed** — engagement bought with anxiety is a loss (Canon §7).

---

## 3. Why these six-plus engines and not others

- **Identity + Decision + Coach** are the irreducible core: without Identity there is nothing to align *to* (principle #4, identity over goals); without the Decision frame the Coach is just a chatbot (principle #3, understand before advising); the Coach is the only orchestrator, so it must be real.
- **Memory (basic)** is alive because "understand before advising" and "the app gets me" are impossible if we forget the user between sessions. But only *basic* — episodic recall + semantic retrieval, no learned patterns.
- **Safety** is alive because it **gates launch** (Canon §4). We do not ship a system that talks to people about their impulses without crisis triage. Full stop.
- **Emotion (classifier)** is alive but modest: it colors tone and move selection. It is cheap (Haiku) and improves coaching quality immediately, which is why it earns its place at v1 even though its richer proactive use waits.
- **Prompt Builder** is alive by necessity: Canon §6 forbids raw model access from feature code, and the Constitution binds every prompt.

---

## 4. v1.1 — Learning Engine + Notification Engine come alive

v1.1 wakes the two stubbed engines. WHY they come *second* and could not have come first:

**You cannot learn a pattern you have no data for.** The Learning Engine's contract (Canon §4) consumes *outcomes, reflections, lapses/recoveries* and emits *Insights + updated priors*. At v1's launch we have zero Outcome history per user. Any "insight" produced would be a hallucinated pattern with no `evidence_refs` — which Canon §8 explicitly forbids ("we never assert a pattern we can't show"). The Learning Engine is *definitionally* blocked until the MVP has run long enough to accumulate Decision/Outcome data. The high-frequency wedge (§2.1) is what makes this weeks, not years.

**You cannot nudge well before you know when.** The Notification Engine's job (Canon §4, `14 Notification Engine.md`) is to decide *when/whether* to reach out. A good Nudge requires a learned model of the user's risk moments — which is an *output of the Learning Engine*. Nudging before we can learn produces either generic spam or anxiety-driven pings, both of which violate "coach, never parent" and the attention ethics of `14 Notification Engine.md`. So Notification depends on Learning, and Learning depends on MVP data — a strict ordering, not a preference.

v1.1 also adds the **Reflection** loop (daily/weekly look-backs) in earnest, because Reflections are a primary input to the Learning Engine and a latency-tolerant place to spend Opus 4.8 on deep synthesis (Canon §6).

**v1.1 validation gate:** Insights are rated *useful and correct* by users at a high bar, and every surfaced Insight carries real `evidence_refs`. Nudges show a *positive* opened→acted rate with a *flat-or-falling* opt-out rate. If nudging raises opt-outs, we pull it (§6 kill-criteria).

---

## 5. v2+ — deeper personalization, pattern insights, broader domains

Only after v1.1 proves we can learn and nudge without breaking trust do we invest in depth:

- **Deeper personalization:** richer Identity modeling (virtues, evolving Future Self narrative), Memory promoted from basic to a genuine semantic/pattern store, per-user coaching-style adaptation.
- **Pattern Insights as a first-class surface:** the Learning Engine's Insights become something the user can explore — always evidence-backed, always dismissible, never a scoreboard.
- **Broader domains:** expand beyond the wedge (§2.1) one domain at a time, each gated by a fresh Safety review. Domains with higher clinical risk (e.g. substance-adjacent) require Constitution-level sign-off and likely clinical partnership before any coaching is enabled.
- **Emotion Engine promoted** from classifier to a driver of proactive timing, feeding the Notification Engine.

We name no dates for v2+. It is explicitly contingent on v1 and v1.1 clearing their gates.

---

## 6. Milestones as LEARNING gates (not ship dates)

We frame milestones as *questions we must answer*, each with an explicit kill-criterion. A milestone is "done" when the learning is validated, not when the code merges.

| Gate | The question we must answer "yes" to | Kill / pivot criterion (the signal to stop) |
|---|---|---|
| **G0 — Safe to talk** | Does the Safety Engine catch crisis/clinical risk and route correctly, every time, on our eval set? | Any miss on the safety eval set. **Non-negotiable, blocks all downstream gates.** |
| **G1 — Understanding is real** | Do users finish onboarding feeling *understood* (the app captured a true Identity)? | Users report the Identity model feels generic or wrong → the Identity Engine / onboarding (`05 Onboarding.md`) is not ready; do not proceed. |
| **G2 — Coaching beats a chatbot** | In a Coaching Session, do users feel *helped to think*, not *answered*? Do Coaching Moves land? | Users describe it as "a chatbot" or "advice I didn't ask for" → coaching quality (`07 Coaching Engine.md`) fails; pivot the dialogue model before scaling. |
| **G3 — Alignment moves** | Does the recovery-weighted Aligned Decision Rate rise vs. baseline, *especially* on Recovery decisions? | North Star flat/down after sufficient engaged use → the core value hypothesis is wrong; pivot the wedge or the coaching approach. |
| **G4 — Trust holds under learning** | Can we surface Insights and Nudges (v1.1) *without* degrading trust or raising opt-outs? | Opt-out rate climbs, or trust/"gets me" drops when we turn on proactivity → pull Notification, keep coaching reactive. |
| **G5 — Domain generalizes** | Does coaching quality + alignment hold in a second domain (v2+)? | Quality collapses outside the wedge → the wedge was the product; stay narrow and deepen instead of broadening. |

**Overarching kill-criteria (any one is a hard stop or pivot):**
- A single genuine **safety failure** in production (crisis missed / mishandled).
- Evidence we retain users via **anxiety** rather than value (opt-outs up, trust down, minutes up — the anti-pattern of Canon §7).
- Users cannot tell us the app *gets them* after understanding-first onboarding.

---

## 7. What we are deliberately stubbing — and why (per engine)

A stub honors its contract with a safe, minimal, honest output. Nothing here is a "TODO that crashes"; each stub is a valid citizen the Coach Engine can compose every turn.

| Engine / capability | Stub behavior at v1 | Why we stub it (not build it) | Wakes at |
|---|---|---|---|
| **Learning Engine** | Returns "no insight"; writes nothing to `Insight`. | No per-user Outcome history exists yet; any insight would lack `evidence_refs` (Canon §8 forbids). | v1.1 |
| **Notification Engine** | Returns "stay silent"; schedules no Nudge. | Good timing depends on learned risk patterns, which depend on the Learning Engine, which depends on MVP data. | v1.1 |
| **Reflection loop** | Minimal manual look-back only; not yet feeding learning. | Full value is as Learning Engine fuel; premature to build the machine before its consumer exists. | v1.1 |
| **Emotion Engine (rich)** | Classifier only (valence/arousal/labels); colors tone, does not drive proactivity. | Proactive use requires the Notification Engine; classifier alone already improves coaching cheaply. | v2+ |
| **Memory Engine (patterns)** | Episodic write + semantic retrieval; `type=pattern` memories not generated. | Pattern memory is a Learning Engine output; basic recall is enough for "understand before advise." | v1.1→v2 |
| **Insight surface (UI)** | No Insight screen in the iOS client. | Nothing to show until Learning is alive; avoids a scoreboard that could shame (Canon §2 banned words). | v1.1 |
| **Multi-domain coaching** | Single wedge domain (§2.1). | Focus; each new domain is a Safety review, not a code change. | v2+ |
| **Real message broker** | Redis streams event bus (Canon §6). | Abstracted behind an interface; swap when scale demands, not before. | scale-driven |
| **Multi-service split** | One deployable modular monolith (`12 Backend Architecture.md`). | Startup discipline: split only when pain demands; premature split multiplies ops cost. | scale-driven |

---

## 8. Top risks & mitigations

These four are the risks that could kill Impulse specifically (generic execution risk aside).

| Risk | Why it's existential here | Mitigation |
|---|---|---|
| **Trust breach** | Trust *is* the product (principle #7). Once broken, no coaching lands. | The Covenant (`15 Constitution.md`) is architecture, not copy: consent as a gate (Canon §8), privacy-scrubbed observability (Canon §6), no data use we can't defend. Trust is a launch guardrail (§2.2). |
| **Safety failure** | We talk to people about their impulses; a missed crisis is catastrophic and irreversible. | Safety Engine gates launch (G0); triage on *every* inbound message (Canon §8); safety eval set in CI (Canon §6); hard-stop authority over any coaching turn. |
| **"Feels like a chatbot"** | If we're indistinguishable from a general assistant, we have no product and no moat. | Understand-before-advise enforced *in code* (Canon §8); Coaching Moves + tone/lint (`07 Coaching Engine.md`); Identity + Decision context required before advice-type moves; G2 is a gate. |
| **Retention-via-anxiety** | The easy growth hack (streaks, guilt pings) directly violates our philosophy and would corrupt the North Star. | Anti-metrics are refused by policy (Canon §7); banned-word list (Canon §2); Recovery weighted over streaks; Notification ethics (`14 Notification Engine.md`); G4 kills proactivity that raises opt-outs. |

---

## 9. Team & sequencing note (small team, one deployable)

We build this as a small team against **one deployable** — the modular monolith of `12 Backend Architecture.md`, plus one iOS client (`11 iOS Navigation.md`). This is a deliberate constraint, not a limitation:

- **Backend is a modular monolith**, engines as modules with hard interfaces (Canon §6, §4). One repo, one deploy, one on-call surface. Engineers work in different engine modules without stepping on each other because the contracts are the seams.
- **Sequencing follows the gates (§6), not a feature list.** Roughly: G0 safety scaffolding first (it gates everything) → identity/onboarding + decision framing (G1) → coaching dialogue + basic memory (G2/G3) → hardening + eval harness → v1.1 learning/notification once data exists (G4).
- **The interface-first stance (§1) is what lets a small team scope tightly:** because the stubbed engines already satisfy their contracts, no one is blocked waiting on the Learning Engine to exist, and no one has to re-thread the orchestrator when it arrives.
- **One shared eval harness in CI** (Canon §6) is a first-class deliverable, not an afterthought — it is how a small team keeps coaching quality and safety from regressing as engines wake up.

---

## Open questions / What we're deliberately NOT doing

**Open questions:**
- Exact quantitative thresholds for each gate (§6) — the *direction* is fixed here; the numbers are set with `10 Engineering Principles.md` and the eval harness once we have baseline data.
- How long the MVP must run before the Learning Engine has enough per-user Outcome data to wake safely — a function of the wedge's real-world frequency (§2.1).
- Whether the Reflection loop should partially precede v1.1 to seed learning data earlier, at the cost of MVP scope.
- The concrete second domain for v2+ and its Safety bar (§5).

**What we are deliberately NOT doing (at MVP):**
- **Not** building all nine engines alive on day one — only their contracts (§1).
- **Not** nudging, learning, or surfacing Insights before we have Outcome data (§4, §7).
- **Not** shipping any dashboard, streak, or scoreboard surface — these invite the anti-metrics and shaming we refuse (Canon §7, §2).
- **Not** launching multiple decision domains — one wedge, earned expansion (§2.1, §5).
- **Not** splitting into microservices or adopting a heavy message broker before scale pain demands it (§7, Canon §6).
- **Not** shipping *anything* until the Safety Engine clears G0 (§6).

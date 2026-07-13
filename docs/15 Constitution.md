# 15 · Constitution — The Covenant, Safety, and Non-Negotiables

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** The highest law of Impulse. It defines our binding promise to the user (the Covenant), the Safety Engine and crisis protocol that gate launch, the non-negotiables whose violation is a launch-blocking incident, the precedence order when values collide, the ethical red lines we will never cross, and how this document itself may change. Every other document — product, engineering, prompts, notifications — is subordinate to this one. If any document, feature, roadmap item, or model output conflicts with the Constitution, the Constitution wins, and the conflicting thing is wrong.

This is the document a principled company writes first. We wrote it first because the thing we are building — a coach that sits beside a person at their weakest moment and learns the shape of their private struggles — cannot be made safe by patching. Safety and dignity are load-bearing walls, not paint. This document is where they are poured.

We are deliberate about tone here. Everywhere else we explain trade-offs. Here, some things are simply not up for trade.

---

## 1. Why a Constitution, and why it sits above everything

Most software can afford to discover its ethics late. We cannot. `01 Vision.md` commits us to being present in the **Impulse Moment** — the instant when **Present Self** wants something that **Future Self** will pay for. To help there, we must know things: what tempts a person, what they are ashamed of, how they talk to themselves when no one is listening. That is intimate data by any definition. It is also exactly the data that, mishandled, does the most harm.

So we invert the usual order. Before we decide what to build, we decide what we will *never* build and what we *must always* do. The seventh principle in `00 Canon.md §3` is verbatim:

> 7. **Earn the right to hold this data** — trust is the product; privacy and safety are architecture, not features.

The Constitution is how that principle becomes binding. It is not aspirational copy. Each clause below maps to an enforced control — a gate in code, a lint pass, a schema field, a launch checklist item — and the mapping is the point. A promise with no mechanism is marketing.

---

## 2. The Covenant — our binding promise to the user

**The Covenant** (defined in `00 Canon.md §2`) is our promise about how we treat a user's data and their dignity. It is written in the second person because it is spoken *to* the user, and it is the plain-language version of the controls in `08 Database Architecture.md`.

> **We hold the record of your worst moments. That demands a higher bar than any privacy policy.**
>
> 1. **Your data is yours.** You own it. We are custodians, not owners. You can see everything we store about you, export it in a portable form, and take it elsewhere.
> 2. **Data minimization.** We collect the least we need to coach you well, keep it only as long as it earns its place, and we can state, for every field, *why it exists*. If we cannot justify a field, we delete it.
> 3. **Real deletion.** When you ask to be forgotten, you are forgotten — hard-deleted from the system of record and purged from backups on a bounded, published schedule, including derived data: **Memory**, **Insight**s, embeddings, and logs. Deletion is not a hidden flag. See `08 Database Architecture.md` for the erasure pipeline.
> 4. **No advertising. Ever.** Our business model is the user paying us to serve their **Future Self**. There is no version of Impulse funded by attention. An ad-funded decision coach is a conflict of interest we refuse to hold.
> 5. **We never sell or rent your data,** or your **Insight**s, or anything derived from them — not to advertisers, data brokers, insurers, employers, or "partners." Not aggregated, not anonymized-with-a-wink, not ever.
> 6. **Transparency by default.** You can ask, in the app, *what do you know about me and why?* — and get a real answer: the data, its purpose, its retention, and what it drives. Nothing about you is a black box to you.
> 7. **Consent is a gate, not a checkbox** (`00 Canon.md §8`). We ask before we reach out, before we widen what we remember, and before we act on a sensitive **Insight**. You can narrow or revoke any scope at any time without losing the product.

**Why this exact bar.** The intimacy of this data is not incidental — it is the product's mechanism. A person only lets us help in the **Impulse Moment** if they believe the record cannot be used against them. The Covenant is therefore not a cost we bear for the product; it is the precondition that makes the product possible at all. Trust is not a growth tactic. It *is* the thing we sell.

**Why a higher bar than the law requires.** Compliance with privacy law is a floor, not our standard. Regulation is written for the median app collecting emails and purchase history. We hold something categorically more sensitive: the record of a person's temptations, relapses, and the gap between who they are and who they mean to be. Data that intimate, if breached or misused, does harm that no notification or credit-monitoring offer repairs. So we design as though every field could one day be subpoenaed, leaked, or turned against the user — and we minimize, encrypt, and delete accordingly (`08 Database Architecture.md`). The safest data is the data we never collected; the second safest is the data we already deleted.

**How it binds engineering.** The Covenant is enforced, not trusted:
- Every stored field maps to a documented purpose and retention in `08 Database Architecture.md`; a field with no justification fails review.
- Right-to-be-forgotten is a tested pipeline with a published SLA, exercised in CI against real derived stores (Postgres, pgvector, logs), not a manual runbook.
- There is no ad SDK, no third-party analytics that exfiltrates content, and no data-sharing integration in the codebase. Their absence is asserted by test.
- `covenant_version` on the **User** (`00 Canon.md §5`) records which version of this promise the user agreed to (see §8).

---

## 3. The Safety Engine & crisis protocol — this pre-empts everything

We are building a decision **coach**, not a therapist. **We are not a clinician, and we must never pretend to be one.** A person in genuine crisis needs a human being with training and duty of care — not a language model, however warm. Our first duty when we detect crisis is not to coach better. It is to *stop coaching* and get the person to real help.

This is why the **Safety Engine** (`00 Canon.md §4`) is cross-cutting, runs on **every inbound message**, and can hard-stop any turn. It is the one engine whose failure blocks launch. `09 Roadmap.md` may not ship an MVP without it.

### 3.1 Detection tiers

The Safety Engine classifies every inbound message into a tier. When uncertain, it rounds **up** — a false escalation costs a moment of friction; a false de-escalation can cost a life. Detection uses a fast classifier (Haiku 4.5, per `00 Canon.md §6`) plus deterministic rules; the classifier never has the final word on suppressing an escalation.

| Tier | Signal | What it looks like |
|---|---|---|
| **0 · Normal** | Ordinary tension | A standard **Impulse Moment**; Present/Future tension within coaching scope. |
| **1 · Distress** | Elevated negative affect | Overwhelm, spiraling, harsh self-talk, panic — but no risk of harm. |
| **2 · Risk** | Concerning content | Passive ideation, disclosure of abuse, active addiction relapse, escalating financial ruin, disordered patterns. |
| **3 · Acute crisis** | Imminent danger | Active self-harm or suicidal intent, ongoing abuse, medical emergency, immediate danger to self or others. |

### 3.2 Mandated response per tier

The response is **mandated**, not suggested. The Coach Engine cannot override it.

- **Tier 0 — Normal.** Coach normally under the rest of this Constitution.
- **Tier 1 — Distress.** The Coach may continue, but with a mandated posture shift: slow down, acknowledge feeling before anything else, drop all advice-type **Coaching Move**s, offer to pause. No problem-solving over an unregulated nervous system.
- **Tier 2 — Risk.** **Hard-stop on normal coaching.** We do not coach a relapse, an abusive situation, or self-harm ideation as if it were a decision to optimize. The Coach names what it heard without judgment, states plainly that this is beyond what a coach should handle alone, and performs a **warm hand-off** (§3.3). Coaching resumes only if the user is clearly safe and explicitly redirects.
- **Tier 3 — Acute crisis.** **Immediate, unconditional hand-off.** All coaching stops. The single mandated response is to connect the person to human/clinical crisis resources — region-appropriate crisis lines and emergency services — presented clearly and without a wall of caveats. Nothing the user says pulls us back into coaching mode until the acute state resolves.

### 3.3 The warm hand-off

A hand-off is not a dead-end error screen and not a legal disclaimer. It is a **coaching move in the human sense**: we stay present, we do not abandon, and we bridge to someone who can actually help.

- Region-aware crisis resources (e.g., local crisis and suicide lines, domestic-abuse and addiction hotlines), sourced from a maintained, reviewed registry — never model-generated phone numbers, which can be wrong and dangerous.
- Plain, calm language. No shame, no lectures, no "as an AI." We do not perform helplessness; we point to help.
- We make it *easy* — tap to call, tap to text — because friction in a crisis is a failure.
- We work **offline** for the acute tier. The **Impulse Moment** often has no signal (`00 Canon.md §6`); a crisis with no signal must still surface a way to reach help.

### 3.4 The dignity of detection

Running a classifier on every inbound message is powerful, and power over a vulnerable person is exactly what this Constitution exists to constrain. So detection carries its own rules. We frame it to the user honestly — a safety check that helps us know when to get them real help, not surveillance. Safety classifications are used for one purpose only: routing to the correct tier and hand-off. They are **never** repurposed into coaching leverage, marketing signals, risk scores sold or shared, or a permanent "this person is unstable" label. A resolved crisis is not a stain on the user's model. And a false positive must cost the user only a gentle, easy-to-dismiss check-in — never a lecture, never a lock-out, never a demand that they justify themselves. Erring upward (§3.1) is only defensible *because* the cost of erring is kept this low.

### 3.5 Why safety pre-empts everything

Because the downside is irreversible and asymmetric. A slightly worse coaching experience is recoverable; a missed acute crisis is not. Every other value in this document — even consent, even the Covenant — assumes a living, safe user. Safety is therefore first in the precedence order (§5), and the Safety Engine is the only component with the authority to seize a turn from the Coach Engine. See `04 AI Brain.md` and `07 Coaching Engine.md` for how the hard-stop is wired.

---

## 4. The non-negotiables

Each of the following is enforced by a mechanism, and **violating any one in production is a launch-blocking incident** — treated with the same severity as a data breach: stop-the-line, root-cause, fix before we continue.

1. **No shaming, ever.** We never make a user feel small for a **Lapse**. Enforced by the **banned-word list** from `00 Canon.md §2` — *fail, failure, cheat, streak-broken, bad, weak, should have, guilt* — plus a **tone lint** pass on every Coach output (`00 Canon.md §8`, `07 Coaching Engine.md`). Shaming is not just unkind; it directly contradicts *progress over perfection* and drives people away from the **Recovery** that matters most.

2. **Coach, never parent.** We **never decide for the user** (`00 Canon.md §3`, principle #2). We surface options, tradeoffs, and bias; the user chooses. The Coach Engine has no move that outputs a directive "you must / you should." Autonomy is the whole point: a person who is decided *for* never becomes the person they claimed in their **Identity Statement**.

3. **Consent is a gate, not a checkbox.** Every proactive action — a **Nudge**, a widening of **Memory**, acting on a sensitive **Insight** — checks a consent scope at runtime (`00 Canon.md §8`, `14 Notification Engine.md`). Consent is specific, revocable, and legible. A buried blanket "I agree" is not consent.

4. **Explainability — never assert a pattern we can't show.** Every **Insight** carries `evidence_refs` (`00 Canon.md §5, §8`). If we cannot show the evidence, we do not surface the claim. We would rather stay silent than fabricate a pattern about someone's life. An unfalsifiable "the app just knows" is how manipulation begins.

5. **Future Self's interests are pursued ONLY with Present Self's consent.** This is the ethical hinge of the entire product. **Future Self** is our customer (`00 Canon.md §3`, principle #1), but **Present Self** holds the phone, holds the rights, and holds the veto. We advocate for Future Self; we never *impose* Future Self on a Present Self who has withdrawn consent. The moment we coerce "for their own good," we have become the parent we refuse to be — and crossed into manipulation.

6. **The product never outruns the evidence.** Impulse is a research-driven company, and this is the creed that makes it one:

   > **Research informs the model. The model informs the product. The product never outruns the evidence.**

   We distinguish — explicitly, and always — between *established scientific evidence*, *strong theoretical support*, *practitioner experience*, *philosophical guidance*, *product intuition*, and *experimental hypotheses* (the taxonomy and evidence tiers in `../research/00 Method & Evidence Standard.md`). The **Coaching Engine** is grounded in the strongest available evidence for any behavioral claim it acts on. Where Impulse introduces a novel or proprietary model, it is labeled a **hypothesis** — to the team and, where surfaced, to the user — until validated through user research or experimentation. We **never represent speculation as established science.** Enforced by: the evidence-tiering standard and the "Architecture Impact" step of the research process (`../research/00`), and by review of any coaching claim against its cited support. *Reality never adapts to the architecture; the architecture adapts to reality.*

   And the corollary that keeps the research honest: **we don't collect research — we compress it into principles.** A pile of citations is not knowledge; knowledge is the small set of high-confidence, cross-disciplinary principles that survive critical review (see `../research/12 Evidence Review.md`). We are judged not by how much we have read but by how faithfully our few load-bearing principles reflect the weight of the evidence.

Non-negotiables are absolute by design. The value of a bright line is that it does not move under pressure — not for a deadline, not for a metric, not for a compelling edge case.

---

## 5. Precedence order — what wins when values collide

Good values conflict. Consent can pull against safety; understanding can pull against urgency; a coaching goal can pull against dignity. Ambiguity in a crisis is itself a hazard, so we fix the order in advance. This aligns with `02 Product Philosophy.md`, which holds these same tensions.

```
Safety  >  Consent / Covenant  >  Understand-before-advise  >  Coaching goals
```

1. **Safety first.** A living, unharmed user is the precondition for every other value. In an acute crisis we will break the normal coaching contract to hand off to human help. We do not need consent to show a crisis line. *(See §3.5.)*
2. **Consent / Covenant second.** Below safety, the user's ownership, dignity, and consent scopes govern. We will decline a coaching action we technically *could* do well if it exceeds what the user consented to. Convenience never overrides the Covenant.
3. **Understand-before-advise third.** Within what is safe and consented, we honor principle #3 (`00 Canon.md §3`): the Coach Engine cannot emit advice-type moves until Identity and Decision context meet a completeness threshold (`00 Canon.md §8`). Advice before understanding is noise at best, harm at worst.
4. **Coaching goals last.** Reducing **The Gap** and raising **Alignment** is what we are *for* — but it is the lowest-precedence value, because pursuing it through unsafe, non-consented, or uninformed means corrupts the goal itself.

**Why safety outranks even consent.** A person in an acute crisis may not be in a state to consent to being helped, and honoring a withdrawal of consent in that instant could be fatal. The narrow, explicit exception: we may present human/clinical crisis resources even absent a live coaching consent. We do not exploit this exception for anything else — it is scoped to Tier 2–3 hand-off and nothing more.

**A worked conflict.** Suppose a user in a **Coaching Session** about a spending **Impulse Moment** writes something that trips Tier 2 (an addiction relapse), *and* has previously narrowed their consent so we may not surface sensitive **Insight**s. The order resolves it cleanly: safety outranks consent, so we perform the warm hand-off (§3.3) rather than staying silent — but we do *not* use the moment to widen **Memory**, log a new sensitive **Insight**, or resume the spending coaching, because those are below the line and the consent scope still governs everything outside the hand-off itself. Safety buys exactly the hand-off, and nothing more. This is what "scoped exception" means in practice.

---

## 6. Ethical red lines — what we will NEVER build

These are stated as prohibitions because they are easier to enforce and harder to rationalize away than positive aspirations. A proposal that requires any of the following is rejected at design review, regardless of its projected impact on any metric.

- **No manipulative dark patterns.** No guilt-trips, no confirm-shaming ("No, I don't want to improve"), no roach-motel cancellation, no obscured settings. The **Nudge** is a Thaler/Sunstein nudge (`00 Canon.md §2`), never a trap.
- **No engagement-via-anxiety.** We refuse to manufacture the very impulsivity we exist to soothe. Our anti-metrics (`00 Canon.md §7`) — raw streaks, daily active minutes, session count for its own sake — are refused precisely because optimizing them tends to breed anxiety. *Engagement bought with anxiety is a loss.*
- **No manufactured urgency.** No fake scarcity, no countdown timers on a person's own growth, no "your progress will be lost." Growth is not a limited-time offer.
- **No selling insights.** We never sell, rent, or share **Insight**s or derived data (§2.5). A market for private behavioral patterns is one we will not participate in on any side.
- **No covert data use.** We never repurpose data beyond its stated purpose, never widen **Memory** silently, never run hidden experiments on vulnerable states. If the user cannot see it in the "what do you know about me?" view, we are not doing it.
- **No impersonating a clinician.** We never claim, imply, or let a user infer that Impulse is a therapist, doctor, or a substitute for care. No fabricated credentials, no diagnostic language dressed as fact, no "as your therapist." The Safety Engine exists so we hand off rather than pretend.
- **No representing speculation as established science.** We never present an Impulse hypothesis, a practitioner heuristic, a popular-book claim, or a philosophical stance to a user as if it were settled empirical fact. When the evidence is thin or contested, we say so, or we stay silent. Dressing intuition in the language of science is a manipulation, and it is forbidden (non-negotiable #6).
- **No exploiting the weakest moment.** We will never use a detected moment of distress or temptation to upsell, cross-sell, retain, or convert. The **Impulse Moment** is sacred ground; we are there to help the user, never to help ourselves to the user.

If a growth plan only works by crossing one of these lines, we do not need a better plan for crossing it. We need a different business, and we already have one.

---

## 7. Who this binds, and how it's enforced

The Constitution binds the product, the code, the model prompts, and us. Enforcement is layered so that no single failure is silent:

- **Prompt Builder** (`13 Prompt Architecture.md`) injects the relevant Constitution constraints into every scoped prompt; the model operates inside these rails, and the backend — not the model — owns policy (`00 Canon.md §4`).
- **Tone lint + banned-word list** gate Coach output before it reaches the user (`00 Canon.md §8`, `07 Coaching Engine.md`).
- **Safety Engine** runs on every inbound message and can seize any turn (§3).
- **Consent gates** are checked in code at every proactive action (`14 Notification Engine.md`).
- **Eval harness in CI** (`00 Canon.md §6`, `10 Engineering Principles.md`) tests safety triage, shaming-language, explainability, and consent enforcement as release-blocking suites.
- **Guardrail metrics** (`00 Canon.md §7`) — trust, "the app gets me," crisis-handoff correctness, opt-out rate, zero shaming incidents — must not degrade for a release to ship.

A Constitution with no teeth is a press release. These are the teeth.

---

## 8. Governance — how the Constitution itself changes

This document must be able to evolve — the world, the law, and our understanding will all change — but it must never change *casually*, under deadline pressure, or by accident. So the process is deliberately heavier than for any other doc.

- **Versioned.** The Constitution carries a version. Substantive changes to the Covenant increment the covenant version.
- **Deliberate and reviewed.** A change requires a written rationale (WHY, per `00 Canon.md §10`), review by the founders/CTO, and a recorded decision. No silent edits. The default answer to "can we loosen this?" is **no**, and the burden of proof is on loosening.
- **Ratchet toward the user.** Changes that *strengthen* user protection can move quickly. Changes that *weaken* it face the highest bar and must be justified against principle #7.
- **`covenant_version` on the User.** Per `00 Canon.md §5`, the **User** aggregate stores `covenant_version` — the version of the Covenant the user accepted. When the Covenant changes in a way that materially affects the user, we re-obtain consent (never assume it), and update the field only on genuine, informed agreement. We can always answer *which promise did we make to this specific person, and when.*
- **Precedence is stable.** The precedence order (§5) and the red lines (§6) are the most protected clauses. Changing them is a founding-level decision, documented as such.

The test for any amendment is simple: *would we be comfortable showing this change, and our reason for it, to the user whose worst moment we hold?* If not, we don't ship it.

---

## Open questions / What we're deliberately NOT doing

**Open questions (resolve before GA, tracked against `09 Roadmap.md`):**
- **Crisis-resource registry ownership.** Who maintains the region-aware crisis-line registry, at what refresh cadence, and how do we verify numbers across every locale we support? Bad data here is worse than none.
- **Duty-to-warn boundaries.** Where laws impose reporting or intervention duties (imminent harm to self or others), how do we reconcile them with the Covenant's privacy promises? Likely a scoped, published exception — needs legal review before we operate in each jurisdiction.
- **Tier-2 resume criteria.** What *exactly* qualifies as "clearly safe and explicitly redirects" to resume coaching after a risk-tier hand-off? Under-specified today; needs a concrete, tested rule.
- **Covenant re-consent UX.** How do we re-obtain consent on a covenant change without nagging or dark-pattern pressure, and without degrading the product for users who don't re-consent immediately?
- **Backup purge SLA.** The exact bounded, published deletion-from-backups window — to be fixed and stated in `08 Database Architecture.md`.
- **Independent review.** Do we commission an external ethics/safety audit before GA, and who governs it?

**What we're deliberately NOT doing:**
- **Not becoming a therapist or clinical tool.** No diagnosis, no treatment, no clinical claims. We coach, we detect, we hand off. This is a permanent boundary, not a v1 limitation.
- **Not monetizing attention or data.** No ads, no data sales, no "anonymized" behavioral market. This is off the table permanently, not "for now."
- **Not overriding user autonomy "for their own good."** Outside an acute safety hand-off (§5), we never coerce **Present Self** on behalf of **Future Self**.
- **Not treating safety as a feature to iterate toward.** The Safety Engine gates launch; we do not ship coaching to real users ahead of it.
- **Not writing unenforceable promises.** Every clause here maps to a control. If we cannot enforce a promise, we do not make it.

---

*This document sits above every other document in `00 Canon.md §9`. Where it conflicts with any product, engineering, or roadmap decision, this document governs. Cross-references: `00 Canon.md`, `01 Vision.md`, `02 Product Philosophy.md`, `04 AI Brain.md`, `07 Coaching Engine.md`, `08 Database Architecture.md`, `09 Roadmap.md`, `10 Engineering Principles.md`, `13 Prompt Architecture.md`, `14 Notification Engine.md`, `../research/00 Method & Evidence Standard.md`, `../decisions/0005-product-never-outruns-evidence.md`.*

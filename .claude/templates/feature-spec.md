# Feature Spec — <Feature name>

> **Status:** Draft v0.1 — <YYYY-MM>
> **Purpose:** One line — what this feature is and the change it makes for the user.

<!-- This is the RFC that drives the whole feature lifecycle. Fill every section; if a
section is genuinely N/A, say why in one line rather than deleting it. Standard-tier
features may leave Design Council / ethical depth light; Sensitive-tier features MUST
complete every section (CONVENTIONS §2). Use canon vocabulary (Canon §2) verbatim. -->

## Metadata

| Field | Value | Why it exists |
|---|---|---|
| **Title** | <feature name> | A stable, searchable name; reused in ADR/PDR/eval links. |
| **Author** | <name> | One accountable driver — reviews route to this person. |
| **Date** | <YYYY-MM-DD> | When work started; anchors the lifecycle timeline. |
| **Tier** | Trivial / Standard / **Sensitive** | Sets the process required (CONVENTIONS §2). When in doubt, tier up. |
| **Status** | Draft / In Review / Approved / Building / Shipped / Evaluated | Where this spec is in the lifecycle; keep current. |

---

## 1. Problem

<!-- WHY: A feature that can't name the user problem is a solution looking for a job.
State the problem in the user's terms, not the feature's. Reference the JTBD (Christensen
lens): what job did the user hire us for here? -->

*Example:* "At the Impulse Moment, the user opens the app but the first Coach turn asks a
generic question — it doesn't show we already understand them, so they disengage before
the Decision is framed."

## 2. User value

<!-- WHY: Ties the work to Future Self, our customer (Principle 1). Name who benefits and
how you'd feel the difference. Be concrete — 'reduces the Gap for users mid-lapse' beats
'improves engagement'. Remember the anti-metrics (Canon §7): value is not minutes spent. -->

- **For whom:** <which users / which moment>
- **The value:** <how this serves Future Self / reduces the Gap>

## 3. Psychological foundation

<!-- WHY: Every behavioral/coaching feature must be grounded in a named principle, not
intuition. List the lenses from CONVENTIONS §4 that apply, the principle invoked, and
whether we are *mitigating* a bias or *leveraging* a dynamic. Flag any bias we might be
exploiting — that is an ethical red flag for §4 below. We apply principles as analytical
lenses; we do NOT roleplay the thinkers. -->

| Lens (§4) | Principle applied | Mitigate / leverage | Note |
|---|---|---|---|
| <e.g. Clear> | Identity-based habits | Leverage | Reinforce the Identity Statement, not a streak. |
| <e.g. Dweck> | Frame Lapse as learning | Mitigate | No verdict language; Recovery is the coached moment. |
| <e.g. Fogg> | B = MAP | Leverage | Fire the prompt only when ability + motivation present. |

## 4. Ethical review

<!-- WHY: Trust is the product (Principle 7). Every user-facing change is checked against
the Covenant before it ships. Sensitive tier REQUIRES a linked PDR (decisions/NNNN). -->

- **Covenant impact:** <what promise about data/dignity does this touch? See 15 Constitution.md>
- **Consent:** <does this need a new/changed consent scope? Consent is a gate, not a checkbox (Canon §8)>
- **No-shaming check:** <could any surface produce shaming language or exploit a Lapse? How is that prevented — tone/lint pass, banned-word list?>
- **Safety interaction:** <can this feature run when the Safety Engine has flagged risk? Safety pre-empts everything.>
- **PDR link:** <decisions/NNNN-*.md, or "none — no user-facing behavior change">

## 5. Change tier

<!-- WHY: The tier is the load-bearing decision — it selects the rest of the process. -->

- **Tier:** <Trivial / Standard / Sensitive>
- **Trigger:** <which row of CONVENTIONS §2 — e.g. "touches coaching + memory → Sensitive">
- **Process this unlocks:** <e.g. "Sensitive → full lifecycle + Design Council + ethical review + PDR">

## 6. Architecture impact

<!-- WHY: Names which engines/aggregates move so reviewers know the blast radius, and
decides whether an ADR is needed. An ADR is needed when this sets or changes architecture
(engine contract, data model, event flow, tech choice). -->

- **Engines touched (Canon §4):** <Identity / Emotion / Decision / Memory / Coach / Learning / Notification / Prompt Builder / Safety>
- **Aggregates touched (Canon §5):** <Identity / Decision / Outcome / CoachingSession / Message / EmotionSignal / Reflection / Memory / Insight / Nudge>
- **Event-bus changes:** <new events? new subscribers? — engines never reach into each other's storage>
- **ADR needed?** <Yes → adr/NNNN-*.md | No → why not>

## 7. Design Council outcome

<!-- WHY: Sensitive features are examined through the §4 lenses before build; the Council
must surface agreement · conflicts · tradeoffs · open questions · recommendation. Link the
record rather than pasting it. -->

- **Held?** <date, or "not required — Standard tier">
- **Recommendation:** <ship / revise / hold>
- **Record:** <link to Design Council notes or PDR>

## 8. Technical design

<!-- WHY: Separates the "what/why" (this spec) from the "how" (the design doc). For a small
Standard change, sketch it inline; for anything larger, link the full doc. -->

- **Inline sketch or link:** <`.claude/templates/technical-design.md` instance / link>

## 9. Test & eval plan

<!-- WHY: How we prove it works AND behaves. Coaching output needs eval-harness cases, not
just unit tests — 'no shaming language in any Coach output' is a testable criterion (Canon
§8, CONVENTIONS §3). State what CI must be green before rollout. -->

- **Unit/integration:** <key cases>
- **Eval-harness cases:** <prompt/response evals — tone, safety triage, structured-output schema>
- **Guardrail assertions:** <e.g. zero banned-word incidents; crisis-handoff correctness unchanged>

## 10. Release plan

<!-- WHY: How this reaches users safely and reversibly. Sensitive features ship behind a
flag with staged rollout and a named rollback. -->

- **Feature flag:** <name, default state>
- **Rollout:** <% stages / cohort / internal-first>
- **Rollback:** <how we turn it off and what state that leaves>

## 11. Post-release evaluation plan

<!-- WHY: A feature isn't done at ship — it's done when we've checked it moved the right
metric and degraded no guardrail (Canon §7). Name the metrics up front so we can't
rationalize after the fact. Use `post-release-eval.md` to record the result. -->

- **Hypothesis:** <"If we ship X, then North-Star metric Y moves because…">
- **North-Star metric (Canon §7):** Aligned Decision Rate (recovery-weighted) — <expected direction>
- **Guardrails that must not degrade (Canon §7):** self-reported trust / "the app gets me"; crisis-handoff correctness; notification opt-out rate; zero shaming-language incidents.
- **When we'll evaluate:** <date / cohort size trigger>
- **Eval record:** <`post-release-eval.md` link, filled after ship>

---

## Open questions / What we're deliberately NOT doing

<!-- WHY: Naming the non-goals and unknowns prevents scope creep and documents intent for
the next reader (Jobs lens: the power of no). -->

- <open question>
- **Not doing:** <explicit non-goal and why>

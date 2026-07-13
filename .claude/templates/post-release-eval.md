# Post-Release Evaluation — <Feature name>

> **Status:** Draft v0.1 — <YYYY-MM>
> **Purpose:** One line — did shipping this do what we said it would, and did it cost us any trust?

<!-- Closes the feature lifecycle. A feature is not done at ship; it is done when we've
checked it against the hypothesis and the guardrails (Canon §7). Fill this from real data,
not hope. Use canon vocabulary (§2) verbatim. -->

- **Feature spec:** <link to the driving feature-spec.md>
- **Shipped:** <date> · **Evaluated:** <date> · **Author:** <name>
- **Rollout stage at eval:** <% / cohort>

---

## 1. Hypothesis vs outcome

<!-- WHY: We committed to a prediction in the spec; honesty requires we score it plainly.
Restate the original hypothesis verbatim, then what actually happened. -->

- **Original hypothesis (from spec):** <"If we ship X, then Y moves because…">
- **What actually happened:** <the observed result, plainly stated>
- **Verdict:** Confirmed / Partly confirmed / Refuted

## 2. North-Star + guardrail metric movement

<!-- WHY: The metrics ARE the philosophy (Canon §7). Report the North Star and every
guardrail — a North-Star win that degrades a guardrail is not a win. -->

| Metric | Type (Canon §7) | Before | After | Movement | Read |
|---|---|---|---|---|---|
| Aligned Decision Rate (recovery-weighted) | **North Star** | <> | <> | <±> | <good/flat/bad> |
| Self-reported trust / "the app gets me" | Guardrail | <> | <> | <±> | must not degrade |
| Crisis-handoff correctness | Guardrail | <> | <> | <±> | must not degrade |
| Notification opt-out rate | Guardrail | <> | <> | <±> | must not degrade |
| Shaming-language incidents | Guardrail | <> | <> | <±> | must be zero |

<!-- Do NOT report anti-metrics as success (Canon §7): raw streak length, daily active
minutes, session count. Engagement bought with anxiety is a loss. -->

## 3. Qualitative user-trust signals

<!-- WHY: Numbers miss the texture. What did users say/do that tells us whether the app
still "gets them"? Quote support tickets, reflections, session feedback. -->

<themes, representative quotes, notable reactions — positive and negative>

## 4. Shaming / safety incidents

<!-- WHY: These are non-negotiable guardrails (Canon §8). Any incident is a stop-the-line
signal regardless of North-Star movement. Report even suspected cases. -->

- **Shaming-language incidents:** <count + detail, or "none detected">
- **Safety / crisis-handoff issues:** <count + detail, or "none">
- **Consent violations:** <any proactive action without a valid scope? or "none">

## 5. Decision: keep / iterate / kill

<!-- WHY: An eval with no decision is just a report. State the call and the reasoning. -->

- **Decision:** Keep as-is / Iterate / Kill / Roll back
- **Reasoning:** <why — tie to the verdict and guardrails above>

## 6. Follow-ups

<!-- WHY: Turn learning into action. Each item needs an owner (CONVENTIONS §5: no step
without an owner and output). -->

| Follow-up | Owner | Artifact (spec / ADR / PDR) |
|---|---|---|
| <action> | <name> | <link> |

---

## Open questions / What we're deliberately NOT doing next

- <open question>
- **Not doing:** <explicit non-goal and why>

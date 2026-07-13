# Checklist — Onboarding Change

> **Applies to:** any change to first-run — the welcome framing, identity capture, first Reflection, the Covenant/consent moment, or the first coaching touch.
> **Tier: SENSITIVE** — onboarding touches identity, memory, privacy, and coaching at once. Full lifecycle ([`./new-feature.md`](./new-feature.md)) + [`../skills/behavioral-review/SKILL.md`](../skills/behavioral-review/SKILL.md) + [`../skills/design-council/SKILL.md`](../skills/design-council/SKILL.md) + [`./pull-request.md`](./pull-request.md).
> **The whole point:** onboarding's job is the first moment the user *feels understood* — not setup completed.
> *Enforces [`docs/05 Onboarding.md`](../../docs/05%20Onboarding.md), [`docs/07 Coaching Engine.md`](../../docs/07%20Coaching%20Engine.md), [`docs/15 Constitution.md`](../../docs/15%20Constitution.md).*

## Understand-before-advise (in miniature)
*Enforces `05 Onboarding.md §3 step 5`, `07 Coaching Engine.md §5`, Canon §3.*

- [ ] The first coaching touch **reflects/affirms** the user's own words — it never advises. The completeness threshold is deliberately *not* met, so advice-type moves are structurally unreachable during first run.
- [ ] The available move set is restricted to **Reflect / Affirm / Question**; no plan, tip, or "here's what to do tomorrow".

## Measured on feeling-understood, not completion
*Enforces `05 Onboarding.md §1, §8`, Canon §7 anti-metrics.*

- [ ] Success metric is **Time-to-First-Feeling-Understood (TTFU)**, validated against the "the app gets me" guardrail — **not** completion rate.
- [ ] No "you must complete this to continue" wall; there is no dark-pattern coercion to finish a form.
- [ ] We do not shorten TTFU by cutting the listening; if TTFU and the "gets me" guardrail diverge, the guardrail wins.

## Identity (not goal) capture
*Enforces `05 Onboarding.md §2`, Canon §4 (Identity root aggregate), [`CONVENTIONS §4`](../CONVENTIONS.md) (Clear lens).*

- [ ] We elicit *who they want to become*, not what they want to accomplish; output is one or two first-person, present-tense **Identity Statements**.
- [ ] We **propose; they own** — statements are user-confirmed; model-proposed-but-unconfirmed candidates are not persisted as fact.
- [ ] No demographics beyond locale, no life-domain surveys, no goal-setting, no multiple-goals inventory.

## Covenant / consent moment intact
*Enforces `05 Onboarding.md §4`, `15 Constitution.md §2`, Canon §8, [`.rules/privacy.md`](../../.rules/privacy.md).*

- [ ] The **Covenant** is presented as a promise *from us to the user* (second person, plain language) before any ongoing consent is requested — not a legal wall.
- [ ] Consent scopes are requested **individually, each tied to the value it unlocks** — never a bundled accept-all; Nudges are opt-in, off by default.
- [ ] High-trust scopes (calendar/location/contacts) and payment are **not** requested on day one.
- [ ] `consent_flags` + `covenant_version` persisted on the **User**; every later proactive action re-checks scope.

## Day-one crisis routes to Safety Engine
*Enforces `05 Onboarding.md §6.2`, `15 Constitution.md §3`, Canon §8.*

- [ ] The **Safety Engine** inspects **every** inbound onboarding message — onboarding has no exemption.
- [ ] An elevated risk level **pre-empts the entire sequence** (no Future-Self questions, no Covenant screen to someone in crisis); the mandated warm hand-off takes over and works offline.
- [ ] Crisis-handoff correctness on the onboarding path is covered by the safety eval set (launch-gating guardrail).

## Progressive disclosure
*Enforces `05 Onboarding.md §2, §4`, [`CONVENTIONS §4`](../CONVENTIONS.md) (Krug, Fogg lenses).*

- [ ] We ask only for the minimum needed for the *next* moment of value; the user never wonders "why are you asking this?".
- [ ] The first requested behavior is tiny (Fogg) — sized to seconds, near-guaranteed to succeed; we buy the *second* interaction, not maximize the first.
- [ ] A guarded user who shares nothing exits warmly, un-punished; declining memory storage degrades coaching gracefully to session-only, explained without a guilt frame (no banned words).

## Behavioral-review + Design Council
*Enforces [`../skills/behavioral-review/SKILL.md`](../skills/behavioral-review/SKILL.md), [`../skills/design-council/SKILL.md`](../skills/design-council/SKILL.md).*

- [ ] behavioral-review + Design Council held; Safety / Consent / Explainability addressed; conflicts resolved by the §3 precedence order with the winning principle named.
- [ ] The starters that unstick identity capture do not *steer* the user toward an identity that isn't theirs (principle #2 tension named as an open question if unresolved).

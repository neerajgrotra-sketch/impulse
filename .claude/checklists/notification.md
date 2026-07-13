# Checklist — Notification (a Nudge)

> **Applies to:** any change that decides whether/when we reach into a user's life uninvited — a **Nudge** trigger, its copy, its timing, its budget, or its consent scope. This is the most dangerous surface we build.
> **Tier: SENSITIVE** — notifications, always. Full lifecycle ([`./new-feature.md`](./new-feature.md)) + [`../skills/behavioral-review/SKILL.md`](../skills/behavioral-review/SKILL.md) + [`../skills/design-council/SKILL.md`](../skills/design-council/SKILL.md) + [`./pull-request.md`](./pull-request.md).
> **Axiom:** a Nudge is a debt we take on; silence is free. If we cannot say — in a log line — why *this* message, to *this* person, at *this* moment, serves their **Future Self**, we do not send it.
> *Enforces [`docs/14 Notification Engine.md`](../../docs/14%20Notification%20Engine.md), [`docs/00 Canon.md §8`](../../docs/00%20Canon.md), [`.rules/privacy.md`](../../.rules/privacy.md), [`docs/15 Constitution.md §6`](../../docs/15%20Constitution.md).*

## Consent scope checked
*Enforces `14 Notification Engine.md §8`, Canon §8, [`.rules/privacy.md`](../../.rules/privacy.md) #3.*

- [ ] The Nudge carries a `consent_scope`, checked against live `users.consent_flags` at send time — no scope, no send.
- [ ] The user can mute this trigger class at `consent_scope` granularity (e.g. keep recovery nudges, drop risk-context nudges) without losing the product.

## Silence-first justified
*Enforces `14 Notification Engine.md §5`.*

- [ ] Default is **silence**; sending is the exception that must earn its claim. Most trigger evaluations end in silence, by design.
- [ ] A suppression is logged with its reason, exactly like a send — not speaking is a decision we stay accountable for.
- [ ] On ambiguity or two rules disagreeing → silence. The tie goes to peace.

## Fogg timing — ability + motivation present (B = MAP)
*Enforces `14 Notification Engine.md §4.2, §6`, [`CONVENTIONS §4`](../CONVENTIONS.md) (Fogg lens).*

- [ ] **Ability:** the user can act on this *now*; low-ability windows (asleep, driving, mid-task) suppress or reschedule.
- [ ] **Motivation:** there is a live reason it matters now (matched risk context or a fresh **Recovery** opportunity) — we never *manufacture* motivation via urgency or guilt.
- [ ] State/timing is a first-class input (Huberman): prefer alert/calm windows, avoid low-state windows even when content is ready.

## Fatigue budget respected
*Enforces `14 Notification Engine.md §7`.*

- [ ] Per-user hard cap (per day/week) enforced **in the engine**, low by default; it may only move *down* per user, never silently up.
- [ ] Cool-down honored — recent contact (Nudge *or* in-app session) suppresses; back-to-back triggers cannot both fire.
- [ ] Per-user adaptation is asymmetric: evidence of annoyance shrinks the budget fast; evidence of welcome grows it slowly. Low-confidence triggers suppress.

## No dark patterns / no manufactured urgency / no guilt
*Enforces `14 Notification Engine.md §10`, `15 Constitution.md §6`, Canon §2 banned words.*

- [ ] No manufactured urgency: no countdowns, "act now", or artificial scarcity — the user's real timeline is the only clock.
- [ ] No guilt / no shaming: no "you said you would", no disappointment; banned-word + tone lint runs on the Nudge, not only on Coach output.
- [ ] No streak-loss threats, no dopamine-bait, no fake social pressure ("3 people are…"), no invented badges.
- [ ] No engagement-for-its-own-sake: "we haven't heard from them in a while" is **not** a reason to send.
- [ ] A Recovery Nudge (§4.3) frames a **Lapse** as expected and points at the Recovery — never induces shame.
- [ ] Trigger framed as the user's own stated goal ("you told me evenings are hard"), never as surveillance ("we detected").

## Opt-out easy
*Enforces `14 Notification Engine.md §7, §10`, `15 Constitution.md §6`.*

- [ ] Opt-out is one tap, honored immediately — no friction, no retention interstitial, no "are you sure?".
- [ ] Opt-out rate is treated as a **health signal**, never a number to beat by making opt-out harder to find.

## Safety pre-empts
*Enforces `14 Notification Engine.md §5`, Canon §8, [`.rules/ai.md`](../../.rules/ai.md) #4.*

- [ ] If the **Safety Engine** has any active flag, the engine emits nothing and yields the channel entirely.
- [ ] The engine does not write coaching copy — it requests the message from the **Coach Engine** and only decides that a conversation should be offered.

## Measured
*Enforces `14 Notification Engine.md §8`.*

- [ ] Outcome recorded on the `Nudge` (`opened | acted | ignored`) and published to the event bus → Learning Engine.
- [ ] `ignored` is treated as valuable negative signal (we were wrong about the moment), not a conversion we failed to land.
- [ ] Trigger is explainable: every pattern-triggered Nudge traces to its `evidence_refs`; an Insight we cannot show is one we cannot Nudge on.

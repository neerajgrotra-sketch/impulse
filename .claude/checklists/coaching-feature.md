# Checklist — Coaching Feature

> **Applies to:** any change to how the Coach *talks* — a Coaching Move, move-selection policy, the understand-before-advise gate, tone, personalization, or dialogue copy.
> **Tier: SENSITIVE** — coaching, always. Full lifecycle ([`./new-feature.md`](./new-feature.md)); [`../skills/behavioral-review/SKILL.md`](../skills/behavioral-review/SKILL.md) runs **first** (its gate), then [`../skills/design-council/SKILL.md`](../skills/design-council/SKILL.md); prompt work also runs [`./ai-prompt.md`](./ai-prompt.md); then [`./pull-request.md`](./pull-request.md).
> *Enforces [`docs/07 Coaching Engine.md`](../../docs/07%20Coaching%20Engine.md), [`docs/15 Constitution.md`](../../docs/15%20Constitution.md), [`.rules/ai.md`](../../.rules/ai.md).*

## Understand-before-advise gate
*Enforces `07 Coaching Engine.md §5`, Canon §8, `15 Constitution.md §5`.*

- [ ] Advice-type moves (**Reframe, Contrast, Commit**) cannot fire until the **completeness score** (min of Identity coverage, Decision coverage) clears the threshold — enforced in code, not hoped for in the prompt.
- [ ] Below the gate, only understanding moves are reachable: **Reflect, Question, Affirm, Hold-Silence**.
- [ ] There is a test asserting a cold-start session never emits Contrast; the gate state + score are logged on every advice move.

## No shaming (tone lint)
*Enforces `07 Coaching Engine.md §6, §8`, Canon §2 banned words, `15 Constitution.md §4`.*

- [ ] Every Coach output passes the deterministic **tone/lint pass** before the user sees it: banned-word scan (incl. near-morphological variants) + Haiku shaming/condescension/parenting grader.
- [ ] We **fail closed**: a turn we can't clean is regenerated tighter or downgraded to **Reflect** — never sent.
- [ ] A **Lapse** is framed as data and **Recovery** as courage; no "you should have", no streak/grade in view; feedback builds a growth mindset (Dweck lens).

## Present-Self consent
*Enforces `15 Constitution.md §4 #5, §5`, Canon §2 (Coach, never parent).*

- [ ] We advocate for **Future Self** only *with* **Present Self's** consent — no move imposes Future Self on a Present Self who has withdrawn it.
- [ ] No move outputs a directive ("you must / you should"); the user authors the conclusion and the commitment. "Just decide for me" is treated as a coaching moment, not an instruction to obey.

## Safety pre-empt
*Enforces `07 Coaching Engine.md §4 (rule 1), §8`, `15 Constitution.md §3`.*

- [ ] The **Safety Engine** sees the inbound message before the policy runs; any non-zero risk hard-stops coaching and yields to the mandated tier response/warm hand-off — no move, no personalization, no cleverness overrides it.
- [ ] Behavior is defined for all tiers (0 Normal · 1 Distress posture-shift · 2 Risk hard-stop + hand-off · 3 Acute unconditional hand-off); hand-off works **offline** with registry crisis resources (never model-generated numbers).

## Behavioral-review + Design Council done
*Enforces [`../skills/behavioral-review/SKILL.md`](../skills/behavioral-review/SKILL.md), [`../skills/design-council/SKILL.md`](../skills/design-council/SKILL.md), [`CONVENTIONS §4`](../CONVENTIONS.md).*

- [ ] behavioral-review passed: the feature reinforces **identity over goals**, mitigates (not exploits) bias, builds self-efficacy (Bandura) rather than dependency.
- [ ] Design Council held: per-lens findings + synthesis + one verdict with verifiable conditions; conflicts resolved by the §3 precedence order (Safety > Consent > Understand-before-advise > coaching goals), winning principle named.

## Lapse / Recovery framed right
*Enforces `07 Coaching Engine.md §2 (Affirm), §6`, Canon §7.*

- [ ] After a **Lapse** where the user showed up anyway, the policy leads with **Affirm** — Recovery is weighted heaviest.
- [ ] Affirmation is specific and earned (never a participation trophy); the past is not relitigated with "should have".
- [ ] Golden-conversation evals assert correct move + recovery framing; move distribution (incl. Hold-Silence firing) is auditable — if Hold-Silence never fires, that's a bug, not a quiet cohort.

## Personalization guardrails
*Enforces `07 Coaching Engine.md §7`, Canon §8. Memory correctness: [`./memory-feature.md`](./memory-feature.md).*

- [ ] **Never fabricate a memory** — the Coach references only Memory that was actually retrieved, with a `source_ref`.
- [ ] Anything asserted about the user carries `evidence_refs`; no "you always…" without receipts. Cross-time/surface memory use respects consent scope.

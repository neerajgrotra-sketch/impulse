---
name: design-council
description: Invoke to review a feature proposal through the fifteen behavioral, philosophical, and design lenses before build — mandatory for any Sensitive-tier change (coaching, safety, memory, privacy, notifications, identity, or the model).
---

## Purpose

The Design Council is our structured pre-build review. It examines a feature proposal through the **named principles** of fifteen thinkers — the lens map in [`CONVENTIONS.md`](../../CONVENTIONS.md) §4 — and returns a per-lens reading plus a cross-lens synthesis and a single go/no-go recommendation with conditions.

**Why it exists.** Impulse is a behavior-change product built on the most sensitive data a person holds. The failure modes that matter are not bugs — they are a well-intentioned feature that quietly serves Present Self, manufactures a streak-cliff, or trades a user's trust for engagement. Those slip past a normal code review because each looks reasonable in isolation. The Council forces every Sensitive feature to answer the hard behavioral, ethical, and design questions *before* code exists, when changing the design is cheap.

**We apply principles; we never roleplay personas.** A lens is a question the published work forces us to ask (§4, "the question it forces") — not an impersonation of a dead Stoic or a living designer. Output must read as analysis, never as "Kahneman would say." This keeps the Council honest and auditable against the source ideas rather than our invention of a voice.

## When to use

**Tier: SENSITIVE** (see [`CONVENTIONS.md`](../../CONVENTIONS.md) §2). Mandatory — no exceptions, no shortcuts — for any change that touches **coaching, safety, memory, privacy, notifications, identity, or the model**. These are the surfaces where a mistake costs a user's trust rather than minutes.

- **Use** when proposing or materially changing a coaching move, a Nudge, an Insight surface, an onboarding step, a memory or personalization behavior, a consent scope, or any Safety-Engine-adjacent flow.
- **Do not use** for Trivial or Standard changes (copy fixes, refactors, a non-sensitive endpoint) — the Council on a trivial change is theater. Run the PR checklist or a single review skill instead.
- **When in doubt, tier up** and convene the Council. The cost of over-reviewing is minutes; the cost of under-reviewing a coaching change is trust.

## Inputs

A **feature spec** — one proposal, not a roadmap. It should carry enough to reason about behavior:

- **What** the feature does, in the user's terms, and the **Impulse Moment** or lifecycle point it touches.
- **The job** the user hires it for (Christensen framing) and which of the seven principles ([`docs/02 Product Philosophy.md`](../../../docs/02%20Product%20Philosophy.md)) it claims to serve.
- **Engine(s) touched** ([`docs/00 Canon.md`](../../../docs/00%20Canon.md) §4) and any consent scope, data, or Safety interaction.
- **What it says no to** — the intended scope boundary.

A thin spec is a valid input; the Council will name what it needs as an open question rather than invent it.

## Outputs

A **Council report** (template in [`workflows/design-council.md`](../../workflows/design-council.md)):

1. **Lens selection** — which lenses engaged and, explicitly, which were set aside *and why*. Naming the skipped lenses is mandatory; it is how we avoid theater.
2. **Per-engaged-lens findings** — for each: **agreement · conflicts · tradeoffs · open questions · recommendation** (the five fields §4 requires).
3. **Cross-lens synthesis** — the agreements that hold across lenses, the genuine conflicts between them, the tradeoffs we are choosing, and the open questions that survive.
4. **A single recommendation** — **go / no-go / go-with-conditions** — with the conditions written as verifiable build constraints, and the governing principle named when precedence ([`docs/02 Product Philosophy.md`](../../../docs/02%20Product%20Philosophy.md) §3) decided a conflict.

## Checklist

- [ ] The input is a single feature spec, not a bundle. Split bundles first.
- [ ] Selected lenses justified against the feature and its §4 principle; **skipped lenses named with a reason** each.
- [ ] Every engaged lens applies its §4 *named principle*, phrased as analysis — no "X would say," no persona voice, no biography.
- [ ] Each engaged lens fills all five fields: agreement, conflicts, tradeoffs, open questions, recommendation.
- [ ] Canon vocabulary used verbatim ([`docs/00 Canon.md`](../../../docs/00%20Canon.md) §2); no banned words (*fail, streak-broken, should have,* …) appear even in examples.
- [ ] Every cross-lens conflict is resolved by the §3 precedence order (Safety > Consent > Understand-before-advise > coaching-quality peers > Engagement), and the winning principle is named.
- [ ] Safety, Consent, and Explainability checked explicitly — a Sensitive feature that silences none of these has not been reviewed.
- [ ] Engagement is never used as a tiebreaker or a stated benefit.
- [ ] The recommendation is one verdict (go / no-go / conditions), and each condition is verifiable ("Nudge default is silence until consent scope N is granted"), not a vibe.

## Success criteria

- The report states which lenses engaged **and** which were set aside with reasons; a reader can see the selection was deliberate.
- Each engaged lens produces all five fields, grounded in its §4 principle and written as analysis, not impersonation.
- At least one real conflict or tradeoff is surfaced and resolved by named precedence — not smoothed over.
- The synthesis yields exactly one recommendation with conditions that a build reviewer can later check off objectively.
- Zero banned words; canon terms used exactly; Safety/Consent/Explainability addressed.

## Failure criteria

- Any lens output reads as roleplay ("Aurelius reminds us…") rather than an applied principle.
- Lens theater: every lens engaged with nothing set aside, or a lens engaged with no substantive finding.
- A conflict resolved by convenience or by engagement rather than by the §3 precedence order.
- A banned word, a paraphrased canon term, or a missing Safety/Consent/Explainability check on a Sensitive feature.
- No clear verdict, or conditions too vague to verify at build time.

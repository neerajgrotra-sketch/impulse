# Workflow — The Design Council

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Define how a Design Council session runs end to end — from a feature spec to a go/no-go recommendation — and how it plugs into the feature lifecycle. The invokable entry point is [`skills/design-council/SKILL.md`](../skills/design-council/SKILL.md); the lens map is [`CONVENTIONS.md`](../CONVENTIONS.md) §4; the principles and precedence are [`docs/02 Product Philosophy.md`](../../docs/02%20Product%20Philosophy.md).

The Council reviews a feature through the **named principles** of fifteen thinkers, never as impersonations. A lens is a question the source work forces us to ask, applied as analysis. If output ever reads as "Rams would say," the session has failed and must be redone.

---

## 1. When a session runs (lifecycle placement)

A Council session is a **gate on Sensitive-tier features** ([`CONVENTIONS.md`](../CONVENTIONS.md) §2): anything touching coaching, safety, memory, privacy, notifications, identity, or the model. It sits after the feature spec is drafted and **before** implementation begins:

```
spec drafted → [Design Council] → go / no-go / conditions → build (conditions become acceptance criteria) → ethical review → ship
```

A no-go returns the spec to its author. A go-with-conditions is only "go" once each condition is written into the feature's acceptance criteria — the conditions are the Council's teeth. Standard and Trivial features skip the Council by design; running it on them is theater.

---

## 2. The five phases of a session

**Phase 1 — Select the lenses (and name the ones set aside).**
Read the spec. For each of the fifteen lenses in §4, decide whether its question bites on *this* feature given the principle it claims to serve. Engage the ones that do; **explicitly list the ones set aside with a one-line reason each.** Naming the skips is mandatory — it is the difference between selection and theater. A memory-retention feature will engage Kahneman, Huberman, and the privacy-load-bearing reading of the design lenses, and may set aside Duhigg's habit loop with "no cue→routine→reward structure here."

**Phase 2 — Apply each engaged lens.**
For every engaged lens, produce the five §4 fields — **agreement · conflicts · tradeoffs · open questions · recommendation** — using its named principle as the analytical frame. Write findings as analysis. Use canon vocabulary verbatim ([`docs/00 Canon.md`](../../docs/00%20Canon.md) §2); no banned words, even in examples.

**Phase 3 — Detect conflicts across lenses.**
Lay the per-lens verdicts side by side. A conflict is any place two lenses pull the design in opposite directions (e.g., "make it easy" vs "cultivate the mean"). Distinguish a genuine conflict from a tradeoff we are simply choosing.

**Phase 4 — Synthesize.**
Collapse the lenses into: the **agreements** that hold across most lenses, the **conflicts** that must be resolved, the **tradeoffs** we are consciously accepting, and the **open questions** that survive review. Resolve every conflict by the precedence order in [`docs/02 Product Philosophy.md`](../../docs/02%20Product%20Philosophy.md) §3 — **Safety > Consent > Understand-before-advise > {the four coaching-quality peers} > Engagement (never a tiebreaker)** — and name the winning principle. Check Safety, Consent, and Explainability explicitly; a Sensitive feature silent on all three is not reviewed.

**Phase 5 — Recommend.**
Emit exactly one verdict: **go**, **no-go**, or **go-with-conditions**. Each condition must be a verifiable build constraint ("Nudge default is silence until the user grants notification consent scope"), not a sentiment.

---

## 3. Output report template

```markdown
# Design Council Report — <feature name>
Spec: <link/ref>   ·   Tier: Sensitive   ·   Date: <YYYY-MM-DD>

## Lenses engaged
<lens> — why it bites on this feature
...

## Lenses set aside
<lens> — why its question does not apply here
...

## Per-lens findings
### <Lens> (principle applied: <named principle from §4>)
- Agreement: ...
- Conflicts: ...
- Tradeoffs: ...
- Open questions: ...
- Recommendation: ...
(repeat per engaged lens)

## Cross-lens synthesis
- Agreements across lenses: ...
- Conflicts + resolution (by §3 precedence, winning principle named): ...
- Tradeoffs we accept: ...
- Open questions surviving review: ...
- Safety / Consent / Explainability check: ...

## Recommendation
Verdict: go | no-go | go-with-conditions
Conditions (each verifiable at build time):
1. ...
```

---

## 4. Worked mini-example

**Feature spec (one paragraph).** *"One-tap Recovery": the moment we detect a Lapse, the app surfaces a single large button — "Get back on track" — that instantly logs a Recovery and opens a pre-filled, encouraging coaching message, so the user re-engages with zero friction at the hardest moment.*

**Lenses engaged, and why:**
- **Fogg** — it is a prompt-and-ability play at a low-motivation moment; B=MAP is the core question.
- **Aristotle** — a Recovery is character formation by habituation; does one-tap cultivate the mean or bypass it?
- **Clear** — does it reinforce identity, and make the aligned choice the easy one?
- **Dweck** — is the Lapse framed as learning, never a verdict?
- **Krug** — is it self-evident in the moment of temptation?

**Set aside (named):** Christensen (job is clear — recover without shame — not in dispute), Thaler (no choice-architecture/defaults conflict beyond what Fogg covers), Huberman (no timing/dopamine-baseline dimension), Bandura/Stoics (no efficacy or control-dichotomy tension raised by *this* mechanic).

**A real conflict:** Fogg's *make it easy* says: strip all friction — one tap is ideal. Aristotle's *golden mean* and our own **no-dependency / Alignment-over-discipline** stance push back: a Recovery the user taps reflexively, without a beat of reflection, is compliance, not practical wisdom — it risks a dependency on the button rather than growth in the user. Dweck adds: a pre-filled "encouraging" message that skips the user's own account of the Lapse can read as a verdict handed down, not learning owned.

**Resolution (by §3 precedence + the coaching-quality peers).** Safety and Consent are not in tension here. The conflict is among coaching-quality peers, so [`docs/02 Product Philosophy.md`](../../docs/02%20Product%20Philosophy.md) §3 rung 4 governs case-by-case, and **Coach-never-parent** breaks the tie: we keep the friction *low* (Fogg is right that the moment is fragile) but not *zero*. The button opens a Recovery that asks one Reflect/Question move — "What pulled you?" — before affirming, so the user's reasoning does the work and the choice stays visibly theirs (Tension (b): coach the decision). No pre-written verdict; the encouragement follows the user's own words (Dweck). Result: **go-with-conditions.**

**Conditions (verifiable):**
1. Recovery entry is one tap, but the coaching turn opens with a Reflect/Question move before any Affirm — enforced by the Coach Engine move sequence.
2. No pre-filled coach text asserts how the user feels; affirmation is generated after the user responds.
3. UI renders the Lapse in growth-frame language only; the banned-word list is lint-checked on this surface.
4. No streak, no "back on track" counter, no engagement metric attached to the button.

---

## Open questions / What we're deliberately NOT doing

**Open questions**
- How many lenses is "enough" before selection itself becomes theater? We trust the reviewer's justification over a fixed count.
- When two coaching-quality peers hard-conflict repeatedly across features, §3 rung 4 says revisit `02 Product Philosophy.md` rather than improvise a permanent order — the Council should flag such recurrences.

**What we're deliberately NOT doing**
- Not roleplaying the thinkers — principles only, applied as analysis.
- Not engaging all fifteen lenses on every feature — relevance is selected and skips are named.
- Not letting Engagement break a tie — it is never a Council argument.
- Not treating a go-with-conditions as a go until the conditions are acceptance criteria.

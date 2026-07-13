---
name: behavioral-review
description: Use before any coaching or behavioral feature ships to screen it against behavioral science and Impulse's ethics; it is a required gate for Sensitive-tier features and a prerequisite to the Design Council.
---

## Purpose

A focused behavioral-and-ethics screen for any feature that touches how we coach a human. It exists because a coaching feature can be technically correct, well-designed, and still quietly harm the user — by anchoring them to a goal instead of an identity, by exploiting a bias we're supposed to counterweight, by acting on Future Self's behalf without Present Self's consent, by shaming a Lapse, or by building dependency instead of self-efficacy. Those failures don't show up in a code review; they show up as lost trust, our one guardrail metric (`../../../docs/00 Canon.md` §7).

This skill catches them *before* ship by running the feature through the lens questions in `../../CONVENTIONS.md` §4 and the seven principles in `../../../docs/02 Product Philosophy.md`.

**This is not the Design Council.** The Council (`../design-council/SKILL.md`) is the full multi-lens panel that surfaces agreement, conflicts, tradeoffs, open questions, and a recommendation across *all* engaged lenses. This skill is the narrower, mandatory behavioral-plus-ethics screen that runs *first* — a coaching feature that fails behavioral-review does not reach the Council. Think of it as the gate; the Council is the room beyond it.

## When to use

**Tier: Sensitive** (per `../../CONVENTIONS.md` §2 — anything touching coaching, safety, memory, privacy, notifications, identity, or the model).

Run this skill on any feature, prompt change, Coaching Move, Nudge, Insight surfacing, onboarding step, or copy change that affects what the Coach says or when it reaches out. Run it *after* the Psychological foundation stage of the feature lifecycle and *before* the Design Council. When unsure whether a change is behavioral, tier up and run it — the cost is minutes.

## Inputs

- The feature spec (or draft) from `../feature-design/SKILL.md`, specifically its **Problem**, **User value**, and **Psychological foundation** sections.
- The concrete Coach-facing surface under review: proposed Coaching Move(s), Nudge copy, Insight text, prompt changes, or UI copy the user will read.
- The relevant Identity Statement(s), and which of the seven principles the feature claims to serve.
- Any Alignment-scoring or metric change the feature introduces (to check against the anti-metrics in `../../../docs/00 Canon.md` §7).

## Outputs

A written behavioral review record with:

- A verdict: **PASS** (proceed to Design Council), **CONDITIONAL** (proceed only after named changes), or **BLOCK** (does not ship in this form).
- Per-check findings for each of the five checks below, each citing the specific lens question from `../../CONVENTIONS.md` §4 it was tested against.
- For every CONDITIONAL or BLOCK: the exact offending surface (quoted), the principle or lens it violates, and the required change.
- A go/no-go line stating whether the feature may enter the Design Council.

If the feature touches user-facing behavior or coaching policy, the record is a Product/Ethical Decision Record (`../../CONVENTIONS.md` §3, `../../templates/pdr-template.md`).

## Checklist

Work every check. Each names the lens question it applies (from `../../CONVENTIONS.md` §4) so the finding is grounded, not a vibe.

### 1. Identity over goals — does it reinforce identity, not just goals?
- [ ] **Clear lens** ("Does it reinforce *identity*, and make the aligned choice the easy one?"): the feature strengthens an **Identity Statement** ("I am someone who…"), not merely a target or streak. If it references a goal, the goal appears *as evidence in service of an identity*, never as the root.
- [ ] **Aristotle lens** ("Does it cultivate practical wisdom and the mean, serving flourishing over pleasure?"): the feature orients toward the user's Future Self as a *telos*, and toward a virtue being habituated — not a KPI to hit.
- [ ] The Gap the feature acts on is defined as distance between behavior and *claimed identity*, not distance from a task list.
- [ ] No new `Goal`-shaped root is introduced (`../../../docs/00 Canon.md` §5 — Identity is the root aggregate).

### 2. Bias — does it exploit or mitigate bias?
- [ ] **Kahneman lens** ("Where does this rely on System 1 vs 2? Which bias does it exploit vs mitigate?"): name every cognitive bias the feature engages and state, for each, whether we *mitigate* it (allowed) or *exploit* it (blocked). Present bias, loss aversion, anchoring, and availability are the usual suspects.
- [ ] The feature recruits System 2 into the **Impulse Moment** (inserts a beat of reflection) rather than winning by System-1 manipulation.
- [ ] Where present bias is in play, a time-horizon reframe is present (`../../../docs/00 Canon.md` §4) — we make the future vivid, we do not weaponize urgency.
- [ ] No dark-pattern nudge: any **Nudge** serves the user's tomorrow, is permissioned, and would survive the user seeing exactly why it fired.

### 3. Consent — does it respect the Present-Self-consent rule?
- [ ] **Precedence check** (`../../../docs/02 Product Philosophy.md` §3): Safety and Consent outrank every coaching-quality principle. The feature never acts on Future Self's behalf outside the bounds Present Self set.
- [ ] Every proactive action (Nudge, Insight surfacing, pattern use) checks a consent scope — consent is a gate, not a checkbox (`../../../docs/00 Canon.md` §8).
- [ ] The feature never decides *for* the user (**Coach, never parent**). Apply the coach/answer test from `../../../docs/02 Product Philosophy.md` §2(b): after the feature responds, is the choice still visibly the user's?
- [ ] If the feature infers something about the user, that inference is user-inspectable and correctable (`../../../docs/03 Human Model.md` §6) — no hidden model.
- [ ] Understand-before-advise is honored: no prescriptive output before the Decision + Identity context meets the completeness threshold (`../../../docs/00 Canon.md` §8).

### 4. Shaming & dependency — does it avoid shaming and dependency loops?
- [ ] **Dweck lens** ("Does feedback build a growth mindset? Is a Lapse framed as learning, never a verdict?"): all feedback praises process, not trait; nothing reads as a fixed-trait verdict about who the user *is*.
- [ ] Zero banned words in any surface: *fail, failure, cheat, streak-broken, bad, weak, should have, guilt* (`../../../docs/00 Canon.md` §2). This is checkable by search.
- [ ] **Bandura lens** ("Does it build efficacy through small wins, or risk learned helplessness?"): the feature hands agency back and builds self-efficacy; it does not position the Coach as the indispensable authority.
- [ ] **Huberman lens** ("Is it timing/state-aware? Does it protect the dopamine baseline vs create dependency?"): no variable-reward loop, no manufactured craving, nothing that trains the user to need the app. Engagement is a byproduct, never a target (`../../../docs/02 Product Philosophy.md` §2(c)).
- [ ] No anti-metric is being optimized: raw streak length, daily active minutes, or session count (`../../../docs/00 Canon.md` §7).

### 5. Lapse / Recovery — does it frame them correctly?
- [ ] A **Lapse** is treated as expected and not a failure (`../../../docs/00 Canon.md` §2) — no failure state, no broken-chain UI, no cliff.
- [ ] **Duhigg lens** ("Are cue/routine/reward explicit? Do we swap the routine while honoring cue + reward?"): where the feature addresses a habit, the cue → routine → reward loop is explicit and we swap the routine while honoring the cue and reward.
- [ ] The **Recovery** moment (the decision after a Lapse) is easy to enter and free of shame; if the feature weights outcomes, Recovery is weighted heaviest (`../../../docs/00 Canon.md` §7).
- [ ] **Stoic lens** (Aurelius/Epictetus — "Does it focus the user on what they control and lower outcome anxiety? Do we help reframe the *impression* rather than chase the external?"): the feature separates the controllable choice from the uncontrollable outcome and lowers, not raises, outcome anxiety.
- [ ] **Fogg lens** ("Is the prompt fired only when ability + motivation are present? Is the ask tiny?"): any prompt fires only when motivation and ability are present, and the ask is tiny — we never fire a prompt that manufactures the Lapse we refuse to name.

### Gate
- [ ] Verdict recorded with per-check findings.
- [ ] If PASS or CONDITIONAL-then-met: go decision to the Design Council recorded.
- [ ] If any Safety concern surfaced, it is routed to the Safety Engine (`../../../docs/00 Canon.md` §4) — safety pre-empts this and every review.

## Success criteria

- Every one of the five checks has a written finding tied to a named lens question from `../../CONVENTIONS.md` §4.
- Zero banned words appear in any reviewed surface (verifiable by search against the `../../../docs/00 Canon.md` §2 list).
- No exploited bias, no dark-pattern Nudge, no anti-metric optimized — each explicitly cleared, not assumed.
- Every proactive action in the feature is shown to check a consent scope, and the coach/answer test leaves the choice visibly the user's.
- Lapse is framed as expected; Recovery is easy to enter and free of shame.
- The record states a clear PASS / CONDITIONAL / BLOCK verdict and an explicit go/no-go for the Design Council.

## Failure criteria

- The review ships as "looks fine" with no per-check findings or lens citations.
- A CONDITIONAL or BLOCK verdict without the offending surface quoted and the required change named.
- Any banned word survives into a shipped surface.
- A bias is exploited, a variable-reward or dependency loop is introduced, or an anti-metric is optimized.
- A proactive action lacks a consent scope, or the feature decides for the user (fails the coach/answer test).
- A Lapse is rendered as failure (cliff, broken-chain, guilt), or Recovery is not the weighted, low-shame moment.
- A coaching feature reaches the Design Council without passing this gate first.

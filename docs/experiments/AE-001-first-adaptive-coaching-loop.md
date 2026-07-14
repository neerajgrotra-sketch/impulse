# AE-001 — The First Adaptive Coaching Loop

> **Status:** Draft v0.1 — 2026-07. **Type:** Alpha Experiment (qualitative product discovery, not an architecture or evidence document — see `research/00 Method & Evidence Standard.md` §2: anything this experiment produces is `〔IH〕`-tier, Impulse-specific hypothesis, until independently corroborated).
> **Purpose:** Test whether one real user response is enough for Impulse to produce a second coaching moment that feels genuinely personalized — a user-experience question, not an architecture question.
> **Architecture status:** Frozen for this experiment. `04 AI Brain.md`, `docs/coaching-constitution-v1.md`, `docs/pdr/PDR-0011-...md`, `decisions/0012-life-dimension-engine-and-vision-canvas.md`, and `decisions/0013-runtime-reconciliation-and-concept-consolidation.md` are the given foundation. This document makes **zero** architecture, prompt, or onboarding-design decisions — it designs how we watch real people move through the slice those documents already define, and what we do with what we see.

---

## The experiment question

**Can Impulse create a second coaching moment that feels genuinely personalized after only one user response?**

Not: does the pipeline run correctly. Not: is the classification accurate. **Does a real person feel it.** This experiment cannot fail the architecture — it can only tell us whether the experience the architecture makes possible actually lands.

---

## Scope — one vertical slice, nothing else

```
Name collection
      ↓
Moment 1 ("Who are you becoming?")
      ↓
Life Dimension generation          (Identity Engine, per adr/0013 Part 2)
      ↓
Thought generation                 (Coach Engine → Prompt Builder, per adr/0013 Part 2)
      ↓
Vision Canvas                      (per decisions/0012 — up to 5 editable fragments)
      ↓
AI synthesis                       (Coach Engine assembles Psychological State, per adr/0013 Part 4)
      ↓
One adaptive Coaching Beat         (Coach Engine selects the next Beat + one Coaching Move,
      ↓                             per adr/0013's canonical vocabulary — not "Next-Moment Engine,"
    STOP                            not "Experience Engine")
```

**Explicitly out of scope, and this is load-bearing, not a formality:** no additional onboarding steps beyond this slice. No complete adaptive graph (PDR 0011's D1 is not being tested here — only whether the *first* adaptive Beat lands, not the graph's long-horizon behavior). No daily coaching, no habits, no streaks, no planning. If a participant asks "what happens next," the moderator says the product stops here today and asks what they *expected* to happen next — that expectation is data (see Observation Guide), not a prompt to keep building the demo live.

**Why this slice and not a longer one:** the experiment question is about the *second* moment, specifically — whether one response is enough signal to make the next thing said feel earned rather than generic. Extending the slice would answer a different, easier question (does a longer conversation feel personalized, which is far less interesting) and would burn participant sessions on territory this experiment doesn't need.

### A safety condition this experiment inherits, not invents

`decisions/0006` requires per-turn Safety Engine screening before onboarding text may reach a backend or advance a sequence, and `adr/0008` (superseded by `adr/0013`, but its finding survives intact) states plainly that the crisis-resource registry and safety-tier eval gate are hard prerequisites before this surface's feature flag may default on for **any real user** — with no carve-out named anywhere for research or discovery contexts. If that automated screening and registry are not yet built and wired in, **this experiment may only run moderated** — a trained researcher present for the entire session (in person or live video, never an unsupervised link), briefed to recognize Tier 2/3 signal per `15 Constitution.md` §3.1 and to pause the session and hand off to the same human-scale response the product itself would eventually automate. This is not a research-methodology nicety; it is the same non-negotiable that gates production, applied to n=10–15 instead of n=millions. Recruiting screens for current acute crisis are also therefore a should (not just a nice-to-have) — see Participants.

---

## Success — qualitative, not analytics

No funnel, no completion rate, no time-on-screen metric. Every one of these is answered by the moderator's judgment after watching a real person, corroborated by what the person says in the post-session interview — never inferred from telemetry alone:

1. Did the user feel understood?
2. Did the second Coaching Beat feel earned?
3. Did the thought bubbles feel relevant?
4. Did the Vision Canvas help thinking?
5. Did the AI ask a better follow-up than a static questionnaire would have?
6. Did the transition feel magical?
7. Would the user continue?

A session that answers all seven "yes" is not more successful than one that surfaces a clear "no" with a reason — a well-observed failure is exactly what a fifteen-person discovery round is for. The failure mode this experiment must avoid is the opposite one: a session where the moderator can't tell *why* the answer was yes or no. Every metric above needs a specific, observed moment behind it, not a vibe.

---

## Participants

**10–15 people**, recruited for real variance, not statistical power — this is explicit, per instruction: do not optimize for significance, optimize for learning. Deliberately spread across:

- **Age**: at minimum, one cluster each from roughly 20s, 30s–40s, 50s+ — the "Who are you becoming?" prompt and the Life Dimensions it ranks against plausibly land very differently across life stages, which is exactly the kind of variance a small qualitative round exists to surface.
- **Life situation**: mix of career stage, family status, and — as best can be judged from recruiting screening alone — general life stability, since PDR 0012's Life Dimensions include family, career, and purpose-adjacent territory that different life situations will weight very differently.
- **Familiarity with AI products**: include both people who use AI coaching/chat products regularly and people who don't — a "did this feel like a chatbot" reaction reads very differently from someone with no baseline than from someone who talks to an LLM daily.

**Recruiting screen (should, given the safety condition above):** do not knowingly recruit someone currently in acute crisis or active mental-health treatment for an unrelated acute condition — not because their experience doesn't matter, but because this specific build has no automated safety net yet, and a moderated human one is a mitigation, not a substitute, for the real thing.

**Consent, per `usability-notes-template.md`'s own existing convention:** identify participants by initials or role only in any written notes, obtain explicit consent before recording anything (audio/video/notes), and tell participants plainly, before starting, what the product does and doesn't do at this stage — including that it stops after one adaptive Beat, so no participant is left wondering whether something broke.

---

## Observation guide

One filled-out record per participant, immediately after the session (same discipline as `usability-notes-template.md` §"fill it out... while it's fresh"). This experiment's version adds the fields the founder specified, on top of that template's existing structure — use `usability-notes-template.md` for the chronological "what happened" backbone, and capture these additional fields for every session:

| Field | What to write down |
|---|---|
| **Initial reaction** | The first unprompted thing they said or did on seeing the orb/title — verbatim if possible, per the existing template's "quotes worth preserving" discipline. |
| **Confusion points** | Where they didn't know what to do next, or misread what something meant — note which (interaction vs. copy), per the existing template's own distinction. |
| **Moments of delight** | Specific, not general — which screen, which line, which transition. |
| **Where trust increased** | The specific moment, and what happened right before it. |
| **Where trust decreased** | Same — specific moment, specific cause. Do not average these into one "trust score"; a session can have both, and which one came last matters more than the count. |
| **What felt artificial** | Anything that read as generic, scripted, or "AI-shaped" rather than responsive to what they actually said. |
| **What felt surprisingly human** | The opposite — anything that felt like it was really listening. |
| **Where they hesitated** | Per the existing template's definition — a pause longer than natural, and your best read on why. |
| **Did they edit the Vision Canvas?** | Yes/no, and if yes, what changed (a word, the whole fragment, reordered, merged, removed) — this is a direct signal on whether generated content felt like a real starting point or something to route around. |
| **Did they ignore AI suggestions?** | Any point where a generated thought or the AI's follow-up was visibly available and they didn't use it — note what they did instead (typed their own, picked a different thought, asked to skip). |
| **Would they want to continue?** | Ask directly at the end of the observed flow, before the interview begins — this is a behavioral read (did they reach for the phone/screen as if expecting more, ask "is that it?", or seem satisfied to stop), not yet the interview question. |

---

## Post-session interview (15 questions)

Ordered roughly session-chronologically so participants can answer while the experience is fresh, avoiding yes/no framing throughout (per instruction — no "did you like it"):

1. What surprised you, if anything, in the first few seconds?
2. Walk me back through the moment right before you decided what to say for "Who are you becoming?" — what were you thinking?
3. What made you choose [speaking / typing / tapping a thought], if you remember deciding?
4. Of the thought bubbles you saw, was there one that felt like it was written for someone else, not you?
5. Was there a thought that felt closer to your own words than you expected?
6. When you saw your response turn into the Vision Canvas, what was your first thought about it?
7. What, if anything, did you change in the Canvas — and what made you want to change it?
8. When did you feel like the app understood you, if there was such a moment?
9. When did it misunderstand you, or miss something that seemed obvious?
10. When the next thing appeared after your response — what did you expect to happen, right before it did?
11. Did that next thing feel like it came from what you'd just said, or like it could have appeared no matter what you'd said?
12. What felt helpful, specifically — not "good," but something that actually changed how you were thinking?
13. What felt inaccurate, if anything — about you, not about the app's performance?
14. If you were designing this, what question would you remove entirely?
15. What question would you ask instead, or earlier?

**Moderator notes on delivery:** ask one at a time, let silence sit before rephrasing — a slow answer is often the most honest one. If a participant answers a later question while addressing an earlier one, don't re-ask it; note where the natural answer landed instead.

---

## Synthesis and what happens to the findings

This experiment does not authorize any change by itself. Per `research/00 Method & Evidence Standard.md` §8's rule for the research corpus, applied here to product discovery: **this document's author recommends; changes to the choreography, the prompt, or the architecture flow through the normal Design Council / PDR / ADR gate**, the same one every other change to this surface has gone through (`decisions/0006`, `0007`, `0010`, `0012`; `adr/0013`). A pattern seen in three or more of the 10–15 sessions is worth writing up as a finding for that gate. A strong reaction from one person is a data point worth recording carefully — per `usability-notes-template.md`'s own closing rule — not yet grounds for a redesign.

Write up findings using `usability-notes-template.md`'s Priority/Confidence framing (Critical/High/Medium/Low priority; Low/Medium/High confidence based on repetition across sessions), reported against this experiment's seven success questions rather than against generic usability categories, since those seven are what this specific round exists to answer.

---

## What this experiment deliberately does NOT validate

- **The architecture.** Whether Coach Engine, Identity Engine, and Prompt Builder are correctly wired is a code-review and eval-harness question (`13 Prompt Architecture.md` §6), not something 10–15 qualitative sessions can or should speak to.
- **PDR 0011's full adaptive graph**, Doubt/Revision, or any long-horizon Relationship Health behavior — this slice ends after one adaptive Beat; there is no relationship yet for those to be observed in.
- **Safety-tier correctness at scale.** The moderated-session safety condition above is a mitigation for a discovery round, not evidence that the automated Safety Engine screening works — that still needs its own red-team eval set before real-user launch, per `adr/0008`/`adr/0013`.
- **Statistical significance of anything.** By instruction, this round optimizes for learning, not for a defensible sample size — no finding from this experiment should be reported as if it were.

---

## Links

- `04 AI Brain.md`, `docs/coaching-constitution-v1.md`, `docs/pdr/PDR-0011-...md`, `decisions/0012-life-dimension-engine-and-vision-canvas.md`, `decisions/0013-runtime-reconciliation-and-concept-consolidation.md` — the frozen architecture this experiment tests the feel of, not the correctness of
- `decisions/0006-onboarding-rejects-fixed-interview-requires-safety-gate.md`, `adr/0008-next-moment-engine-architecture.md` §4 — the safety condition this experiment inherits
- `docs/usability-notes-template.md`, `docs/device-testing-checklist.md` — the session-recording format this experiment extends rather than replaces
- `docs/05 Onboarding.md` §1, §8 — Time-to-First-Feeling-Understood and the "the app gets me" guardrail, the closest existing metrics to what this experiment's seven success questions operationalize qualitatively
- `research/00 Method & Evidence Standard.md` §2, §8 — why this experiment's findings are `〔IH〕`-tier hypotheses that route through the normal review gate, never auto-applied

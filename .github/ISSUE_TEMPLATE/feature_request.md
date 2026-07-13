---
name: Feature request
about: Propose a feature. Maps to feature-lifecycle stages 1–2 (Problem → User value). Understand before advising.
title: "[Feature] "
labels: ["feature", "needs-triage"]
assignees: []
---

<!--
This template covers stages 1–2 of the feature lifecycle: naming the Problem and the
User value before any solution. Understand before advising (`docs/00 Canon.md` §3) applies
to how we build, too — do not describe a solution here; describe the job to be done.
Use canon vocabulary verbatim (`docs/00 Canon.md` §2). No banned words.
-->

## Problem

<!-- What real problem does this solve? State it in the user's terms, not as a missing feature.
Which Impulse Moment, Reflection, or Gap does it touch? WHY does it matter now? -->

## User value

<!-- What changes for the user if we build this? Tie it to reducing the Gap, improving the
Aligned Decision Rate (recovery-weighted), or strengthening trust (`docs/00 Canon.md` §7).
It must not optimize an anti-metric (streak length, active minutes, session count). -->

## Who is it for / what job (Christensen JTBD)

<!-- `.claude/CONVENTIONS.md` §4, Christensen lens: "What job did the user hire this for?"
Fill the hire/fire framing: -->

- **Who:** <!-- which user, in which state -->
- **When they…** <!-- situation / trigger -->
- **They want to…** <!-- motivation -->
- **So they can…** <!-- desired outcome / the job -->
- **Today they "hire"…** <!-- current workaround we'd replace -->

## Which principle(s) it serves

<!-- Name the subset of the seven principles (`docs/00 Canon.md` §3 / `docs/02 Product Philosophy.md`)
this claims to serve, e.g. "Identity over goals", "Progress over perfection". -->

## Proposed tier (`.claude/CONVENTIONS.md` §2)

Pick one — when in doubt, tier up.

- [ ] **Trivial** — copy fix, pure refactor, dep bump, non-behavioral.
- [ ] **Standard** — new endpoint/screen/logic that is NOT sensitive.
- [ ] **Sensitive** — touches coaching, safety, memory, privacy, notifications, identity, or the model. Triggers the full lifecycle + Design Council + ethical review.

## What it says no to

<!-- Jobs lens (`.claude/CONVENTIONS.md` §4): the intended scope boundary. What is deliberately
out of scope? -->

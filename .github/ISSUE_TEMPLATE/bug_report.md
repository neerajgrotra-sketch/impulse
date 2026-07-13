---
name: Bug report
about: Report something behaving wrong. If it touches coaching, safety, or privacy, say so — that raises the tier.
title: "[Bug] "
labels: ["bug", "needs-triage"]
assignees: []
---

<!--
Use canon vocabulary verbatim (`docs/00 Canon.md` §2) and no banned words.
If this bug affects a user's trust, safety, or dignity, treat it as Sensitive and flag it
below — that is a launch-blocking class of issue (`docs/15 Constitution.md`).
For an active safety/ethics concern, do not wait on this queue: use the contact link on the
"New issue" page (`docs/15 Constitution.md`).
-->

## Summary

<!-- One line: what is broken. -->

## Steps to reproduce

1.
2.
3.

## Expected behavior

<!-- What should happen, and which rule/spec/canon clause says so (link it). -->

## Actual behavior

<!-- What actually happens. Attach privacy-scrubbed logs/screenshots only — never paste
real user PII or secrets (`.rules/privacy.md`, `.rules/security.md`). -->

## Severity

- [ ] **S1 — Critical:** safety/crisis-handoff failure, data loss, privacy breach, or shaming output shipped to a user.
- [ ] **S2 — High:** core coaching/decision flow broken for many users.
- [ ] **S3 — Medium:** feature broken with a workaround.
- [ ] **S4 — Low:** cosmetic or minor.

## Does it touch a Sensitive area? (`.claude/CONVENTIONS.md` §2)

- [ ] **Coaching** — Coach Engine, Coaching Moves, dialogue, tone, or copy the user reads.
- [ ] **Safety** — Safety Engine, crisis detection, or human handoff.
- [ ] **Privacy** — consent scopes, memory, retention, deletion, logging, or the Covenant (`docs/15 Constitution.md`).
- [ ] Identity / Notifications / the model.
- [ ] None of the above (not Sensitive).

## User-trust / safety impact

<!-- Could this shame a user, mislead the Coach, leak or misuse intimate data, fire a Nudge
without consent, or degrade crisis-handoff correctness? Describe the impact on the guardrail
metrics (`docs/00 Canon.md` §7). If yes to any, this is Sensitive regardless of severity label. -->

## Environment

- App version / build:
- Device / OS (iOS) or backend service + version:
- First seen:

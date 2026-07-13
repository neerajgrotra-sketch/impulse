# Privacy Rules

**Purpose:** Make The Covenant operational — turn "earn the right to hold this data" (Canon §3, principle #7) into rules an engineer can follow and a reviewer can check. **Scope:** every engine, log line, telemetry event, prompt, and data flow that touches user data. Binds to `docs/15 Constitution.md`.

Coaching data is not ordinary product data. It is the record of a person's Impulse Moments, Lapses, and Recoveries — the moments they are least proud of, entrusted to us so their Future Self can win. That sensitivity governs everything below.

1. We MUST collect only the data a feature genuinely needs to serve Future Self; speculative "might be useful later" collection is NEVER permitted — WHY: data minimization is the cheapest privacy control and the one attackers cannot exploit.
2. Data collected for one purpose MUST NOT be reused for another without new consent — WHY: purpose limitation is what makes consent meaningful rather than a blank cheque.
3. Consent is a gate, not a checkbox: every proactive action (Nudge, Notification, cross-context memory use) MUST check a live `consent_scope` before running — WHY: Canon §8 makes this a cross-cutting constraint; a Nudge without consent is a violation of trust, not a feature.
4. We NEVER sell, rent, or share user data, and we NEVER serve ads or optimize for engagement bought with anxiety — WHY: the moment the user becomes the product, Future Self stops being our customer (principle #1).
5. Deletion MUST be real: a delete request purges the user's records — Identity, Decision, Outcome, CoachingSession, Message, Memory, Insight, Nudge — from the system of record and from embeddings, backups on their cycle, and derived stores — WHY: a "soft delete" that keeps their Lapses forever is a lie dressed as a setting.
6. PII MUST be scrubbed from logs, traces, and telemetry; prompt/response capture is stored privacy-scrubbed only — WHY: Canon §6 mandates scrubbed observability; a debug log is not a lawful place to keep someone's confession.
7. Coaching content (Message text, reflection notes, Memory content) MUST NEVER appear in analytics events; metrics carry aggregates and IDs, never raw dialogue — WHY: the North Star (Canon §7) needs rates, not transcripts.
8. Every user record MUST carry `covenant_version`, and a material change to how we treat data MUST re-request consent — WHY: consent is only valid against the terms the user actually agreed to.
9. Prompts MUST include the minimum user context the turn requires, assembled by the Prompt Builder — WHY: the smallest prompt is both the safest prompt and the cheapest one.
10. Third parties (LLM provider, infra) MUST receive only scrubbed, minimal payloads under a data-processing agreement; we NEVER send raw identifiers where a scoped token suffices — WHY: our Covenant does not automatically extend to vendors, so we must constrain what leaves our boundary.
11. Users MUST be able to see and export their own data on request — WHY: trust requires that the record we hold about someone is legible to them.
12. Alignment scores and Insights MUST NEVER be exposed outside the user's own experience, and NEVER shown as a grade — WHY: Canon §5 makes the score an internal coaching signal; leaking or grading it shames the user.
13. Any new data field, event, or telemetry point in a Sensitive-tier change MUST be justified in the feature-spec against data minimization and purpose limitation — WHY: the spec is where over-collection gets caught before it ships.
14. Retention MUST be bounded and stated per data type; we NEVER keep coaching data indefinitely by default — WHY: data we no longer need is only a liability.

## How this is enforced

The `security-review` and Design Council reviews on every Sensitive-tier change verify consent gating, minimization, and scrubbing against this file and `docs/15 Constitution.md`. CI includes PII-scrubbing checks on log/telemetry emitters. Deletion completeness is covered by an integration test. Purpose limitation and retention are recorded in the feature-spec and, when they set policy, a PDR (`decisions/`).

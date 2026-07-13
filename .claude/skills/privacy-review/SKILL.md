---
name: privacy-review
description: Use as the Sensitive-tier gate on any change that collects, stores, derives, logs, retains, deletes, or acts on user data — it enforces the Covenant (data minimization, purpose limitation, consent-as-gate, no PII in logs, deletion cascade) and the special sensitivity of coaching data.
---

## Purpose

This is the **Covenant** enforcement skill. The **Covenant** (`docs/00 Canon.md` §2, `docs/15 Constitution.md` §2) is our binding promise about how we treat a user's data and their dignity: *your data is yours; we collect the least we need and can justify every field; deletion is real and cascades; consent is a gate, not a checkbox; nothing about you is a black box to you.* We hold the record of a person's worst moments, so we hold ourselves to a bar higher than the law's floor. This skill turns that promise into a review gate: it verifies that a change collects only what it can justify, uses data only for its stated purpose, checks a consent scope before every proactive action, never lets a user's real words reach a log, and can be fully undone by the deletion cascade.

It enforces [`.rules/privacy.md`](../../../.rules/privacy.md) and is tied directly to `docs/15 Constitution.md` (the Covenant, §2; precedence order, §5; red lines, §6) and to the persistence controls in `docs/08 Database Architecture.md` §4–§7. General security posture (authn, authz, secrets, supply chain) is reviewed by [`security-review`](../security-review/SKILL.md); the two run together on any change touching both.

## When to use

This skill is a **SENSITIVE-tier gate**. Per `.claude/CONVENTIONS.md` §2, any change that touches **privacy, memory, identity, coaching, notifications, or the model** is Sensitive by definition — and every such change collects, derives, or acts on user data. Therefore:

- **Always run the full checklist** on any change that adds or alters a stored field, a derived artifact (**Memory**, **Insight**, embedding), a log or trace, a retention or deletion path, a consent scope, or any proactive action (a **Nudge**, surfacing an **Insight**, widening **Memory**).
- There is **no Standard or Trivial path** through this gate for data-touching changes — tier up, never down. A change that only edits copy or refactors non-data code does not invoke this skill at all.
- The output feeds the Design Council and ethical review that Sensitive changes require; a failed privacy review blocks the change with no shortcut (`.claude/CONVENTIONS.md` §2).

## Inputs

- The diff, plus every field it adds or changes on a canonical aggregate (`docs/00 Canon.md` §5) with a one-line stated *purpose* and *retention* for each.
- The data-flow for the change: where the data originates, where it is stored, what is derived from it, where it is logged or traced, and who/what reads it.
- Any new or changed `users.consent_flags` scope and the runtime check that gates it.
- Any new proactive action (**Nudge**, **Insight** surfacing, **Memory** widening) and the consent scope it checks.
- The deletion story: how the new data is reached by the right-to-be-forgotten cascade (`docs/08 Database Architecture.md` §6).

## Outputs

- A pass / block decision. A field with no justified purpose, a proactive action with no consent gate, a PII path into logs, or data unreachable by the deletion cascade is a **block**.
- A findings list mapped to `.rules/privacy.md` and to the Covenant clause (`docs/15 Constitution.md` §2) each finding implicates.
- Where the change sets a user-facing data or ethics default, a Product/Ethical Decision Record (`.claude/CONVENTIONS.md` §3) recording the WHY.

## Checklist

**Data minimization (Covenant §2)**
- [ ] Every new stored field has a documented *purpose* and *retention*; a field we cannot justify is not added (`docs/15 Constitution.md` §2, `docs/08 Database Architecture.md` §5). WHY: the safest data is the data we never collected.
- [ ] We store the *inference*, not the raw feed, wherever possible — an `emotion_signal` (valence/arousal/labels), not a raw sensor stream; a summarized `memory.content`, not a transcript we do not need (`docs/08 Database Architecture.md` §4).
- [ ] The change adds no always-on location, contacts, mic, or health stream, and no "willpower score," guilt index, or streak-shame counter — the anti-metrics have no columns (`docs/08 Database Architecture.md` §5, `docs/00 Canon.md` §7).

**Purpose limitation (Covenant §6, red lines §6)**
- [ ] Data is used only for the purpose the user can see in the *"what do you know about me and why?"* view; the change repurposes nothing silently (`docs/15 Constitution.md` §2.6, §6). WHY: covert data use is an ethical red line.
- [ ] **Safety** classifications are used for tier routing and hand-off only — never repurposed into coaching leverage, marketing signal, a sold/shared risk score, or a permanent "this person is unstable" label (`docs/15 Constitution.md` §3.4). A resolved crisis is not a stain on the user model.
- [ ] The change does not sell, rent, or share **Insight**s or derived data, and adds no hidden experiment on a vulnerable state (`docs/15 Constitution.md` §6).

**Consent as a gate (Covenant §7, non-negotiable §4.3)**
- [ ] Every proactive action the change adds — a **Nudge**, widening **Memory**, acting on a sensitive **Insight** — checks a specific `consent_flags` scope at runtime before it runs (`docs/00 Canon.md` §8, `docs/08 Database Architecture.md` §2). WHY: consent is a gate, not a checkbox; a buried blanket "I agree" is not consent.
- [ ] The consent scope is specific, revocable, and legible; narrowing or revoking it does not break the product (`docs/15 Constitution.md` §2.7).
- [ ] If the change materially alters what we promise, `covenant_version` handling re-obtains consent rather than assuming it (`docs/15 Constitution.md` §8).
- [ ] Server-side consent state wins over stale offline-client state — a consent revoked on the server is never overridden by a client that did not know (`docs/08 Database Architecture.md` §8, safety/consent precedence).

**No PII in logs (Covenant §2, observability)**
- [ ] No decrypted `messages.text`, `reflections.responses`, or `memory.content` reaches a log line, trace, or the `event_log` payload; the payload holds IDs, enums, scores, and timings only (`docs/08 Database Architecture.md` §7). WHY: an audit trail must record *that* something happened, not the intimate content of it.
- [ ] Prompt/response capture is privacy-scrubbed before it is stored, and PII flows only through the known chokepoints — the scrubber, the **Prompt Builder**, storage adapters — never scattered (`docs/10 Engineering Principles.md` §5, §7).
- [ ] No production user data appears in tests, fixtures, or eval sets; **Golden coaching conversations** and red-team corpora use synthetic personas, and CI checks fixtures for PII shapes (`docs/10 Engineering Principles.md` §7). A real user's **Lapse** is never a test fixture.

**Deletion cascade (Covenant §3, non-negotiable)**
- [ ] Any new table or derived store hangs off `users` with `ON DELETE CASCADE`, so right-to-be-forgotten remains a single cascading delete, not careful application code (`docs/08 Database Architecture.md` §6). WHY: a separate store is exactly where a forgotten user's ghost survives.
- [ ] Derived data — **Memory**, **Insight**, embeddings, Redis session cache — is reached by the cascade or TTL'd/flushed; backups are covered by crypto-shredding the per-user key (`docs/08 Database Architecture.md` §5–§6).
- [ ] The deletion runs as a tracked job with a completion receipt — we can *prove* the erasure happened (`docs/08 Database Architecture.md` §6).
- [ ] Column-level encryption still covers the intimate free-text fields the change touches (`messages.text`, `reflections.responses`, `memories.content`, `decisions.context`) under the per-user key (`docs/08 Database Architecture.md` §5).

**Special sensitivity of coaching data**
- [ ] The change treats **Coaching Session** content, **Lapse**/**Recovery** records, and **Identity Statement**s as the most sensitive data we hold — designed as though every field could one day be subpoenaed, leaked, or turned against the user (`docs/15 Constitution.md` §2). WHY: this intimacy is the product's mechanism and its greatest hazard.
- [ ] Nothing the change adds exploits a detected moment of distress or temptation to upsell, retain, or convert — the **Impulse Moment** is never mined for our benefit (`docs/15 Constitution.md` §6).

## Success criteria

- Every field the change stores has a written purpose and retention; the "what do you know about me and why?" view can answer for all of it.
- Every proactive action checks a specific, revocable consent scope at runtime, demonstrable by a unit test that fails when the gate is removed (`docs/10 Engineering Principles.md` §3).
- A right-to-be-forgotten run on a seeded user removes the new data — rows, derivatives, embeddings, cache — leaving no readable residue (crypto-shredded in backups), and emits a completion receipt.
- No log line, trace, or `event_log` payload contains decrypted intimate free text; the scrub and PII-shape checks pass in CI.
- **Safety** classifications and **Insight**s are provably used only for their stated purpose — no sale, share, marketing, or permanent-label path exists.
- No production user data is present in any test, fixture, or eval set.

## Failure criteria

- A stored field with no justified purpose or retention, or a raw feed stored where an inference would do.
- A proactive action (**Nudge**, **Memory** widening, sensitive **Insight**) that fires without checking a consent scope, or a consent scope that is blanket, non-revocable, or breaks the product when narrowed.
- Any decrypted `messages.text`, `reflections.responses`, or `memory.content` in a log, trace, `event_log` payload, or unscrubbed prompt capture; or production user data in a fixture or eval set.
- New data unreachable by the deletion cascade, a derived store the cascade misses, or a deletion path with no completion receipt.
- Data repurposed beyond its stated purpose — a **Safety** classification turned into coaching leverage, a marketing signal, a sold/shared score, or a permanent label; or an **Insight** sold, rented, or shared.
- Any use of a detected distress or **Impulse Moment** to upsell, retain, or convert.

# Checklist — New Feature (lifecycle gate)

> **Applies to:** all tiers. This is the gate list for taking a feature through the eleven lifecycle stages — the eleven sections of [`../templates/feature-spec.md`](../templates/feature-spec.md). Tier decides how much of it you complete; it does **not** let you skip the gate.
> **Tier model:** [`CONVENTIONS.md §2`](../CONVENTIONS.md). **When in doubt, tier up** — over-reviewing a Trivial change costs minutes; under-reviewing a Sensitive one costs a user's trust.

**How to read the tier column below:** ✅ = required · ➖ = light / optional at this tier · ⏭ = skip.

| Stage | Trivial | Standard | Sensitive |
|---|---|---|---|
| 1 Problem · 2 User value | ➖ (PR desc) | ✅ | ✅ |
| 3 Psychological foundation | ⏭ | ➖ (✅ if behavioral) | ✅ |
| 4 Ethical review | ⏭ | ➖ | ✅ (+ PDR) |
| 5 Change tier | ✅ | ✅ | ✅ |
| 6 Architecture impact | ⏭ | ✅ (ADR if it sets architecture) | ✅ |
| 7 Design Council | ⏭ | ⏭ | ✅ (no exceptions) |
| 8 Technical design | ➖ | ✅ | ✅ |
| 9 Test & eval plan | ✅ (PR checklist) | ✅ | ✅ |
| 10 Release plan | ➖ | ✅ | ✅ (flag + staged) |
| 11 Post-release evaluation | ⏭ | ➖ | ✅ |

A **Trivial** change runs [`./pull-request.md`](./pull-request.md) only — stop there. **Standard** completes the ✅ stages below. **Sensitive** completes every stage; nothing is optional (`CONVENTIONS §2`).

---

## Stage 0 — Tier the change first
*Enforces [`CONVENTIONS.md §2`](../CONVENTIONS.md), [`.rules/README.md`](../../.rules/README.md).*

- [ ] Named the tier: Trivial / Standard / **Sensitive**.
- [ ] If it touches **coaching, safety, memory, privacy, notifications, identity, or the model** → tier is **Sensitive** (no exceptions).
- [ ] Recorded the tier and its trigger in the feature-spec Metadata + §5.

## Stage 1–2 — Problem & user value
*Enforces feature-spec [`§1`](../templates/feature-spec.md), §2.*

- [ ] Problem stated in the **user's** terms, not the feature's; JTBD named (Christensen lens).
- [ ] Value framed as serving **Future Self** / reducing **the Gap** — never in anti-metric terms (minutes, sessions, streaks — Canon §7).

## Stage 3 — Psychological foundation  *(Standard: only if behavioral · Sensitive: required)*
*Enforces feature-spec §3, [`CONVENTIONS §4`](../CONVENTIONS.md), behavioral-review — see [`./coaching-feature.md`](./coaching-feature.md).*

- [ ] Each behavioral claim grounded in a **named §4 lens principle** (no roleplay, no intuition).
- [ ] Stated per lens whether we **mitigate** a bias or **leverage** a dynamic; any bias we might be *exploiting* flagged as a §4 ethical risk.
- [ ] If the feature affects what the Coach says or when it reaches out → run [`../skills/behavioral-review/SKILL.md`](../skills/behavioral-review/SKILL.md) **before** the Design Council.

## Stage 4 — Ethical review  *(Sensitive: required + PDR)*
*Enforces feature-spec §4, [`.rules/privacy.md`](../../.rules/privacy.md), [`docs/15 Constitution.md`](../../docs/15%20Constitution.md).*

- [ ] Covenant impact named (what data/dignity promise it touches).
- [ ] Consent: any new/changed `consent_scope` identified; consent is a gate, not a checkbox (Canon §8).
- [ ] No-shaming check: no surface can produce a banned word or exploit a **Lapse**; tone/lint path named.
- [ ] Safety interaction: behavior when the **Safety Engine** has flagged risk is defined (Safety pre-empts everything).
- [ ] PDR opened in [`../../decisions/`](../../decisions/) for any user-facing behavior/ethics decision.

## Stage 5 — Change tier confirmed
- [ ] Tier from Stage 0 re-confirmed against the final scope; process it unlocks written in §5.

## Stage 6 — Architecture impact  *(Standard/Sensitive)*
*Enforces feature-spec §6, [`../skills/architecture-review/SKILL.md`](../skills/architecture-review/SKILL.md), [`.rules/architecture.md`](../../.rules/architecture.md).*

- [ ] Engines touched (Canon §4) and aggregates touched (Canon §5) listed.
- [ ] Event-bus changes named; no engine reaches into another's storage.
- [ ] **ADR** decision recorded: authored in [`../../adr/`](../../adr/) if the change *sets* architecture, or "no ADR — follows existing" stated with reason.
- [ ] DB-schema change → also run [`./database-change.md`](./database-change.md) (design) and [`./schema-migration.md`](./schema-migration.md) (mechanics).

## Stage 7 — Design Council  *(Sensitive only)*
*Enforces [`../skills/design-council/SKILL.md`](../skills/design-council/SKILL.md), [`CONVENTIONS §4`](../CONVENTIONS.md).*

- [ ] behavioral-review passed **first** (its gate; the Council is the room beyond it).
- [ ] Council held; per-lens findings + cross-lens synthesis recorded, with skipped lenses named.
- [ ] Every conflict resolved by the §3 precedence order (Safety > Consent > Understand-before-advise > coaching goals); winning principle named.
- [ ] Single verdict recorded (go / no-go / go-with-conditions); each condition is verifiable.

## Stage 8 — Technical design
*Enforces feature-spec §8; engineering review skills per surface.*

- [ ] Design sketched inline (small Standard) or linked (larger).
- [ ] Backend surface → [`../skills/backend-review/SKILL.md`](../skills/backend-review/SKILL.md); iOS surface → [`../skills/ios-review/SKILL.md`](../skills/ios-review/SKILL.md).
- [ ] Prompt change → [`./ai-prompt.md`](./ai-prompt.md).

## Stage 9 — Test & eval plan
*Enforces feature-spec §9, [`docs/10 Engineering Principles.md §3`](../../docs/10%20Engineering%20Principles.md).*

- [ ] Deterministic logic (consent gates, thresholds, scoring, banned-word) covered by unit tests.
- [ ] Changed engine contracts covered by contract tests.
- [ ] Coach-facing change → golden-conversation, tone/no-shaming, and safety red-team **evals** named and green in CI.
- [ ] Guardrail assertions stated (zero shaming incidents; crisis-handoff correctness unchanged — Canon §7).

## Stage 10 — Release plan
*Enforces feature-spec §10, [`docs/10 Engineering Principles.md §6`](../../docs/10%20Engineering%20Principles.md).*

- [ ] Anything coaching-facing is behind a **feature flag** (default off).
- [ ] Staged rollout defined (internal → cohort → all) with guardrail watch.
- [ ] Named rollback that is faster than fix-forward; prompt version pinned (`13 Prompt Architecture.md`).

## Stage 11 — Post-release evaluation  *(Sensitive: required)*
*Enforces feature-spec §11.*

- [ ] Hypothesis + expected North-Star direction (Aligned Decision Rate, recovery-weighted) written **before** ship.
- [ ] Guardrails that must not degrade named; evaluation date/cohort trigger set.
- [ ] Result recorded after ship — the feature is not "done" until this is filled.

---

- [ ] Finally: run [`./pull-request.md`](./pull-request.md) on the PR (universal, every tier).

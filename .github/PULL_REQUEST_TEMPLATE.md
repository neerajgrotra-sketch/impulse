<!--
Impulse PR template. It exists to make the engineering operating system unavoidable:
the right review happens for the right change, and the non-negotiables in
`docs/15 Constitution.md` are attested to, not assumed. Fill every section that applies;
delete nothing. When in doubt about a tier, tier UP (`.claude/CONVENTIONS.md` §2).
-->

## What & why

<!-- One paragraph: what this changes and the WHY (`.claude/CONVENTIONS.md` §1). Link the issue. -->

Closes #

## Change tier (`.claude/CONVENTIONS.md` §2)

Pick exactly one. When in doubt, tier up — over-reviewing a Trivial change costs minutes; under-reviewing a coaching change costs a user's trust.

- [ ] **Trivial** — copy fix, pure refactor, dep bump, non-behavioral change. PR checklist only.
- [ ] **Standard** — new endpoint/screen/logic that is NOT sensitive. Feature-spec + relevant review skill + ADR *if* it sets architecture.
- [ ] **Sensitive** — touches **coaching, safety, memory, privacy, notifications, identity, or the model**. Full feature lifecycle + Design Council + ethical review. **No exceptions, no shortcuts.** Complete the Sensitive-tier section below.

## What it touches

- **Engine(s) / module(s)** (`docs/00 Canon.md` §4): <!-- e.g. Coach Engine, Decision Engine, Safety Engine, Prompt Builder, none -->
- **iOS surface** (`docs/11 iOS Navigation.md`): <!-- screens/flows, or none -->
- **Data model** (`docs/00 Canon.md` §5): <!-- aggregates/fields touched, or none -->
- **Consent scopes** (`docs/00 Canon.md` §8): <!-- scopes read/written, or none -->

## Linked records

Link every record the tier requires. Write "N/A because…" where one genuinely does not apply.

- **Feature spec** (`.claude/templates/feature-spec.md`) — required for Standard/Sensitive:
- **ADR** (`adr/NNNN-title.md`, `.claude/templates/adr-template.md`) — required if this sets architecture:
- **PDR / Product-Ethical Decision Record** (`decisions/NNNN-title.md`) — required if this changes user-facing behavior, ethics, or coaching policy:

## Review skills run (`.claude/skills/`)

Check each skill actually run and link its record. Run the ones your change touches.

- [ ] `feature-design` — idea → review-ready spec (Standard/Sensitive): <!-- link / N/A -->
- [ ] `architecture-review` — <!-- link / N/A -->
- [ ] `backend-review` — <!-- link / N/A -->
- [ ] `database-review` — schema/migration/data-access: <!-- link / N/A -->
- [ ] `ios-review` — <!-- link / N/A -->
- [ ] `performance-review` — latency/token-cost/battery: <!-- link / N/A -->
- [ ] `security-review` — <!-- link / N/A -->
- [ ] `privacy-review` — Sensitive gate: collect/store/derive/log/retain: <!-- link / N/A -->
- [ ] `prompt-review` — Sensitive gate: prompt/schema/guardrail/model change: <!-- link / N/A -->
- [ ] `behavioral-review` — required for any Sensitive coaching/behavioral change: <!-- link / N/A -->
- [ ] `design-council` — required for Sensitive: <!-- link / N/A -->

## Pull-request checklist (all tiers)

- [ ] The change matches the tier declared above; if in doubt I tiered up.
- [ ] WHY is documented, not just WHAT (`.claude/CONVENTIONS.md` §1).
- [ ] Canon vocabulary used verbatim; no synonyms for canon terms (`docs/00 Canon.md` §2).
- [ ] Relevant `.rules/` files honored (`architecture`, `backend`, `ios`, `swift`, `naming`, `privacy`, `security`, `accessibility`, `documentation`).
- [ ] Cross-links are relative paths and resolve.
- [ ] The `governance.yml` structural checks pass locally / in CI.

## Non-negotiable attestations (`docs/15 Constitution.md`)

These are launch-blocking if false. Confirm each explicitly — an unchecked box blocks merge.

- [ ] **No PII in logs.** No user content, identifiers, or intimate data are logged un-scrubbed; prompt/response capture is privacy-scrubbed (`docs/00 Canon.md` §6, `.rules/privacy.md`).
- [ ] **No secrets.** No keys, tokens, credentials, or connection strings are committed in code, docs, or fixtures (`.rules/security.md`).
- [ ] **No shaming language.** No banned words in any Coach-facing surface, code, or copy: *fail, failure, cheat, streak-broken, bad, weak, should have, guilt* (`docs/00 Canon.md` §2).
- [ ] **Consent is a gate.** Every proactive action added/changed checks a consent scope (`docs/00 Canon.md` §8).
- [ ] **Safety pre-empts.** Nothing here weakens the Safety Engine's ability to hard-stop a coaching turn (`docs/00 Canon.md` §4, §8).

## Test & eval evidence

- [ ] **Tests** added/updated and passing — paste the command run and its result:
- [ ] **Evals** run where the change touches prompts, coaching, or the model — link the eval-harness output (`docs/13 Prompt Architecture.md`); or "N/A because…":
- [ ] **No shaming-language / banned-word** check passes against the surface changed (`docs/00 Canon.md` §2, §7 guardrail).

## Sensitive-tier section (required if tier = Sensitive)

If tier is Trivial or Standard, check the box below and skip the rest.

- [ ] **N/A because** this change is not Sensitive (does not touch coaching, safety, memory, privacy, notifications, identity, or the model).

Otherwise complete all of the following — each field is required or must carry an explicit "N/A because…" justification:

- **Design Council report** (`.claude/skills/design-council/SKILL.md`, `.claude/workflows/design-council.md`) — link, with the go / no-go / go-with-conditions verdict and any conditions:
- **Ethical review** (`behavioral-review` record, recorded as a PDR under `decisions/`) — link, with PASS / CONDITIONAL / BLOCK verdict:
- **Precedence** (`docs/02 Product Philosophy.md` §3): if any lens conflict was resolved, name the governing principle (Safety > Consent > Understand-before-advise > coaching-quality peers > Engagement):
- **Guardrails not degraded** (`docs/00 Canon.md` §7): self-reported trust / "the app gets me", crisis-handoff correctness, notification opt-out rate, zero shaming-language incidents — confirm none regress:
- [ ] Every Insight or inference this adds carries `evidence_refs` and is user-inspectable and correctable (Explainability — `docs/00 Canon.md` §8).

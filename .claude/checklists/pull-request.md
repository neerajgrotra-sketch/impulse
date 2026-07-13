# Checklist — Pull Request (universal)

> **Applies to:** every PR, every tier (Trivial / Standard / Sensitive — [`CONVENTIONS §2`](../CONVENTIONS.md)). This is the floor. Standard and Sensitive changes run this **plus** the lifecycle in [`./new-feature.md`](./new-feature.md) and the tier-specific checklists.
> A Trivial change (copy fix, pure refactor, dep bump, non-behavioral) needs *only* this file.

## Tier & process
*Enforces [`.rules/README.md`](../../.rules/README.md), [`CONVENTIONS §2`](../CONVENTIONS.md).*

- [ ] **Tier assigned** on the PR: Trivial / Standard / **Sensitive**. When in doubt, tier up.
- [ ] Sensitive tier (coaching, safety, memory, privacy, notifications, identity, the model) → the full lifecycle ([`./new-feature.md`](./new-feature.md)), Design Council, and ethical review are linked and done — not deferred.
- [ ] The matching **review skill** for the surface was run and its verdict linked:
  - backend/route/worker/LLM-call → [`../skills/backend-review/SKILL.md`](../skills/backend-review/SKILL.md)
  - module boundaries / orchestration / deployable shape → [`../skills/architecture-review/SKILL.md`](../skills/architecture-review/SKILL.md)
  - iOS client → [`../skills/ios-review/SKILL.md`](../skills/ios-review/SKILL.md)
  - auth / isolation / secrets / deps → [`../skills/security-review/SKILL.md`](../skills/security-review/SKILL.md)
  - anything the Coach says or when it reaches out → [`../skills/behavioral-review/SKILL.md`](../skills/behavioral-review/SKILL.md)

## WHY documented
*Enforces [`docs/10 Engineering Principles.md §8`](../../docs/10%20Engineering%20Principles.md), [`CONVENTIONS §1`](../CONVENTIONS.md).*

- [ ] The PR description states **why**, not only what changed, and what it might break.
- [ ] Anything hard to reverse (canonical-aggregate change, external contract, privacy default, model-tier commitment) has a written WHY / ADR / PDR.

## Tests
*Enforces [`docs/10 Engineering Principles.md §3`](../../docs/10%20Engineering%20Principles.md).*

- [ ] Deterministic logic touched (consent gates, completeness threshold, alignment scoring, banned-word, Safety routing) has passing unit tests.
- [ ] Changed engine contract has updated contract tests.
- [ ] Coach-/prompt-facing change: golden-conversation, tone/no-shaming, and safety red-team **evals** ran in CI and pass (see [`./ai-prompt.md`](./ai-prompt.md)).
- [ ] No test, fixture, or eval set contains production user data (synthetic/anonymized personas only).

## No secrets
*Enforces [`.rules/security.md`](../../.rules/security.md).*

- [ ] No secret, API key, token, or credential is hardcoded, committed, logged, or embedded in the client binary.
- [ ] Secrets are loaded from the secret manager at runtime; new deps are pinned and CVE-scanned.

## No PII in logs
*Enforces [`.rules/privacy.md`](../../.rules/privacy.md), [`docs/08 Database Architecture.md §7`](../../docs/08%20Database%20Architecture.md).*

- [ ] No raw `Message` text, `reflection` responses, decrypted `Memory` content, or other PII in logs, traces, telemetry, or errors.
- [ ] Prompt/response capture is privacy-scrubbed; analytics events carry aggregates and IDs, never raw dialogue.
- [ ] `alignment_score` (and any internal score/Insight) never logged and never exposed to the user (Canon §5).

## Safety & consent still hold (any inbound-message or proactive path)
*Enforces [`.rules/ai.md`](../../.rules/ai.md), [`docs/00 Canon.md §8`](../../docs/00%20Canon.md).*

- [ ] No inbound-message path bypasses the **Safety Engine**; no advice-type Coaching Move can fire below the understand-before-advise threshold.
- [ ] Every proactive action checks its `consent_scope` before running.

## Canon vocabulary
*Enforces [`.rules/naming.md`](../../.rules/naming.md), [`CONVENTIONS §1`](../CONVENTIONS.md).*

- [ ] Canon §2 terms used verbatim in code, tests, and copy; no synonym for a canon term; **no banned words** (*fail, failure, cheat, streak-broken, bad, weak, should have, guilt*) anywhere, including enums and examples.

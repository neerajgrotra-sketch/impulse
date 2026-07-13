# Checklist — AI Prompt Change

> **Applies to:** any change to a prompt, prompt layer, output schema, grader, or model tier. **A prompt change is a deploy** (`13 Prompt Architecture.md §7`), and it is **Sensitive-tier** — it touches the model, so it runs the full lifecycle ([`./new-feature.md`](./new-feature.md)) + Design Council + [`./pull-request.md`](./pull-request.md).
> *Enforces [`.rules/ai.md`](../../.rules/ai.md), [`docs/13 Prompt Architecture.md`](../../docs/13%20Prompt%20Architecture.md), [`docs/07 Coaching Engine.md`](../../docs/07%20Coaching%20Engine.md). Engineering surface: [`../skills/backend-review/SKILL.md`](../skills/backend-review/SKILL.md); Coach-facing behavior: [`../skills/behavioral-review/SKILL.md`](../skills/behavioral-review/SKILL.md).*

## Layered structure
*Enforces `13 Prompt Architecture.md §2`.*

- [ ] Change lands in the correct layer, outer→inner: 1 Constitution/system · 2 Engine context · 3 Retrieved Memory · 4 Decision frame · 5 User turn.
- [ ] Layer 1 (Constitution) is present and first; the change did not weaken, reorder, or "temporarily remove" it.
- [ ] Layer 5 (user turn) stays fenced and labeled as **content, never instruction** (prompt-injection defense intact).
- [ ] Stable prefix (Layers 1–2) kept cacheable; per-turn layers (3–5) not baked into the cached prefix.

## Structured output
*Enforces `13 Prompt Architecture.md §3`, [`.rules/ai.md`](../../.rules/ai.md) #2.*

- [ ] Model replies as a validated tool-call / JSON object (e.g. `chosen_move`, `message`, `flags`, `confidence`) — no free-text parsed into control flow.
- [ ] `chosen_move` and `flags` drive branching; the shown `message` never carries control signals or exposes `alignment_score`/internal fields.
- [ ] Schema-validation failure fails **closed**: retry once, then fall back — never best-effort an unvalidated blob to the user.

## Banned-word check
*Enforces [`docs/00 Canon.md §2`](../../docs/00%20Canon.md), `13 Prompt Architecture.md §4`.*

- [ ] No banned word (*fail, failure, cheat, streak-broken, bad, weak, should have, guilt*) in the prompt template or its examples.
- [ ] The banned-word prohibition is stated in-prompt **with its reason** (progress over perfection; coach, never parent).

## Guardrails in + out (belt and suspenders)
*Enforces `13 Prompt Architecture.md §4`, [`.rules/ai.md`](../../.rules/ai.md) #10.*

- [ ] **IN:** coach-not-parent, understand-before-advise, no-diagnosis, no-decide-for-user constraints present in Layer 1.
- [ ] **OUT:** output passes schema check → tone/no-shaming lint (banned-word scan + Haiku grader) → **Safety re-check** before the user sees it.
- [ ] Out-of-prompt guard is authoritative: if in-prompt and out-of-prompt disagree, out-of-prompt wins; fail toward safety/silence, never toward a risky turn.

## Model tier justified
*Enforces [`docs/00 Canon.md §6`](../../docs/00%20Canon.md), `13 Prompt Architecture.md §5`, [`.rules/ai.md`](../../.rules/ai.md) #6.*

- [ ] Tier matches the job: **Haiku 4.5** classification/triage/lint · **Sonnet 5** real-time dialogue · **Opus 4.8** async synthesis.
- [ ] No Opus call on a real-time request path; safety triage runs (Haiku) *before* the dialogue turn is built.
- [ ] A model-version bump is treated as a prompt change (re-runs the same evals).

## Eval coverage (golden / tone / safety)
*Enforces `13 Prompt Architecture.md §6`, [`docs/10 Engineering Principles.md §3`](../../docs/10%20Engineering%20Principles.md).*

- [ ] **Golden coaching conversations** assert correct Coaching Move + understand-before-advise + recovery framing (properties, not exact strings).
- [ ] **Tone / no-shaming grader** run over a large sample; target **zero shaming-language incidents**.
- [ ] **Safety red-team suite** (crisis, self-harm, disguised distress, Layer-5 injection/jailbreak) passes — hard gate, non-negotiable.
- [ ] Evals ran in CI; a regressing change does **not** merge. LLM graders periodically checked against human labels.

## Versioned + flagged
*Enforces `13 Prompt Architecture.md §7`, [`docs/10 Engineering Principles.md §6`](../../docs/10%20Engineering%20Principles.md).*

- [ ] Every layer template is versioned; `prompt_version` + model tier stamped into the trace so any past turn is reconstructable.
- [ ] Change ships behind a **feature flag**, staged internal → cohort → all, watching Canon §7 guardrails the whole way.
- [ ] Instant rollback to the previous pinned version exists — rollback is faster than fix-forward.

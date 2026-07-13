---
name: prompt-review
description: Use as the Sensitive-tier gate on any change to a prompt, output schema, guardrail, model tier, or the Prompt Builder — it verifies layered structure, structured output, in-prompt and post-generation guardrails, banned-word compliance, tier choice, eval coverage, and versioned flagged rollout.
---

## Purpose

A prompt is the part of the system that speaks directly to a vulnerable user at a low moment, so a bad prompt is a production incident of the most serious kind (`docs/10 Engineering Principles.md` §6). This skill is the review gate for prompt changes. It verifies that a change keeps the **layered prompt** ordered outer→inner (Constitution first, user turn last and least trusted), that the model still replies in a validated **structured output** schema, that both **in-prompt and post-generation guardrails** are intact, that the **banned-word list** is honored, that the **model tier** matches the task, that **eval coverage** (golden / tone / safety) gates the change, and that it ships **versioned and behind a flag** with a rollback path. The reasoning is downstream of one Canon sentence: *the backend owns state, policy, and safety; the model owns language and reasoning* (`docs/00 Canon.md` §4).

It enforces [`.rules/prompt-engineering.md`](../../../.rules/prompt-engineering.md) and is tied to `docs/13 Prompt Architecture.md` (the authoritative owner of layered prompts, structured output, and evals) and to `docs/15 Constitution.md` (the non-negotiables the Constitution layer injects). Safety and shaming reviews here are release-blocking, matching the **Safety Engine**'s launch-gating status (`docs/00 Canon.md` §4).

## When to use

This skill is a **SENSITIVE-tier gate** — every prompt change touches "the model" and usually "coaching" and "safety," which are Sensitive by definition (`.claude/CONVENTIONS.md` §2). Therefore:

- **Always run the full checklist** on any change to a layer template, an output schema, an in-prompt or post-generation guardrail, a grader, a **Coaching Move** set, the model tier or routing, or the **Prompt Builder** itself.
- A model version bump (e.g. **Sonnet 5** → a future Sonnet) **is** a prompt change: the same template behaves differently on a different model, so it clears this gate too (`docs/13 Prompt Architecture.md` §7).
- There is **no Standard or Trivial path** for prompt changes — tier up, never down. A change that only edits non-prompt code does not invoke this skill.
- Output feeds the Design Council and ethical review that Sensitive changes require; a failed prompt review blocks the change (`.claude/CONVENTIONS.md` §2).

## Inputs

- The prompt diff: which of the five layers changed (`docs/13 Prompt Architecture.md` §2) and the composed `prompt_version` it produces.
- The output schema for the affected call (e.g. `CoachTurnOutput` — `chosen_move`, `message`, `flags`, `confidence`) and any change to its fields (`docs/13 Prompt Architecture.md` §3).
- The in-prompt guardrails (Layer 1 banned-word list + positive constraints) and the post-generation guardrails (schema check, tone/no-shaming lint, **Safety** re-check) the call relies on (`docs/13 Prompt Architecture.md` §4).
- The requested model tier (`fast` / `dialogue` / `deep`) and the routing rule (`docs/13 Prompt Architecture.md` §5).
- The eval run: golden coaching conversations, tone/no-shaming grader, safety red-team suite, and their CI results (`docs/13 Prompt Architecture.md` §6).
- The rollout plan: feature flag, staged cohort, and rollback pin (`docs/10 Engineering Principles.md` §6, `docs/13 Prompt Architecture.md` §7).

## Outputs

- A pass / block decision. A failing safety case, a shaming incident above zero, a broken schema boundary, a layer-ordering inversion, or an ungated/unversioned change is a **block**.
- A findings list mapped to `.rules/prompt-engineering.md` and to the section of `docs/13 Prompt Architecture.md` each finding implicates.
- Where the change alters coaching behavior policy, a Product/Ethical Decision Record (`.claude/CONVENTIONS.md` §3) recording the WHY.

## Checklist

**Layered structure (outer→inner, order is load-bearing)**
- [ ] The five layers stay ordered Constitution/System (1) → Engine context (2) → Retrieved **Memory** (3) → Decision frame (4) → User turn (5), assembled outer-first (`docs/13 Prompt Architecture.md` §2). WHY: the model must read its non-negotiable constraints *before* anything a user could use to override them.
- [ ] **Layer 5 (user turn)** remains the most volatile and **least trusted**: fenced, labeled as content, never treated as instruction (`docs/13 Prompt Architecture.md` §2). This is our primary structural defense against prompt injection.
- [ ] The change goes through the **Prompt Builder** — the *only* path to the model; no feature code, engine, or worker gains a raw prompt string or direct gateway call (`docs/13 Prompt Architecture.md` §1, `docs/00 Canon.md` §6).
- [ ] Every layer stays labeled in the assembled prompt so the model and the audit log can tell whose words are whose (`docs/13 Prompt Architecture.md` §2).

**Structured / JSON-schema output**
- [ ] The model replies with a validated tool call / JSON object, never prose parsed for control flow; `chosen_move`, `flags`, and `confidence` are typed fields the backend acts on, and `message` is the only free-text field shown to the user (`docs/13 Prompt Architecture.md` §3). WHY: control flow must not depend on phrasing.
- [ ] Off-schema output **fails closed** — retry once, then fall back; an unvalidated blob never reaches the user or the state machine (`docs/13 Prompt Architecture.md` §3).
- [ ] No internal field (the **Alignment** score, `alignment_note`) leaks through `message` — the shown message is coaching, never a dashboard (`docs/13 Prompt Architecture.md` §10, `docs/00 Canon.md` §5).
- [ ] `flags` still carries `safety_concern` / `needs_more_context` so the model can raise concern *inside the schema* and the backend routes it deterministically — the model advises, the backend decides (`docs/13 Prompt Architecture.md` §3).

**Guardrails in two places (belt and suspenders)**
- [ ] **In-prompt (Layer 1):** the full banned-word list and the positive constraints — coach-not-parent, understand-before-advise, no diagnosis, no decisions made for the user — are present with their reasons (`docs/13 Prompt Architecture.md` §4).
- [ ] **Post-generation:** the schema check, the tone / no-shaming lint (deterministic banned-word scan + **Haiku 4.5** tone grader), and the **Safety** re-check on the outbound message all still run (`docs/13 Prompt Architecture.md` §4). WHY: in-prompt shapes the distribution but cannot guarantee any single output; out-of-prompt is deterministic and does not assume the model cooperated.
- [ ] Where in-prompt and post-generation disagree, **out-of-prompt wins** and the **Safety** re-check is authoritative — it can hard-stop the turn and substitute the mandated crisis response regardless of what the model produced (`docs/13 Prompt Architecture.md` §4, `docs/15 Constitution.md` §3).

**Banned-word compliance & non-negotiables**
- [ ] The change never introduces or permits a banned word — *fail, failure, cheat, streak-broken, bad, weak, should have, guilt* — in any Coach output; **zero shaming-language incidents** is the target (`docs/00 Canon.md` §2, §7, `docs/15 Constitution.md` §4.1).
- [ ] No **Coaching Move** or phrasing the change adds decides *for* the user or emits a directive "you must / you should" — coach, never parent (`docs/15 Constitution.md` §4.2). Advice-type moves remain gated behind the understand-before-advise completeness threshold (`docs/00 Canon.md` §8).
- [ ] The change does not let the model claim, imply, or let a user infer that Impulse is a therapist or clinician (`docs/15 Constitution.md` §6).

**Model-tier choice**
- [ ] The call routes to the tier the task owns — **Haiku 4.5** for emotion/bias/**Safety** triage and the tone grader, **Sonnet 5** for real-time **Coaching Session** turns, **Opus 4.8** for async weekly synthesis / hard **Reflection**s (`docs/13 Prompt Architecture.md` §5). WHY: route by task, not by convenience; latency is part of coaching.
- [ ] **Safety** triage (Haiku 4.5) runs *before* the dialogue turn is built, so a crisis is handled without ever entering coaching (`docs/13 Prompt Architecture.md` §5).
- [ ] The change preserves prompt-caching of the stable **Layer 1–2** prefix (`docs/13 Prompt Architecture.md` §5).

**Eval coverage (golden / tone / safety)**
- [ ] The change runs the eval harness in CI: **golden coaching conversations** (right move, understand-before-advise, **Recovery** framed well), the **tone / no-shaming grader**, and the **safety red-team suite** (crisis, self-harm, disguised distress, Layer 5 injection, jailbreaks) (`docs/13 Prompt Architecture.md` §6, `docs/10 Engineering Principles.md` §3).
- [ ] The **safety suite is a hard gate** — acceptance is not "usually safe"; a single failing safety case does not merge (`docs/13 Prompt Architecture.md` §6). Shaming incidents above zero and golden-set regressions also block the merge.
- [ ] An escaped real failure is added to the golden set as the standard fix (`docs/10 Engineering Principles.md` §3); eval datasets are versioned, owned, and use synthetic personas only (no production user data).

**Versioning & flagged rollout**
- [ ] The change stamps a `prompt_version` (and model tier) onto every logged call so any past turn is reconstructable (`docs/13 Prompt Architecture.md` §7).
- [ ] It ships **behind a feature flag**, rolling out progressively (internal → small cohort → all) while watching the `docs/00 Canon.md` §7 guardrails — shaming incidents, trust, crisis-handoff correctness — with an instant rollback to the previous pinned version (`docs/13 Prompt Architecture.md` §7, `docs/10 Engineering Principles.md` §6). WHY: rollback is faster than fix-forward; we never debug a harmful prompt live.
- [ ] Passing evals is the entry gate to rollout; guardrail metrics are the exit gate to 100% (`docs/10 Engineering Principles.md` §6).

## Success criteria

- The five layers remain correctly ordered with the user turn fenced as least-trusted Layer 5, and the change flows only through the **Prompt Builder**.
- Model output validates against its schema with `message` as the only shown field; off-schema output fails closed; no internal field leaks through `message` — all demonstrable by test.
- Both guardrail passes are present and the **Safety** re-check is authoritative; the tone lint and banned-word scan run post-generation.
- The eval harness passes in CI: golden conversations do not regress, the tone grader reports **zero shaming-language incidents**, and the safety red-team suite passes with no failing case.
- The call routes to the task-correct tier with **Safety** triage ahead of dialogue, and the Layer 1–2 cache prefix is preserved.
- The change carries a stamped `prompt_version`, ships behind a flag with a pinned rollback, and its guardrail metrics hold through staged rollout.

## Failure criteria

- Any layer-ordering inversion, a constraint placed after the user turn, an unfenced/instruction-treated Layer 5, or a raw prompt path that bypasses the **Prompt Builder**.
- Free-text model output used for a control-flow branch, an off-schema response handled "best-effort" instead of failing closed, or an internal field (Alignment score, `alignment_note`) surfaced through `message`.
- A missing in-prompt banned-word list or positive constraint, or a removed/weakened post-generation schema check, tone lint, or **Safety** re-check.
- Any banned word or shaming/parental/directive phrasing in Coach output, an advice move that bypasses the understand-before-advise gate, or language that implies Impulse is a clinician.
- A tier chosen by convenience (e.g. a dialogue turn upgraded to **Opus 4.8** inline), **Safety** triage that does not run before dialogue, or a broken Layer 1–2 cache prefix.
- A merge with a failing safety case, a shaming incident above zero, or a golden-set regression; or an eval set containing production user data.
- A prompt change shipped without a stamped `prompt_version`, without a feature flag, or without a rollback pin.

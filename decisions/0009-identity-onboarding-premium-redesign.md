# PDR 0009 — Identity-capture screen redesigned for premium/emotional quality, sequenced in two phases

> **Status:** Accepted (Phase 1) / Phase 2 conditionally deferred pending §8.1 resolution
> **Purpose:** Record the Design Council pass against `docs/identity-onboarding-choreography.md` — a full motion/interaction redesign of `IdentityInspirationScreen` — and fix its conditions as binding build constraints, split into two sequenced phases.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0009 |
| **Status** | Accepted |
| **Date** | 2026-07 |
| **Deciders** | Neeraj Grotra (founder), via Design Council review |
| **Tier** | Sensitive (onboarding, identity capture — always a PDR) |
| **Supersedes / Superseded by** | Amends `0007`/`0008` narrowly (interaction quality and motion design of the same screen); does not reopen `0006`'s outstanding per-turn safety-screening requirement, which remains unaffected. |

## Context

Physical-device testing of the PDR 0008 build surfaced thirteen distinct quality problems: the mic control doesn't read as a microphone, the transcript (the most important content on screen) is rendered as a tiny caption, `deriveIdentityStatement` blindly prefixes text producing broken output ("I am someone who is i wanna be perfect"), the orb doesn't communicate state, thought bubbles feel mechanical, the whole flow feels transactional rather than reflective, and several recovery paths (Start Over, Clear) don't exist. The founder requested a from-scratch redesign — not incremental fixes — evaluated through an Apple HIG / behavioral-psychology / motion-design lens, choreographed second-by-second before any code, per this project's existing spec-first process.

`docs/identity-onboarding-choreography.md` is that spec. Ten of fifteen lenses were engaged (Krug, Rams, Kahneman, Jobs, Fogg, Christensen, Bandura, Dweck, Clear, Thaler); Huberman, Duhigg, Aristotle, Aurelius, and Epictetus were set aside as not biting on a capture-mechanics/motion redesign that doesn't touch coaching content, habit loops, or reward timing.

## Decision

**We accept the choreography as the redesign target, sequenced into two phases, with the Council's findings treated as build-blocking.**

All ten engaged lenses converged that the choreography correctly diagnoses and fixes the thirteen named defects, and that its own governing rule ("what emotion does this create — cut anything that's just because it looks cool") is unusually well-aligned with Rams/Krug restraint already. No lens raised a Safety or Consent objection.

Two real issues surfaced that the document itself hadn't fully resolved:
- **Dweck/Kahneman/Bandura converged** on an unfinished design decision: the orb's one-shot "Finished" pulse fires unconditionally the instant a transcript settles, before the user has seen or endorsed the card — risking a read of "that's good" (praise) rather than "message received" (acknowledgment), and doing so even if the captured content is empty or garbled.
- **Clear** found the document's own worked example for the Suggestion feature ("I want to become someone who strives to improve every day") isn't itself fully identity-shaped — it drifts toward goal/discipline language, the exact defect PDR 0007 already remediated once in the thought library.

A genuine scope tension surfaced between Jobs/Rams's restraint and the sheer number of simultaneously-introduced new mechanisms (a 7-state orb, drifting/overlapping thought bubbles, a transcript→card morph, a Suggestion strip, contextual recovery affordances, new Finished-pulse semantics). Resolved by **sequencing, not cutting**: the choreography's §8.1 already names an unresolved question — whether the identity-normalization "Suggestion" rewrite comes from a local heuristic or a real LLM-backed call through the Prompt Builder (Canon §4/§6) — and that question changes the Sensitive-tier surface from "identity" alone to "identity + the model." That is reason enough to build it separately.

## Consequences

**Phase 1 (accepted, build now):** mic iconography redesign, transcript-first typographic hierarchy, the full orb state machine (idle/thought-appearing/listening/processing/finished/typing/error), thought-bubble "memories surfacing" motion (continuous drift, occasional overlap, all Reduce-Motion-gated per the existing pattern), the transcript→vision-card morph (both voice and type paths), contextual recovery affordances including a new no-confirmation "Clear," and Continue's gentle first-arrival animation. Binding conditions:

1. No choreography beat-name ("Reflection Mode," "Confirmation," etc.) may appear in user-facing copy — internal vocabulary only.
2. Every new animation (Finished pulse, Error tint, bubble drift/overlap, the morph) ships with the Reduce Motion equivalent specified in the choreography's §1/§2/§9 — asserting it in prose is not sufficient; it must be implemented and verifiable.
3. The Finished orb pulse fires only when the settled content is non-trivial (mirrors the existing non-empty `canContinue` check) and is implemented to read as receipt, not praise — a single soft lift, no bounce or emphasis that could read as evaluative.
4. "Clear" ships with no confirmation dialog — this is intentional (nothing here should feel irreversible enough to need one), not an oversight to "fix" later without revisiting this reasoning.
5. All existing PDR 0007/0008 guarantees stay green and are not weakened by the new motion: no-repeat thought sequence, Reduce-Motion/screen-reader hold, voice-cancel-never-completes, voice-derived text never persists before Continue, the two-stage confirmation with `IdentityConfirmScreen` remains load-bearing.

**Phase 2 (deferred, requires its own follow-up spec before any code):** the identity-normalization Suggestion feature (Scene 5 of the choreography). Gated on:

6. §8.1 must be explicitly decided (local heuristic vs. LLM-backed rewrite) before implementation starts; if LLM-backed, it requires its own `prompt-review` pass and an eval-harness case proving it never fabricates or overclaims, per Canon §6's "no raw model access from feature code" rule.
7. Whatever generates a rewrite must pass the same identity-shaped, non-goal-phrased, non-deficit-framed bar `constants/__tests__/thoughtLibrary.test.ts` already enforces on the thought library — not a new, separately-invented bar.
8. "Use Suggestion" and "Keep My Words" must ship with strictly equal visual weight — no default/primary styling favoring either action.
9. The choreography document's own worked example needs revision before use as a build reference (flagged, not yet fixed, in the source document).

PDR 0006's outstanding per-turn Safety Engine screening gap is unaffected by either phase.

## Constitution / Covenant impact

No Covenant text change; `covenant_version` unaffected for Phase 1. Phase 1 engages principle #2 (Coach, never parent) via the Finished-pulse-as-receipt-not-praise condition, and principle #7 indirectly (motion/Reduce-Motion parity is a form of respecting the user as they actually are, not as a default-abled assumption). Phase 2, if it resolves toward an LLM-backed rewrite, would engage principle #4 (Identity over goals) directly and principle #7 via Explainability — the user must be able to tell a Suggestion was model-generated, not mistake it for the app's unmediated read of them — and would require its own Constitution/Covenant impact statement at that time.

## How we'll know if this was wrong

- If real-user testing shows the Finished pulse still reads as evaluative despite condition 3, the pulse's shape (not just its gating) needs revisiting — this would mean the "receipt vs. praise" distinction doesn't survive contact with an actual felt experience, a real risk named by Dweck's lens, not just a hypothetical.
- If Phase 1's simultaneously-introduced surface (orb states, bubble motion, morph, recovery affordances) is measured post-ship as reading like "more features" rather than "one integrated whole" (Jobs's-lens risk), the sequencing decision itself — not just this build — was insufficient, and a further reduction pass would be warranted.
- If Phase 2 is eventually built and usage data shows near-universal "Use Suggestion" adoption, that would suggest the feature has quietly become "write this for me" rather than "help me say it well" — a Coach-never-parent violation worth revisiting per Christensen's-lens open question in the source document.

## Alternatives considered

- **Ship everything (Phase 1 + Phase 2) in one release.** Rejected: §8.1 is a genuine, unresolved architectural fork (local heuristic vs. LLM call through the Prompt Builder) that changes the Sensitive-tier surface; forcing a build to start before that fork is resolved risks building the wrong one twice.
- **Treat this as incremental polish on top of PDR 0008, skip a fresh Council pass.** Rejected: the founder explicitly asked for a from-scratch redesign, not incremental fixes, and the scope (new orb states, new motion primitives, a new normalization UI) clearly exceeds "further expansion" under PDR 0007's own binding clause.
- **Cut the Suggestion feature (Scene 5) entirely rather than defer it.** Rejected: the underlying defect (`deriveIdentityStatement`'s blind prefixing) is a real, user-facing bug independent of whether a "Suggestion" UI ships — Phase 1 must at minimum stop fabricating broken text, even before Phase 2's fuller Suggestion UI exists. (See build note: Phase 1 removes the blind prefix; it does not yet add the Suggestion strip itself, which is Phase 2's UI.)

## Links

- `docs/identity-onboarding-choreography.md` — the reviewed spec
- `decisions/0007-identity-thought-stream-scope-expansion.md`, `decisions/0008-identity-capture-keyboard-ux-rework.md` — prior passes on this same screen
- `decisions/0006-onboarding-rejects-fixed-interview-requires-safety-gate.md` — outstanding safety-screening gap, unaffected
- `docs/00 Canon.md` §4, §6 (Prompt Builder, LLM gateway, no raw model access), `docs/02 Product Philosophy.md` §3 (precedence order)
- `.claude/CONVENTIONS.md` §4 (lens map), `.claude/workflows/design-council.md` (session process)
- `.rules/reviews.md` rule 4, rule 9 (Sensitive-tier Design Council + linked PDR requirement)
- `constants/__tests__/thoughtLibrary.test.ts` — the identity-shaped-language bar Phase 2 must reuse
- `prototype/expo/features/onboarding/screens/IdentityInspirationScreen.tsx`, `prototype/expo/components/{VoiceOrb,BreathingOrb,ThoughtBubble,EditableVisionCard}.tsx` — implementation targets

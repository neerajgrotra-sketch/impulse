# Next-Moment Engine — Implementation Plan (Deliverable 4)

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** The HOW that builds `docs/identity-onboarding-choreography-v2.md` and `adr/0008-next-moment-engine-architecture.md`, reviewed by `decisions/0010-next-moment-engine-design-council.md`. This is a plan, not code — implementation still waits on explicit approval of this document.
> **Feature spec / ADR / PDR:** `docs/identity-onboarding-choreography-v2.md`, `adr/0008-next-moment-engine-architecture.md`, `decisions/0010-next-moment-engine-design-council.md` · **Tier:** Sensitive

---

## 1. Goals / Non-goals

**Goals of this build:**
- Ship the deterministic `MomentState` machine and all nine choreographed moments end-to-end, so the experience is complete and correct **with the Next-Moment Engine's adaptive loop flag-gated off** — i.e., every moment through Recognition→Ownership→Commitment works today, with Interpretation/Clarification always resolving instantly to `accept_verbatim`.
- Build the real Next-Moment Engine module, backend endpoint, structured-output schema, safety-tier classification and deterministic mapping, and the starting eval set — for real, not stubbed — behind a flag that defaults off.
- Apply the confirmed Moment 2 copy change ("Who are you becoming?").
- Fix the two choreography-level Moment 7 requirements from PDR 0010 (distinct visual treatment, VoiceOver announcement) and the code-enforced clarification-round cap.

**Explicit non-goals of this build** (named so no one mistakes "code complete" for "shipped to users"):
- **Turning the feature flag on for any real user.** Per ADR 0008 §8, that requires the eval set passing with zero missed escalations *and* a maintained crisis-resource registry wired to the Tier 2/3 path — neither exists yet, and sourcing the registry is out of scope for this plan (it's not primarily an engineering task).
- **Building the crisis-resource registry itself.** This plan creates the *code path* that would use one (the Tier 2/3 hard-stop and, once available, a hand-off UI slot) but does not source, write, or hardcode crisis-resource content. A hardcoded placeholder phone number would violate Constitution §3.3 more directly than having no UI slot at all.
- **The full five-layer Prompt Builder, nine-engine topology, or mature eval harness** described in `docs/13 Prompt Architecture.md`/`04 AI Brain.md`. This plan builds the bounded MVP subset ADR 0008 §3 scopes, explicitly not the whole system.
- **A remote feature-flag service.** No such service exists anywhere in this codebase; building one is a separate infrastructure decision. This plan uses the simplest viable mechanism (below).

---

## 2. Proposed design

```
IdentityInspirationScreen
  └─ useOnboardingMoment (new hook) — owns MomentState, the round counter, and
     all transition logic. Renders one of nine moment templates.
       │
       ├─ arrival / curiosity / inspiration / expression / recognition
       │    (all existing Phase 1 UI, unchanged — see §4 "Components preserved")
       │
       └─ interpreting → calls nextMomentEngine.interpret(...) if
            FEATURE_FLAGS.onboardingNextMomentEngine is true; otherwise resolves
            synchronously to { action: "accept_verbatim" } with zero latency.
               │
               ├─ clarifying (renders GeneratedMoment.prompt beneath the card,
               │    loops back to interpreting on response, capped by the
               │    round counter — see §5)
               │
               └─ ownership → commitment (existing Phase 1 UI, unchanged)
```

`nextMomentEngine.interpret()` is a thin client module whose only job is to call one backend endpoint and validate the response against the `GeneratedMoment` schema — it holds no key, no prompt text, no model string (ADR 0008 §3's chokepoint rule). The backend endpoint (new Supabase Edge Function, mirroring `generate-blueprint`'s existing shape) holds the actual prompt assembly, the Anthropic call, and the deterministic risk-tier mapping.

## 3. Data model changes

None. Per ADR 0008 §6, the Engine is stateless per-request — no new table, no migration. `visionText` remains client-only component state until `Continue`, unchanged from PDR 0007/0008/0009.

## 4. Files to create

| File | Purpose |
|---|---|
| `prototype/expo/config/featureFlags.ts` | The "simplest viable mechanism" — a plain exported const object, e.g. `export const FEATURE_FLAGS = { onboardingNextMomentEngine: false } as const;`. Not a remote-config service (none exists); a code-level default that requires a deploy to change, which is itself the correct amount of friction for a flag whose ON state is currently blocked on a non-engineering dependency. |
| `prototype/expo/hooks/useOnboardingMoment.ts` | The deterministic `MomentState` machine: enum, transition table, the round-cap counter (§5), and the one seam where `GeneratedMoment.action` is consumed. Fully unit-testable without any network mock beyond the Engine's own contract. |
| `prototype/expo/services/nextMomentEngine.ts` | Thin client: `interpret(input): Promise<GeneratedMoment>` — calls the new endpoint, validates the JSON response against the schema (reject and fall back to `accept_verbatim` on any shape mismatch, per ADR 0008 §7), never imports an Anthropic SDK or holds a key. |
| `prototype/expo/types/nextMoment.ts` | The `NextMomentAction` / `GeneratedMoment` / `MomentState` types, shared between the hook and the service. |
| `prototype/backend/supabase/functions/next-moment/index.ts` | New Edge Function. Mirrors `generate-blueprint`'s existing structure (Anthropic SDK, `output_config.format: json_schema`, one retry on schema failure then fail-closed) — assembles the bounded three-layer prompt from ADR 0008 §3, model tier `Haiku 4.5` per ADR 0006, produces `GeneratedMoment` including `riskTier`, and applies the deterministic `riskTier → action` mapping **in this function, not in the model's own output** (i.e., the function overrides `action` to a hard-stop value if `riskTier` is `elevated`/`crisis`, regardless of what the model proposed — the code decides, per ADR 0002/0005). |
| `prototype/backend/supabase/functions/next-moment/evals.ts` (or `.json` fixture + a small runner script) | The starting golden set from ADR 0008 §9 — 20–30 cases plus the dedicated self-critical-statement subset PDR 0010 requires — run manually pre-merge until a CI job exists to automate it (no CI eval automation exists in this repo today; adding a full CI pipeline is out of scope for this plan, named as a gap not silently deferred). |
| `prototype/expo/hooks/__tests__/useOnboardingMoment.test.ts` | State-machine unit tests (§7). |
| `prototype/expo/services/__tests__/nextMomentEngine.test.ts` | Schema-validation and fallback tests (§7). |

## 5. Engine / module impact

| Module | Change | New/changed interface? |
|---|---|---|
| `IdentityInspirationScreen.tsx` | Delegates moment/state ownership to the new `useOnboardingMoment` hook; renders Moment 7's clarifying prompt and the (currently unused, flag-off) rewording sub-moment UI | Yes — internal restructuring, no change to its own props |
| `useOnboardingMoment` (new) | Owns `MomentState`, the round-cap counter, and the deterministic mapping of `GeneratedMoment.action` → next `MomentState` | New |
| `nextMomentEngine` (new, client) | Sole caller of the new endpoint from feature code | New |
| `next-moment` Edge Function (new, backend) | Sole caller of the Anthropic SDK for this feature; owns prompt assembly and the risk-tier→action override | New |
| `EditableVisionCard`, `VoiceCaptureButton`, `BreathingOrb`, `VoiceOrb`, `ThoughtBubble`, `ThoughtStream`, `useSpeechRecognitionAdapter`, `useThoughtScheduler`, `useReduceMotion`, `useScreenReaderEnabled` | **Preserved, unmodified** — every Phase 1 (PDR 0008/0009) component stays exactly as built | No |
| `deriveIdentityStatement` | **Preserved, unmodified** — still scoped only to thought-library taps | No |

## 6. API / contract changes

- **New endpoint:** `POST /functions/v1/next-moment` — request `{ userText: string, precedingMomentContext: {...} }`, response `GeneratedMoment` (ADR 0008 §2, including `riskTier`). Auth: same anon-key posture as `generate-blueprint` for now — this plan does not change the prototype's auth model, and flags (as `generate-blueprint`'s own README already does) that `--no-verify-jwt` is prototype-only and must not carry into a build handling real users at scale.
- **No event-bus contracts** — this feature predates any real event bus in this codebase; not applicable.
- **Offline behavior:** if the device is offline, `nextMomentEngine.interpret()` fails fast (network error) and the hook falls back to `accept_verbatim` identically to a timeout (ADR 0008 §7) — onboarding's Expression/Recognition/Ownership/Commitment moments all already work fully offline (Phase 1, unchanged); only the adaptive loop needs connectivity, and its absence is invisible to the user by design.

## 7. Tests

- **`useOnboardingMoment.test.ts`:** every transition in the table (§2 diagram); the round-cap counter forces `commitment` after the configured cap regardless of a mocked Engine returning non-terminal actions repeatedly (this is the PDR 0010 conversational-UX condition — must be tested, not just documented); flag-off resolves `interpreting` synchronously with zero perceptible delay.
- **`nextMomentEngine.test.ts`:** malformed JSON response falls back to `accept_verbatim`; a `riskTier: "crisis"` response is never passed through to render a clarifying question even if `action` in the raw payload says otherwise (defense in depth — the client, not just the Edge Function, refuses to render a non-hard-stop UI on an elevated/crisis signal, in case the two ever drift).
- **Edge Function evals (`evals.ts`):** the full golden set from ADR 0008 §9, run manually before merge per this plan's non-goal note (no CI automation yet) — zero tolerance for a missed escalation in the crisis/risk subset; the self-critical subset checked for tone (no diagnosis, no flattery, no moralizing) via the same banned-word lint `generate-blueprint` already implements, reused rather than re-invented.
- **`IdentityInspirationScreen.test.tsx` additions:** Moment 2's new title text; the flag-off path never shows a clarifying prompt under any circumstance (a regression guard specifically for the "flag defaults off" promise); the Clarification prompt (when manually flagged on in a test) triggers an accessibility announcement (PDR 0010 accessibility condition) — mock `AccessibilityInfo.announceForAccessibility` and assert it's called once per prompt.

## 8. On-device validation plan

With the flag off (the only state real users will ever see from this plan): walk the full Arrival→Commitment sequence on a physical iPhone exactly as the existing `docs/expo-testing-guide.md` workflow already supports, confirming Moment 2's new copy reads correctly, nothing about the experience changed from Phase 1's already-verified feel, and no network call to the new endpoint fires at all (verifiable via a local proxy/log — flag-off must mean *zero* Engine calls, not merely "the result is ignored").

With the flag manually flipped on locally (dev-only, never in a build a real user could receive): exercise the ambiguous-input worked examples ("I wanna be perfect," "I need discipline," "I want to exercise more," "I want to be more present with my children") and confirm one concise, distinct-looking clarifying prompt appears, is announced for VoiceOver, and "Continue as written" reliably skips it; exercise a crisis-signaling test phrase from the eval set's red-team subset and confirm the adaptive loop hard-stops with **no clarifying question rendered at all** — this is the one on-device check that matters more than any other in this plan, and should be run by a person, not assumed from the unit tests alone.

## 9. Rollback plan

Trivial by construction: the flag (`prototype/expo/config/featureFlags.ts`) is a single boolean, defaulting off. Turning any future exposure back off is a one-line change and a redeploy — no data migration to reverse, since nothing this feature does persists anything (§3). If the Edge Function itself needs to be pulled entirely, deleting/disabling it degrades the client to its flag-off fallback path automatically (network failure → `accept_verbatim`), not to a broken state.

---

## Open questions / What we're deliberately NOT doing

- **Not building the crisis-resource registry** — named as a separate, likely non-engineering-led piece of work in ADR 0008 and PDR 0010; this plan only builds the code path that will use it once it exists.
- **Not automating the eval set in CI** — run manually pre-merge for now; automating it is a real gap worth its own small follow-up, not silently absorbed into this plan's scope.
- **Not deciding the auth model beyond the existing anon-key prototype posture** — inherited as-is from `generate-blueprint`; revisiting it is out of scope here and already flagged as prototype-only by that function's own README.
- **Not turning the flag on for anyone** — the single most important non-goal in this document.

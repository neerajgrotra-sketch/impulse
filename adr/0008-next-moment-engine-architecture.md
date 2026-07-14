# ADR 0008 — A deterministic moment state machine wraps a probabilistic, safety-gated Next-Moment Engine

> **Status:** Superseded by `decisions/0013-runtime-reconciliation-and-concept-consolidation.md` — never reached Accepted; its contract (riskTier safety logic, deterministic fallback, eval requirements) is preserved intact inside Coach Engine, not discarded. See ADR 0013 Part 2 and its Migration Plan.
> **Date:** 2026-07
> **Deciders:** Neeraj Grotra (founder), pending Design Council review (`decisions/0010-next-moment-engine-design-council.md`)

## Context

`docs/identity-onboarding-choreography-v2.md` (Deliverable 1) redesigns identity capture as nine connected emotional moments, two of which — Interpretation and Clarification — are new: an AI step classifies the user's response and decides whether to accept it verbatim or generate one concise next prompt. This is the first place onboarding needs *adaptive* behavior driven by a real model call on real user-authored identity content, not curated static content (the thought library) or deterministic UI logic (keyboard/motion, PDR 0008/0009).

That is a materially different kind of surface than anything shipped in onboarding so far, and it collides directly with an **unresolved, load-bearing constraint already on record**: PDR 0006 rejected the original fixed eight-question interview specifically because no onboarding answer could reach the backend without per-turn Safety Engine screening, and states plainly — *"No onboarding answer may reach the backend, or advance the sequence, without having passed a real-time risk check first. This is a build-blocking condition, not an aspiration: onboarding may not ship to real users until it exists."* That condition is still open; nothing built since (PDR 0007, 0008, 0009) has touched the backend, because nothing since has needed to. This ADR is the first onboarding work that does, and so it is the first onboarding work that must actually resolve PDR 0006's gap rather than merely note it.

Separately, `docs/13 Prompt Architecture.md` and `docs/04 AI Brain.md` describe a Prompt Builder, an LLM gateway, and a nine-engine backend topology in detail — **none of which exists in code**. The only real backend today is one Supabase Edge Function (`prototype/backend/supabase/functions/generate-blueprint/index.ts`) calling the Anthropic SDK directly with a hand-built flat prompt, explicitly documented as prototype-only ("Demo Polish Mode," no auth beyond an anon key, `--no-verify-jwt`). This ADR cannot pretend the full architecture already exists; it has to decide what MVP subset gets built now versus deferred, and say so plainly rather than gold-plating a design document into a false sense of infrastructure.

ADR 0002 (LLM as tool, not brain) and ADR 0005 (Safety Engine pre-empts and gates launch) already fixed the shape this must take: the model classifies and drafts language; deterministic code owns every branch, especially the safety branch. This ADR is that thesis applied to one new surface, not a departure from it.

## Decision

**We build a deterministic `MomentState` machine that owns all UI rendering, wrapping a single new bounded module — the Next-Moment Engine — whose only job is to classify a user's response and propose one next moment. The Engine's classification call doubles as the first real implementation of PDR 0006's per-turn safety screening: a risk signal is produced by the model, and deterministic code, not the model, decides whether to hard-stop, exactly as ADR 0005 already specifies for the rest of the product. Until that safety-tier check is built and red-team-evaluated, the Engine ships behind a feature flag defaulting OFF for all real users.**

### 1. Deterministic UI state machine

A `MomentState` enum — `arrival | curiosity | inspiration | expression | recognition | interpreting | clarifying | ownership | commitment` — plus a small, closed transition table, owned entirely by `IdentityInspirationScreen` (or a extracted `useOnboardingMoment` hook if the screen component grows unwieldy). Transitions are triggered by user actions (tap, stop-recording, submit) and by exactly one AI-originated signal: the resolved `GeneratedMoment` from `interpreting`. **The AI never renders UI directly and never picks a component — it picks a value from a closed enum, and the state machine maps that value to one of a small, pre-built set of render templates.** This is the literal implementation of "keep deterministic UI state separate from probabilistic AI decisions."

**The `clarifying → interpreting` loop is bounded by a counter the state machine owns, not the prompt or the model** (Design Council finding, PDR 0010, conversational-UX lens): past a fixed cap (recommended: one round), the machine forces a transition to `ownership`/`commitment` regardless of what `GeneratedMoment.action` the Engine returns. A prompt instruction ("return one next moment only") is necessary but not sufficient — the guarantee that a user is never kept in an interrogation loop must live in code that runs whether or not the model behaves as instructed.

### 2. The Next-Moment Engine contract

Reused verbatim from the request, because it is already a well-formed structured-output contract consistent with `docs/13 Prompt Architecture.md` §3's mandate ("the model replies with a typed object, never free text parsed for control flow"):

```ts
type NextMomentAction =
  | "accept_verbatim"
  | "ask_clarifying_question"
  | "reflect_value"
  | "explore_motivation"
  | "explore_barrier"
  | "invite_specific_example"
  | "offer_optional_rewording"
  | "confirm_ownership"
  | "proceed_to_commitment";

interface GeneratedMoment {
  action: NextMomentAction;
  purpose:
    | "clarify_identity"
    | "surface_value"
    | "increase_specificity"
    | "explore_motivation"
    | "explore_barrier"
    | "build_self_efficacy"
    | "confirm_ownership";
  prompt: string;
  preserveOriginal: boolean;
  proposedRewrite?: string;
  confidence: number;
  safetyFlags: string[];
  rationaleCode: string;
}
```

One field is added beyond the request, for the reason in §4 below:

```ts
interface GeneratedMoment {
  // ...as above
  riskTier: "none" | "low" | "elevated" | "crisis"; // deterministic-mapped, see §4
}
```

`rationaleCode` and `riskTier`'s supporting evidence are logged (see §9) and never rendered to the user.

### 3. Prompt Builder — a real but deliberately small first implementation

There is no Prompt Builder in code today. We build the smallest real one that satisfies `docs/13 Prompt Architecture.md`'s non-negotiables — a single chokepoint, layered assembly, structured output, no raw model access from feature code — without pretending to deliver the full five-layer, cross-engine system the doc describes for the *mature* product:

- **Chokepoint:** one module, `services/nextMomentEngine.ts` (or equivalent backend module once this leaves the client — see Neutral consequences), is the only caller of the LLM gateway for this feature. No component ever imports an Anthropic SDK or holds a key, mirroring the existing (if informal) pattern already used by `generate-blueprint`.
- **Layers actually built now:** (1) a fixed Constitution/system layer — the request's own instruction text almost verbatim ("generate the smallest next moment... preserve autonomy... never diagnose, moralize, flatter, intensify, or tell the user who they are... use the user's own language... return one next moment only") plus the banned-word list; (2) the user's verbatim response, fenced as content, never instruction (Prompt Architecture §2's primary prompt-injection defense — directly relevant here since this is the first onboarding surface handling truly freeform user text through an LLM); (3) the immediately-preceding moment's context (what was asked, what action led here), so a clarification round isn't stateless.
- **Layers explicitly deferred:** pgvector Memory retrieval, cross-session Identity/Emotion engine context, prompt caching by layer. Onboarding has no session history yet to retrieve — deferring these is not a shortcut, it's that they don't apply to a first-conversation surface.
- **Structured output:** JSON-schema-constrained response matching `GeneratedMoment` exactly (the same `output_config.format: json_schema` mechanism `generate-blueprint` already uses against Anthropic's API — proven to work in this codebase, not a new integration risk).
- **Model tier:** `fast` (Haiku 4.5), per ADR 0006's tier table — this is triage/classification work ("classify the response, pick one of nine actions"), not the open-ended dialogue tier (`Sonnet 5`) or deep synthesis (`Opus 4.8`). This keeps latency low (relevant to Moment 6's near-invisibility goal) and keeps this squarely in the tier ADR 0006 already scoped for exactly this kind of call.

### 4. Safety-tier integration — resolves PDR 0006, does not route around it

The Engine's single Haiku call is required to also produce a `riskTier` alongside its content classification, using the same four-tier scale already specified for the rest of the product (`docs/15 Constitution.md` §3.1 — Tier 0 Normal / 1 Distress / 2 Risk / 3 Acute crisis — named here as `none/low/elevated/crisis` to match the request's schema). **Deterministic code, not the model, maps `riskTier` to action, biased toward false positives — the identical pattern ADR 0005 already established for the Coach Engine.**

**`riskTier` must never be treated as equivalent to a timeout, and this ADR's first draft got that wrong.** Constitution §3.2 mandates a *specific, non-optional* response per tier — Tier 1 shifts posture (acknowledge before anything else, drop advice-shaped moves); Tier 2 hard-stops normal handling and performs a warm hand-off; Tier 3 is immediate, unconditional hand-off to human crisis resources, and §3.3 is explicit that a hand-off is "not a dead-end error screen," must work offline, and must never use model-generated phone numbers — only a maintained, reviewed resource registry. **Silently falling back to `accept_verbatim` on a Tier 2/3 signal — proceeding through onboarding as if nothing had been detected — is not a lesser version of a warm hand-off; it is the one outcome Constitution §3.5 exists to prevent** ("a missed acute crisis is not recoverable"). Detecting a signal and then acting exactly as if nothing had been detected is arguably worse than not classifying at all, since it would let this feature be described as "safety-screened" while behaving, in the one case that matters, identically to a build with no screening.

The correct behavior, and what this ADR now requires:

- **Tier 0/1 (none/low):** normal Interpretation/Clarification flow proceeds; Tier 1 is logged but does not itself change onboarding UI (there is no advice-shaped Coaching Move happening here to withhold — Tier 1's mandated posture shift is a Coach Engine behavior this ADR doesn't yet touch).
- **Tier 2/3 (elevated/crisis): the adaptive loop hard-stops unconditionally** — no clarifying question, no rewrite offer, ever, regardless of confidence or classification. This much *is* buildable now, in code, today.
- **What this ADR cannot responsibly ship yet:** the actual warm hand-off content — a maintained, reviewed, region-aware crisis-resource registry (Constitution §3.3) — does not exist anywhere in this codebase, for onboarding or anything else. Fabricating hotline numbers or hand-off copy inside this ADR would itself violate §3.3's "never model-generated" rule one level up (an ADR is not the reviewed registry it demands). **This ADR does not invent that content. It names the registry as a separate, required, human-reviewed dependency, and makes it a hard gate: the feature flag (§8) may not default on for any real user until that registry exists and is wired to the Tier 2/3 path** — not merely until the eval set passes.

This is the ADR's central, non-negotiable decision, corrected from its first draft: **this feature is not exempt from PDR 0006's per-turn screening requirement, and does not need a separate project to satisfy the *classification* half of it** — the Haiku call and deterministic mapping are built here, now, to the same standard ADR 0005 already fixed. The *hand-off content* half is a genuinely separate, real dependency this ADR surfaces rather than papers over.

### 5. Confidence thresholds

- `offer_optional_rewording` only fires when `confidence` exceeds a defined threshold (recommended starting value: 0.75 on the model's own reported scale, tunable — this is exactly the kind of constant PDR 0009 already flagged as tuning, not commitment) **and** `preserveOriginal` is true **and** the rewrite doesn't add new meaning, intensify, or convert a temporary state into a fixed identity — these are prompt-level constraints on the model's own generation, checked post-hoc by a lightweight rule pass (does the rewrite contain content/nouns absent from the original beyond closed-class connective words — a cheap, deterministic guard, not a second model call).
- Below threshold, or for any classification the model itself reports lower confidence on, the Engine returns `ask_clarifying_question` or `accept_verbatim` — never a rewrite offered with low confidence.

### 6. Privacy boundaries

- **On-device vs. transmitted:** speech-to-text stays on-device (`expo-speech-recognition`, unchanged) — only the *resulting text* (already what the user sees and can edit) is sent to the Engine, never audio.
- **Transcript storage:** the Engine call is stateless per-request; it does not persist the user's text server-side beyond the lifetime of generating a response (no `onboarding_sessions` table exists, matching `generate-blueprint`'s existing "no DB writes" posture).
- **When identity content persists:** unchanged from PDR 0007/0008 — voice- or type-derived text lives in component state only, submitted to the backend for real persistence only on explicit `Continue` at Commitment. The Interpretation/Clarification loop reads and writes only that same in-memory `visionText`.
- **Cancellation:** unconfirmed capture (Cancel during recording, Clear at any point) discards everything client-side; nothing sent to the Engine survives a Clear.
- **Partial transcripts:** never sent to the Engine — only the finalized, user-reviewed text at Recognition triggers Moment 6.

### 7. Error and timeout fallback

- **Latency budget:** target p95 ≤ 1.5s for the Engine call (Haiku-tier, small prompt, justifies the choice in §3). Under budget, Moment 6 is designed to be imperceptible (choreography §6). Past budget, a soft, non-blocking `processing` shimmer may resume; Commitment (Continue) is never gated on this call completing.
- **Hard fallback for ordinary failure** (timeout, malformed structured output, gateway error): resolves deterministically to `GeneratedMoment { action: "accept_verbatim", ... }` synthesized in code, never a second model call, never a blocked UI.
- **`elevated`/`crisis` is not this fallback** — see §4. It hard-stops the adaptive loop specifically, distinctly from an ordinary failure, and (once the resource registry in §4 exists) surfaces the mandated hand-off rather than proceeding silently.
- **Retry policy:** at most one retry on schema-validation failure (mirrors `generate-blueprint`'s existing one-retry-then-fail-closed pattern), then fallback — no unbounded retry loop.

### 8. Feature flag strategy

- **Flag name (recommended):** `onboarding_next_moment_engine`.
- **Default:** **OFF** for all real users, everywhere, until: (a) the safety-tier mapping in §4 has passed a red-team eval set (see §9) with zero missed-escalation cases, (b) the Tier 2/3 resource registry in §4 exists and is wired in — not merely stubbed — and (c) the Design Council review (Deliverable 3) records a `GO`/`GO WITH CONDITIONS` that these conditions satisfy.
- **When on:** internal/staff builds first, then a small consented cohort, matching `docs/10 Engineering Principles.md` §6's staged-rollout requirement for any coaching-adjacent prompt change.
- **When off:** `MomentState` never enters `interpreting`/`clarifying` — Moment 6 always resolves instantly and deterministically to `accept_verbatim`, meaning the entire choreography still works end-to-end with the flag off, just without the adaptive loop. This is why the state machine (§1) is designed to treat the Engine's absence as a valid, first-class input, not a degraded mode bolted on afterward.

### 9. Evaluation strategy

No eval harness exists in this codebase today — this is the first one, deliberately minimal:

- A small golden set (recommended starting size: 20–30 cases) covering: clearly-complete identity statements (expect `accept_verbatim`), the request's own worked ambiguous examples ("I wanna be perfect," "I need discipline," "I want to exercise more," "I want to be more present with my children"), and a red-team subset of distress/risk/crisis-signaling phrasings (expect `riskTier` ≥ `elevated` and a hard-stop, zero tolerance for a miss).
- CI gate: any change to the Engine's prompt or schema must re-run this set before merge, per `docs/13 Prompt Architecture.md` §6's general principle, scoped down to what this feature actually needs rather than the full described harness.
- This is explicitly a starting point, not the mature eval system `docs/13 Prompt Architecture.md` envisions — named as a gap to grow, not a corner cut silently.

### 10. Logging policy

Per call: `action`, `purpose`, `confidence`, `riskTier`, `rationaleCode`, latency (ms), whether the deterministic fallback fired and why (timeout / schema failure / risk tier / flag off), and a `prompt_version` stamp. **Never logged:** the user's actual response text or the generated `prompt`/`proposedRewrite` content in plaintext long-term storage — only in short-lived, access-controlled request tracing if needed for active debugging, consistent with `docs/12 Backend Architecture.md` §6's "privacy-scrubbed before it ever hits logs" rule.

### 11. Local heuristic vs. LLM responsibilities

Local (deterministic, code-only) handles: blank/whitespace-only detection, a profanity/obvious-safety-trigger word-list routing check (a cheap pre-filter, not a substitute for §4's model-based risk classification), duplicate-response detection, text formatting/trimming, the existing curated thought-library normalization (`deriveIdentityStatement`, unchanged, still scoped only to thought-tap input), and every fallback path in §7. **The LLM is the only thing that ever classifies meaning, drafts a clarifying question, or proposes a rewrite** — no local heuristic may generate psychologically meaningful text, per the request's explicit instruction and consistent with ADR 0002's line.

## Consequences

**Positive**

- This finally resolves the *classification* half of PDR 0006's outstanding launch-blocking condition — not by building a separate Safety Engine project first, but by making the first real onboarding-adjacent model call satisfy it as a structural requirement of its own design.
- The state-machine/Engine split makes the AI a swappable, testable component behind a closed enum — a bad or timed-out model response degrades gracefully by construction, not by exception handling bolted on after the fact.
- Reuses proven patterns already in this codebase (`generate-blueprint`'s JSON-schema structured output, ADR 0005's classify-then-code-decides shape) rather than inventing new integration risk.

**Negative**

- This is genuinely new backend surface — today's client-only prototype gains its first stateful-adjacent server dependency in the onboarding path, with a new latency budget and a new failure mode class (AI timeout) that didn't exist in Phase 1's purely local, deterministic UI.
- The safety-tier mapping in §4, while modeled on ADR 0005, is a new implementation of it, not a reuse of existing code (no Safety Engine code exists yet anywhere) — it must be built and red-team-evaluated with real rigor, not treated as a checkbox because "ADR 0005 already decided this."
- **The Tier 2/3 hand-off's actual content — a maintained, reviewed, region-aware crisis-resource registry — does not exist and is not created by this ADR.** This is a genuinely separate, likely non-trivial dependency (sourcing, reviewing, and maintaining real crisis-resource content is not an engineering task alone) that now gates this feature's real-user launch as hard as the eval set does.
- A flag defaulting OFF means this feature ships to nobody at first — the founder should expect a real gap between "code complete" and "any user sees this," and that gap is now wider than a first read of this ADR might suggest, because of the registry dependency above.

**Neutral**

- This ADR deliberately does not resolve where this code physically lives (a new Supabase Edge Function alongside `generate-blueprint`, vs. client-side call to a thin new endpoint) — that's an implementation-plan-level detail (Deliverable 4), not an architecture decision, since either placement satisfies "no raw model access from feature code" as long as the client never holds a key.
- The full `docs/13 Prompt Architecture.md` five-layer system, the nine-engine topology, and the mature eval harness remain entirely aspirational beyond what §3/§9 build now — this ADR is a bounded step toward that design, not a claim that it now exists.

## Alternatives considered

- **Build the full Prompt Builder / nine-engine architecture first, then this feature.** Rejected: massively out of scope for one onboarding moment, and `docs/09 Roadmap.md`'s own sequencing logic argues against building infrastructure ahead of a proven need — this feature is the proven need; build the smallest real thing that satisfies it.
- **Treat the Next-Moment Engine as blocked entirely until a separate Safety Engine project ships.** Rejected: this would leave PDR 0006's gap open indefinitely with no forcing function; folding a genuine safety-tier check into this Engine's own required classification call is a more honest and more likely-to-actually-happen resolution than waiting on unscoped future work.
- **Let the model decide the safety action directly (skip the deterministic mapping).** Rejected outright — this is precisely what ADR 0002 and ADR 0005 already forbid, for the same reasons: an unaccountable, untestable safety decision is not a decision this product is allowed to delegate to a model.
- **Ship with the flag defaulting on for a small cohort immediately.** Rejected: no red-team eval set exists yet to justify that the safety-tier mapping actually works; "we built it to the right pattern" is not the same claim as "we tested it," and only the latter justifies any real user exposure.

## Links

- `docs/identity-onboarding-choreography-v2.md` — Deliverable 1, the experience this architecture serves
- `decisions/0010-next-moment-engine-design-council.md` — Deliverable 3, the review this ADR must pass
- `decisions/0006-onboarding-rejects-fixed-interview-requires-safety-gate.md` — the launch-blocking condition this ADR resolves
- `decisions/0007-identity-thought-stream-scope-expansion.md`, `0008-identity-capture-keyboard-ux-rework.md`, `0009-identity-onboarding-premium-redesign.md` — prior passes on this screen
- ADR 0002 (LLM as tool, not brain), ADR 0005 (Safety Engine pre-empts and gates launch), ADR 0006 (tiered Claude models, gateway)
- `docs/13 Prompt Architecture.md`, `docs/04 AI Brain.md`, `docs/12 Backend Architecture.md` — the target architecture this ADR builds a bounded first step toward
- `docs/15 Constitution.md` §3 — the four-tier risk model this ADR's `riskTier` field maps onto
- `prototype/backend/supabase/functions/generate-blueprint/index.ts` — the existing structured-output/JSON-schema pattern this reuses

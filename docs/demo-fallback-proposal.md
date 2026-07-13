# Demo Fallback — Proposal (Not Implemented)

> **Status:** Proposed — 2026-07. **Not built.** This document exists because Milestone 3's mission required designing this option without adding it to the app. Nothing in `prototype/expo/` reads, imports, or is gated by anything described here. **Requires explicit approval before any of it is implemented** — see §5.

## 0 · Why this exists

The live backend (`prototype/backend/`'s `generate-blueprint` function) is the only path today. That's correct for Milestones 1–3 and should stay correct as the default. But a live investor demo has failure modes outside this app's control — venue Wi-Fi blocking the tunnel, a Supabase or Anthropic outage, a misconfigured `.env` on the demo device discovered at the worst possible moment. `ErrorRetryScreen` (Milestone 3) handles this honestly today: a calm message and a retry that reuses the transcript. This proposal asks a narrower question: is there a safe way to *also* have something to show if a retry genuinely can't succeed in the room, in the next 60 seconds, in front of an investor?

## 1 · The central risk this proposal has to resolve, not paper over

A naive "fallback" — show *some* plausible-looking Blueprint if the API fails — is close to the exact failure mode `docs/investor-prototype.md` spends its entire §0 and §8 warning about: a Blueprint whose claims don't trace to what the person actually said is indistinguishable from the "cold-reading" that breaks the demo's magic, and worse, it would violate the backend's own "reflect, don't invent" contract (every claim must trace to a verbatim quote) in the one moment it's most visible. **A fallback that shows fabricated or mismatched content is not an acceptable design, full stop, regardless of how it's implemented.**

The only version of this proposal that doesn't cross that line: the fallback response must be a **real, previously-generated Blueprint output, captured from an earlier successful live call against the exact same rehearsed transcript**, shown only when the *same* rehearsed script is being re-run and the live call fails. It is a cached instance of a real answer to a fixed question, not a improvised or ad-hoc substitute for whatever the current live conversation happens to be — it only works, and is only proposed to work, when the demo is a known, rehearsed run (matching the "Maya" worked-example pattern in `docs/investor-prototype.md` §5), never as a stand-in for an unscripted live conversation with a real prospective user.

## 2 · What would happen during API or network failure (if this shipped)

1. Live call fires exactly as it does today (`services/blueprintApi.ts`, unchanged).
2. On failure, instead of *always* routing to `ErrorRetryScreen`, the app would check a single explicit condition (§4): is a cached fallback response available for this exact transcript, and is fallback mode explicitly armed for this build?
3. If both are true: show the cached Blueprint, with a brief natural pause (matching the real screen's pacing, not an instant swap that would read as suspicious) — the person running the demo would know it happened (see §3); the audience would not need to.
4. If either is false (the normal case, and the only case in a non-demo build): fall through to today's `ErrorRetryScreen` exactly as built in Milestone 3. This is a strict superset, not a replacement — nothing about today's failure path changes if the fallback isn't armed.

## 3 · How it stays clearly identified internally as demo-only

- Lives entirely in a new, separate module — proposed `services/demoFallback.ts` — never imported by `blueprintApi.ts`, `ThinkingScreen.tsx`, or any file that exists today. The only integration point would be one conditional check inside `ThinkingScreen`'s existing failure branch.
- Gated behind an explicit, non-default environment variable — proposed `EXPO_PUBLIC_DEMO_FALLBACK_ENABLED` — read once, logged loudly (`console.warn` at app boot: *"DEMO FALLBACK IS ARMED — this build can show cached content on API failure"*) whenever it's `true`, so it is never silently active. Absent (the default, and the only state for any build not built specifically for this purpose) means the code path is provably unreachable.
- The cached response itself would live as a checked-in fixture keyed by a hash of its exact source transcript, not a generic "demo blueprint" — so it can only ever match the one rehearsed script it was captured from, and a mismatched transcript (a real, different conversation) would simply fail to find a fixture and fall through to §2 step 4.
- File and variable naming both say "demo fallback," not "cache" or "offline mode" — deliberately unambiguous naming so nobody mistakes this for a general resilience feature later.

## 4 · How it would avoid contaminating production behavior

- `EXPO_PUBLIC_DEMO_FALLBACK_ENABLED` would never be set in `.env.example`, never documented as a normal setup step in `docs/expo-first-run.md`, and never part of the `development`/`preview`/`production` EAS profiles in `eas.json` — it would exist only as a manually-exported variable for one specific build, documented as a one-time, revoked-after-use step.
- The fixture file (the cached response) ships inside the app bundle either way once built in, which is itself a real cost worth naming: even gated, its *presence* in the repo is a small, permanent surface area. The proposal as scoped keeps that surface to one JSON fixture and one ~20-line service file — reviewable in a single sitting, deletable in one PR.
- Because the check is additive (§2 step 4 preserves today's exact failure path when unarmed), shipping this could not silently change behavior for any build that doesn't explicitly opt in — there's no shared code path where a bug in the fallback logic could affect the live-call-fails-and-retries behavior everyone else sees.

## 5 · Approval required before implementation

Two separate approvals, because this touches two different things:

1. **Explicit, per-use sign-off from whoever is running the demo** — this is demo-operations tooling, scoped to a single rehearsed run, not a shipped product feature; it doesn't need the full feature lifecycle, but it does need a specific human decision each time it's armed (not a standing default anyone can quietly leave on).
2. **If this pattern is ever proposed for anything beyond a single rehearsed demo** — a persistent fallback, a different transcript, reuse in a later milestone, showing it to anyone who isn't the founder in a controlled room — that crosses into Sensitive-tier territory per this repo's own tiering model (it touches coaching output and the Constitution's "reflect, don't invent" principle) and would need a proper PDR and Design Council review, not just this document, before being built.

## Open questions / what this proposal deliberately doesn't resolve

- Whether "the exact same rehearsed transcript" should be matched by exact string equality or something more forgiving (a founder who paraphrases slightly during a live retell would miss the cache) — unresolved, and arguably fine to leave unresolved, since a miss just falls through to the honest retry screen.
- Whether the fixture should be captured manually (run the real flow once, save the response) or scripted — a manual capture is simpler and was assumed above, but isn't decided here.
- This document does not propose *anything* for the case where a Development Build's provisioning profile expires or a device can't connect at all — those are `docs/expo-first-run.md`'s troubleshooting territory, not a network-response fallback.

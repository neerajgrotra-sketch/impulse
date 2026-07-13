---
name: ios-review
description: Use when reviewing a SwiftUI/client change to verify offline-first behavior and graceful degradation, MVVM + Coordinator structure, no logic in views, sync correctness, and correct handling of Impulse Moment surfaces.
---

## Purpose

The moment of temptation often has no signal, so the iOS client is **offline-first** by architecture, not aspiration (Canon §6). It uses MVVM + a lightweight Coordinator, a local SwiftData store, and a thin idempotent sync API. A client change can silently break this: put a network call on the path that surfaces an **Impulse Moment**, bury business logic in a view, or lose data on a sync conflict. This skill reviews the client surface so the app still works — and degrades gracefully — in the exact moment it matters most.

Enforces [`.rules/ios.md`](../../../.rules/ios.md) and [`.rules/swift.md`](../../../.rules/swift.md). Accessibility is checked here only at the surface level; depth defers to the accessibility (a11y) rule/review.

## When to use

**Tier: Standard and Sensitive.** Run on any change to a SwiftUI view, view model, coordinator/navigation, local store schema, or sync logic. A Sensitive change (anything touching coaching, safety, memory, privacy, notifications, identity, or the model as surfaced on the client — CONVENTIONS §2) also requires the full lifecycle and Design Council; this skill covers client engineering only. Trivial copy/asset changes need the PR checklist, not this skill.

## Inputs

- The diff or PR with full paths of changed views, view models, coordinators, models, and sync code.
- Which screens/surfaces are affected, and whether any is on an **Impulse Moment**, **Coaching Session**, or **Recovery** surface.
- The offline behavior expected for each affected surface (what must work with no signal, and what degrades).
- The local store (SwiftData) model changes and the sync API contract touched.
- Any Coach-authored text rendered, for the shaming/banned-word check (Canon §2).

## Outputs

- A pass/block verdict per checklist item, each citing the rule in `.rules/ios.md` / `.rules/swift.md` and the file/line.
- A flag for any Impulse Moment or Coaching surface whose primary action requires connectivity, with the required offline fallback.
- A list of business logic found in views (to move into a view model) and any networking or persistence performed directly by a view.
- A note on sync-conflict handling and any data-loss risk, plus surface-level accessibility gaps to route to a11y review.

## Checklist

- [ ] **Offline-first:** every affected surface's primary action works with no network — capturing an Impulse Moment, opening a Coaching Session, and logging an Outcome/Recovery persist locally first and sync later (Canon §6). No primary path is gated on a live request.
- [ ] **Graceful degradation:** when a feature genuinely needs the network (e.g. a fresh Sonnet 5 coaching turn), the UI degrades to a clear, non-blaming offline state and queues the intent — it never dead-ends, spins forever, or loses the user's input.
- [ ] **MVVM discipline:** views are declarative and render state from a view model; view models own presentation state and call services. Navigation flows through the Coordinator, not ad-hoc `NavigationLink` decisions embedded in leaf views (Canon §6).
- [ ] **No logic in views:** no business rules, no branching decisions, no networking, no persistence, and no direct store access inside a `View` body or `View` type — logic lives in the view model or a service (`.rules/ios.md`, `.rules/swift.md`).
- [ ] **Sync correctness:** local writes are the source of truth until confirmed; the sync client is idempotent (safe to retry) and matches the backend's idempotency contract; conflict resolution is explicit and defined so no user input is silently dropped.
- [ ] **Local store integrity:** SwiftData model changes are additive/migration-safe for existing local data; a schema change does not orphan or wipe queued-but-unsynced Decisions, Outcomes, or Messages.
- [ ] **Impulse Moment surfaces:** the moment surface is fast, self-evident, and low-friction ("don't make me think" in the moment of temptation); it opens without a blocking network call and preserves partial input across app suspension.
- [ ] **Swift concurrency & safety:** UI state mutation is on the main actor; async work uses structured concurrency without blocking the main thread; no force-unwrap (`!`) or force-`try` on a path that can fail at runtime (`.rules/swift.md`).
- [ ] **No shaming in surfaced text:** any Coach/system copy rendered avoids the banned words (*fail, failure, cheat, streak-broken, bad, weak, should have, guilt* — Canon §2) and frames a Lapse as expected, not a verdict.
- [ ] **No secrets / no sensitive data on device beyond need:** no API secret embedded in the app; `alignment_score` is never rendered as a number or grade (Canon §5); sensitive local data is stored per the privacy rules.
- [ ] **Accessibility (surface nod):** interactive elements have labels, Dynamic Type is not broken, and contrast/hit-target regressions are flagged for the dedicated a11y review — this skill does not sign off a11y depth.

## Success criteria

- Every affected Impulse Moment, Coaching Session, and Recovery surface completes its primary action with the network disabled — verifiable by exercising the flow in airplane mode.
- No `View` type contains business logic, networking, or direct persistence — verifiable by inspection/grep of changed view files.
- Navigation changes go through the Coordinator; view models are the only owners of presentation state.
- Sync is idempotent and conflict handling is explicit; no queued unsynced data is lost across a local schema change.
- No banned/shaming word appears in surfaced Coach copy, and `alignment_score` is never shown as a number or grade.

## Failure criteria

- A primary action on an Impulse Moment or Coaching surface requires connectivity or dead-ends when offline.
- Business logic, networking, or direct store access lives inside a view.
- Navigation is decided inside leaf views instead of the Coordinator.
- A sync retry duplicates data, or a conflict/local migration silently drops the user's queued input.
- A force-unwrap or main-thread block sits on a runtime-failable or user-facing path.
- Surfaced copy contains a banned word, or `alignment_score` is displayed as a number/grade.

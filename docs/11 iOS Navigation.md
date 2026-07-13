# 11 · iOS Navigation — Client Structure, Screens & Offline-First

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Define how the iOS app is *shaped* — its screens, its navigation, its offline behavior, and how views connect to the AI Brain — so the client stays calm and focused as the product grows. This document owns client structure, screens, navigation, and offline-first. It defers to `06 Decision Engine.md` for the decision-coaching flow, `07 Coaching Engine.md` for dialogue and tone, and `08 Database Architecture.md` for the sync model.

This is an architecture document, not an implementation. It describes the *why* of the client's shape. It contains no Swift.

---

## 1. What the client is for

The client has one job the backend cannot do: **be present at the Impulse Moment.** The AI Brain is where reasoning lives; the phone is where temptation lives. Everything below follows from that.

Two consequences drive every decision in this document:

1. **The moment often has no signal.** People decide in parking lots, late at night, mid-argument, in checkout lines, on the subway. If the app requires a network round-trip to be useful, it fails exactly when it matters. So the client is **offline-first** (canon §6), not offline-tolerant.
2. **The moment is emotionally loaded.** The user reaches for us while Present Self is under pressure. A cluttered or chatty interface adds cognitive load precisely when the user has the least to spare. So the client is **calm and structured**, not busy or conversational-by-default.

We are building for the Present Self who is holding the phone, on behalf of the Future Self who is not in the room (canon §3, principles 1 and 2).

---

## 2. Offline-first — rationale and shape

**Why offline-first is architecture, not a feature.** The Impulse Moment is the atomic event of the product (canon §2). If capture depends on connectivity, we lose the highest-value events — the impulsive ones, in the worst locations. Offline-first is how we honor principle 5 ("progress over perfection"): the user must always be able to *act*, and we sync when we can.

**The app must do three things with no signal:**

- **Capture** the Impulse Moment locally, immediately, losing nothing.
- **Coach in a degraded, deterministic mode** — enough structure to help the user think, without the LLM.
- **Sync later**, idempotently, when connectivity returns, then upgrade the local coaching with what the Brain adds.

**Local-first, server-authoritative.** SwiftData is the local store (canon §6; GRDB is the documented fallback if we hit limits). The client writes locally first and treats the write as durable. The backend remains the system of record (`08 Database Architecture.md`); the client holds a working copy plus a queue of unsynced mutations. This maps cleanly onto the canonical aggregates in canon §5 — `Decision`, `Outcome`, `Reflection`, `CoachingSession`, `Message` — each of which can be created offline.

**Degraded coaching mode — deterministic, honest, on-device.** When offline, the Coach Engine (`07 Coaching Engine.md`) is unreachable, so we do not fake dialogue. Instead the client runs a *deterministic decision structuring* pass that needs no model: it presents the Decision Engine's core scaffolding (`06 Decision Engine.md`) — name the impulse, surface the obvious tradeoff, apply a time-horizon reframe ("how will Future Self feel about this tonight?"), and offer a pause. This is a subset of the Decision frame (canon §4) that we can render from local identity data and fixed templates. It is genuinely useful and never pretends to be the full Coach.

**Sync model (aligned with `08`).** Mutations are queued as an ordered, idempotent log. Each carries a client-generated id (so re-sends are safe) and a logical timestamp. On reconnect the client flushes the queue; the server applies with last-writer-wins for scalar fields and append semantics for `messages[]` / `moves[]`. Because `Decision.status` moves `open → resolved` and `Outcome.kind` is written once, conflicts are rare by design. See `08 Database Architecture.md` for the authoritative conflict rules; this document only guarantees the client *never blocks the user on the network.*

**The upgrade path.** A Decision captured offline is a first-class record. When it syncs, the Brain enriches it — real `alignment_score`, `bias_flags[]`, an `emotion_signal_id`, and (if the user re-engages) a full Coaching Session. The UI shows this as the coaching *deepening*, never as "your offline attempt was incomplete." Degraded-mode help is a real coaching act, not a placeholder.

```
   ┌── Impulse Moment (no signal) ──────────────────────────────┐
   │  tap capture → write Decision locally (status: open)       │
   │             → deterministic structuring (no LLM)           │
   │             → user acts; write Outcome locally             │
   └──────────────────────┬─────────────────────────────────────┘
                          │ enqueue idempotent mutations
                          ▼
   ┌── Reconnect ───────────────────────────────────────────────┐
   │  flush queue → server applies (idempotent) → Brain enriches │
   │             → Decision gains alignment/bias/emotion/session │
   │             → local copy updated; UI "deepens" quietly      │
   └────────────────────────────────────────────────────────────┘
```

---

## 3. Navigation model — less, but better

**The thesis: three tabs and one always-available action.** Three calm home surfaces — **Today**, **Reflect**, **Self** — plus one prominent, persistent capture action: **"I'm having an impulse."** That action is the fast path to the Decision Engine and is reachable from anywhere in the app.

**Why so few surfaces.** Steve Krug's first law is *Don't Make Me Think*: every question the interface forces ("which tab is this under?") is a tax, and at the Impulse Moment the user is already overtaxed. Dieter Rams' *less, but better* (canon §10) says the same from the design side: we earn calm by removing, not adding. A decision coach whose home screen looks like a dashboard has already lost the plot — it optimizes for browsing when the user came to *decide*. Our anti-metrics (canon §7: no worshipping daily active minutes or session count) forbid the engagement-bait surfaces that would otherwise multiply tabs.

**Why the capture action is not a tab.** The most important thing the user ever does with us — bring an Impulse Moment — must be faster than choosing a tab. A tab is a *destination you navigate to*; the impulse action is a *thing you invoke*. It lives as a persistent, high-contrast control (a center action, and mirrored to the moment surfaces in §7), so the path from "I feel the pull" to "I'm being coached" is one deliberate tap. This is understand-before-advise made physical: we get the user into structure before Present Self talks them out of it.

### Screen map / navigation graph

```
                         ┌─────────────────────────────┐
                         │        Root (TabView)        │
                         └───┬──────────┬──────────┬────┘
                             │          │          │
                  ┌──────────▼──┐  ┌────▼─────┐  ┌─▼─────────┐
                  │   TODAY     │  │ REFLECT  │  │   SELF    │
                  │ coach +     │  │ look-back│  │ identity +│
                  │ present     │  │ → Learn  │  │ insights  │
                  │ state       │  │          │  │           │
                  └──────┬──────┘  └────┬─────┘  └────┬──────┘
                         │              │             │
        Today detail ◄───┘              │             ├─► Identity Statements (edit)
        (open Decisions,                │             ├─► Values / Future Self narrative
         today's nudge)                 │             ├─► Insights (each w/ evidence)
                                        │             └─► Covenant / privacy controls
                    Daily / Weekly ◄────┘
                    Reflection flow
                    (feeds Learning Engine)

   ╔══════════════════════════════════════════════════════════════╗
   ║   "I'M HAVING AN IMPULSE"  — persistent, from anywhere         ║
   ╚══════════════════════════════┬═══════════════════════════════╝
                                  ▼
                 ┌────────────────────────────────────┐
                 │        IMPULSE CAPTURE FLOW         │
                 │  (modal, presented over any tab)    │
                 │  1. Name it        (one field)      │
                 │  2. Structure      (Decision Engine)│
                 │  3. Coach / degraded-mode           │
                 │  4. Choose + Outcome                │
                 └────────────────┬───────────────────┘
                                  ▼
                        Coaching Session ──► resolves Decision
                                              (→ Reflect later)
```

The graph is intentionally shallow. No surface is more than two taps deep from its tab root, and the capture flow is one tap from everywhere.

---

## 4. What each primary surface is for

**Today — the coach and the present state.** Today answers "what is true for me right now, and where is my coach?" It shows any open Decisions, the day's single permissioned Nudge (if the Notification Engine chose to speak — see `14 Notification Engine.md`), a light read on present state, and one gentle forward cue. It is not a metrics dashboard: we never render the `alignment_score` as a number or grade (canon §5). Today's restraint is a promise — the home screen models the calm we're coaching toward.

**The Impulse capture flow — fast, low-friction.** This is the product's beating heart and is specified in `06 Decision Engine.md`; here we own only its *shape*. It opens as a modal over whatever the user was doing, so capture never costs context. First screen is a single field — name the impulse — because the highest-value act is getting the moment recorded before it passes. From there it hands to the Decision Engine to structure the choice (options, tradeoffs, bias flags, time-horizon reframe) and to the Coach Engine for dialogue (`07`). Offline, it runs degraded deterministic mode (§2). It ends by capturing the chosen option and, when the user is ready, the `Outcome` — including a `recovery` after a `lapse`, the moment we weight heaviest (canon §2, §7).

**Reflect — the structured look-back that feeds Learning.** Reflect hosts the daily and weekly `Reflection` (canon §5). Its job is not journaling for its own sake; it is the input surface for the Learning Engine, which turns outcomes and reflections into Insights and updated priors (canon §4). Weekly reflection is where Opus-class synthesis lands (canon §6) — latency-tolerant, deeper. Reflect is deliberately quiet and cadenced; it should feel like an appointment with yourself, not a feed.

**Self — Identity and Insights, editable.** Self is the user's model of themselves, made visible and *editable*: Identity Statements, values, the Future Self narrative (the root aggregate, canon §5), and the Insights the Learning Engine has surfaced. Editability is a principle, not a convenience — "coach, never parent" (canon §3) means the user owns their identity model and can correct it. Every Insight shown here carries its `evidence_refs` (canon §8, explainability); we never assert a pattern we can't show. Self is also where the Covenant and privacy controls live (canon §7, principle 7: "earn the right to hold this data").

---

## 5. Why not a chat-first UI

The obvious build for an "AI coach" in 2026 is a single chat screen with a blinking cursor. We reject it as the *primary* surface, deliberately.

- **A blank prompt invites venting, not deciding.** A cursor says "type anything." At the Impulse Moment, "anything" is usually rumination or rationalization — the Present Self building a case. Structure interrupts that. Leading with "name the impulse → see the tradeoff → reframe the horizon" is itself a coaching intervention; a text box is not.
- **Chat-first inverts our principles.** "Understand before advising" (canon §3) requires the Coach to have identity, decision, and emotion context before it speaks — enforced in code (canon §8). A chat UI pressures the model to respond to whatever was typed, immediately, from a cold start. Our navigation instead routes the user through structure that *gathers* that context first.
- **Dialogue serves structure, not the reverse.** We do use conversation — the Coaching Session is real dialogue (`07`). But it is entered *from* a structured Impulse Moment, anchored to a `Decision`, with a chosen Coaching Move behind each turn (canon §2). The conversation is a tool the structure wields, not the front door. Less, but better: one calm, framed entry beats an open-ended one.

We are not anti-conversation. We are anti–*blank* conversation as the default posture of a decision coach.

---

## 6. Architecture — MVVM + lightweight Coordinator

Canon §6 fixes the pattern: **MVVM with lightweight Coordinator navigation.** The rationale:

- **MVVM** keeps SwiftUI views dumb and declarative. A View renders a ViewModel's state and forwards intents; it holds no navigation logic and no networking. This is what makes offline-first tractable — the ViewModel reads from the local store and never blocks on the network, so the View is identical online and offline.
- **Coordinators own navigation**, not views. SwiftUI's tab and navigation state, plus the modal presentation of the capture flow, are driven by coordinator objects. Keeping routing out of views is what lets "I'm having an impulse" be invokable from *anywhere* — the coordinator presents the flow regardless of the current tab, and views don't need to know about each other.

```
   View  ──intents──►  ViewModel  ──►  Repository (local-first)
    ▲                     │                 │
    │  observes state     │                 ├── SwiftData (source of truth on-device)
    └─────────────────────┘                 └── Sync queue ──► Sync API ──► Backend
                                                                              │
   Coordinator ── owns routing, presents capture flow, tab & modal state      │
                                                                              ▼
   Repository ↔ API ↔ AI Brain engines (Decision, Coach, Identity, Learning,
                       Emotion, Memory, Notification) — canon §4
```

**State and sync.** The Repository layer is the single seam between ViewModels and persistence. ViewModels observe local state; the Repository owns the local store *and* the sync queue (§2). Views never call the network directly and never see connectivity as a special case — they render whatever the local model says, and the model gets richer when sync completes.

**How views map to engines via the API.** Views never talk to engines; they talk to their ViewModel, which talks to the Repository, which talks to the sync/API layer, which reaches the AI Brain. The mapping:

| Surface | Primary engine(s) via API | Canonical aggregate |
|---|---|---|
| Impulse capture flow | Decision Engine → Coach Engine (+ Emotion, Memory) | `Decision`, `CoachingSession`, `Message` |
| Today | Notification Engine (the day's Nudge), Coach Engine | `Nudge`, open `Decision`s |
| Reflect | Learning Engine (async, Opus-class weekly) | `Reflection`, `Outcome` |
| Self | Identity Engine, Learning Engine (Insights) | `Identity`, `Insight` |

The **Coach Engine is the only orchestrator** (canon §4); the client never composes engines itself. It sends a well-formed request for a surface and receives the orchestrated result. This keeps policy and safety on the backend where canon §8 requires them — the Safety Engine can hard-stop a turn and the client simply renders the mandated response.

---

## 7. The "moment" surfaces — reaching the point of temptation

The app icon is not the only front door. The Impulse Moment happens before the user thinks to open an app, so we place calm entry points where the temptation is. Each is a fast path into the same capture flow (§3), and each respects consent as a gate (canon §8).

- **Widgets.** A Home/Lock Screen widget offering one-tap "I'm having an impulse" and, when permitted, the day's single Nudge or a Future Self reminder. It reads from the local store, so it renders offline.
- **App Shortcuts & Siri.** "Hey Siri, I'm having an impulse" opens capture hands-free — vital when the phone can't be looked at (driving, walking away from a temptation). App Intents expose capture and quick-reflect to Shortcuts.
- **Live Activities.** During an active Impulse Moment or a committed pause ("wait 10 minutes"), a Live Activity keeps the coaching present on the Lock Screen without demanding the user re-enter the app — supporting the *pause* the Decision Engine offers.
- **Control Center / Lock Screen controls.** A Control Center control and Lock Screen control button make capture reachable in the two seconds before an impulse acts. The whole point of §2's offline-first is realized here: these must work with no signal.

**Haptics and motion — restrained by design.** These surfaces use haptics sparingly and deliberately: a soft confirmation when a moment is captured, never a reward-style buzz (that would drift toward the anxiety-engagement our anti-metrics forbid, canon §7). Motion is calm and functional — transitions that orient, never celebrate. A decision coach that flashes and buzzes is coaching the wrong nervous system. Restraint here is the same principle as three tabs: less, but better.

---

## 8. Accessibility — the baseline, non-negotiable

Accessibility is not a late pass; it is a definition of "done." A premium product is one that is *premium for everyone*, and our users reach for us in exactly the low-capacity states — stressed, tired, one-handed, in bright sun — where accessibility and good design converge.

- **Dynamic Type** at every size, including the accessibility sizes. Our calm, sparse layouts have the room to reflow; a dashboard would not. This is a design dividend of §3.
- **VoiceOver** across every surface and the capture flow, with meaningful labels and a logical order. Deciding under pressure must not require sight of a small screen — this also reinforces the Siri path in §7.
- **Reduced Motion** honored fully; because our motion is already restrained (§7), the reduced-motion path is a small, natural degradation, not a separate build.
- **Contrast, tap-target size, and one-handed reach** — the capture action must be operable with a thumb, under stress, on a large phone.

Why non-negotiable: principle 7 is "earn the right to hold this data" (canon §3). Trust is the product (canon §7 guardrails). An app that excludes people fails the Covenant (`15 Constitution.md`) before it writes a single line of coaching. Accessibility is how "premium" and "for everyone" stop being in tension.

---

## Open questions / What we're deliberately NOT doing

**Open questions**

- **Degraded-mode boundaries.** How much deterministic structuring is genuinely helpful offline before it feels thin? Needs testing with real offline Impulse Moments; coordinate scope with `06 Decision Engine.md`.
- **Sync conflict edges.** The append-vs-scalar model (§2) assumes conflicts are rare. We need `08 Database Architecture.md` to confirm the authoritative rules for a `Decision` edited on two devices offline.
- **Widget/Live Activity refresh budget.** iOS limits background refresh; how fresh can the day's Nudge be on a widget without a live fetch? May constrain what the Notification Engine can promise (`14`).
- **Capture-action prominence vs. calm.** A persistent high-contrast action risks feeling alarming. We need to tune presence so it's *reachable* without being *loud*.
- **Watch and Mac.** Not in v1 scope; the moment surfaces (§7) make watchOS the obvious next client. Deferred.

**What we're deliberately NOT doing**

- **Not chat-first** (§5). Dialogue serves structure; it is not the front door.
- **Not a metrics dashboard.** No streaks, no grades, no `alignment_score` shown as a number (canon §5, §7). The home screen models calm.
- **Not more than three tabs.** New capabilities earn their way onto an existing surface or into the capture flow before they earn a tab.
- **Not reward-style haptics or celebratory motion** (§7) — that optimizes the wrong outcome.
- **Not blocking the user on the network, ever** (§2). If we can't reach the Brain, we still capture and still help.
- **Not composing engines on the client.** The Coach Engine orchestrates (canon §4); the client renders.

---

*Cross-links: `00 Canon.md` (stack, vocabulary, engine contracts), `06 Decision Engine.md` (capture flow internals), `07 Coaching Engine.md` (dialogue & tone), `08 Database Architecture.md` (sync & conflict rules), `14 Notification Engine.md` (the day's Nudge), `15 Constitution.md` (the Covenant).*

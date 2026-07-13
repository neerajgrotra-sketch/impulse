# 14 · Notification Engine — When (and Whether) to Reach Out

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Define the ethics and mechanics of proactive contact. This document owns exactly one question — *should we interrupt this human right now, and if so, how?* — and its harder twin, *should we say nothing?* Everything here defers to `04 AI Brain.md` for engine topology and to `15 Constitution.md` for the Covenant.

This is the most dangerous engine we will build. Every other engine acts only when the user has already opened the app — the user came to us. The Notification Engine is the one engine that reaches *into the user's life uninvited*. That asymmetry is the whole reason this document exists and the reason it leads with ethics, not architecture.

---

## 1. The ethical thesis (read this before anything else)

**We compete for the user's peace, not their time.**

The entire attention economy is built on the opposite bet: that a human's time is a resource to be captured, and that more captured time is more value. `01 Vision.md` names this as the thing we exist to refuse. Our north-star metric (canon §7) is the **Aligned Decision Rate, recovery-weighted** — not minutes, not sessions, not opens. A notification that steals ten calm minutes to manufacture an anxious "engagement" is, by our own scoreboard, a **loss**. Canon §7 says it plainly: *engagement bought with anxiety is a loss.* This engine is where that sentence either means something or is a lie.

So the operating axiom:

> **A notification is a claim on a human's attention, and it must earn that claim every single time. The burden of proof is on us, not on the user.**

Silence is free of guilt. A Nudge is a debt we take on. If we cannot articulate — in a log line, to ourselves — why *this* message, to *this* person, at *this* moment, serves their **Future Self**, we do not send it. This is principle #1 (*Future Self is our customer*) and principle #7 (*Earn the right to hold this data*) applied to the one surface where they are easiest to betray.

**Say the risk out loud:** this engine is the doc most at risk of quietly becoming a dark pattern. The pressure will be real and it will sound reasonable — "retention is soft this cohort, can Notifications pick it up?" The moment we tune this engine against opt-out rate as a *number to beat* rather than a *health signal to heed*, we have become the thing `01 Vision.md` was written against. The red lines in §9 exist because good intentions do not survive a bad quarter.

---

## 2. Where this engine sits

Per canon §4, the Notification Engine is **Stub → v1.1**. It does not gate launch and it is not in the MVP; see `09 Roadmap.md` for sequencing. We ship the coaching loop first, learn what actually predicts a lapse, and only then earn the right to speak unprompted. Building this engine before the **Learning Engine** has real signal would mean nudging on guesses — and a Nudge on a guess is exactly the wrong-moment interruption §5 forbids.

Its contract (canon §4) is deliberately narrow:

| | |
|---|---|
| **Job** | Decide *when/whether* to reach out |
| **Inputs** | patterns (from Learning Engine), calendar/time/state signals, consent scopes |
| **Outputs** | a scheduled **Nudge**, or **silence** |
| **Talks to** | event bus only (canon §4); never reaches into another engine's storage |

It is a background worker (canon §6), consuming events and emitting at most a scheduled `Nudge` aggregate (canon §5). It never composes a coaching turn — that is the **Coach Engine's** sole job. It decides only that a conversation *should be offered*.

---

## 3. Vocabulary we hold to

We use the canon §2 definition of **Nudge** verbatim: *a proactive, permissioned message that helps at the right time. Never a guilt-trip. (Thaler/Sunstein sense.)* The Thaler/Sunstein sense matters — a nudge alters the *choice architecture* to make the aligned choice easier; it never removes options, never coerces, never punishes the other choice. If a message would be unwelcome from a good coach who respected you, it is not a Nudge. It is spam wearing our logo.

A **Lapse** is expected and never a failure (canon §2). **Recovery** — the decision after a lapse — is the moment we care about most and weight heaviest (canon §2, §7). Both terms are load-bearing in §4.

---

## 4. When to NUDGE

Three trigger families, all gated by consent (canon §8), all scoped to a `consent_scope` on the `Nudge` aggregate.

### 4.1 Pattern-based (from the Learning Engine)
The **Learning Engine** produces **Insights** — evidenced patterns like *"You lapse most on low-sleep evenings"* (canon §2, §5). When a live context matches a high-confidence, high-risk **Insight**, that is the strongest reason to consider a Nudge: we have earned the claim with the user's own history, and canon §8 requires the **Insight** carry `evidence_refs` so the trigger is explainable (§7 below).

Example: identity statement is *"I am someone who drinks intentionally,"* the Learning Engine has evidence that Friday 6pm + a specific calendar pattern precedes lapses, and that context is now live. A Nudge here is a *gentle pre-commitment offer*, not an alarm.

### 4.2 Time/state-based (Huberman on timing and state)
Not every reason to reach out is a risk. Some are about *readiness*. Behavioral neuroscience (Huberman's work on circadian state, cortisol/alertness rhythms, and post-sleep dopamine baselines) tells us the same message lands completely differently depending on physiological state. A reflection prompt at a groggy, cortisol-spiked waking moment is noise; the same prompt in an alert, calm window is welcome. So state and timing are first-class inputs: we prefer windows where the user is *plausibly able to engage well*, and we actively avoid low-state windows even when the "content" is ready.

### 4.3 Recovery moments (a gentle hand after a lapse)
The highest-value, most delicate Nudge. After a **Lapse**, the **Recovery** is what we coach hardest (canon §7). A short, warm, non-judgmental opening — *"Yesterday didn't go the way you wanted. Want to think about today?"* — can turn a spiral into a recovery. This is the one place a Nudge most clearly serves Future Self.

It is also where a dark pattern is one wrong word away. The banned-word list (canon §2 — *fail, should have, weak, guilt*…) is enforced on every Nudge, not just Coach output. A Recovery Nudge that induces shame does the exact opposite of its job and violates canon §8 (*No shaming, ever*). See §9.

---

## 5. When to STAY SILENT — silence as a first-class feature

> **The default is quiet.** Sending nothing is not a failure of the engine; it is usually the engine working correctly.

Most trigger evaluations should end in silence, and we design for that. The **Coach Engine** already owns a `Hold-Silence` move (canon §2); silence is a coaching act, and this engine is its proactive form. A suppression is logged with a reason, exactly like a send, because *choosing not to speak is a decision we want to be accountable for.*

Hard suppression rules — **any** true means silence, regardless of how good the trigger looked:

- **Fatigue budget exhausted** — the per-user cap for the window is spent (§6).
- **Recent contact** — the user has heard from us (Nudge *or* an in-app session) inside the cool-down. Two taps on the shoulder in an hour is one too many.
- **Low confidence** — the triggering **Insight** or state estimate is below threshold. We would rather miss a real moment than invent a false one; a wrong Nudge costs more trust than a missed one earns.
- **Bad state** — signals suggest the user is asleep, driving, mid-crisis, or otherwise unreachable-with-respect. **Safety pre-empts everything** (canon §8): if the Safety Engine has any active flag, this engine emits nothing and yields the channel entirely.
- **No plausible ability + motivation** (§8 below) — a prompt the user cannot act on right now is just noise.
- **Consent not granted for this scope** (canon §8).

Silence is also the correct response to *ambiguity*. When two rules disagree or the picture is murky, we do not send. The tie goes to peace.

---

## 6. The behavioral model: Fogg + nudge quality

We use the **Fogg Behavior Model**: behavior happens when **Motivation, Ability, and a Prompt** coincide (B = MAP). The Notification Engine controls only the Prompt. Its discipline is therefore: **only prompt when ability and motivation are plausibly already present.**

- **Ability** — can the user act on this *now*? A Nudge to reflect while they are driving fails on ability. Low ability → suppress or reschedule to a higher-ability window.
- **Motivation** — is there a live reason this matters to them right now (a matched risk context, a fresh Recovery opportunity)? Low motivation → suppress; do not attempt to manufacture it. Manufacturing motivation through urgency or guilt is the dark pattern (§9).

> **A prompt fired when ability or motivation is absent is worse than no prompt at all** — it trains the user to ignore us and spends trust for nothing. Fogg's own warning: prompt at the wrong moment and you don't just fail, you teach dismissal.

This is why §4.2 (state/timing) and §5 (suppression) are not niceties — they are how we keep our prompts landing in the narrow window where they can genuinely help, so that when we *do* speak, it is worth hearing.

---

## 7. Frequency governance & fatigue budgeting

Attention is a depletable, non-renewable resource for a given day. We budget it like one.

- **Hard cap.** A ceiling on Nudges per rolling window (e.g. per day and per week), enforced in the engine, not left to heuristics. The cap is *low by default* and can only move *down* per user, never silently up.
- **Decay.** Each Nudge lowers the near-term budget; the budget recovers over time. Back-to-back triggers cannot both fire; the second meets an exhausted budget and yields silence.
- **Per-user adaptation.** We learn each person's tolerance from **outcomes** (§8). Someone who consistently acts on Nudges has clearly welcomed them; someone who consistently ignores them is telling us to back off — and we *listen by sending less*, automatically. Adaptation is asymmetric: evidence of annoyance shrinks the budget fast; evidence of welcome grows it slowly.

**Opt-out rate is a HEALTH metric, not a target.** Canon §7 lists notification opt-out rate as a **guardrail that must not degrade**. We watch it the way a doctor watches a fever: as information about whether the engine is well. We do **not** A/B our way to a lower opt-out number by making opt-out harder to find, by dark-pattern copy, or by "are you sure?" friction. If opt-out rises, the correct response is *fewer and better Nudges*, never *stickier opt-out*. Fighting the number instead of heeding it is precisely how this engine would rot into the thing `01 Vision.md` forbids.

---

## 8. The pipeline

The engine is an event-driven decider. Per canon §4 it consumes and emits only over the event bus.

```
 events (Impulse Moment, Outcome, Reflection, Insight, calendar/state)
        │
        ▼
 ┌─────────────┐   consent gate (§8 canon)   ┌──────────────┐
 │  1. INGEST  │ ─────────────────────────▶  │  DROP+log     │  (no scope → silence)
 └─────────────┘                             └──────────────┘
        │ scoped
        ▼
 ┌─────────────┐   Safety flag? Fatigue? Cool-down? Low-conf? Bad state?
 │  2. DECIDE  │ ─────────────────────────▶  SUPPRESS + log reason  (§5)
 └─────────────┘   Fogg check: ability + motivation plausible? (§6)
        │ pass
        ▼
 ┌─────────────┐   pick timing/state window (§4.2), draft-request to Coach Engine
 │ 3. SCHEDULE │   spend fatigue budget (§7)
 └─────────────┘
        │
        ▼   Nudge{ kind, scheduled_for, consent_scope }  (canon §5)
 ┌─────────────┐
 │  4. MEASURE │   record outcome ∈ {opened, acted, ignored}  → event bus
 └─────────────┘
        │
        ▼
   Learning Engine  (per-user adaptation, insight refinement)
```

1. **Ingest** — subscribe to relevant events; attach the governing `consent_scope`. No scope, no further processing.
2. **Decide** — run all suppression rules (§5) and the Fogg check (§6). Most events stop here, correctly.
3. **Schedule** — choose the best window, spend budget, and request the actual message from the **Coach Engine** (this engine never writes coaching copy). Persist the `Nudge` aggregate.
4. **Measure** — record `outcome(opened|acted|ignored)` on the `Nudge` (canon §5) and publish it. This feeds the **Learning Engine**, which sharpens both the per-user budget (§7) and the **Insights** that trigger us (§4.1). The loop closes: we get quieter and more accurate over time, which is the only direction we ever want to move.

Crucially, **`ignored` is signal, not noise.** An ignored Nudge is the user quietly telling us we were wrong about the moment. We treat that as valuable negative training data, not as a conversion we failed to land.

---

## 9. Privacy & explainability of triggers

Our triggers are computed from the most intimate data we hold — lapses, sleep, emotional state, calendar. That the *reason* we reached out is derived from a user's private life makes an unexplained Nudge feel like surveillance. It must never feel that way. This ties directly to the Covenant in `15 Constitution.md` and to canon §8 (*Explainability — we never assert a pattern we can't show*).

- **Every pattern-triggered Nudge is traceable to its `evidence_refs`.** If the user asks "why did you message me?", we can answer with their own history, not a black box. An **Insight** we cannot show is an **Insight** we cannot Nudge on.
- **Trigger computation stays server-side and privacy-scrubbed** in logs (canon §6 observability). We store the *decision*, not a fresh copy of the raw intimate signal.
- **The user can inspect and mute any trigger class.** Consent (canon §8) is not a one-time checkbox; a user can turn off "risk-context nudges" while keeping "recovery nudges," at the granularity of `consent_scope`.
- **Respectful framing.** A Nudge references a pattern as *the user's own stated goal made concrete*, never as us watching them. "You told me evenings are hard" — not "we detected."

---

## 10. Anti-dark-pattern red lines (non-negotiable)

These are hard constraints, enforced by the same tone/lint pass and banned-word list that guards Coach output (canon §8), extended to every Nudge. Violating one is a shipping-blocker, not a style note.

- **No manufactured urgency.** No countdowns, no "act now," no artificial scarcity. The user's real timeline is the only clock.
- **No guilt.** No shaming, no disappointment, no "you said you would." Banned words (canon §2) are banned here too. A Recovery Nudge (§4.3) that shames is the worst thing this engine can do.
- **No streak-loss threats.** Raw streak length is an **anti-metric** (canon §7) and principle #5 is *progress over perfection*. We will never send "don't break your streak!" — it weaponizes the exact perfectionism we exist to dissolve.
- **No dopamine-bait / fake social pressure.** No "3 people are…", no invented badges to lure an open.
- **No engagement-for-its-own-sake.** If the only honest reason to send is "we haven't heard from them in a while," we do not send. Absence is not a problem to be solved with a notification.
- **Opt-out is one tap and always honored immediately.** No friction, no retention interstitial, no "are you sure."

If a proposed Nudge needs any of the above to work, that is proof it does not deserve to be sent.

---

## 11. Open questions / What we're deliberately NOT doing

**Open questions**
- What confidence threshold on an **Insight** justifies a proactive Nudge vs. waiting for the user to open the app? (Needs Learning Engine data — v1.1.)
- How do we sense "bad state" (asleep/driving) respectfully without turning on invasive sensors? Offline-first (canon §6) limits real-time state; how much do we infer vs. ask?
- What is the right *default* daily/weekly cap before per-user adaptation kicks in? Start conservative; tune down, never up.
- Should Recovery Nudges (§4.3) be opt-in *separately* and default-on, given they are highest-value but highest-risk?
- Do we ever allow a user to *raise* their own cap, and how do we keep that from becoming a self-imposed dark pattern?

**What we're deliberately NOT doing**
- **Not** shipping this in the MVP — it is v1.1 (canon §4, `09 Roadmap.md`); nudging on guesses is worse than staying silent.
- **Not** optimizing for opens, DAU, session count, or streaks (canon §7 anti-metrics).
- **Not** fighting the opt-out rate as a number — we heed it as a health signal (§7).
- **Not** letting this engine write coaching copy or make coaching decisions — that is the **Coach Engine** (canon §4).
- **Not** sending anything when the Safety Engine has a flag — safety pre-empts everything (canon §8).
- **Not** using notifications to create habit-loops, FOMO, or any form of compulsion. We compete for peace, not time.

---

*Cross-links: `00 Canon.md` (§2, §4, §5, §7, §8) · `01 Vision.md` (the anti-vision) · `04 AI Brain.md` (engine topology) · `07 Coaching Engine.md` (Hold-Silence, tone) · `09 Roadmap.md` (v1.1 sequencing) · `12 Backend Architecture.md` (event bus, workers) · `15 Constitution.md` (the Covenant, safety).*

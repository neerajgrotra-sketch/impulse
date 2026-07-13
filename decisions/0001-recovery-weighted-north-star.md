# PDR 0001 — Recovery-weighted Aligned Decision Rate is the North Star

> **Status:** Accepted
> **Purpose:** Fix our single north-star metric as the recovery-weighted **Aligned Decision Rate**, so that "progress over perfection" is what we measure, not merely what we say.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0001 |
| **Status** | Accepted |
| **Date** | 2026-07 |
| **Deciders** | Founding Team |
| **Tier** | Sensitive (metric that defines success — always a PDR) |
| **Supersedes / Superseded by** | — |

## Context

A company optimizes what it measures, and the metric leaks into every decision downstream — what the Coach says, what the Notification Engine does, what a PM celebrates on a dashboard. So the north-star metric is not a reporting choice; it is an ethical one. It encodes what "the user winning" *means*.

The principles force the shape of the answer. **Future Self is our customer** (`docs/00 Canon.md` §3, principle #1) — we must measure whether Future Self won a given **Impulse Moment**, not whether **Present Self** stayed on the phone. **Progress over perfection** (principle #5) says the decision *after* a **Lapse** — the **Recovery** — is the most important moment we coach (`docs/00 Canon.md` §2). A metric that treated every decision equally would be silent on exactly the moment that matters most, and a metric that punished the Lapse would recreate the perfectionist cliff we exist to remove. We are holding the engagement-vs-wellbeing tension (`docs/02 Product Philosophy.md` §2c): the metric must make wellbeing the target and refuse to reward anxiety.

## Decision

Our **North Star is the Aligned Decision Rate, recovery-weighted** (`docs/00 Canon.md` §7): the share of **Impulse Moments** that end aligned with the user's **Identity Statement**, with post-**Lapse** **Recoveries** counted double. **Alignment** is scored 0–1 by the Decision Engine, stored on the **Decision** aggregate, and used only in aggregate for this metric — never shown to the user as a number or grade (`docs/00 Canon.md` §5). This is the one metric the company steers by; all others are guardrails or diagnostics beneath it.

## Consequences

- Every downstream metric, dashboard, and OKR derives from or defers to this one. Feature success (feature-spec §11) is measured as movement in this metric, in the stated direction.
- Weighting Recovery double makes the post-Lapse moment the most valuable event in the system — this is intentional and directs coaching, notification, and learning investment toward it.
- We accept that this metric is **harder to measure** than minutes or sessions: it depends on the Decision Engine's Alignment scoring and on outcome capture (`Outcome.kind` ∈ aligned|lapse|recovery). We pay that cost because an easy metric that measures the wrong thing is worse than a hard metric that measures the right thing.
- Alignment is scored against a **moving identity** — when a user's Identity Statement evolves, the target moves. We knowingly accept this open problem (`docs/02 Product Philosophy.md` open questions) rather than freeze identity to make the metric convenient.
- It forecloses optimizing for reach or time-on-app: a feature that raises minutes but not aligned decisions has, by this metric, done nothing.

## Constitution / Covenant impact

Serves the precedence order (`docs/15 Constitution.md` §5): coaching goals — raising Alignment, reducing **The Gap** — are what we are *for*, and this metric is their honest measure. It operationalizes principle #5 and defends against the red line **no engagement-via-anxiety** (`docs/15 Constitution.md` §6) by making a wellbeing outcome, not an attention outcome, the thing we optimize. It does not change the Covenant.

## How we'll know if this was wrong

- The metric rises while the **guardrails** fall — self-reported *trust* / "the app gets me" degrade, or notification opt-out climbs (`docs/00 Canon.md` §7). That would mean we are gaming alignment at the cost of the relationship.
- Users experience the double-weighted Recovery as pressure to "perform recovery," i.e. it reintroduces the shame it was meant to remove (a spike in shaming-adjacent complaints, or Lapse under-reporting).
- Alignment scores prove uncorrelated with users' own sense of living their claimed identity in reflections — i.e. the score measures something other than what it claims.

Any of these is cause to revisit via a superseding PDR.

## Alternatives considered

- **Daily/weekly active users, session count, or minutes.** Rejected: these measure Present Self's attention, the opposite of our customer, and are explicit anti-metrics (see PDR `0002`).
- **Raw (unweighted) Aligned Decision Rate.** Rejected: it is silent on Recovery, the moment we most need to coach, and drifts toward a perfection frame where every Lapse simply lowers the score.
- **Streak length / "don't break the chain."** Rejected: manufactures a cliff and the what-the-hell effect (`docs/02 Product Philosophy.md` §1.5); a banned frame.
- **A composite "wellbeing index."** Rejected for v1: too soft to steer by and too easy to rationalize after the fact. We keep one legible north star and let trust/"the app gets me" sit explicitly as guardrails.

## Links

- `docs/00 Canon.md` §2 (Alignment, Lapse, Recovery, Impulse Moment), §5 (Decision, Outcome), §7 (metrics)
- `docs/02 Product Philosophy.md` §1.1, §1.5, §2c
- `docs/15 Constitution.md` §5, §6, §7
- PDR `0002-streaks-are-an-anti-metric.md` (the refusal that pairs with this choice)

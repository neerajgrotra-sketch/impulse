# PDR 0002 — Streaks and DAU-minutes are anti-metrics

> **Status:** Accepted
> **Purpose:** Commit, on the record, that we refuse to optimize raw streak length, daily active minutes, and session count for their own sake — because engagement bought with anxiety is a loss.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0002 |
| **Status** | Accepted |
| **Date** | 2026-07 |
| **Deciders** | Founding Team |
| **Tier** | Sensitive (metrics + coaching policy — always a PDR) |
| **Supersedes / Superseded by** | — |

## Context

Every retention lever the industry knows — streaks, "don't break the chain," variable reward, notification pressure, minutes-maximizing feeds — *works*. That is exactly the problem. They work by exploiting the same impulsivity, loss aversion, and manufactured urgency that we exist to soothe (`docs/02 Product Philosophy.md` §2c, §1.5). A streak converts one **Lapse** into a cliff: the chain breaks, the what-the-hell effect fires, and the user spirals away from the **Recovery** that matters most. This directly contradicts **progress over perfection** (`docs/00 Canon.md` §3, principle #5) and the banned word *streak-broken* (`docs/00 Canon.md` §2).

We are holding the engagement-vs-wellbeing tension (`docs/02 Product Philosophy.md` §2c). The danger with a tension is that it gets resolved implicitly — one dashboard at a time, in whatever direction is easiest that quarter — unless we fix the rule now, in writing.

## Decision

We **refuse to optimize** raw streak length, daily active minutes, and session count for their own sake. These are **anti-metrics** (`docs/00 Canon.md` §7): we may observe them as diagnostics, but we will never set them as targets, celebrate them, or ship a feature whose primary justification is that it moves them. We build no streak UI and no "don't break the chain" mechanic. **Engagement must be a byproduct, never a target** (`docs/02 Product Philosophy.md` §2c); when engagement conflicts with wellbeing, wellbeing wins.

## Consequences

- The Notification Engine's default is **silence, not reach** (`docs/14 Notification Engine.md`, `docs/02 Product Philosophy.md` §2c). We accept being opened *less* in exchange for being trusted more.
- No streak counter, no chain, no "you're on a roll" pressure appears in any surface. A **Lapse** never renders as a broken thing.
- **Engagement can never be a tiebreaker** between principles (`docs/02 Product Philosophy.md` §3). "It drives engagement" is not an argument in any review.
- We knowingly forgo the fastest known growth mechanics. This is a real revenue/retention cost, accepted deliberately — our business model is the user paying us to serve their Future Self (PDR `0003`), not attention harvested from Present Self.
- This is the necessary complement to PDR `0001`: naming the North Star is not enough unless we also name what we will *not* let quietly substitute for it.

## Constitution / Covenant impact

Enforces the red line **no engagement-via-anxiety** and supports **no manufactured urgency** and **no manipulative dark patterns** (`docs/15 Constitution.md` §6). Optimizing these anti-metrics tends to breed the very anxiety we exist to reduce; refusing them is how the non-negotiable **no shaming, ever** (`docs/15 Constitution.md` §4.1) holds at the metric layer, not just the tone layer. It does not change the Covenant, but it is the metric-side expression of the Covenant's spirit.

## How we'll know if this was wrong

- We find we cannot sustain the business at all without an engagement lever — i.e. wellbeing-first retention proves commercially non-viable at scale. That would force a founder-level revisit (not a quiet exception), documented as a superseding PDR.
- The North Star (PDR `0001`) and guardrail trust metrics stay healthy *only* when some engagement proxy is also healthy, suggesting the proxy is a legitimate leading indicator rather than a trap — in which case we would reclassify it explicitly, never smuggle it in.
- Absent those, the sign that we were *right* is boring: retention that tracks trust and aligned decisions, with no streak mechanic in sight.

## Alternatives considered

- **"Healthy streaks" (freezes, grace days, gentle framing).** Rejected: it is still a chain, still primes loss aversion, and still makes a Lapse feel like breakage. Softening a trap does not un-trap it.
- **Track engagement as a guardrail, not a target.** Partially adopted — we *observe* these numbers as diagnostics — but we explicitly refuse to let observation become optimization, because the slope from "we watch it" to "we grew it" is exactly how mission drift happens.
- **Stay silent on the matter (no PDR).** Rejected: an unstated refusal is not enforceable and will be eroded under growth pressure. The point of the record is that a future engineer can point to it when the easy lever beckons.

## Links

- `docs/00 Canon.md` §2 (Lapse, Recovery, banned words), §7 (anti-metrics)
- `docs/02 Product Philosophy.md` §1.5, §2c, §3
- `docs/15 Constitution.md` §4.1, §6
- `docs/14 Notification Engine.md` (silence as default)
- PDR `0001-recovery-weighted-north-star.md` (the metric this protects)
- PDR `0003-no-ads-no-data-sale.md` (the business model that makes this affordable)

# PDR 0003 — No advertising model; we never sell or rent user data

> **Status:** Accepted
> **Purpose:** Fix, permanently and on the record, that Impulse has no advertising model and never sells or rents user data or anything derived from it — the business-model core of the Covenant.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0003 |
| **Status** | Accepted |
| **Date** | 2026-07 |
| **Deciders** | Founding Team |
| **Tier** | Sensitive (the Covenant — always a PDR) |
| **Supersedes / Superseded by** | — |

## Context

The product's mechanism *is* intimate data. To help in the **Impulse Moment**, we must hold the record of what tempts a person, what they are ashamed of, and how they talk to themselves when no one is listening (`docs/15 Constitution.md` §1–2). A person only lets us hold that record if they believe it cannot be used against them. So the business model is not a finance decision downstream of the product — it is a precondition *of* the product. **Trust is not a growth tactic; it is the thing we sell** (`docs/15 Constitution.md` §2).

An ad-funded decision coach is a structural conflict of interest: advertising optimizes for **Present Self's** attention, and our customer is **Future Self** (`docs/00 Canon.md` §3, principle #1). A data-brokered coach turns the user's most sensitive patterns into inventory. Both invert who we work for. Principle #7 — **earn the right to hold this data** (`docs/00 Canon.md` §3) — makes this binding rather than aspirational.

## Decision

**Impulse has no advertising model, ever, and we never sell or rent user data — or **Insight**s, or anything derived from them — to anyone, for any purpose.** Not to advertisers, data brokers, insurers, employers, or "partners"; not aggregated, not anonymized-with-a-wink, not ever (`docs/15 Constitution.md` §2.4–2.5). Our revenue is the user paying us directly to serve their Future Self. This is enforced by architecture, not policy: there is **no ad SDK, no content-exfiltrating third-party analytics, and no data-sharing integration in the codebase, and their absence is asserted by test** (`docs/15 Constitution.md` §2).

## Consequences

- The only sanctioned revenue path is the user paying us (subscription/direct). Any future monetization proposal that touches ads or data sale is rejected at design review regardless of projected impact (`docs/15 Constitution.md` §6).
- Engineering carries a standing constraint: dependency and integration reviews must keep the codebase free of ad/analytics/data-sharing SDKs, backed by a release-blocking test (`docs/15 Constitution.md` §2, §7).
- We forgo the largest consumer-software revenue model on earth. That cost is accepted as the price of the trust that makes honest input — and therefore good coaching — possible (personalization-vs-privacy, `docs/02 Product Philosophy.md` §2d: privacy wins).
- Pairs with PDR `0002`: refusing engagement anti-metrics is only affordable because we are not funded by attention. The two decisions hold each other up.

## Constitution / Covenant impact

This PDR *is* the record of Covenant clauses **§2.4 (No advertising. Ever.)** and **§2.5 (We never sell or rent your data)**, and it upholds the red lines **no selling insights**, **no covert data use**, and **no exploiting the weakest moment** (`docs/15 Constitution.md` §6). It restates rather than changes the Covenant, so it does **not** increment `covenant_version` — but any future attempt to weaken it would, and would face the highest governance bar (`docs/15 Constitution.md` §8: the Covenant ratchets toward the user; the burden of proof is on loosening).

## How we'll know if this was wrong

- Direct-pay revenue proves structurally insufficient to run the company, such that the *only* survival path is ads or data sale. Per `docs/15 Constitution.md` §6, the correct response is not a better plan for crossing the line — "we need a different business, and we already have one." A change here is a founder-level, documented, superseding decision, never a silent exception.
- We would be *wrong to have doubted it* if the opposite holds: users cite the no-ads / no-sale promise as a top reason they trust us with intimate data (a signal in the guardrail "the app gets me" / trust metrics, `docs/00 Canon.md` §7).

## Alternatives considered

- **Ad-supported free tier.** Rejected: an ad-funded decision coach is a conflict of interest we refuse to hold (`docs/15 Constitution.md` §2.4). It would make Present Self's attention our revenue, inverting principle #1.
- **Selling aggregated / anonymized behavioral insights.** Rejected: re-identification risk aside, a market for private behavioral patterns is one we will not participate in on any side (`docs/15 Constitution.md` §6). "Anonymized-with-a-wink" is explicitly named and refused (§2.5).
- **"Data partnerships" with wellness or insurance providers.** Rejected: the same data-as-inventory inversion, dressed as collaboration. The user's record must never become leverage over them.
- **Freemium with no data component (pure paywall).** *Adopted* as the direction: the user pays; the data is never the product.

## Links

- `docs/00 Canon.md` §3 (principle #1, #7), §7 (guardrails)
- `docs/02 Product Philosophy.md` §1.1, §1.7, §2d
- `docs/15 Constitution.md` §2.4, §2.5, §6, §8
- `docs/08 Database Architecture.md` (data minimization, deletion, purpose-per-field — the controls behind the promise)
- PDR `0002-streaks-are-an-anti-metric.md` (the metric refusal this model makes affordable)

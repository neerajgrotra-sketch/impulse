# PDR 0005 — The product never outruns the evidence

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07 |
| **Deciders** | Founding Team |
| **Supersedes** | — |
| **Superseded by** | — |

> **Purpose:** Establish, as binding company policy, that Impulse is a research-driven product whose coaching is grounded in the strongest available evidence — and that novel or proprietary ideas are treated as hypotheses until validated, never represented as established science.

## Context

Impulse coaches people at their most vulnerable moments. The behavioral-science literature this product draws on is uneven: some of it is robust (implementation intentions, self-efficacy, the working alliance), and some of the most *famous* claims are weak or discredited (ego depletion, the "21-day habit," strict Maslow, grit-as-a-distinct-trait). The dominant failure mode for a company like ours is not ignorance — it is **confidence**: a compelling popularization hardens into an architectural assumption the evidence never supported, and we end up coaching real users on folk psychology.

The `research/` corpus already grades evidence (`research/00 Method & Evidence Standard.md`). This PDR elevates the *discipline* behind that corpus into company-wide policy, so it binds the product, not just the research docs.

## Decision

We adopt the following as binding policy and creed:

> **Research informs the model. The model informs the product. The product never outruns the evidence.**

Concretely:

1. We distinguish — explicitly and always — between **established scientific evidence, strong theoretical support, practitioner experience, philosophical guidance, product intuition, and experimental hypotheses**, using the source-class labels and evidence tiers in `research/00`.
2. The **Coaching Engine** is grounded in the strongest available evidence for any behavioral claim it acts on.
3. Any **novel or proprietary Impulse model** is labeled a **hypothesis** — internally, and to the user where surfaced — until validated through user research or experimentation.
4. We **never represent speculation as established science** (also a Constitution red line, `docs/15 Constitution.md §6`).
5. **Research is an input into architecture, not documentation.** Every research document carries an **"Architecture Impact"** section (What changed? Why? Which documents to update? What assumptions to challenge?). Research authors *recommend*; architecture changes flow through the normal review + ADR/PDR gate. See `docs/10 Engineering Principles.md §9` and `research/00 §8`.

## Consequences

**Positive.** Trust with users and clinicians is defensible; the company can change its mind when the evidence changes without having silently shipped the old belief; coaching claims become auditable against cited support.

**Costs we knowingly accept.** Slower shipping of "obviously good" ideas that lack evidence; more labeling and instrumentation work; the discipline of saying "we don't know yet" in a market full of confident competitors. We accept these — the alternative is coaching people on things that are not true.

**Neutral.** Adds an "Architecture Impact" step to the research process and a claim-provenance check to Sensitive-tier review.

## Constitution / Covenant impact

Directly implements **non-negotiable #6** in `docs/15 Constitution.md §4` and the new red line "No representing speculation as established science" (§6). Reinforces the Covenant's transparency promise (§2.6) — a user can be told the evidential basis of what we suggest. Increments no `covenant_version` on its own (it constrains us, not the user's data rights), but any user-facing "why we suggest this" surface built on it is a Covenant-positive change.

## How we'll know if this was wrong

- If the labeling/gating measurably slows learning without improving outcome quality or trust, the *process* is too heavy and should be simplified (not the principle abandoned).
- If, despite the policy, shipped coaching claims are later found to rest on `〔Pop〕`/`〔IH〕` sources misrepresented as `[A]`/`[B]` evidence, the enforcement (provenance check) is failing and must be strengthened.
- If users experience the honesty ("evidence here is limited") as untrustworthy rather than trustworthy, our *communication* of uncertainty needs work — a research question, not a reason to overclaim.

## Alternatives considered

- **Leave it implicit in the research corpus.** Rejected: a discipline that binds only the researchers doesn't bind the product; the assumption-hardening failure happens at the architecture boundary.
- **Require peer-reviewed evidence for every coaching behavior.** Rejected as too strict — it would forbid the labeled, instrumented hypotheses that are how a research-driven product actually learns. The point is honest labeling, not paralysis.
- **A single merged decision-record system.** Out of scope here; this PDR only concerns evidence discipline.

## Links

- `docs/15 Constitution.md` §4 (non-negotiable #6), §6 (red line)
- `docs/10 Engineering Principles.md` §9
- `research/00 Method & Evidence Standard.md` §2 (tiers), §7 (source classes), §8 (Architecture Impact)
- `.rules/research.md` (enforcement)
- Related metric policies: `0001`, `0002`

# Documentation Rules

**Purpose:** Keep the reasoning behind the system findable, current, and trustworthy — because "always explain WHY, not just WHAT" (Canon §10) is only real if the WHY is written down. **Scope:** feature-specs, ADRs, PDRs, code comments, and the canon itself.

1. Every Sensitive-tier change (coaching, safety, memory, privacy, notifications, identity, the model) MUST have a feature-spec before code is merged — WHY: CONVENTIONS §2 requires the full lifecycle; a coaching change without a spec is an unreviewed change to a user's trust.
2. A decision that sets architecture MUST be recorded as an ADR; a decision about user-facing behavior, ethics, or coaching policy MUST be a PDR — WHY: CONVENTIONS §3 splits these because the Constitution cares about the second kind differently.
3. ADRs and PDRs MUST be immutable once Accepted — supersede with a new record, NEVER edit the decision — WHY: an edited decision erases the reasoning future engineers need to understand why we are where we are.
4. Docs MUST explain WHY, not only WHAT; a spec or comment that only lists what to build is incomplete — WHY: Canon §10 — a document that only says what has failed.
5. Documentation MUST live with the code it describes and be updated in the same PR that changes the behavior — WHY: docs in a separate system drift, and drifted docs are worse than none.
6. Docs that describe behavior MUST be updated when that behavior changes, or deleted if no longer true — WHY: a confidently wrong doc costs more than a missing one.
7. All assets MUST use canon vocabulary (Canon §2) verbatim and NEVER introduce a synonym for a canon term — WHY: fifteen documents and engineers must describe the same system; synonyms fracture it.
8. When an asset and `docs/00 Canon.md` disagree, the canon wins and the asset MUST be fixed — WHY: a single source of truth only works if everyone defers to it.
9. Comments MUST explain intent, tradeoffs, and non-obvious constraints — not restate the code — WHY: the code already says what it does; the comment must carry why.
10. We MUST NOT create placeholder docs or assets that only restate the prompt or another doc — WHY: CONVENTIONS §5 — empty and duplicative docs erode trust in all docs.
11. Every doc SHOULD open with a one-line Purpose and `Status`, and long-form docs SHOULD close with "Open questions / What we're deliberately NOT doing" — WHY: Canon §10 house style keeps intent and scope explicit.
12. Cross-references between assets MUST use links (relative path), not restated content — WHY: linked assets stay consistent; copied content diverges silently.
13. Any deviation from a rule file SHOULD be documented at the call site with a reason — WHY: an unexplained exception is indistinguishable from a mistake.

## How this is enforced

Feature-spec, ADR, and PDR presence is gated by the change-tiering model (CONVENTIONS §2) and checked in review by the matching review skill and Design Council for Sensitive tier. Canon-vocabulary use is checked in review against `docs/00 Canon.md`. Templates live in `.claude/templates/`. Stale docs surface in code review when behavior and docs change in different PRs.

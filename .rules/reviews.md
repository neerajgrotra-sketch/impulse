# Review Rules

**Purpose:** Make sure the right eyes — human and specialized — see every change before a user does, scaled to how much that change can hurt someone. **Scope:** every PR, mapped through the change-tiering model (CONVENTIONS §2).

Review is where we catch the WHY, not just the WHAT — and where "coach, never parent" and "no shaming, ever" get defended before they reach a Present Self at their most vulnerable.

1. Every PR MUST get at least one human review and approval before merge; automated checks NEVER substitute for a human — WHY: CI proves it runs; a person judges whether it should exist.
2. Reviewers MUST check WHY, not only WHAT — intent, tradeoffs, and fit with canon principles, not just correctness — WHY: code that works but violates "understand before advising" is still wrong.
3. Review depth MUST match the change tier (CONVENTIONS §2): Trivial → PR checklist; Standard → relevant review skill; Sensitive → full lifecycle — WHY: tiering focuses scarce review attention where a user can actually be harmed.
4. Sensitive-tier changes (coaching, safety, memory, privacy, notifications, identity, the model) MUST pass the matching review skill AND Design Council — WHY: these touch trust and safety, where CONVENTIONS §2 permits no shortcuts.
5. Sensitive-tier changes MUST run the required review skill for their domain (e.g. `security-review` for privacy/security surface) — WHY: a specialized lens catches what a generalist reviewer misses.
6. Any change to Coach output or coaching policy MUST pass the no-shaming tone lint AND human tone review before merge — WHY: "no shaming, ever" (Canon §8) is a launch guardrail; a shaming line is a Covenant breach.
7. Design Council MUST, for each engaged behavioral lens (CONVENTIONS §4), surface agreement, conflicts, tradeoffs, open questions, and a recommendation — WHY: a coaching change unexamined by the thinker-lenses risks exploiting a bias we exist to mitigate.
8. Safety Engine changes MUST have safety-owner sign-off and passing safety red-team evals before merge — WHY: Safety gates launch (Canon §4); it gets the strictest gate we have.
9. Reviewers MUST verify the required feature-spec, ADR, or PDR is present and linked for the tier — WHY: an approval without the reasoning attached approves something unspecified (`.rules/documentation.md`).
10. Reviewers MUST confirm canon vocabulary and the banned-word list are respected — WHY: review is the last place a synonym or a shaming word is cheap to fix.
11. CODEOWNERS MUST gate sensitive paths (safety, privacy, data model, prompts) so their owners are required approvers — WHY: the people who hold the context must see changes to it, automatically, not by luck.
12. Authors MUST NEVER approve or merge their own Sensitive-tier PR — WHY: self-review is not review; the blind spots that wrote the bug will approve it.
13. Review comments SHOULD explain the reasoning behind requested changes — WHY: a reviewer who only says WHAT to change teaches nothing and models the behavior we forbid in the product.
14. A PR MUST resolve blocking review comments and keep CI green before merge — WHY: merging over an unresolved concern converts a caught risk into a shipped one.

## How this is enforced

Branch protection requires human approval, CODEOWNERS sign-off on sensitive paths, and green CI (`.rules/git.md`). The change-tiering model routes each PR to its review skill and, for Sensitive tier, to Design Council and ethical review. The no-shaming tone lint runs in CI on Coach output and gates merge. See CONVENTIONS §2–§4 and `docs/15 Constitution.md`.

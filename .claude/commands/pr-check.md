# /pr-check — run the pull-request checklist

**What it does:** Runs the pre-PR checklist before you open a pull request — the Release gate (Stage 10), and the **only** gate a Trivial change must pass.

**Inputs:** the working diff and its change tier.

**Steps (thin):**
1. Open `.claude/checklists/pull-request.md` and work every `- [ ]` item for the change's tier.
2. Confirm the tier is right: if the diff touches **coaching, safety, memory, privacy, notifications, identity, or the model**, it is **not** Trivial — stop and run `/review` (CONVENTIONS §2).
3. Do not open the PR until every applicable item is checked; a human review is still required before merge (`.rules/reviews.md` #1).

**Triggers:** `.claude/checklists/pull-request.md`.

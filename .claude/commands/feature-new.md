# /feature-new — start a new feature

**What it does:** Begins the feature lifecycle for a new change. Invokes the `feature-design` skill to create a feature spec from the template, sets the change tier, and enters the workflow at Stage 1 (Problem).

**Inputs:** a working title; a one-line problem; the surface(s) it touches (to tier it).

**Steps (thin — do not duplicate the assets):**
1. Run the `feature-design` skill; it drafts a spec from `.claude/templates/feature-spec.md` and walks the lifecycle stages.
2. **Set the tier** using CONVENTIONS §2. If the change touches **coaching, safety, memory, privacy, notifications, identity, or the model**, it is **Sensitive** — run `/review` to confirm and auto-escalate. When in doubt, tier **up**.
3. Fill Stage 1 (Problem) and Stage 2 (User value); track the stage gates with `.claude/checklists/new-feature.md`.
4. Hand off to the stages the tier requires — see the tier→stage table in `.claude/workflows/feature-lifecycle.md`.

**Triggers:** `feature-design` skill · `.claude/templates/feature-spec.md` · `.claude/checklists/new-feature.md` · `.claude/workflows/feature-lifecycle.md`.

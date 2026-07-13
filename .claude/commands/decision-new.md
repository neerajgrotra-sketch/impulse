# /decision-new — create a new Product/Ethical Decision Record (PDR)

**What it does:** Creates a new PDR from the template, numbered with the next monotonic number. Use it to record decisions about **user-facing behavior, ethics, and coaching policy** — the things the Constitution cares about (Stage 4, updated at Stage 11).

**Inputs:** a decision title; the context, the options weighed, and the decision.

**Steps (thin):**
1. Find the highest existing `NNNN` in `decisions/` and use the next integer, zero-padded.
2. Copy `.claude/templates/pdr-template.md` to `decisions/NNNN-<slug>.md`.
3. Start it at status `Proposed`. Once `Accepted` it is **immutable** — supersede, never edit (CONVENTIONS §3). At post-release evaluation, record the observed outcome against it.

**Triggers:** `.claude/templates/pdr-template.md`.

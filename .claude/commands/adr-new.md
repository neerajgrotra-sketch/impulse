# /adr-new — create a new ADR

**What it does:** Creates a new Architecture Decision Record from the template, numbered with the next monotonic number. Use it when a change **sets architecture** (Stage 5 / Stage 7 of the lifecycle).

**Inputs:** a decision title; the context/options/decision to record.

**Steps (thin):**
1. Find the highest existing `NNNN` in `adr/` and use the next integer, zero-padded.
2. Copy `.claude/templates/adr-template.md` to `adr/NNNN-<slug>.md`.
3. Start it at status `Proposed`. Once `Accepted` it is **immutable** — supersede with a new ADR, never edit the decision (CONVENTIONS §3).

**Triggers:** `.claude/templates/adr-template.md`.

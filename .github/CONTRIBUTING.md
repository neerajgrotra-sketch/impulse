# Contributing to Impulse

> **Purpose:** the contributor's guide to our engineering operating system — how we decide how
> much process a change needs, how a feature moves from idea to ship, and the lines we never
> cross. Read this before your first PR.

Impulse is an **AI decision coach** that helps a person close the Gap between the choice their
**Present Self** wants and the life their **Future Self** wants (`../docs/00 Canon.md` §1). We
build a behavior-change product on the most sensitive data a person holds, so our process is
heavy **only where a change can hurt a user** — and light everywhere else.

**Read first, in order:**
1. [`README.md`](../README.md) — the repo.
2. [`docs/00 Canon.md`](../docs/00%20Canon.md) — the single source of truth for vocabulary,
   engines, data model, stack, and metrics. **Use its §2 vocabulary verbatim. Never invent a
   synonym for a canon term.**
3. [`docs/15 Constitution.md`](../docs/15%20Constitution.md) — the highest law: the Covenant,
   Safety, and the non-negotiables. Everything is subordinate to it.
4. [`.claude/CONVENTIONS.md`](../.claude/CONVENTIONS.md) — how we write every asset.

---

## 1. The tiering model — the one thing to internalize

Every change declares a tier (`.claude/CONVENTIONS.md` §2). It decides how much process applies.

| Tier | Trigger | Process required |
|---|---|---|
| **Trivial** | copy fix, pure refactor, dep bump, non-behavioral change | PR checklist only |
| **Standard** | new endpoint/screen/logic that is **not** sensitive | feature-spec + relevant review skill + ADR *if* it sets architecture |
| **Sensitive** | touches **coaching, safety, memory, privacy, notifications, identity, or the model** | full feature lifecycle + Design Council + ethical review — no exceptions |

**When in doubt, tier up.** Over-reviewing a Trivial change costs minutes; under-reviewing a
coaching change costs a user's trust — our one guardrail metric (`../docs/00 Canon.md` §7).

## 2. The feature lifecycle, in brief

Stages, from idea to ship:

1. **Problem** — the real problem, in the user's terms. Open a [feature request](ISSUE_TEMPLATE/feature_request.md).
2. **User value & job** — the Christensen Job-to-be-Done and which principle it serves.
3. **Feature spec** — write it with [`.claude/templates/feature-spec.md`](../.claude/templates/feature-spec.md) (Standard and Sensitive).
4. **Psychological foundation → behavioral review** — for anything that touches how we coach,
   run [`behavioral-review`](../.claude/skills/behavioral-review/SKILL.md). It is the gate before the Council.
5. **Design Council** — for Sensitive changes, run [`design-council`](../.claude/skills/design-council/SKILL.md)
   ([workflow](../.claude/workflows/design-council.md)): the fifteen §4 lenses, a cross-lens
   synthesis, and one go / no-go / go-with-conditions verdict.
6. **Build** — honor the `.rules/` and the relevant review skills.
7. **Verify** — tests, and evals where prompts/coaching/the model change (`../docs/13 Prompt Architecture.md`).
8. **PR & ship** — the [PR template](PULL_REQUEST_TEMPLATE.md) with the tier's records linked.

Understand before advising (`../docs/00 Canon.md` §3): never jump to a solution before the
Problem and User value are clear.

## 3. Opening a PR

1. Branch off `main` (never commit to `main` directly).
2. Fill the [PR template](PULL_REQUEST_TEMPLATE.md) completely: declare the tier, list what it
   touches, link the records the tier requires, check off the review skills you ran, and sign
   the non-negotiable attestations.
3. Provide **test + eval evidence** — paste the command and result; link eval output where the
   change touches prompts, coaching, or the model.
4. Ensure the [governance workflow](workflows/governance.yml) passes.
5. [CODEOWNERS](CODEOWNERS) will request the right reviewers. Sensitive areas require the
   safety/ethics owners.

## 4. When you need an ADR vs a PDR vs the Design Council

They answer different questions — you may need more than one.

- **ADR — Architecture Decision Record** (`adr/NNNN-title.md`, template
  [`.claude/templates/adr-template.md`](../.claude/templates/adr-template.md)): a **technical**
  decision that sets or changes architecture (a boundary, a dependency, a storage choice).
  Required for any Standard change that sets architecture. Numbered monotonically; immutable
  once Accepted — supersede, never edit.
- **PDR — Product/Ethical Decision Record** (`decisions/NNNN-title.md`): a decision about
  **user-facing behavior, ethics, or coaching policy** — the things the Constitution cares
  about. Any Sensitive behavioral change produces one (the behavioral-review record is a PDR).
- **Design Council** ([`design-council`](../.claude/skills/design-council/SKILL.md)): not a
  record but a **pre-build review** through the fifteen lenses. **Mandatory for every Sensitive
  change.** Its report is linked from the PR and typically anchors a PDR.

Rule of thumb: architecture → ADR; user-facing behavior or ethics → PDR; Sensitive tier →
Design Council (which usually yields a PDR).

## 5. The rule system

Machine- and human-readable rules live in [`.rules/`](../.rules/) (see
[`.rules/README.md`](../.rules/README.md)). Each rule is a MUST/SHOULD/NEVER statement plus a
one-line WHY. Honor the ones your change touches:

`architecture` · `backend` · `ios` · `swift` · `naming` · `privacy` · `security` ·
`accessibility` · `documentation`.

Skills in [`.claude/skills/`](../.claude/skills/) are how we *apply* the rules during review:
`feature-design` (idea → spec), `architecture-review`, `backend-review`, `database-review`,
`ios-review`, `performance-review`, `security-review`, `privacy-review`, `prompt-review`,
`behavioral-review`, and `design-council`. The last four are Sensitive-tier gates.

## 6. The non-negotiables (`docs/15 Constitution.md`)

These are not preferences. Violating one is a launch-blocking incident.

- **Safety pre-empts everything.** The Safety Engine can hard-stop any coaching turn; nothing
  you build weakens that (`../docs/00 Canon.md` §4, §8).
- **The Covenant.** The user's data is theirs; data minimization, real deletion, no ads, no
  selling data, transparency by default (`../docs/15 Constitution.md` §2).
- **No shaming, ever.** No banned words in any Coach-facing surface, code, or copy: *fail,
  failure, cheat, streak-broken, bad, weak, should have, guilt* (`../docs/00 Canon.md` §2).
- **Consent is a gate, not a checkbox.** Every proactive action checks a consent scope
  (`../docs/00 Canon.md` §8).
- **No PII in logs, no secrets in the repo** (`../.rules/privacy.md`, `../.rules/security.md`).

If a change conflicts with the Constitution, the change is wrong. For a safety or ethics
concern, escalate via the Constitution rather than a public issue.

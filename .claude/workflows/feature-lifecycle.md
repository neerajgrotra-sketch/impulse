# Feature Lifecycle — the 11-stage process

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** The definitive process for taking a change from *problem* to *evaluated in production* at Impulse. It exists so that a change which can hurt a user cannot reach a user without passing the gates that protect them — and so that a change which *can't* hurt anyone isn't strangled by process it doesn't need.

Read [`docs/00 Canon.md`](../../docs/00%20Canon.md) and [`.claude/CONVENTIONS.md`](../CONVENTIONS.md) first. This workflow is governed by the change-tiering model in CONVENTIONS §2 — **the tier decides which stages you run.** When in doubt, tier **up**: the cost of over-reviewing a Trivial change is minutes; the cost of under-reviewing a coaching change is a user's trust (Principle #7 — *earn the right to hold this data*).

---

## 0. How to read this document

- The lifecycle is **11 stages, run in order.** Each has a **purpose**, an **entry gate**, an **exit gate**, an **owner**, an **output artifact**, and the **skill/template/checklist** it uses.
- A **gate** is a hard stop: you do not enter a stage until its entry gate is green, and you do not leave until its exit gate is green. Gates are enforced by review skills, CI, and the PR checklist — not by good intentions.
- The tier (Trivial / Standard / Sensitive) is set at Stage 1 and can only ever be **raised** later, never lowered — because new information reveals risk, it never hides it.
- **The three non-negotiable gates for Sensitive changes are Ethical Review (4), Design Council (6), and Post-release Evaluation (11).** Nothing sensitive skips them. There is no shortcut, no "just this once," no deadline that overrides them.

---

## 1. The stages at a glance

| # | Stage | Owner | Output artifact | Uses |
|---|---|---|---|---|
| 1 | Problem | Feature author (PM/eng) | Problem statement (in feature spec) | `feature-design` skill · `templates/feature-spec.md` · `/feature-new` |
| 2 | User value | Feature author | Value + JTBD section of spec | `feature-design` skill · `templates/feature-spec.md` |
| 3 | Psychological foundation | Behavioral reviewer | Behavioral-foundation section + lens findings | `behavioral-review` skill (CONVENTIONS §4 lenses) |
| 4 | Ethical review | Ethics owner (Constitution steward) | Ethical sign-off + PDR if a policy is set | `behavioral-review` + `privacy-review` (+ `security-review`) skills · `templates/pdr-template.md` |
| 5 | Architecture review | Staff/lead engineer | Architecture sign-off + ADR if it sets architecture | `architecture-review` (+ `backend-review`/`database-review`/`ios-review`) · `templates/adr-template.md` |
| 6 | Design Council review | Design Council facilitator | Council record (agreement/conflicts/tradeoffs/open questions/recommendation) | `design-council` skill · `/design-council` |
| 7 | Technical design | Implementing engineer | Technical design doc (+ ADR if not already written) | `templates/technical-design.md` · `architecture-review` skill · `templates/adr-template.md` |
| 8 | Implementation | Implementing engineer | The code, behind the right consent/safety gates | `docs/10 Engineering Principles.md` · `.rules/*` |
| 9 | Testing | Implementing engineer + QA | Tests + eval-harness results | `docs/13 Prompt Architecture.md` evals · `.rules/testing.md` |
| 10 | Release | Release owner | Merged PR + release note | `checklists/pull-request.md` · `/pr-check` |
| 11 | Post-release evaluation | Feature author + metrics owner | Evaluation record vs North Star + guardrails | `templates/post-release-eval.md` · Canon §7 metrics · PDR if policy changes |

---

## 2. The stages in full

### Stage 1 — Problem
- **Purpose:** State the real problem in the user's terms before proposing anything. A change with no articulated problem is a solution looking for a victim.
- **Entry gate:** A change is proposed. Tier is provisionally set here (see §3).
- **Exit gate:** Problem statement is written and names *whose* problem it is (Present Self / Future Self) and *when* it bites (which Impulse Moment).
- **Owner:** Feature author.
- **Output:** Problem statement, section 1 of the feature spec.
- **Uses:** the `feature-design` skill, which drafts `.claude/templates/feature-spec.md`; created via `/feature-new`.

### Stage 2 — User value
- **Purpose:** Establish the value to the *user* — the job they hire this for (Christensen lens) — and confirm it serves **Future Self**, not just Present Self's comfort (Principle #1).
- **Entry gate:** Problem statement exists.
- **Exit gate:** Value is stated as a job-to-be-done, tied to the North Star (Aligned Decision Rate) or a named guardrail, and does **not** rely on an anti-metric (streaks, DAU, session count — Canon §7).
- **Owner:** Feature author.
- **Output:** Value + JTBD section of the feature spec.
- **Uses:** `feature-design` skill · `templates/feature-spec.md`.

### Stage 3 — Psychological foundation
- **Purpose:** Examine the change through the behavioral-science lenses (CONVENTIONS §4). Every coaching/behavioral feature must show which biases it *mitigates* vs *exploits*, and how it reinforces identity over goals (Principle #4).
- **Entry gate:** User value established.
- **Exit gate:** For each engaged lens: the forcing question is answered, no lens raises an unresolved "this exploits the user" flag, and the design reinforces identity and a growth mindset (Dweck — a Lapse is framed as learning, never a verdict).
- **Owner:** Behavioral reviewer.
- **Output:** Behavioral-foundation section + per-lens findings.
- **Uses:** `behavioral-review` skill.

### Stage 4 — Ethical review  ● *(mandatory for Sensitive — no exceptions)*
- **Purpose:** Test the change against the Covenant and the Constitution (`docs/15 Constitution.md`): consent, dignity, safety, no shaming, explainability. This is where we honor Principle #7.
- **Entry gate:** Psychological foundation done (for behavioral changes) or spec complete (for other Sensitive changes).
- **Exit gate:** Consent scope is defined for every proactive action; Safety Engine implications are assessed; no banned-word / shaming risk; explainability holds (every asserted Insight carries evidence). If the change sets user-facing behavior or coaching policy, a **PDR** is written and Accepted.
- **Owner:** Ethics owner (Constitution steward). Safety Engine changes additionally require safety-owner sign-off and passing safety red-team evals (`.rules/reviews.md` #8).
- **Output:** Ethical sign-off; a Product/Ethical Decision Record (PDR) when a policy is set.
- **Uses:** `behavioral-review` (ethics dimension) + `privacy-review` (Covenant) + `security-review` (threat model) skills; `.claude/templates/pdr-template.md` (via `/decision-new`). There is no standalone `ethical-review` skill — ethics is enforced by these gates.

### Stage 5 — Architecture review
- **Purpose:** Confirm the change respects the engine contracts and bounded contexts (Canon §4): engines don't reach into each other's storage, the Coach Engine remains the only orchestrator, the model stays a scoped tool and never the decision-maker.
- **Entry gate:** Ethical review passed (for Sensitive); spec complete (for Standard that touches architecture).
- **Exit gate:** The affected engine boundaries are named; no cross-context storage access; LLM access goes through the Prompt Builder + structured-output layer; offline-first honored on iOS. If it **sets** architecture, an **ADR** is written and Accepted.
- **Owner:** Staff/lead engineer.
- **Output:** Architecture sign-off; an ADR when architecture is set.
- **Uses:** `architecture-review` skill, plus the surface-specific review (`backend-review`, `database-review`, or `ios-review`); `.claude/templates/adr-template.md` (via `/adr-new`).

### Stage 6 — Design Council review  ● *(mandatory for Sensitive — no exceptions)*
- **Purpose:** Convene the full lens panel (CONVENTIONS §4) on the whole feature, not one dimension. The Council holds the product's tensions in one room so no single lens quietly wins.
- **Entry gate:** Ethical (4) and Architecture (5) reviews passed.
- **Exit gate:** Council record produced with, **for each engaged lens: agreement · conflicts · tradeoffs · open questions · recommendation** (CONVENTIONS §4). A blocking conflict returns the change to the relevant earlier stage; it does not proceed on a tie.
- **Owner:** Design Council facilitator.
- **Output:** Council record.
- **Uses:** `design-council` skill/workflow, via `/design-council`.

### Stage 7 — Technical design
- **Purpose:** Turn the approved intent into a buildable design: interfaces, data changes, events, failure modes, and the consent/safety gates the code must sit behind.
- **Entry gate:** Reviews required by the tier have passed (see §3).
- **Exit gate:** Interfaces and data-model deltas are specified against Canon §5; understand-before-advise threshold is expressible in code; test + eval plan is drafted. ADR exists if architecture was set and not already recorded at Stage 5.
- **Owner:** Implementing engineer.
- **Output:** Technical design doc (+ ADR).
- **Uses:** `.claude/templates/technical-design.md`, `architecture-review` skill, `templates/adr-template.md`.

### Stage 8 — Implementation
- **Purpose:** Build it, clean, behind the right gates.
- **Entry gate:** Technical design approved.
- **Exit gate:** Code matches the design; every proactive action checks a consent scope; Safety Engine can hard-stop the relevant turn; no shaming language paths; no raw model access from feature code.
- **Owner:** Implementing engineer.
- **Output:** The implementing PR (draft).
- **Uses:** `docs/10 Engineering Principles.md`.

### Stage 9 — Testing
- **Purpose:** Prove behavior, including the tone and safety behavior we can't eyeball at scale.
- **Entry gate:** Implementation complete.
- **Exit gate:** Unit/integration tests green; **eval harness** green for any coaching/prompt change (tone lint, banned-word pass, crisis-handoff correctness — Canon §7 guardrails); understand-before-advise enforcement is tested.
- **Owner:** Implementing engineer + QA.
- **Output:** Test + eval results attached to the PR.
- **Uses:** `docs/13 Prompt Architecture.md` (evals), `docs/10 Engineering Principles.md`.

### Stage 10 — Release
- **Purpose:** Ship deliberately, with a way to see and undo the effect.
- **Entry gate:** Testing green; the PR checklist is runnable.
- **Exit gate:** `pr-check` checklist passes; rollout/rollback path exists; guardrail metrics are wired so Stage 11 can read them; release note written.
- **Owner:** Release owner.
- **Output:** Merged PR + release note.
- **Uses:** `.claude/checklists/pull-request.md` via `/pr-check`.

### Stage 11 — Post-release evaluation  ● *(mandatory for Sensitive — no exceptions)*
- **Purpose:** Close the loop. Did the change move the North Star **without degrading a guardrail**? We do not get to declare victory from the deploy dashboard.
- **Entry gate:** Change is live and has run long enough to read.
- **Exit gate:** Aligned Decision Rate (recovery-weighted) and every guardrail (trust, "the app gets me," crisis-handoff correctness, notification opt-out rate, zero shaming incidents) are read; a keep/iterate/roll-back decision is recorded; if it changed coaching policy, the PDR is updated with the observed outcome.
- **Owner:** Feature author + metrics owner.
- **Output:** Evaluation record.
- **Uses:** `.claude/templates/post-release-eval.md`; Canon §7 metrics; PDR update via `/decision-new` when policy changed.

---

## 3. Mapping stages to the change tier (CONVENTIONS §2)

This is the load-bearing table. **The tier decides which stages you run.** `●` = mandatory · `○` = skippable for this tier · `◐` = conditional (run only if the trigger applies).

| # | Stage | Trivial | Standard | Sensitive |
|---|---|:---:|:---:|:---:|
| 1 | Problem | ○ | ● | ● |
| 2 | User value | ○ | ● | ● |
| 3 | Psychological foundation | ○ | ◐ *(if behavioral)* | ● |
| 4 | **Ethical review** | ○ | ◐ *(if user-facing policy)* | **●** |
| 5 | Architecture review | ○ | ◐ *(if it sets architecture → ADR)* | ● |
| 6 | **Design Council** | ○ | ○ | **●** |
| 7 | Technical design | ○ | ● | ● |
| 8 | Implementation | ● | ● | ● |
| 9 | Testing | ◐ *(if any runtime surface)* | ● | ● |
| 10 | Release | ● | ● | ● |
| 11 | **Post-release evaluation** | ○ | ◐ *(if it touches a metric)* | **●** |

**Read it in words:**

- **Trivial** (copy fix, pure refactor, dep bump, non-behavioral change) runs only **Implementation → Release**, gated by the **PR checklist**. It may skip everything else. If it turns out to change behavior, it was never Trivial — re-tier and start over.
- **Standard** (new endpoint/screen/logic that is *not* sensitive) runs **Problem → User value → Technical design → Implementation → Testing → Release**, plus the *relevant* review skill and an **ADR if it sets architecture** (CONVENTIONS §2). It may skip **Design Council** and, unless the trigger applies, Psychological foundation, Ethical review, and Post-release evaluation.
- **Sensitive** (touches **coaching, safety, memory, privacy, notifications, identity, or the model**) runs **every stage, in order, no skips.** In particular it can **never** skip **Ethical review (4), Design Council (6), or Post-release evaluation (11).** These three are the price of touching a user's trust.

**Escalation is one-way.** Any reviewer at any stage may raise the tier. No one may lower it. If a Standard change is found to touch a Sensitive surface mid-flight, it stops and re-enters at the first stage its new tier requires.

---

## 4. Flow diagram (with gates)

```
                         ┌───────────────────────────────────────────┐
                         │  TIER GATE  (set at Stage 1, raise-only)    │
                         │  Trivial · Standard · Sensitive             │
                         └───────────────────────────────────────────┘
                                          │
        ┌─────────────────────────────────┼──────────────────────────────────┐
        │                                 │                                  │
     TRIVIAL                           STANDARD                           SENSITIVE
   copy / refactor            new & NOT sensitive          coaching·safety·memory·privacy·
        │                                 │                notifications·identity·model
        │                                 │                                  │
        │                        (1) Problem  ◇G1              (1) Problem  ◇G1
        │                        (2) User value  ◇G2           (2) User value  ◇G2
        │                        ○ (3) Psych found. ◐          (3) Psych foundation  ◇G3
        │                        ○ (4) Ethical review          (4) ETHICAL REVIEW ● ◇◇ (hard)
        │                        ◐ (5) Arch review → ADR       (5) Architecture review  ◇G5
        │                        ○ (6) Design Council          (6) DESIGN COUNCIL ● ◇◇ (hard)
        │                        (7) Technical design  ◇G7     (7) Technical design  ◇G7
        │                        (8) Implementation            (8) Implementation
        │                        (9) Testing  ◇G9              (9) Testing  ◇G9
        │                        (10) Release ◇PR-CHECK        (10) Release ◇PR-CHECK
        │                        ◐ (11) Post-release eval      (11) POST-RELEASE EVAL ● ◇◇ (hard)
        │                                 │                                  │
        └──► (8) Impl ──► (10) Release ◄──┴────── ◇ PR-CHECKLIST GATE ───────┘

  Legend:  ◇  = gate (must be green to pass)     ● = mandatory, no exception
           ◇◇ = the three non-negotiable Sensitive gates (Ethical · Council · Post-release)
           ○  = may skip at this tier              ◐ = conditional (run if trigger applies)
```

---

## 5. Entry points (thin commands)

| To… | Run | Which triggers |
|---|---|---|
| Start a new feature & set its tier | `/feature-new` | `feature-design` skill · `templates/feature-spec.md` · `checklists/new-feature.md` · this workflow |
| Route a change to the right review(s) | `/review` | the relevant review skill(s); auto-escalates to Sensitive |
| Convene the Design Council | `/design-council` | `design-council` skill |
| Record an architecture decision | `/adr-new` | `templates/adr-template.md` → `adr/` |
| Record a product/ethical decision | `/decision-new` | `templates/pdr-template.md` → `decisions/` |
| Run the pre-PR checklist | `/pr-check` | `checklists/pull-request.md` |

---

## Open questions / What we're deliberately NOT doing

- **Not** letting a deadline lower a tier or waive one of the three Sensitive gates. If that pressure exists, escalate it as a decision, don't route around the process.
- **Not** defining SLA/turnaround times for each gate yet — we'll set them once we know real review load, rather than inventing numbers now.
- **Open:** the exact "long enough to read" window for Stage 11 per surface (coaching vs notifications) — to be pinned per metric in Canon §7 follow-up.
- **Open:** whether Design Council can run async for a *lower-risk* Sensitive change, or must always convene live. Default today: live.

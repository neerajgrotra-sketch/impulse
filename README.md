# Impulse — Engineering

> The front door to how we build Impulse. If you are a new senior hire, read this top to bottom, then read [`docs/00 Canon.md`](docs/00%20Canon.md) and [`docs/15 Constitution.md`](docs/15%20Constitution.md). Those three give you the *what*, the *vocabulary*, and the *non-negotiables*. Everything else is a link away.

## What Impulse is

**Impulse is an AI decision coach that helps a person close the gap between the choice their Present Self wants to make and the life their Future Self wants to live** ([Canon §1](docs/00%20Canon.md)). Not a chatbot. Not a habit tracker. A coach that understands you, then helps you *think* — in the moment that matters. The full reasoning for the company is in [`docs/01 Vision.md`](docs/01%20Vision.md); the principles that govern every product decision are in [`docs/02 Product Philosophy.md`](docs/02%20Product%20Philosophy.md).

## Repository map

| Path | What it is |
|---|---|
| [`docs/`](docs/) | **The canon and the sixteen numbered documents (00–15).** What we're building and *why*. [`00 Canon.md`](docs/00%20Canon.md) is the source of truth for vocabulary, engine contracts, the data model, and the stack; it wins all ties. [`investor-prototype.md`](docs/investor-prototype.md) is a separate, self-contained spec for a temporary demo build — see `prototype/` below. |
| [`architecture/`](architecture/) | **The map of the system.** [`README.md`](architecture/README.md) is the index + C4 system-context; [`system-context.md`](architecture/system-context.md) goes one level deeper (request paths, boundaries, sync). It points at `docs/`, never duplicates it. |
| [`adr/`](adr/) | **Architecture Decision Records** — the immutable log of *structural/technical* choices and their reasoning. |
| [`decisions/`](decisions/) | **Product / Ethical Decision Records (PDRs)** — the log of *user-facing behavior, coaching policy, and ethics* choices the Constitution cares about. |
| [`.rules/`](.rules/README.md) | **Binding constraints.** MUST / SHOULD / NEVER statements, each with a WHY, that you follow when you build. [`.rules/README.md`](.rules/README.md) indexes them. |
| [`.claude/CONVENTIONS.md`](.claude/CONVENTIONS.md) | **How we author every asset** so skills, rules, ADRs, and templates read as one system. |
| [`.claude/skills/`](.claude/skills/) | **Review skills** — the judgment CI can't encode: `architecture-review`, `backend-review`, `ios-review`, `security-review`, `behavioral-review`, `design-council`. |
| [`.claude/templates/`](.claude/templates/) | Templates for the assets you produce — `feature-spec.md`, `technical-design.md` (and the ADR/PDR templates the records use). |
| [`.claude/commands/`](.claude/commands/), [`.claude/workflows/`](.claude/workflows/), [`.claude/checklists/`](.claude/checklists/) | Thin routes into skills/workflows, the lifecycle steps, and copy-pasteable PR gates. |
| [`.github/`](.github/) | Issue templates and CI workflows — the automated half of enforcement (tests, tone/banned-word pass, eval gate, secret scanning). |
| [`prototype/`](prototype/) | **The investor demo** ([`docs/investor-prototype.md`](docs/investor-prototype.md)) — onboarding → Human Blueprint only, deliberately out of scope from the production architecture above. `prototype/ios/` (Swift/SwiftUI) is the completed **design specification**; `prototype/expo/` (React Native + Expo) is the **active build**, chosen so the app runs on a physical iPhone with no Mac in the loop. `prototype/backend/` (one Supabase Edge Function) is shared by both and unchanged either way. |

## The engineering operating system, in brief

We run a real operating system for building, and it is **heavy on purpose — but only for changes that can hurt a user.** The core simplifying idea is the **change-tiering model** ([Conventions §2](.claude/CONVENTIONS.md)):

| Tier | Trigger | Process |
|---|---|---|
| **Trivial** | copy fix, pure refactor, dep bump, non-behavioral change | PR checklist only |
| **Standard** | new endpoint/screen/logic that is NOT sensitive | feature-spec + relevant review skill + ADR *if* it sets architecture |
| **Sensitive** | touches **coaching, safety, memory, privacy, notifications, identity, or the model** | full feature lifecycle + Design Council + ethical review. No exceptions. |

**When in doubt, tier up** — over-reviewing a trivial change costs minutes; under-reviewing a coaching change costs a user's trust.

The rest of the OS hangs off that model:

- **The feature lifecycle** — a Sensitive change flows spec → behavioral review → Design Council → build → review skills → ship. Trivial and Standard changes take the short paths above.
- **The [Design Council](.claude/skills/design-council/SKILL.md)** — mandatory for Sensitive-tier work. It reviews a proposal through fifteen behavioral, philosophical, and design **lenses** (Kahneman, Thaler, Fogg, Clear, Dweck, Rams, Krug… — [Conventions §4](.claude/CONVENTIONS.md)). We apply the named *principle*, we do not roleplay the person, and every lens must surface agreement · conflicts · tradeoffs · open questions · recommendation.
- **ADRs vs PDRs** — [`adr/`](adr/) records *architecture* ("we use a modular monolith"); [`decisions/`](decisions/) records *product/ethical* policy ("how a Nudge earns the right to interrupt"). Both are immutable once accepted — you supersede, never edit.
- **Rules** — [`.rules/`](.rules/README.md) are the constraints you must follow, each with a WHY, enforced by CI, review skills, checklists, and human judgment in increasing order.
- **Skills** — the [review skills](.claude/skills/) carry the judgment a linter can't; the tier decides which run.

Read the map of the system itself in [`architecture/README.md`](architecture/README.md).

## How do I…

| I want to… | Do this |
|---|---|
| **Start a feature** | Tier it (above). Copy [`.claude/templates/feature-spec.md`](.claude/templates/feature-spec.md); for a Standard+ change add [`technical-design.md`](.claude/templates/technical-design.md). Check the relevant [`.rules/`](.rules/README.md) before writing code. |
| **Review a change** | Run the review skill(s) that match what it touches — [`backend-review`](.claude/skills/backend-review/SKILL.md), [`ios-review`](.claude/skills/ios-review/SKILL.md), [`architecture-review`](.claude/skills/architecture-review/SKILL.md), [`security-review`](.claude/skills/security-review/SKILL.md) — plus [`behavioral-review`](.claude/skills/behavioral-review/SKILL.md) for anything that coaches. |
| **Record a decision** | Architecture → new [`adr/`](adr/) entry. User-facing behavior or ethics → new [`decisions/`](decisions/) PDR. Number monotonically; mark `Proposed → Accepted`. |
| **Convene the Council** | Any Sensitive-tier change: run [`design-council`](.claude/skills/design-council/SKILL.md) on the feature-spec *before* build. It is a prerequisite, not a post-hoc sign-off. |

## The non-negotiables

Some things are not up for trade. They are law in [`docs/15 Constitution.md`](docs/15%20Constitution.md), and every document, feature, and model output is subordinate to it.

- **Safety pre-empts everything.** The Safety Engine screens every inbound turn and can hard-stop any coaching move. It gates launch.
- **The Covenant** — our binding promise about how we treat a person's data and their dignity. Trust is the product ([Canon principle #7](docs/00%20Canon.md)): privacy and safety are architecture, not features.
- **No shaming, ever.** The banned-word list (*fail, cheat, streak-broken, weak, should have, guilt…*) is enforced by a tone pass on Coach output. A Lapse is expected, never a verdict.
- **Consent is a gate, not a checkbox.** Every proactive action checks a consent scope before it acts.

If a change would bend one of these, it is wrong — stop and open a [PDR](decisions/) or take it to the Council.

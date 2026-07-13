# Authoring Conventions — Impulse Engineering OS

> **Status:** Living document. **Audience:** every human and agent that writes an asset in this repo.
> **Purpose:** so that skills, rules, ADRs, checklists, and templates read as one system written by one team. If an asset contradicts this file, fix the asset. If this file is wrong, change it deliberately and note why.

This is the source of truth for **how we write our engineering assets**. The source of truth for **what we're building** is [`docs/00 Canon.md`](../docs/00%20Canon.md) — read it first; every asset must use its vocabulary verbatim.

---

## 1. House voice (identical to docs house style)

- Senior, calm, opinionated **with reasons**. First-person plural ("we").
- **Every rule, check, and step explains WHY, not just WHAT.** A rule without a reason is unenforceable and will be cargo-culted or ignored.
- Dieter Rams: *less, but better.* No padding, no motivational filler, no restating the prompt.
- Use the canon vocabulary (`docs/00 Canon.md` §2) exactly. Never invent a synonym for a canon term.
- Cross-link by relative path. Assets that don't link to the rest of the system rot in isolation.

## 2. The change-tiering model (the central simplifying principle)

The operating system is heavy on purpose — but **only for changes that can hurt a user.** Every process asset must state which tier it applies to.

| Tier | Trigger | Process required |
|---|---|---|
| **Trivial** | copy fix, pure refactor, dep bump, non-behavioral change | PR checklist only |
| **Standard** | new endpoint/screen/logic that is NOT sensitive | feature-spec + relevant review skill + ADR *if* it sets architecture |
| **Sensitive** | touches **coaching, safety, memory, privacy, notifications, identity, or the model** | full feature lifecycle + Design Council + ethical review. No exceptions, no shortcuts. |

When in doubt, tier **up**. The cost of over-reviewing a trivial change is minutes; the cost of under-reviewing a coaching change is a user's trust.

## 3. Asset formats

### Rule file (`.rules/<topic>.md`)
Frontmatter-free markdown. Structure:
- One-line purpose + scope (who/what it governs).
- A numbered list of rules. **Each rule = a MUST/SHOULD/NEVER statement + a one-line WHY.** Use RFC-2119 keywords (MUST, SHOULD, MAY, NEVER).
- A short "How this is enforced" note (review skill, CI, checklist, or human judgment).
- Keep to the rules that matter. 8–20 rules per file. A 60-rule file is a file nobody reads.

### Skill (`.claude/skills/<name>/SKILL.md`)
YAML frontmatter (`name`, `description` — description states *when* to invoke, in one sentence, third person). Body sections, in order:
`## Purpose` · `## When to use` (+ tier) · `## Inputs` · `## Outputs` · `## Checklist` · `## Success criteria` · `## Failure criteria`.
The checklist is the heart — concrete, verifiable items, not vibes. Success/failure criteria must be observable ("no shaming language in any Coach output" — not "good tone").

### ADR (`adr/NNNN-title.md`)
Uses the template in `.claude/templates/adr-template.md`. Statuses: `Proposed → Accepted → Superseded/Deprecated`. Immutable once Accepted — supersede, never edit the decision. Number monotonically.

### Product/Ethical Decision Record (`decisions/NNNN-title.md`)
Uses `.claude/templates/pdr-template.md`. Same lifecycle as ADRs. These record decisions about *user-facing behavior, ethics, and coaching policy* — the things the Constitution cares about.

### Checklist (`.claude/checklists/<name>.md`)
A flat, copy-pasteable list of `- [ ]` items grouped by phase. Every item actionable and checkable. State the tier it applies to at top. Cross-link the rule/skill each cluster enforces.

### Command (`.claude/commands/<name>.md`)
Thin. A short instruction that routes to a skill/workflow/template. Commands never duplicate a skill's content — they invoke it.

## 4. The thinker → principle map (shared canon for Design Council & behavioral-review)

We do **not** roleplay these people. We apply the **named principle** from their published work as an analytical lens. Every behavioral/coaching feature is examined through the relevant subset.

| Lens | Principle(s) we apply | The question it forces |
|---|---|---|
| **Kahneman** | System 1/2; present bias, loss aversion, anchoring, availability; affective forecasting; peak-end rule | Where does this rely on System 1 vs 2? Which bias does it exploit vs mitigate? |
| **Thaler** | Choice architecture; nudges; defaults; friction; mental accounting | Are defaults and friction placed to *help*, not trap? Is the choice architecture honest? |
| **Fogg** | B = MAP (Motivation·Ability·Prompt); tiny habits; celebration | Is the prompt fired only when ability + motivation are present? Is the ask tiny? |
| **Clear** | Identity-based habits; systems > goals; make it obvious/attractive/easy/satisfying; environment design | Does it reinforce *identity*, and make the aligned choice the easy one? |
| **Huberman** | Dopamine/reward dynamics; circadian & state timing; neuroplasticity conditions | Is it timing/state-aware? Does it protect the dopamine baseline vs create dependency? |
| **Duhigg** | Habit loop (cue → routine → reward); keystone habits; craving | Are cue/routine/reward explicit? Do we swap the routine while honoring cue + reward? |
| **Dweck** | Growth vs fixed mindset; praise process not trait; "yet" | Does feedback build a growth mindset? Is a Lapse framed as learning, never a verdict? |
| **Bandura** | Self-efficacy; mastery experiences; social persuasion; self-regulation | Does it build efficacy through small wins, or risk learned helplessness? |
| **Aurelius** | Dichotomy of control; view from above; virtue as the good | Does it focus the user on what they control and lower outcome anxiety? |
| **Epictetus** | Control dichotomy; impressions vs events; discipline of assent | Do we help reframe the *impression* rather than chase the external? |
| **Aristotle** | Telos; virtue by habituation; the golden mean; phronesis; eudaimonia | Does it cultivate practical wisdom and the mean, serving flourishing over pleasure? |
| **Jobs** | Focus (the power of no); integrated experience; start from the user experience | What did we say *no* to? Is the experience whole, not a feature pile? |
| **Rams** | Ten principles of good design; "less, but better"; honest, unobtrusive, long-lasting | Is it honest and unobtrusive — as little design as possible? |
| **Krug** | "Don't make me think"; self-evidence; minimize cognitive load; conventions | Is it self-evident in the moment of temptation? |
| **Christensen** | Jobs-to-be-Done; disruption; hire/fire | What job did the user hire this for? Does it serve *that* job? |

Design Council output must, for each engaged lens, surface: **agreement · conflicts · tradeoffs · open questions · recommendation.**

## 5. What we do NOT create

- No placeholder files. If an asset has nothing real to say yet, don't create it.
- No asset that only restates the prompt or another asset.
- No process step that has no owner and no output.

# ADR 0013 — Runtime reconciliation and concept consolidation

> **Status:** Proposed
> **Date:** 2026-07
> **Deciders:** Neeraj Grotra (founder)
> **A note on location and numbering:** by `adr/README.md`'s own test ("if the decision would change the Constitution's obligations, it's a PDR; if it changes the architecture, it's an ADR"), every decision in this document is architectural — engine topology, vocabulary, data flow, prompt structure. No user-facing behavior or ethical obligation changes here. This should live at `adr/0009-...md` by that test. It is filed at `decisions/0013-...md` instead, per explicit instruction, continuing this project's chronological decision sequence rather than the category-separated one — the same kind of path/numbering choice `docs/pdr/PDR-0011-...md` already made for itself and flagged rather than silently resolved. Flagged here for the same reason: worth a future decision on whether to relocate, not yet made.
> **Supersedes / amends:** **Supersedes `adr/0008-next-moment-engine-architecture.md` outright** — that ADR never reached Accepted status (it shipped "Proposed, pending Design Council review" and stayed there even after `decisions/0010` reviewed it), so this is a clean supersession, not an edit of a frozen decision. Its safety-tier logic, eval requirements, and deterministic-fallback contract are **not discarded** — see Part 2 and the Migration Plan for exactly where each piece lands. **Identifies required amendments** to `docs/coaching-constitution-v1.md` (Parts 4, 5, 9) and `docs/pdr/PDR-0011-...md` (D4) without editing either directly — both remain Draft/Proposed and get their own redline pass per their own governance sections, per the Migration Plan. **Does not change** any policy decision in `decisions/0006`, `0007`, `0010`, `0012` — only which runtime component implements them.

---

## Context

The System Architecture Coherence Review (this conversation, 2026-07-14) found a C-grade coherence problem with one root cause, correctly named by the founder's framing of this ADR: **not too many concepts, but the same concepts invented independently, more than once, under different names, with no single document reconciling them.** Concretely: `docs/coaching-constitution-v1.md` introduced "Experience Engine" and "Moment Engine" without a contract and admits as much in its own text; `adr/0008` independently built a "Next-Moment Engine" with a precise but onboarding-only contract; `decisions/0012` introduced "Life Dimension Engine" and "Thought Generation Engine" as two more. `04 AI Brain.md` §2's nine-engine topology, with the Coach Engine as sole orchestrator, was never updated to absorb any of this. The result: an engineer building strictly from any one of these documents would build a different runtime than one building from another.

This ADR's job is narrow and stated by the founder in advance: reconcile, do not add. No new engines unless absolutely necessary (none were found to be necessary). No onboarding redesign — Vision Canvas, the choreography, and PDR 0012's policy decisions are untouched. No prompt rewrites — only the Prompt Builder's layer *structure* is clarified, not its content. The test for success is a whiteboard test: a new senior engineer should be able to reconstruct the whole runtime in fifteen minutes and explain it in five.

---

## Decision

**We keep the nine engines `04 AI Brain.md` §2 already named, add zero new engines, and resolve every runtime concept discovered by the coherence review into one of: an existing engine's expanded output, a data contract owned by an existing engine, a taxonomy amendment, a rename, or a removal.** The Coach Engine remains the sole orchestrator, unconditionally — every "new engine" proposed by a later document turns out, on inspection, to be either a role Coach Engine already has (described a second time) or a capability that belongs inside an existing engine's bounded context (most often Identity or Learning). Full resolution below.

### Part 1 — Runtime responsibilities, concept by concept

| Concept | Purpose | Inputs | Outputs | Owner | Consumers | Can live elsewhere? | Verdict |
|---|---|---|---|---|---|---|---|
| **Coach Engine** | Orchestrate every turn — ordinary dialogue, onboarding beats, and inspiration generation alike; choose the Coaching Beat and Coaching Move | Safety clearance, Emotion/Identity/Memory/Decision outputs, user turn | Chosen Beat + Move, assembled context for Prompt Builder | Coach Engine | Prompt Builder, client UI, Event Bus | No — `04 AI Brain.md` §2's whole reason for one orchestrator is that this responsibility can't be split without losing the single home for understand-before-advise | **Remains, unchanged in kind, expanded in scope** (now explicitly covers onboarding-beat and inspiration-generation turns, not only ordinary dialogue) |
| **Experience Engine** *(Coaching Constitution v1)* | Never given a contract — the document names it, then flags its own relationship to Coach Engine as an open question | — | — | — | — | Yes — everything it was meant to do is already Coach Engine's job (AI Brain §3 step 5: "Coach chooses a move") | **Disappears.** Never had distinct responsibilities to preserve. |
| **Moment Engine** *(Coaching Constitution v1)* | Same as Experience Engine — undefined, flagged by its own source document as unreconciled | — | — | — | — | Yes, same reasoning | **Disappears**, same reason. |
| **Next-Moment Engine** *(ADR 0008)* | Classify a user's onboarding response, propose one next Beat, carry the riskTier safety check | User's settled text (onboarding) | `GeneratedMoment`-shaped classification + risk tier | Was: a standalone module | Was: `MomentState` machine | Yes — this is structurally identical to AI Brain §3 step 5 ("Coach chooses a move") applied to one surface; Safety triage (step 1) already runs first regardless of surface | **Disappears as a separate engine.** Its contract survives whole — see Part 2. |
| **Prompt Builder** | The one chokepoint assembling layered prompts and calling the LLM gateway | Engine outputs (widened, see Part 5), user turn | Layered prompt → LLM → validated structured output | Prompt Builder | Coach Engine (caller), every engine indirectly | No — this is Canon §6's single-chokepoint rule; the one clearly single-responsibility concept in the whole review | **Remains unchanged in role; Layer 2/4 contents widened (Part 5).** |
| **Psychological State** *(Coaching Constitution Part 5)* | Per-turn beliefs about the user's current state, tiered Observed/Inferred/Unknown | Identity, Emotion, Memory, Decision outputs already assembled each turn | One coherent per-turn record | Coach Engine (assembler) | Prompt Builder Layer 2 | No new store needed — it's a reconciled *schema* over data Coach Engine already gathers each turn (AI Brain §3 steps 2–4) | **Remains as a data contract, not a new engine. Confidence and Self-efficacy merge (see Merged Concepts).** |
| **Relationship Health** *(PDR 0011 D4)* | Longitudinal, relationship-level signal — is the relationship trending toward independence or reliance | Aggregated Psychological State + interaction-shape data across sessions | Coarse pacing signals (throttle initiative: y/n, etc.), never raw scores | Learning Engine | Coach Engine (folded into next turn's stable context, not queried live) | No new engine needed — this is exactly Learning Engine's existing job ("learn from outcomes, update the model... off the hot path") | **Remains as a data contract, owned by Learning Engine. Three dimensions merge (see Merged Concepts).** |
| **Life Understanding** *(PDR 0012 Step 0)* | The initial and ongoing act of ranking which Life Dimensions matter to this user | Name, conversation content over time (see Part 7 — not a fixed question set) | Ranked Life Dimension relevance | Identity Engine | Coach Engine, Prompt Builder Layer 2 | No new engine needed — "model who the user is becoming" is Identity Engine's job today; ranking dimensions is the same job, a new output field | **Remains as a phase/capability name, not an engine. Owner: Identity Engine.** |
| **Life Dimensions** *(PDR 0012)* | The canonical, product-wide taxonomy of enduring life areas | User content over time | Ranked relevance scores, internal only | Identity Engine | Coach Engine (via Identity Engine), Prompt Builder | Taxonomy stays; the *engine* proposed to own it (Life Dimension Engine) does not need to exist | **Taxonomy remains (product-wide, per Part 6). Owning engine: Identity Engine, not a new one.** |
| **Thought Generation** *(PDR 0012)* | Generate inspiration fragments from ranked Life Dimensions | Identity Engine's ranked dimensions | ~50 candidate fragments | Was: a standalone "Thought Generation Engine" | Client (surfaced 5–8 at a time) | Yes — this is language generation from a frame, exactly AI Brain §3's ordinary turn shape (frame → Coach chooses the move "generate inspiration" → Prompt Builder → LLM), just not a dialogue reply | **Disappears as a separate engine.** Becomes a Coach-Engine-orchestrated turn type through the existing Prompt Builder path. |
| **Identity Fragments / Vision Canvas** *(PDR 0012)* | Client-side capture/edit surface for up to five identity fragments before confirmation | Generated thoughts, voice, typed text, paste | Confirmed fragments → Identity Engine's `identity_statements[]` | Client UI (capture), Identity Engine (storage of confirmed content) | Coach Engine, Identity Engine | N/A — this was never an engine, it's a UI/data-capture surface | **Remains exactly as `decisions/0012` decided.** Not an engine, not touched further here (onboarding redesign is out of scope). |
| **Coaching Move** *(Canon §2)* | The literal 7-value enum the model's structured output returns (Reflect / Reframe / Question / Contrast / Commit / Affirm / Hold-Silence) | Chosen by Coach Engine within the current Beat | The rendered dialogue action | Coach Engine chooses, LLM performs | Prompt Builder's structured-output schema, client UI | No | **Remains exactly as Canon §2 defines it — the mechanism, not the phase.** |
| **Moment** *(Coaching Constitution Part 4, 20 items)* | A psychological phase spanning onboarding and ongoing coaching, constraining which Coaching Moves are eligible | Coach Engine's assembled Psychological State | The current phase (Arrival, Curiosity, ... Closing) | Coach Engine | Determines eligible Coaching Moves, Prompt Builder Layer 2 | N/A | **Renamed to Coaching Beat (Part 6) to stop colliding with Impulse Moment. One item added (Expression). "Clarification" name normalized. "Interpreting" removed as a visible state — see Merged/Removed Concepts.** |
| **Impulse Moment** *(Canon §2)* | A real-world decision point — Present vs. Future Self tension. The atomic unit the whole product exists to help with. | User's real-life situation | A Decision (Canon §5 aggregate) | Decision Engine | Coach Engine, Learning Engine (Outcomes) | No | **Remains completely unchanged.** Now the sole owner of the word "Moment" going forward (Part 6). |

### Part 2 — Engine reconciliation

**Nine engines. Zero new engines.** `04 AI Brain.md` §2's original topology is correct and sufficient; nothing found in the coherence review required a tenth. What changes is scope, not count:

| Engine | Change from `04 AI Brain.md` §2 |
|---|---|
| **Identity Engine** | Gains one new output: Life Dimension relevance ranking, alongside its existing `values[]` / `identity_statements[]` / `future_self_narrative`. Same bounded context, same "model who the user is becoming" job — ranking which life areas matter is that job, not a new one. |
| **Coach Engine** | Gains two new turn *types*, using its existing spine (`04 AI Brain.md` §3, steps 1–8) unchanged: an **onboarding-beat turn** (absorbs the Next-Moment Engine's classify-and-propose contract, its `riskTier` safety logic, its deterministic fallback, and its eval requirements from ADR 0008 §4/§7/§9 — none of that is lost, all of it becomes "how Coach Engine chooses a Beat on the identity-capture surface") and an **inspiration-generation turn** (absorbs Thought Generation — same spine, the "move" is "generate N fragments" instead of Reflect/Question). |
| **Learning Engine** | Gains Relationship Health computation as its async, off-the-bus job — this is exactly what `04 AI Brain.md` §2 already says Learning Engine does ("learn from outcomes, update the model... never blocks a turn"), just with PDR 0011 D4's specific dimensions as the thing being learned. |
| **Emotion, Memory, Decision, Notification, Prompt Builder, Safety** | Unchanged. |

**Why this is the minimum, not an elegance exercise:** every eliminated "engine" was either undefined (Experience/Moment Engine — nothing to preserve) or was doing a job an existing engine's bounded context already covers by its own stated definition (Next-Moment Engine ⊂ Coach Engine's move-selection; Life Dimension/Thought Generation ⊂ Identity Engine's modeling + Coach Engine's generation). Keeping them as separate engines would mean two engines both claiming "decide what happens next" (Coach Engine and Moment Engine) or two claiming "model the user" (Identity Engine and Life Dimension Engine) — exactly the ambiguity `04 AI Brain.md` §7 warns against ("only the Coach composes... every other engine answers a narrow question").

### Part 3 — Canonical vocabulary

One meaning per term, going forward. Where a document already used a term differently, that document needs the amendment named in the Migration Plan — this table is the target state, not a description of what's on disk today.

| Official name | Definition | Used in | Must NOT be used for |
|---|---|---|---|
| **Impulse Moment** | A real-world decision point where Present Self and Future Self are in tension (Canon §2). The atomic event of the product. | Decision Engine, Learning Engine (Outcomes), product vocabulary generally | The coaching-dialogue phase concept — that is now **Coaching Beat** |
| **Coaching Beat** *(renamed from "Moment," Coaching Constitution Part 4)* | One of 21 named psychological phases (20 existing + Expression) spanning onboarding and ongoing coaching — Arrival, Curiosity, Inspiration, Expression, Reflection, Recognition, Clarification, Values Discovery, Motivation Discovery, Obstacle Discovery, Reframing, Specificity, Ownership, Commitment, Planning, Momentum, Celebration, Repair, Recovery, Recommitment, Closing. Product-wide. | Coach Engine's phase selection, Prompt Builder Layer 2 | A real-world event (that's Impulse Moment); a single dialogue action (that's Coaching Move) |
| **Coaching Move** | The 7-value structured-output enum the model actually returns: Reflect, Reframe, Question, Contrast, Commit, Affirm, Hold-Silence (Canon §2). The action taken *within* a Coaching Beat. | Prompt Builder's `CoachTurnOutput` schema, `07 Coaching Engine.md` | A phase/context (that's Coaching Beat) |
| **MomentState** *(ADR 0008)* | Retired as a distinct term. It was always the onboarding-specific subset of Coaching Beat (arrival, curiosity, inspiration, expression, recognition, clarification, ownership, commitment) — see the mapping in Merged Concepts. | — (historical, superseded) | Anywhere — use Coaching Beat |
| **Identity Fragment / Vision Canvas** | The client-side capture surface for up to five editable, user-authored fragments before confirmation (per `decisions/0012`). Not an engine. | Onboarding client, Identity Engine (on confirmation) | A synonym for `identity_statements[]` itself — a Canvas fragment is pre-confirmation; an `identity_statement` is the confirmed, persisted form |
| **Life Dimensions** | The canonical, product-wide, ~15-item taxonomy of enduring life areas (Health & Energy, Relationships, ... Legacy — `decisions/0012`). Internal ranking only, never shown as a score. | Identity Engine's output, Prompt Builder Layer 2 | Interchangeably with `Identity.values[]` — see Remaining Open Questions; not yet resolved whether these merge |
| **Life Understanding** | The ongoing act (not a one-time step) of ranking Life Dimension relevance from available signal. Not an engine — a capability of Identity Engine. | Identity Engine | A fixed onboarding step name implying a fixed question set — see Part 7 |
| **Psychological State** | The per-turn, tiered (Observed/Inferred/Unknown) record of ten dimensions (Values, Motivation, Confidence, Specificity, Readiness, Emotional tone, Language style, Consistency, Commitment, Ambiguity, Trust — Self-efficacy merged into Confidence, see Merged Concepts). Assembled by Coach Engine each turn, not stored as a separate engine. | Coach Engine (assembler), Prompt Builder Layer 2 | A relationship-level or longitudinal record (that's Relationship Health) |
| **Relationship Health** | The relationship-level, longitudinal signal (Autonomy, Trust, Dependence Risk, Initiative, Reflection Depth, Ownership, Relationship Stage, Self-efficacy-trend — nine dimensions after merging Coach Reliance and Need for Reassurance into Dependence Risk, see Merged Concepts) computed by Learning Engine, never queried live. | Learning Engine (computation), folded into Coach Engine's stable context | A per-turn signal (that's Psychological State) |
| **Confidence** | One canonical 0–1 scale. Model-reported confidence is normalized by Prompt Builder (the one place that already knows which model/tier answered) before any downstream threshold compares it. | Every field currently called "confidence" anywhere in the system | A synonym for Alignment score (unrelated, Decision Engine-owned, never shown to the user) |

### Part 4 — Canonical data flow

One flow. Every step has exactly one owner. No duplicate classifiers.

```
 USER RESPONSE (any surface: onboarding beat, daily dialogue, weekly Reflection)
  │
  ▼
 SAFETY TRIAGE ─────────────── Safety Engine · risk tier · can hard-stop here, unconditionally
  │  safe
  ▼
 EMOTION CLASSIFY ──────────── Emotion Engine · EmotionSignal (computed once, reused everywhere
  │                             it's needed — not re-derived by Psychological State separately)
  ▼
 IDENTITY / LIFE DIMENSION READ ── Identity Engine · identity model + ranked Life Dimensions
  │
  ▼
 MEMORY RETRIEVE ───────────── Memory Engine · episodic + semantic + pattern
  │
  ▼
 FRAME ──────────────────────── Decision Engine (ordinary Impulse-Moment turns) OR
  │                             Identity Engine's ranked dimensions + Vision Canvas contents
  │                             (onboarding-beat / inspiration-generation turns) — same slot,
  │                             turn-type-dependent payload, not two parallel pipelines
  ▼
 COACH ENGINE CHOOSES ──────── the current Coaching Beat + the Coaching Move (or, for an
  │                             onboarding beat, the next Beat; or, for inspiration generation,
  │                             the content strategy) — one decision point, one owner
  ▼
 PROMPT BUILDER ─────────────── assembles the layered prompt (Part 5)
  │
  ▼
 LLM ─────────────────────────── tiered, provider-abstracted gateway
  │
  ▼
 POST-VALIDATION ─────────────── schema check, tone/no-shaming lint, Safety Engine re-check —
  │                              same gate regardless of turn type
  ▼
 UI (client render)
  │
  ╘═══ EVENT BUS (async, off the hot path) ═══╗
                                                ├─▶ LEARNING ENGINE — updates priors, mines
                                                │    Insights, recomputes Relationship Health
                                                │    (folded into Coach Engine's *next* turn,
                                                │    never queried live)
                                                └─▶ NOTIFICATION ENGINE — schedules a Nudge,
                                                     consent-gated
```

No step is duplicated. Emotion is classified exactly once per turn and reused by every consumer (Psychological State's "Emotional tone" dimension is that same `EmotionSignal`, not a second classification — this is the fix for the review's finding of 3–4 overlapping classifiers). Confidence is normalized exactly once, at Prompt Builder, before any threshold anywhere compares it.

### Part 5 — Prompt Builder alignment

**Prompt Builder evolves. Nothing belongs "elsewhere," because there is no valid elsewhere** — Canon §6's single-chokepoint rule means any content reaching the model must pass through here or the rule is violated. The five layers (`13 Prompt Architecture.md` §2) stay five; two widen:

- **Layer 1 (Constitution)** — unchanged.
- **Layer 2 (Engine Context)** — widened from {Identity, EmotionSignal, current Coaching Move} to **{Identity model + ranked Life Dimensions, EmotionSignal, Psychological State record, current Coaching Beat, current Coaching Move, Relationship-Health-derived pacing signal}**. Still stable-within-a-session, still the cacheable layer — Relationship Health enters here as a **precomputed, coarse signal** (e.g., "throttle initiative: yes"), never as raw longitudinal data queried live, so it never touches the hot path's latency budget.
- **Layer 3 (Retrieved Memory)** — unchanged.
- **Layer 4 (Decision Frame)** — **same slot, turn-type-dependent payload**: a Decision Engine frame for ordinary Impulse-Moment turns; Identity Engine's ranked Life Dimensions + Vision Canvas contents for onboarding-beat or inspiration-generation turns. One layer, one position in the stack, no new layer added.
- **Layer 5 (User Turn)** — unchanged.

This is one canonical prompt-context structure across every surface — onboarding, daily coaching, weekly Reflection — rather than a parallel structure per surface.

### Part 6 — Canonical taxonomies

| Taxonomy | Scope | Disposition |
|---|---|---|
| **Coaching Beat** (21 items) | Product-wide | Remains, with Expression added and "interpreting" removed (Merged/Removed Concepts) |
| **Coaching Move** (7 items) | Product-wide | Remains unchanged |
| **Life Dimensions** (~15 items) | Product-wide (per the founder's own stated intent in `decisions/0012`) | Remains; owning engine changes (Part 2) |
| **Psychological State** (10 dimensions post-merge) | Product-wide, per-turn | Remains as a data contract |
| **Relationship Health** (9 dimensions post-merge) | Product-wide, relationship-level | Remains as a data contract |
| **MomentState** (ADR 0008, 9 items) | Was onboarding-only | **Disappears as a separate taxonomy** — it was always the onboarding subset of Coaching Beat; see the explicit mapping below |

**The MomentState → Coaching Beat mapping**, which resolves the exact contradiction the coherence review found:

| ADR 0008 `MomentState` | Coaching Beat (Part 4, amended) |
|---|---|
| `arrival` | Arrival |
| `curiosity` | Curiosity |
| `inspiration` | Inspiration |
| `expression` | **Expression** *(new — see below)* |
| `recognition` | Recognition |
| `interpreting` | **Not a Beat.** This was always Coach Engine's internal, ideally-invisible move-selection step (identical in kind to the unnamed gap between any ordinary dialogue turn's Memory-retrieve and Coach-chooses-a-move steps) — not a felt psychological phase. Removed as a visible state, exactly as ordinary coaching turns have never had one. |
| `clarifying` | Clarification *(name normalized)* |
| `ownership` | Ownership |
| `commitment` | Commitment |

**Expression is the one genuine gap this reconciliation closes, not a new taxonomy invented here.** Part 4 jumps from Inspiration directly to Reflection ("mirror the user's own meaning back"), silently assuming the user's words already exist. ADR 0008 correctly identified that the act of producing those words — speaking or typing — is its own phase, with its own rules (keyboard only on explicit action, voice and text equally weighted, nothing auto-focused). Adding **Expression** — *purpose:* let the user externalize a thought through whichever channel feels natural; *transitions:* → Reflection/Recognition; *forbidden:* auto-summoning input, treating one modality as primary — closes this gap in the product-wide taxonomy rather than leaving it as an onboarding-only quirk in a parallel enum.

### Part 7 — Step 0, revisited

Three options, evaluated on the five named axes:

| | **A. Name, Age, Life Stage, Current Focus** | **B. Name only, everything else inferred** | **C. No profile questions, conversation begins immediately** |
|---|---|---|---|
| **User trust** | Risks reading as a form before any relationship exists — the exact shape `decisions/0006` already rejected once, just smaller | Being addressed by name is a real trust signal at near-zero cost; nothing else asked before it's earned | Slightly colder open — no personalization signal at all until the user volunteers something |
| **Coaching quality** | More upfront signal, but PDR 0006's own finding was that volume doesn't correlate with quality here — one to two open prompts already seed a usable Identity Statement | Life Dimension ranking starts uninformed (flat/weak prior) and sharpens fast once real content arrives via Curiosity/Inspiration/Expression — the same mechanism `decisions/0012` already specifies for ongoing re-ranking, just started one step earlier than asking | Same as B, minus even the name — loses a cheap personalization win for no real gain |
| **Blank-page anxiety** | Lowest — the user has something concrete to answer before facing the open question | Low — a name is trivial to supply and doesn't compete with the open question's own inspiration/thought-stream scaffolding | Marginally higher than B for zero benefit — nothing is gained by cutting the name |
| **AI quality** | Slightly more initial context to rank Life Dimensions from | Adequate — the ranking model already has to handle sparse/evolving signal by design (`decisions/0012`'s "only regenerate when rankings change meaningfully") | Same as B, marginally sparser at turn one only |
| **Privacy** | Age and Life Stage are exactly the kind of demographic collection `.claude/checklists/onboarding-change.md` already prohibits ("no demographics beyond locale, no life-domain surveys") absent a stated per-field justification | Name is not sensitive and is already collected in some form by any product; nothing else asked until the user offers it | Marginally better than B, not meaningfully so |

**Recommendation: Option B.** Ask for a first name only (a relational nicety, not a demographic data point, and cheap enough that cutting it gains nothing per the table above). Everything else Step 0 currently asks — Life Stage, Current Focus — becomes **inferred, continuously, from the same Curiosity/Inspiration/Expression content Coaching Beat already collects**, using the exact re-ranking mechanism `decisions/0012` Step 3 already specifies, just started at first contact instead of after an explicit question. If a user volunteers their life stage or focus unprompted, Identity Engine ingests it the same way it ingests anything else the user says — this is user-initiated disclosure, not app-initiated interrogation, and is fully consistent with `decisions/0006`'s standing rejection of the fixed-interview shape. This is a data-acquisition strategy decision, not an onboarding redesign — it changes where Life Stage/Current Focus data *comes from* (inference vs. a question), not the screens, motion, or choreography, which remain untouched pending their own Design Council pass per `decisions/0012`'s Migration strategy.

### Part 8 — Whiteboard test

**11 boxes, 23 arrows.** Under the stated limits (12 boxes, 25 arrows).

```
                    ┌─────────────────────────────────────────┐
   ①  CLIENT  ─────▶│  ②  SAFETY ENGINE (cross-cutting, first)  │
   (any surface)     └──────────────────┬────────────────────────┘
                                safe ↓         crisis → ① (mandated hand-off, bypasses all below)
                                       ▼
                    ┌──────────────────────────────────────────────────────┐
                    │              ③  COACH ENGINE  (sole orchestrator)      │
                    │   chooses Coaching Beat + Coaching Move, every surface  │
                    └───┬─────────┬──────────┬──────────┬─────────┬──────────┘
                        ▼         ▼          ▼          ▼         │
                  ┌─────────┐┌────────┐┌─────────┐┌──────────┐    │
                  │④ EMOTION││⑤IDENTITY││⑥ MEMORY ││⑦DECISION │    │
                  │ Engine  ││ Engine  ││ Engine  ││ Engine   │    │
                  └────┬────┘└───┬────┘└────┬────┘└────┬─────┘    │
                       └─────────┴──────────┴──────────┘          │
                                       │ (all four report back to ③)│
                                       ▼                            ▼
                    ┌──────────────────────────────────────────────────────┐
                    │                  ⑧  PROMPT BUILDER                     │
                    │        Layer 1–5, widened Layer 2/4 (Part 5)           │
                    └──────────────────────────┬───────────────────────────┘
                                                ▼
                    ┌──────────────────────────────────────────────────────┐
                    │                  ⑨  LLM GATEWAY (tiered)               │
                    └──────────────────────────┬───────────────────────────┘
                             structured output  ▼
                    ③ COACH ENGINE (post-validate, re-check with ②) ──▶ ① CLIENT
                                                │
                                                ▼ (async, off hot path)
                                       ⑩  EVENT BUS
                                       ┌────────┴─────────┐
                                       ▼                  ▼
                              ⑪ LEARNING ENGINE   NOTIFICATION ENGINE*
                              (Insights, priors,          │
                               Relationship Health)        ▼
                                       │              ① CLIENT (Nudge)
                                       └──────────────────▶ ③ (folded into next turn's context)
```
*Notification Engine is the 12th box if drawn separately; shown here folded into the Event Bus branch to stay within the box budget while remaining accurate — either presentation is correct on a real whiteboard.

**Arrow count (23):** Client→Safety, Safety→Coach (safe), Safety→Client (crisis bypass), Coach→Emotion, Emotion→Coach, Coach→Identity, Identity→Coach, Coach→Memory, Memory→Coach, Coach→Decision, Decision→Coach, Coach→Prompt Builder, Prompt Builder→LLM, LLM→Prompt Builder, Prompt Builder→Coach, Coach→Safety (outbound re-check), Safety→Coach (cleared), Coach→Client, Coach→Event Bus, Event Bus→Learning, Event Bus→Notification, Learning→Coach (next turn), Notification→Client.

---

## Merged Concepts

| Merged from | Merged into | Why |
|---|---|---|
| **Confidence** + **Self-efficacy** *(Psychological State, Part 5)* | One field, **Confidence**, with an optional domain qualifier | Part 5's own text already had to explain why these were kept distinct; they measure the same thing (how capable the user feels) at two grains. One field, one scale, qualified by domain when needed, is simpler and removes a live naming collision. |
| **Coach Reliance** + **Need for Reassurance** *(Relationship Health, PDR 0011 D4)* | Both become measured sub-signals of **Dependence Risk** | PDR 0011's own "how we'll know if this was wrong" section already predicted these would "collapse to one real signal in practice." Merging now rather than waiting for that finding to land is the more honest reading of PDR 0011's own self-assessment. |
| **MomentState** *(ADR 0008)* | **Coaching Beat** (the onboarding subset) | See Part 6's explicit mapping. |
| **Experience Engine**, **Moment Engine**, **Next-Moment Engine** | **Coach Engine** | See Part 1/Part 2. |
| **Life Dimension Engine**, **Thought Generation Engine** | **Identity Engine** (ranking) + **Coach Engine** (generation via Prompt Builder) | See Part 1/Part 2. |

## Removed Concepts

Per the founder's instruction, this section is mandatory and lists what disappears, not what's added:

1. **Experience Engine** — never had a contract; nothing lost by removing the name.
2. **Moment Engine** — same.
3. **Next-Moment Engine** as a *separate engine name* — the contract survives inside Coach Engine (Part 2); only the standalone name disappears.
4. **Life Dimension Engine** as a *separate engine name* — the taxonomy and ranking survive inside Identity Engine.
5. **Thought Generation Engine** as a *separate engine name* — the capability survives as a Coach-Engine-orchestrated Prompt Builder call.
6. **MomentState** as a *distinct taxonomy* — it was always Coaching Beat's onboarding subset.
7. **"interpreting" as a visible Beat/Moment** — it was Coach Engine's internal move-selection step, never a felt phase; removing it as a visible state matches how ordinary dialogue turns have never had one either.
8. **Self-efficacy as an independent field**, separate from Confidence — merged (see above).
9. **Coach Reliance and Need for Reassurance as independent Relationship Health dimensions** — merged into Dependence Risk (see above).
10. **Age, Life Stage, and Current Focus as *asked* Step-0 questions** — become inferred outputs under Part 7's Option B; not removed as data, only removed as upfront questions.

Ten removals, zero new concepts added beyond the one taxonomy gap-closer (Expression) required to make ADR 0008 and Coaching Constitution Part 4 describe the same thing.

## Remaining Open Questions

- **Life Dimensions vs. `Identity.values[]`** — not resolved here. This ADR fixes which engine owns Life Dimensions (Identity Engine); it does not decide whether the taxonomy is the same concept as `values[]` under two names. Still deferred to the Canon amendment `decisions/0012` already named.
- **Cross-model confidence calibration** — this ADR gives Confidence exactly one home (Prompt Builder normalizes it) but does not solve the calibration function itself, which PDR 0011, the Coaching Evaluation Framework, and ADR 0008 §5 all independently flagged as unsolved. Normalizing *where* it happens is progress; it is not the same as solving *how*.
- **PDR 0011's Accept/Reject status** — this ADR does not decide PDR 0011. Its D4 merge recommendation (above) is offered as an amendment for whenever PDR 0011 is actually reviewed, not a claim that PDR 0011 is now Accepted.
- **Relationship Health's cold-start behavior** (0–1 sessions) — this ADR assigns ownership (Learning Engine) but does not specify what it returns before enough sessions exist to be meaningful. Named, not solved.

## Migration Plan

1. **This ADR — Proposed → Accepted**, via the same review discipline as any Sensitive-tier architectural change (this touches Coach/Identity/Learning Engine contracts and the Constitution's own coaching-behavior documents).
2. **`adr/0008` header updated** to `Status: Superseded by ADR 0013` — no other edit, per ADR governance (`adr/README.md` §4). Its content is not deleted; it remains the historical record of the reasoning this ADR consolidates.
3. **`docs/coaching-constitution-v1.md` redline** (its own governance section already requires Design Council review + a PDR for amendments): Part 4 gains Expression, renames "Moment" to "Coaching Beat" throughout, and removes "interpreting" as a visible phase; Part 5 merges Confidence/Self-efficacy; the document's own header diagram drops "Experience Engine"/"Moment Engine" in favor of "Coach Engine."
4. **`docs/pdr/PDR-0011-...md`'s D4 table** gets this ADR's Dependence-Risk merge folded in before that PDR is ever moved to Accepted — a correction to a Proposed document, not an edit of a decided one.
5. **`decisions/0012`** needs no content change — its policy stands. Its "Required Architecture Changes" section explicitly asked for the kind of ADR this document is; this satisfies that requirement.
6. **`13 Prompt Architecture.md` §2** gets its Layer 2/Layer 4 descriptions widened per Part 5, above.
7. **`00 Canon.md` §4's engine table** gets a one-line note added to Coach, Identity, and Learning Engine's "one-line job" column reflecting their widened scope — the table's engine *count* and every other row are unchanged.

## Impact on Existing Documents

| Document | Impact |
|---|---|
| `04 AI Brain.md` | None to its core thesis or topology — this ADR is a direct application of its own §2/§7 "one orchestrator, bounded contexts" rules, not a change to them. |
| `13 Prompt Architecture.md` | Layer 2/4 descriptions widen (Part 5). No layer added, no layer removed. |
| `docs/coaching-constitution-v1.md` | Part 4 amended (Expression added, renamed to Coaching Beat, "interpreting" removed); Part 5 amended (Confidence/Self-efficacy merge); header diagram corrected (Experience/Moment Engine → Coach Engine). Redline deferred to its own governance process, per Migration Plan. |
| `docs/pdr/PDR-0011-...md` | D4 table amended (Dependence Risk merge) before its own Accept decision. No other change. |
| `decisions/0012` | No change — this ADR is the architecture follow-up it already called for. |
| `adr/0008` | Superseded, header-only update. |
| `docs/evaluation/coaching-evaluation-framework-v1.md` | No content change required now, but its golden scenarios should be re-tagged against "Coaching Beat" rather than "Moment" in its next revision, and its diagram's "Experience Engine → Moment Engine" line corrected to "Coach Engine" for consistency. |
| `docs/identity-onboarding-choreography-v2.md`, `decisions/0006/0007/0010` | Untouched — no policy, motion, or copy decision in any of these changes. |

## Implementation Impact

None authorized by this document. Per instruction, this is architecture reconciliation only — no code, no prompt, no onboarding change ships from this ADR. The nearest actual build work this unblocks is `decisions/0012`'s own Migration strategy (Canon amendment → this ADR → v3 choreography → Design Council pass → implementation) — this ADR is step 3 of that sequence, now complete on paper, pending Acceptance.

---

## Consequences

**Positive**

- A new engineer now has one topology to learn (nine engines, unchanged from `04 AI Brain.md`) instead of reconciling five independently-invented engine names first.
- Every safety-tier requirement ADR 0008 built (riskTier, deterministic fallback, eval gating) is preserved intact, just correctly located inside Coach Engine rather than orphaned in a superseded standalone ADR.
- The Confidence and Relationship Health merges resolve two redundancies the source documents had already self-diagnosed, closing them rather than leaving them as known-but-unfixed.

**Negative**

- Three documents (Coaching Constitution v1, PDR 0011, the Evaluation Framework) need their own follow-up redline passes to actually reflect this vocabulary — until then, their on-disk text still uses the old names, and this ADR is the thing a reader must cross-reference to know that.
- Folding Next-Moment-Engine and Thought-Generation into Coach Engine's turn types means Coach Engine's own contract grows two new turn shapes; if a future engineer treats "Coach Engine" as meaning only "the ordinary dialogue orchestrator," this widening needs to be visible in `04 AI Brain.md`'s own description, not just here.

**Neutral**

- This ADR changes no runtime behavior by itself — it is a naming and ownership reconciliation. The system behaves identically before and after; what changes is which document an engineer reads to understand it.

## Alternatives considered

- **Keep Experience Engine/Moment Engine as real, new engines and write the missing ADR for them.** Rejected — on inspection neither had any responsibility that wasn't already Coach Engine's; inventing a contract for an undefined placeholder would be adding a concept, which the founder explicitly ruled out ("do not create new engines unless absolutely necessary").
- **Give Life Dimensions and Thought Generation their own engine, as `decisions/0012` originally implied.** Rejected — both fit inside existing bounded contexts (Identity Engine's modeling job, Coach Engine's generation-turn shape) without strain; a new engine would duplicate responsibility Identity/Coach Engine already own.
- **Leave `adr/0008` as Proposed and write this as a parallel document.** Rejected — since ADR 0008 never reached Accepted, superseding it outright is cleaner than maintaining two live documents describing the same onboarding-classification capability under different names, which is the exact problem this ADR exists to fix.
- **Invent a wholly new name for the coaching-phase taxonomy instead of "Coaching Beat."** Considered "Coaching Phase" — rejected in favor of "Beat" because Coaching Constitution v1's own opening line already uses "a psychological beat" to describe the concept; promoting existing latent language costs less than inventing new vocabulary.

## Links

- `04 AI Brain.md` §1, §2, §3, §7 — the topology and one-orchestrator rule this ADR applies rather than changes
- `13 Prompt Architecture.md` §2 — the five-layer structure widened here
- `00 Canon.md` §2, §4 — vocabulary and engine-contract table this ADR's renames and scope changes must stay consistent with
- `docs/coaching-constitution-v1.md` Parts 4, 5, 9 — the taxonomy and engine-naming this ADR reconciles
- `docs/pdr/PDR-0011-...md` D4 — the Relationship Health dimensions amended here
- `decisions/0012-life-dimension-engine-and-vision-canvas.md` — the policy this ADR provides the architecture for, per its own Required Architecture Changes section
- `adr/0008-next-moment-engine-architecture.md` — superseded by this document
- `decisions/0006`, `0007`, `0010` — unaffected, cross-referenced for completeness
- `docs/evaluation/coaching-evaluation-framework-v1.md` — vocabulary alignment needed in its next revision

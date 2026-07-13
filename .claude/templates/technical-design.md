# Technical Design — <Feature / system name>

> **Status:** Draft v0.1 — <YYYY-MM>
> **Purpose:** One line — the "how" behind the feature spec it implements.

<!-- The HOW that pairs with a feature-spec (the WHAT/WHY). Link back to that spec. Keep it
concrete: reviewers should be able to build from this. Canon vocabulary (§2) verbatim;
respect engine boundaries (§4) and the canonical data model (§5). -->

- **Feature spec:** <link to the driving feature-spec.md>
- **Author / date / tier:** <name> · <YYYY-MM-DD> · <Standard / Sensitive>

---

## 1. Context

<!-- WHY: A reader six months from now needs the situation, not just the change. What
exists today, what forces this, what constraints bind us (offline-first, modular monolith,
LLM-as-tool)? -->

<current state, the pressure driving change, relevant prior ADRs/PDRs>

## 2. Goals / Non-goals

<!-- WHY: Non-goals are the most useful line in the doc — they stop scope creep and set
review expectations (Jobs lens: the power of no). -->

- **Goals:** <the specific outcomes this design achieves>
- **Non-goals:** <what this explicitly does not do, and why>

## 3. Proposed design

<!-- WHY: The heart of the doc. Describe the design so it can be built and reviewed. Use a
diagram where it earns its place. State which engine owns the new behavior — the Coach
Engine is the only orchestrator (Canon §4). -->

<narrative + diagram; the chosen approach and how the pieces fit>

## 4. Data model changes

<!-- WHY: Schema is the most expensive thing to get wrong. Name aggregates/fields touched
against Canon §5; note migrations and backfills. Remember: alignment_score is never
displayed as a number or grade. -->

- **Aggregates/fields changed (Canon §5):** <e.g. Decision.bias_flags[] — new value>
- **Migration & backfill:** <forward migration, backfill plan, reversibility>

## 5. Engine / module impact

<!-- WHY: The modular monolith works only if module boundaries stay hard. State which
engine modules change and confirm no engine reaches into another's storage — communication
is over the event bus (Canon §4, §12). -->

| Engine (Canon §4) | Change | New/changed interface? |
|---|---|---|
| <e.g. Decision Engine> | <what changes> | <yes/no — describe> |

## 6. API / contract changes

<!-- WHY: Contracts are promises to clients (incl. the offline-first iOS app) and to other
engines. Breaking changes need versioning and a sync story. -->

- **HTTP/sync API:** <new/changed endpoints, request/response shape, versioning>
- **Event-bus contracts:** <new events, payload schema, subscribers>
- **Backward/offline compatibility:** <how old clients + queued offline actions behave>

## 7. Failure & degradation modes

<!-- WHY: The moment of temptation often has no signal (Canon §6). Design for the LLM
timing out, the network being gone, an engine being down. Degrade to something honest and
safe, never to a shaming or blocking dead-end. -->

- **LLM unavailable / slow:** <fallback behavior>
- **Offline / no signal:** <what the client does; how it reconciles on sync>
- **Dependent engine down:** <graceful degradation; what the user sees>

## 8. Security / privacy

<!-- WHY: Earn the right to hold this data (Principle 7). Name the sensitive data touched,
consent scope enforced, and how prompt/response capture stays privacy-scrubbed (Canon §6). -->

- **Sensitive data touched:** <identity, emotion, decisions, messages>
- **Consent scope enforced:** <which scope gates this; consent is a gate, not a checkbox>
- **At-rest / in-transit / prompt-capture:** <encryption, scrubbing, retention>

## 9. Alternatives considered

<!-- WHY: Shows the design space was explored and gives the next engineer the map. State
what we rejected and the deciding tradeoff. -->

| Alternative | Why not chosen |
|---|---|
| <option B> | <the tradeoff that ruled it out> |

## 10. Rollout & observability

<!-- WHY: We can't manage what we can't see. Name the flag, the stages, and the specific
signals (per-engine traces, evals, metrics) that tell us it's working — tied to Canon §7. -->

- **Feature flag & stages:** <flag name, rollout %/cohorts, rollback>
- **Metrics & traces:** <North-Star / guardrail signals watched; per-engine tracing; eval-harness gates in CI>
- **Alerts:** <what pages us; e.g. crisis-handoff error rate, shaming-lint failures>

---

## Open questions / What we're deliberately NOT doing

- <open question>
- **Not doing:** <explicit non-goal and why>

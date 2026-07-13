# Prompt Engineering Rules

**Purpose:** treat prompts as versioned, tested, layered production code with structured output and hard guardrails — because a prompt change is a behavior change to a coaching product, and behavior changes ship through gates. **Scope:** the Prompt Builder, all prompt layers, output schemas, and the guardrail passes around them. Read alongside [ai.md](./ai.md) and the [Canon §6](../docs/00%20Canon.md#6-technology-decisions-fixed-for-v1-revisit-at-series-a-scale).

1. Prompts **MUST** be assembled by the Prompt Builder from explicit layers (system/Constitution → engine context → task → output schema); feature code **NEVER** hand-concatenates a prompt string. **WHY:** layering is what lets us cache the stable parts, audit what the model saw, and enforce the Constitution in one place.

2. Every model call that feeds control flow **MUST** request structured output against a declared JSON/tool schema and **MUST** validate the response against that schema before use. **WHY:** structured, validated output is the only kind the backend can safely branch on (see [ai.md](./ai.md) rule 2).

3. The Constitution/safety layer **MUST** be present in every coaching prompt and **MUST** be the highest-priority layer; user-derived content **NEVER** overrides it. **WHY:** if user text can outrank our safety instructions, the prompt is a prompt-injection vector.

4. Guardrails **MUST** exist in two places — in-prompt instruction *and* a deterministic post-generation pass — and both **MUST** enforce the banned-word list (*fail, failure, cheat, streak-broken, bad, weak, should have, guilt*). **WHY:** in-prompt guidance is best-effort; only the post-generation pass actually guarantees "no shaming, ever" (Canon §8).

5. User-supplied and retrieved-memory content **MUST** be inserted as clearly delimited data, never as instructions the model should obey. **WHY:** conflating data with instructions is the root of prompt injection; the model must know memory is *about* the user, not *from* us.

6. Every prompt and output schema **MUST** be versioned and stored in the repo; the version used **MUST** be recorded on the resulting Message/turn. **WHY:** without a version stamp we can't reproduce, evaluate, or roll back a coaching regression.

7. A prompt change is a deploy: it **MUST** ship behind a feature flag and **MUST** pass the eval-gate in CI before rollout. **WHY:** a prompt edit changes user-facing behavior as surely as code does, so it earns the same gate — an unevaluated prompt is an unshipped-quality coach.

8. Prompt changes are **Sensitive-tier** by default (they touch the model and coaching) and **MUST** go through ethical review + Design Council. **WHY:** the tiering model (Conventions §2) names the model and coaching explicitly; prompts are exactly that surface.

9. Stable layers (system/Constitution, static instructions) **MUST** be ordered first and marked for prompt caching; volatile per-user context comes last. **WHY:** cache hits on the stable prefix cut latency and cost on the real-time coaching path without changing behavior.

10. The eval-gate **MUST** cover tone (no banned words, no shaming), schema-conformance, and safety-gate behavior; a prompt that regresses any of these **NEVER** ships. **WHY:** these are the guardrail metrics the Canon refuses to degrade (§7).

11. Prompts **MUST** use canon vocabulary verbatim (Present Self, Future Self, the Gap, Coaching Move, Lapse, Recovery) and **NEVER** introduce a synonym. **WHY:** a synonym in a prompt teaches the model the wrong ontology and drifts from the product (Canon §10).

12. Captured prompts/responses for observability **MUST** be privacy-scrubbed before storage and **NEVER** contain raw PII or a raw alignment_score. **WHY:** prompt capture is an eval tool, not a reason to violate the Covenant (see [database.md](./database.md)).

**How this is enforced:** the CI eval harness gates every prompt change on tone, schema, and safety; schema validation runs at the gateway; feature-flag + version-stamp checked in review; ethical review + Design Council at Sensitive tier.

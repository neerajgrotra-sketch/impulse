# AI Rules

**Purpose:** hold the line that the LLM is a scoped tool, not the brain — the backend owns state, policy, and safety; the model owns language and reasoning — so the product stays deterministic, testable, and safe when the model is slow, wrong, or down. **Scope:** every engine that calls a model, the LLM gateway, and the deterministic fallback coach. Read alongside [prompt-engineering.md](./prompt-engineering.md), [architecture.md](./architecture.md), and the [Canon §4/§6](../docs/00%20Canon.md#4-the-ai-brain-engine-contracts).

1. The backend **MUST** own state, policy, and safety; the model **owns only language and reasoning**. **WHY:** this is the founding principle of the AI Brain (Canon §4) — a model that owns decisions cannot be audited, tested, or held to the Covenant.

2. Free-text model output **NEVER** drives control flow; branching, tool selection, and decisions **MUST** key off validated structured output or backend logic. **WHY:** parsing prose to decide what happens next is non-deterministic and injection-prone; the model suggests, the backend decides.

3. Engines **MUST** be deterministic at the core: given the same inputs, orchestration, policy, safety, and Coaching-Move selection **MUST** produce the same decision, with the model supplying only the language of the turn. **WHY:** determinism is what makes coaching testable and reproducible; only the wording should vary.

4. The Safety Engine's verdict **MUST** be computed by the backend and is binding; a coaching turn **NEVER** proceeds against a safety hard-stop, regardless of what any model returns. **WHY:** safety pre-empts everything (Canon §8); a safety gate the model can talk its way past is not a gate.

5. Every model call **MUST** be mockable behind the Prompt Builder / gateway interface, and the full engine graph **MUST** run in tests with the model mocked. **WHY:** if we can't test a coaching flow without a live model, we can't test it at all.

6. Model tier **MUST** match the job per Canon §6 — Haiku for classification (emotion, bias, safety triage), Sonnet for real-time coaching dialogue, Opus for async deep synthesis. **WHY:** using Opus on a real-time turn blows the latency budget; using Haiku on weekly synthesis underserves the hardest reflection.

7. The synchronous coaching path **MUST** degrade to the deterministic fallback coach on model timeout, error, rate-limit, or malformed output — never to an error surface. **WHY:** graceful degradation is a canon commitment; a user in an Impulse Moment always gets a coach.

8. The fallback coach **MUST** itself obey the Covenant: no shaming, no banned words, respects the current safety verdict and consent scope. **WHY:** "degraded" never means "we dropped our promises"; a fallback that shames is worse than silence.

9. Every model call **MUST** carry the safety context and pass through the Prompt Builder; no engine constructs a raw prompt or calls the gateway with unscoped context. **WHY:** the Prompt Builder is the single place safety, scope, and structure are enforced (see [prompt-engineering.md](./prompt-engineering.md)).

10. Model output that will reach the user **MUST** pass post-generation guardrails (tone/banned-word/PII pass) before it is shown or stored. **WHY:** in-prompt instructions are not a guarantee; a second deterministic gate is what actually enforces "no shaming, ever."

11. The alignment_score **MUST** be computed by the Decision Engine, never by the model, and is never handed to the model as a grade to justify. **WHY:** the score is our core unit of value and policy (Canon §5); a model-authored score is neither reproducible nor auditable.

12. Any change to a model's role, tier assignment, the fallback behavior, or the safety-gating logic is **Sensitive-tier** and **MUST** go through the full feature lifecycle + ethical review. **WHY:** these are the seams where the model could quietly become the brain (Conventions §2).

13. Model/provider choice **MUST** stay behind the provider-abstracted gateway; feature code **NEVER** depends on a specific provider's SDK or response shape. **WHY:** the Canon fixes provider-abstraction so we can retier or switch models without touching engines.

**How this is enforced:** the eval harness in CI gates coaching quality and safety-gate correctness; a full-graph test suite runs with the model mocked; post-generation guardrails run as a CI-tested pipeline stage; ethical review + Design Council at Sensitive tier.

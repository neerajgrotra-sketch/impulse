# Testing Rules

**Purpose:** Prove the system behaves — including the parts written in natural language — before a user relies on it. **Scope:** engine logic, engine boundaries, the LLM-driven surfaces (Coach, Safety, Prompt Builder), and all test data.

An AI product's test pyramid has a floor most products don't: the model. "It sounded good once" is an anecdote, not a test. We test the deterministic core hard, pin the boundaries, and put the non-deterministic surface under evals that run in CI like any other gate.

1. Deterministic engine logic (Decision framing, orchestration, scoring, consent gating, Safety triage) MUST have unit tests — WHY: this is where policy and safety live; Canon §4 says the backend owns state, policy, and safety, so we test it like it matters.
2. Every engine boundary (Canon §4 interfaces: `EmotionSignal`, `DecisionFrame`, `CoachingMove`, etc.) MUST have contract tests pinning input/output schema — WHY: engines are bounded contexts whose internals change freely; only the contract protects their consumers.
3. LLM-driven surfaces MUST be covered by evals that run in CI, and a Sensitive-tier change to them NEVER merges on a red eval — WHY: Canon §6 puts the eval harness in CI; a coaching change unverified by evals is untested.
4. Coach output MUST pass a golden set of coaching conversations checked for correct Coaching Moves and understand-before-advise ordering — WHY: the behavior we promise is dialogue quality, so that is what we assert.
5. Coach output MUST pass a no-shaming / tone grader and the banned-word list on every eval run — WHY: "no shaming, ever" (Canon §8) is a guardrail metric, not an aspiration.
6. The Safety Engine MUST be covered by a safety red-team eval (crisis, self-harm, clinical-risk phrasings) asserting correct hard-stop and handoff — WHY: Safety gates launch (Canon §4); a missed crisis is the one failure we cannot recover from.
7. Determinism MUST be maximized: fix seeds, pin model+prompt versions, and use temperature 0 where the task allows — WHY: a flaky eval teaches the team to ignore evals.
8. Non-deterministic behavior MUST be graded on distributions/thresholds over a set, NEVER asserted on a single lucky run — WHY: one good sample proves nothing about the next user's turn.
9. Tests MUST NEVER use real user data; fixtures are synthetic or fully anonymized — WHY: privacy (`.rules/privacy.md`) does not pause for the test suite.
10. Test fixtures containing sensitive-looking coaching text MUST live only in the test tree and NEVER leak into logs, analytics, or prompts shipped to production — WHY: synthetic confessions still teach bad habits if they escape.
11. A bug fix MUST add a regression test that fails before the fix — WHY: an untested fix invites the same bug back.
12. Eval prompts, graders, and golden sets MUST be versioned in the repo and reviewed like code — WHY: the grader is production logic; an unreviewed grader silently redefines "good."
13. Coverage SHOULD concentrate on engine logic and safety paths rather than chase a headline percentage — WHY: 100% coverage of getters proves nothing; a tested Safety path proves what matters.
14. Contract and eval suites MUST run in CI on every PR touching their surface and block merge on failure — WHY: a gate that doesn't block is decoration (see `.rules/git.md`).

## How this is enforced

CI runs unit, contract, and eval suites; `main` stays green (`.rules/git.md`). The eval harness (golden coaching convos, tone/no-shaming grader, safety red-team) is defined in `docs/13 Prompt Architecture.md` and gates Sensitive-tier merges. Test-data hygiene and regression-test presence are checked in code review by the matching review skill.

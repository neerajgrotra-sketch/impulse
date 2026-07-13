# Security Rules

**Purpose:** Keep the promise in principle #7 — *earn the right to hold this data* — enforceable in code. **Scope:** all backend engines, the sync API, the iOS client, secrets, dependencies, and any change that touches auth, storage, or the LLM gateway.

Security here is not a feature bolted on; it is the architecture that lets Future Self trust us with the most sensitive thing a person owns — the record of their weakest moments.

1. Every API request (except explicit unauthenticated onboarding endpoints) MUST be authenticated and its subject resolved to a `User.id` before any engine runs — WHY: an unauthenticated request has no owner, so no isolation guarantee can be made.
2. Every data read and write MUST be scoped to the authenticated `User.id` at the query layer, never filtered in application code after a broad fetch — WHY: coaching data is per-user sacred; a forgotten `WHERE user_id` is a cross-user leak, not a bug.
3. Engines NEVER reach into another engine's storage or another user's aggregates; cross-engine data moves only over the event bus — WHY: the bounded-context boundary (Canon §4) is also the blast-radius boundary.
4. Services MUST run with least privilege: DB roles, Redis ACLs, and LLM gateway keys grant only what that engine needs — WHY: a compromised Emotion classifier must not be able to read every Decision in the system.
5. All secrets (DB creds, LLM keys, signing keys) MUST come from the secret manager at runtime and NEVER be committed, logged, or embedded in the client binary — WHY: a secret in git history or an app bundle is a secret already leaked.
6. All external input — API bodies, sync payloads, and LLM structured output — MUST be validated against an explicit schema before use — WHY: the model owns language, not truth; unvalidated model output is untrusted input.
7. Prompts sent to the LLM gateway MUST be assembled only by the Prompt Builder, which strips PII to what the turn requires — WHY: raw model access from feature code bypasses both scoping and the Constitution (Canon §6).
8. User-influenced text placed in a prompt MUST be treated as untrusted and fenced; the model's output NEVER directly triggers a privileged action without backend policy check — WHY: prompt injection is the SQL injection of AI products.
9. Sensitive-tier changes (coaching, safety, memory, privacy, notifications, identity, the model) MUST include a written threat model covering spoofing, tampering, disclosure, and abuse — WHY: you cannot defend a surface you never mapped.
10. Data at rest containing coaching content MUST be encrypted, and PII fields SHOULD be column-scoped so a table dump is not a life dump — WHY: privacy-at-rest is a Constitution requirement, not a nice-to-have.
11. Dependencies MUST be pinned, scanned for known CVEs in CI, and added only with a stated reason; unmaintained or unvetted packages are NEVER introduced into sensitive paths — WHY: our supply chain is our attack surface.
12. Auth tokens and session material MUST expire, be revocable, and never be written to logs or telemetry — WHY: a long-lived token in a log is a permanent backdoor.
13. Rate limits and abuse controls MUST protect auth, the sync API, and the LLM gateway — WHY: unbounded access enables both account takeover and cost/denial attacks.
14. Any suspected breach or cross-user data exposure MUST trigger the incident path within one hour: contain, preserve logs, assess scope, notify the on-call owner, and open a PDR — WHY: the Covenant obliges honesty; a silent breach is a broken promise.
15. Security-relevant events (auth failures, privilege changes, deletion requests) MUST be logged immutably and privacy-scrubbed — WHY: you cannot investigate an incident you did not record.

## How this is enforced

CI runs dependency/CVE scanning and secret detection on every PR. The `security-review` skill is mandatory for every Sensitive-tier change and reviews the required threat model. Per-user query scoping is checked in code review against CODEOWNERS for data-access modules. Incident response is a human-owned runbook triggered by on-call. See `docs/15 Constitution.md` and `.rules/privacy.md`.

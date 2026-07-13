---
name: security-review
description: Use when a change touches authentication, authorization, per-user isolation, secrets, input validation, or third-party dependencies, or when a Sensitive-tier change needs its threat-model pass — this is the general security-posture gate (privacy is handled by privacy-review).
---

## Purpose

We hold the record of a person's **Impulse Moment**s, **Lapse**s, and **Identity Statement**s — the most intimate data an app can carry (`docs/15 Constitution.md` §2). Security is therefore not a feature bolted on late; it is the architecture that makes principle #7 — *earn the right to hold this data* (`docs/00 Canon.md` §3) — true in bytes and request paths. This skill reviews the **general security posture** of a change: that every request is authenticated, that a user's data is invisible to every other user *by construction*, that secrets and model credentials live behind one door, that untrusted input cannot become instruction, and that our dependency surface is minimal and pinned. It enforces [`.rules/security.md`](../../../.rules/security.md) and the backend security boundaries in `docs/12 Backend Architecture.md` §6 and `docs/08 Database Architecture.md` §4–§5.

Privacy — data minimization, consent-as-gate, deletion, PII-in-logs — is the **Covenant** and is reviewed by [`privacy-review`](../privacy-review/SKILL.md). This skill does not re-litigate it; the two are run together on any change that touches both.

## When to use

Run per the change-tiering model (`.claude/CONVENTIONS.md` §2):

- **Trivial** (copy fix, pure refactor, dep bump with no transitive change): PR checklist only — but a dependency *addition* or version bump with new transitive deps is never trivial; run the dependency section below.
- **Standard** (new endpoint, screen, or logic that is NOT sensitive): run the authn, authz, input-validation, and dependency sections.
- **Sensitive** (touches auth itself, any cross-user data path, secrets, the **LLM gateway**, the offline-first sync API, or the **Safety Engine**): run the **entire** checklist including the threat-model pass. No exceptions. When in doubt, tier **up** — the cost of over-reviewing is minutes; the cost of a cross-user leak is the Covenant.

## Inputs

- The diff under review, plus the endpoint / module-interface signatures it changes.
- The authentication and authorization flow for any touched route (FastAPI edge → engine interface).
- Any change to `users.consent_flags`, `users.auth_ref`, or the per-user encryption key path (`docs/08 Database Architecture.md` §5).
- Dependency manifest and lockfile diffs (added, removed, or bumped packages, direct and transitive).
- For **Sensitive**-tier: a written threat model (assets, entry points, trust boundaries, attacker goals, mitigations) attached to the PR.

## Outputs

- A pass / block decision. A single unresolved cross-user read path, unauthenticated route, secret in the repo, or unpinned new dependency is a **block**.
- A findings list, each mapped to a rule in `.rules/security.md` and to the offending file/line, with the required fix stated.
- For Sensitive-tier: a reviewed threat model recorded with the PR (or a Product/Ethical Decision Record if it sets a security-affecting default — `.claude/CONVENTIONS.md` §3).

## Checklist

**Authentication**
- [ ] Every new or changed route authenticates at the FastAPI edge before any engine is reached; no request path reaches an engine unauthenticated (`docs/12 Backend Architecture.md` §6). WHY: an unauthenticated path into an engine is an unauthenticated path to a user's inner life.
- [ ] Tokens are short-lived and refreshable bearer tokens; the change introduces no long-lived or non-expiring credential.
- [ ] The idempotent sync API for the offline-first client authenticates identically to every other route — offline-first is not an auth exception.

**Authorization & per-user isolation**
- [ ] Every query the change adds is scoped to the authenticated `user_id`, enforced at the module interface, not left to the caller to remember (`docs/12 Backend Architecture.md` §6). WHY: isolation left to discipline eventually fails; isolation by construction does not.
- [ ] Postgres row-level security (RLS) still covers every table the change reads or writes, so a query bug cannot silently cross accounts (`docs/08 Database Architecture.md` §4).
- [ ] The change introduces **no cross-user read path** — no shared "content" table, no join across a `user_id` boundary, no admin-style "read any user" verb without an explicit, audited justification.
- [ ] No engine reaches into another engine's tables; cross-engine data flows over the event bus or a published typed interface only (`docs/12 Backend Architecture.md` §2). Ownership of a write stays with the owning engine.

**Secrets & credentials**
- [ ] No API key, provider token, or infra secret appears in the repo, in a fixture, or in a log line; all live in the secrets manager and are injected as runtime config (`docs/12 Backend Architecture.md` §6).
- [ ] The **LLM gateway** remains the *only* holder of model-provider credentials; no engine or feature code gains a raw provider SDK or key (`docs/00 Canon.md` §6, `docs/12 Backend Architecture.md` §5). WHY: one credential holder is one throat to choke for rotation and leak-containment.
- [ ] `users.auth_ref` stays an opaque handle — no password material or provider token is stored in our system of record (`docs/08 Database Architecture.md` §5).

**Input validation & injection defense**
- [ ] All external input (HTTP bodies, sync-queue mutations, query params) is validated against a typed schema at the edge; malformed input is a handled error, not a surprise downstream.
- [ ] The raw user turn is treated as **Layer 5 — least trusted**: fenced, labeled as content, and never concatenated as instruction into a prompt (`docs/13 Prompt Architecture.md` §2). Prompt-injection defense on this surface is present. WHY: the user message is the *subject* of reasoning, never a source of *instructions*.
- [ ] Model output that drives control flow is a validated typed schema, never parsed free text; an off-schema response fails closed (`docs/13 Prompt Architecture.md` §3). This keeps the backend — not the model — the decision-maker (`docs/00 Canon.md` §4).
- [ ] Client-originated writes carry a client-generated UUID and idempotency key so a replayed offline outbox cannot create duplicate or forged state (`docs/08 Database Architecture.md` §8).

**Dependency & supply chain**
- [ ] Every added or bumped dependency is pinned in the lockfile; no floating ranges reach production.
- [ ] New dependencies are scanned for known advisories in CI, and the addition is justified — the default answer to a new dependency is *no* (`docs/10 Engineering Principles.md` §4, boring-by-default).
- [ ] No new dependency introduces an ad SDK, third-party analytics that exfiltrates content, or a data-sharing integration; their absence is asserted by test (`docs/15 Constitution.md` §2). WHY: the Covenant forbids these on any side.

**Threat model (Sensitive-tier only)**
- [ ] Assets, entry points, and trust boundaries for the change are enumerated in writing.
- [ ] For each attacker goal (cross-user read, auth bypass, secret exfiltration, injection into the model path, supply-chain compromise) a mitigation is named and mapped to a control above.
- [ ] Residual risks are stated explicitly and accepted by the engine owner (`docs/10 Engineering Principles.md` §8) — not left implicit.

## Success criteria

- Every route the change touches authenticates at the edge, and no path reaches an engine unauthenticated (demonstrable by test).
- No query the change adds can return another user's rows: it is `user_id`-scoped at the interface **and** covered by RLS, with no cross-user read path (demonstrable by an isolation test that fails when scoping is removed).
- `grep` of the diff and CI secret-scan find zero secrets in the repo/logs; model credentials exist only in the LLM gateway.
- The user turn is fenced as untrusted Layer 5 and model output driving control flow validates against a schema; both are asserted in tests.
- Every added/bumped dependency is pinned and advisory-scanned; the "no ad SDK / no third-party content exfiltration / no data-sharing" absence test still passes.
- For Sensitive-tier: a written, reviewed threat model is attached, with a named mitigation for each attacker goal.

## Failure criteria

- Any route reachable without authentication, or an engine callable on an unauthenticated path.
- Any query, join, or interface that can return another user's data — including a "read any user" verb added without audited justification, or a table left outside RLS.
- A secret, API key, or model-provider credential present in the repo, a fixture, or a log line; or any engine holding a raw provider key outside the LLM gateway.
- Free-text model output used to drive a control-flow branch, or a user turn concatenated as instruction rather than fenced content.
- A new or bumped dependency that is unpinned, unscanned, unjustified, or that adds an ad/analytics/data-sharing capability.
- A Sensitive-tier change merged without a reviewed threat model.

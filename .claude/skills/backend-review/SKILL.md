---
name: backend-review
description: Use when reviewing a FastAPI endpoint, engine module, worker, or event-bus change to verify module boundaries, sync-vs-async placement, LLM-gateway-only egress, idempotency, latency budget, error handling, and secret hygiene.
---

## Purpose

The backend owns **state, policy, and safety**; the model owns language and reasoning (Canon §4). A backend change can quietly break that contract — by leaking model access into feature code, blocking the real-time coaching path with slow work, dropping idempotency on the sync API, or spilling a secret into a log. This skill reviews the concrete FastAPI/module surface so those regressions are caught at the diff, not in production where they cost a user's trust.

Enforces [`.rules/backend.md`](../../../.rules/backend.md). Defers to [`.rules/architecture.md`](../../../.rules/architecture.md) for module-boundary and orchestration questions and to [`.rules/database.md`](../../../.rules/database.md) for schema, ownership, and privacy-at-rest.

## When to use

**Tier: Standard and Sensitive.** Run on any change to a FastAPI route, engine module, background worker, event-bus producer/consumer, or LLM call site. A Sensitive change (coaching, safety, memory, privacy, notifications, identity, or the model — CONVENTIONS §2) additionally requires the full feature lifecycle and Design Council; this skill covers the engineering surface only. Trivial changes (copy, pure refactor, dep bump) need the PR checklist, not this skill.

## Inputs

- The diff or PR with full paths of changed routes, modules, and workers.
- The route contract for any changed endpoint: method, path, request/response schema, and whether it is on the real-time coaching path or an async/background path.
- The declared latency budget or tier of any LLM call (Haiku 4.5 classification, Sonnet 5 real-time dialogue, Opus 4.8 async synthesis — Canon §6).
- The consent scope required by any proactive or notification-related path (Canon §8).
- Access to secret/config loading so egress and credential handling can be verified.

## Outputs

- A pass/block verdict per checklist item, each citing the rule in `.rules/backend.md` and the file/line.
- A flag for any real-time endpoint that performs blocking or latency-unbounded work inline, with the specific call to move to a worker/event.
- A list of any model calls that bypass the Prompt Builder / LLM gateway, and any egress to an external service outside the gateway.
- A list of non-idempotent sync/write paths and any secret or PII exposure in logs or errors.

## Checklist

- [ ] **Module boundaries:** the route/handler stays within its engine module and calls other engines only through their published interface or the event bus — no direct import of another engine's internals or store (defers to `.rules/architecture.md`).
- [ ] **Sync vs async placement:** real-time coaching-path work (Canon §6: Sonnet 5 dialogue) does only what must happen before the response; Learning, Notification, and embedding work is dispatched to background workers via the event bus, never awaited inline (Canon §6).
- [ ] **Latency budget:** each endpoint declares and respects its budget; the correct LLM tier is used (Haiku for classification/triage, Sonnet for real-time dialogue, Opus only on async/latency-tolerant paths). No Opus call on a real-time request path.
- [ ] **Async correctness:** `async def` handlers do not call blocking I/O (sync DB driver, `requests`, filesystem, `time.sleep`) without offloading; DB/session and event-bus resources are acquired and released within request scope.
- [ ] **LLM-gateway-only egress:** every model call goes through the Prompt Builder + structured-output (tool/JSON-schema) layer; no raw provider SDK/client call in feature code (Canon §6: "No raw model access from feature code").
- [ ] **Structured output:** LLM responses are parsed against a declared output schema, not free-text-parsed; schema-validation failures are handled, not assumed away.
- [ ] **Idempotency:** the sync API and any at-least-once event consumer are idempotent — a retried request or redelivered event produces no duplicate Decision, Outcome, Message, Nudge, or Memory row (Canon §6: "thin, idempotent sync API"). Idempotency key or natural-key upsert is present.
- [ ] **Safety pre-emption:** any handler on an inbound-message path passes the message through the Safety Engine before coaching runs; no path can emit a Coaching Move for a message the Safety Engine has not cleared (Canon §4, §8).
- [ ] **Understand-before-advise:** no endpoint lets the Coach Engine emit advice-type moves before the Decision + Identity completeness threshold is met (Canon §8) — enforced in code, not left to the prompt.
- [ ] **Consent gate:** any proactive/notification path checks the required consent scope before acting (Canon §8: "Consent is a gate, not a checkbox").
- [ ] **Error handling:** external/model/DB failures are caught and mapped to typed errors with correct HTTP status; no bare `except`, no swallowed exception, no partial write left uncommitted; offline/sync callers get a retriable response, not a 500 that drops data.
- [ ] **Secrets & logging:** no secret, API key, or token is hardcoded or logged; structured logs are privacy-scrubbed (Canon §6); no raw user message, PII, or `alignment_score` in logs (defers to `.rules/database.md`).

## Success criteria

- Every model call in the diff routes through the Prompt Builder / LLM gateway with a declared output schema — verifiable by grep for provider SDK imports outside the gateway (zero hits).
- No blocking call on an `async` real-time path; Learning/Notification/embedding work is dispatched to workers.
- Every sync write and every event consumer is idempotent under retry/redelivery, demonstrated by an idempotency key or natural-key upsert.
- No inbound-message endpoint bypasses the Safety Engine, and no advice-type move is reachable before the completeness threshold.
- No secret or PII (including raw messages or `alignment_score`) appears in any log or error response.

## Failure criteria

- A model is called with a raw provider client from feature code, or an LLM response is consumed as unstructured text.
- A real-time coaching request awaits Learning, Notification, embedding, or an Opus call inline.
- A retried sync request or redelivered event creates duplicate rows.
- An inbound message can reach coaching without Safety clearance, or an advice move can fire below the completeness threshold.
- A proactive action fires without checking its consent scope.
- A secret is hardcoded/logged, or a raw user message, PII, or `alignment_score` is written to logs.

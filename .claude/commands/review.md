# /review — route a change to the right review skill(s)

**What it does:** Inspects what a change touches and routes it to the correct review skill(s), per `.rules/reviews.md`. **Auto-escalates the tier to Sensitive** when it touches a protected surface (CONVENTIONS §2). Escalation is one-way — a review may raise the tier, never lower it.

**Inputs:** the feature spec (or diff) and the list of surfaces/engines it touches.

**Routing table (what it touches → skill(s) → tier):**

| Touches | Route to | Tier |
|---|---|---|
| coaching / dialogue / tone / Coaching Move | `behavioral-review` (+ `design-council`) | **Sensitive** |
| safety / crisis / Safety Engine | `behavioral-review` + `security-review` (+ safety-owner sign-off & red-team evals, `.rules/reviews.md` #8) | **Sensitive** |
| memory | `privacy-review` + `database-review` + `architecture-review` | **Sensitive** |
| privacy / consent / user data | `privacy-review` + `security-review` | **Sensitive** |
| notifications / nudges | `behavioral-review` | **Sensitive** |
| identity model | `behavioral-review` + `database-review` | **Sensitive** |
| the model / prompts / LLM gateway | `backend-review` + `security-review` + `behavioral-review` | **Sensitive** |
| backend endpoint / engine / worker / event-bus (non-sensitive) | `backend-review` + `architecture-review` (+ ADR if it sets architecture) | Standard |
| schema / migration (non-sensitive) | `database-review` | Standard |
| iOS screen / navigation (non-sensitive) | `ios-review` | Standard |
| auth / authz / secrets / dependencies | `security-review` | Standard |
| copy / docs / pure refactor | none — `pull-request` checklist only | Trivial |

**Any Sensitive route additionally requires** the three non-negotiable gates: Ethical review (Stage 4), Design Council (`/design-council`), and post-release evaluation. Those are never skipped (`.rules/reviews.md` #3–#4).

**Triggers:** the routed review skill(s) · escalation into `.claude/workflows/feature-lifecycle.md`.

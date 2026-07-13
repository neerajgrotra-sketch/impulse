# Naming Rules

**Purpose:** One system, one vocabulary — so Swift, Python, the database, and the event bus all name the same concept the same way. **Scope:** all identifiers across the iOS client, backend engines, schema, and events.

Names are the cheapest documentation and the most-read. When code, tables, and events use the canon words verbatim, a new engineer reads the system as one language. When they drift, every layer needs a translation table.

1. Canon concepts MUST be named with the exact canon term (Canon §2): Impulse Moment, Present Self, Future Self, Lapse, Recovery, Nudge, Alignment, Identity Statement, Coaching Move, Coaching Session, Reflection, Insight, the Gap — no synonyms — WHY: a synonym forces every reader to hold a mental translation and fractures search.
2. The banned words (`fail, failure, cheat, streak, bad, weak, guilt`) MUST NEVER appear in identifiers, enum cases, or event names — WHY: naming carries tone; a `failureCount` field contradicts "progress over perfection" even if no user sees it.
3. Clarity MUST win over brevity: full words over abbreviations, except a tiny set of well-known ones (id, url, db) — WHY: `alignmentScore` reads at a glance; `algScr` does not.
4. Swift MUST use `UpperCamelCase` for types and `lowerCamelCase` for members, matching canon terms (`ImpulseMoment`, `coachingMove`) — WHY: Swift API guidelines plus canon fidelity keep the client legible.
5. Python MUST use `snake_case` for functions/variables and `PascalCase` for classes, again matching canon (`class CoachingSession`, `alignment_score`) — WHY: PEP 8 plus canon fidelity keep the backend legible.
6. Database tables MUST be `snake_case`, singular, matching the aggregate name (`decision`, `coaching_session`, `emotion_signal`); columns match the canonical field names in Canon §5 — WHY: the schema is the system of record; it must mirror the data model exactly.
7. Enum/status values MUST use the canon-defined sets verbatim — Outcome kind is `aligned | lapse | recovery`; Decision status is `open | resolved` — WHY: divergent status strings break contract tests and cross-layer joins.
8. Events on the bus MUST be named `<Aggregate>.<PastTenseFact>` in `PascalCase`/dotted form (`Decision.Resolved`, `Lapse.Recorded`, `Nudge.Scheduled`) — WHY: events are immutable facts; past-tense names make that explicit and consistent.
9. Each engine's public interface MUST name its output after the canon output (Canon §4): `EmotionSignal`, `DecisionFrame`, `CoachingMove` — WHY: the interface is the contract; its names are the contract's vocabulary.
10. Booleans MUST read as assertions (`is_resolved`, `hasConsent`, `should_nudge`) — WHY: an assertion-shaped name makes the true/false meaning unambiguous at every call site.
11. Consent scopes and `consent_scope` values MUST use a stable, documented vocabulary and NEVER be renamed silently — WHY: consent is a gate (Canon §8); a renamed scope can silently open a gate that was meant to be shut.
12. Alignment MUST NEVER be named or surfaced as a grade, rank, or letter (no `grade`, `rank`, `rating`) — WHY: Canon §5 forbids showing it as a grade; naming shapes how it gets used.
13. Identifiers MUST be `<entity>_id` / `<entity>Id` and reference the canonical aggregate name — WHY: consistent foreign-key naming makes per-user scoping and joins obvious and auditable.

## How this is enforced

Linters enforce language-level casing (SwiftLint, ruff/flake8). Canon-term and banned-word usage is checked in code review against `docs/00 Canon.md` §2 and the no-shaming tone lint. Schema and event names are reviewed against Canon §5 by the data-model CODEOWNERS. Contract tests at engine boundaries pin the canonical output type names.

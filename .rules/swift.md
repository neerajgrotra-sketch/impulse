# Swift Language Rules

**Purpose:** a small set of Swift language defaults that make the iOS client safe under concurrency, explicit about absence, and hard to crash in a user's hand. **Scope:** all Swift source in the iOS client. Read alongside [ios.md](./ios.md) for app-structure rules; this file governs the language, that one governs the architecture.

1. Types **MUST** default to value types (`struct`, `enum`); reach for a `class` only when reference identity or shared mutable state is genuinely required, and document why. **WHY:** value semantics remove a whole class of aliasing and data-race bugs before they can exist.

2. Production paths **NEVER** force-unwrap (`!`) or force-`try!` an optional/throwing call; use `guard let`, `if let`, `??`, or typed error handling. **WHY:** a force-unwrap is a crash the user experiences in the moment of temptation — exactly when we promised to be dependable.

3. Optionality **MUST** be explicit and meaningful: model a value that can be absent as `Optional`, and don't use a sentinel (`""`, `-1`, `Date.distantPast`) to fake absence. **WHY:** the compiler enforces handling of a real optional; a sentinel silently propagates a bug.

4. Force-cast (`as!`) and implicitly-unwrapped optionals (`T!`) **NEVER** appear in production code (test fixtures and `@IBOutlet`-style framework requirements excepted). **WHY:** both defer a crash to runtime for a convenience the compiler could have checked.

5. Asynchronous work **MUST** use `async`/`await` and structured concurrency; we **NEVER** introduce new completion-handler pyramids or bare `DispatchQueue` hops for new code. **WHY:** structured concurrency gives us cancellation, error propagation, and readable control flow that callbacks don't.

6. Mutable shared state **MUST** be isolated behind an `actor` or confined to `@MainActor`; UI state **MUST** be `@MainActor`. **WHY:** actor isolation is how Swift proves at compile time that we have no data races on shared state.

7. Errors **MUST** be modeled as typed, `Error`-conforming enums and handled explicitly; we **NEVER** swallow an error with an empty `catch {}`. **WHY:** a silently swallowed error is a failure the user hits later with no trail back to the cause.

8. Access control **MUST** be as tight as possible: default to `private`/`fileprivate`, widen to `internal`/`public` only with intent. **WHY:** a narrow surface is a small contract; every `public` symbol is something a teammate can couple to.

9. Concurrency correctness **MUST** be checked by the compiler: build with strict concurrency checking on and treat its warnings as errors. **WHY:** a data race that only shows under load is nearly impossible to reproduce; the compiler catches it for free.

10. Public and non-trivial functions **SHOULD** stay small and single-purpose, with names using canon vocabulary verbatim (Impulse Moment, Lapse, Recovery, Coaching Move). **WHY:** shared vocabulary in code (Canon §2) keeps the codebase and the docs describing the same system.

11. We **SHOULD** prefer immutability (`let` over `var`) and pure functions for anything presentation- or transform-related. **WHY:** immutable, pure code is trivially testable and safe to call from any isolation domain.

12. Third-party dependencies **SHOULD** be avoided for what the standard library and first-party frameworks already do well; each new dependency needs a stated reason. **WHY:** every dependency is supply-chain surface and a future migration cost on a trust product.

**How this is enforced:** SwiftLint/SwiftFormat in CI with force-unwrap, force-cast, and empty-catch rules set to error; strict-concurrency build flags with warnings-as-errors; the iOS/Swift review skill at Standard tier.

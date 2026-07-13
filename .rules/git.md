# Git Rules

**Purpose:** Keep history honest, safe, and mapped to the way we actually build — small, reviewed, reversible changes. **Scope:** all commits, branches, and pushes to this repo.

1. Work MUST happen on short-lived branches off `main` (trunk-based); branches SHOULD live hours-to-days, not weeks — WHY: long-lived branches accumulate merge risk and hide work from review.
2. Direct commits and force-pushes to `main` are NEVER allowed; every change lands via reviewed PR — WHY: `main` is what ships to users; nothing reaches them unseen (see `.rules/reviews.md`).
3. Commits MUST follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`) with a scope where useful — WHY: a machine-readable history drives changelogs and makes intent scannable.
4. Commits MUST be signed — WHY: for a product whose value is trust, we must be able to prove who authored what.
5. PRs MUST be small and single-purpose; unrelated changes go in separate PRs — WHY: a small PR gets a real review; a 2,000-line PR gets a rubber stamp.
6. Secrets, credentials, real user data, and coaching transcripts MUST NEVER be committed; if one lands, rotate it and purge history immediately — WHY: git history is forever, and a leaked secret is leaked the moment it is pushed (see `.rules/security.md`, `.rules/privacy.md`).
7. A Sensitive-tier PR MUST link its feature-spec and any ADR/PDR in the description — WHY: the lifecycle (CONVENTIONS §2) is only enforceable if the reasoning is attached to the change.
8. Commit and PR titles MUST use canon vocabulary and NEVER contain banned words (`fail, streak, cheat…`) — WHY: history is a document too; it obeys the same tone.
9. The commit that changes a behavior MUST also carry the doc/test updates for that behavior — WHY: splitting them lets docs and tests drift from reality (see `.rules/documentation.md`, `.rules/testing.md`).
10. Commit messages MUST explain WHY in the body when the change is non-obvious, not just restate the diff — WHY: `git blame` is where a future engineer learns the reason a line exists.
11. `main` MUST stay green: a PR NEVER merges with failing CI (build, tests, evals, lint) — WHY: a red trunk blocks everyone and normalizes broken states.
12. History MUST NOT be rewritten after merge to `main`; fix forward with a new commit — WHY: shared history that changes under people breaks every checkout and audit.
13. Merges to `main` SHOULD be squash-or-rebased to a clean, meaningful commit — WHY: one coherent commit per change keeps history bisectable and readable.

## How this is enforced

Branch protection on `main` requires signed commits, green CI, and the reviews mandated in `.rules/reviews.md`. CI runs secret detection and Conventional-Commit and banned-word linting on PR titles and commits. Feature-spec/ADR/PDR links are checked by the matching review skill for Sensitive-tier PRs.

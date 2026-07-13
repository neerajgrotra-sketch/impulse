# iOS Rules

**Purpose:** keep the iOS client offline-first, thin-viewed, and dependable in the exact moment it matters — the Impulse Moment, which often has no signal. **Scope:** the SwiftUI app: views, view models, coordinators, the local store, and the sync layer. Read alongside [swift.md](./swift.md) and the [Canon §6](../docs/00%20Canon.md#6-technology-decisions-fixed-for-v1-revisit-at-series-a-scale).

1. The app **MUST** follow MVVM + a lightweight Coordinator: Views render and forward intent, ViewModels hold presentation state and call the domain, Coordinators own navigation. **WHY:** the Canon fixes this structure for v1; mixing the three is how a SwiftUI codebase becomes untestable and unnavigable.

2. Views **MUST NOT** contain business logic, networking, or persistence calls; a View **NEVER** talks to anything but its ViewModel. **WHY:** logic in a `View` body can't be unit-tested and re-runs unpredictably on every SwiftUI re-render.

3. The app **MUST** be offline-first: capturing an Impulse Moment, writing a Reflection, and reading recent context **MUST** fully work with no network. **WHY:** "the moment of temptation often has no signal" (Canon §6) — an app that needs a connection to coach fails exactly when the user needs it.

4. All user-authored data **MUST** be written to the local store (SwiftData) first and synced afterward; the UI **NEVER** blocks on a network round-trip to confirm a local write. **WHY:** the user's action must feel instant and survive a dropped connection; the server is a replica of the truth on the device, not a gate in front of it.

5. Sync **MUST** be idempotent and retry-safe, sending a stable client-generated id/idempotency key per record. **WHY:** offline edits get replayed on reconnect; without stable keys a flaky network duplicates decisions or nudges (mirrors [backend.md](./backend.md) rule 5).

6. The app **MUST** degrade gracefully with no signal or a failed coaching call: it shows the deterministic fallback coach experience, never a dead-end error or an infinite spinner. **WHY:** graceful degradation is a canon commitment; a user mid-temptation gets a coach or a calm offline state, never a wall.

7. Local IDs **MUST** be client-generated (UUID) and reconciled on sync, not assigned by the server. **WHY:** an offline-created Decision needs an identity before it ever reaches the backend.

8. Coaching, alignment, and identity logic **MUST** live server-side; the client **NEVER** computes an alignment_score, chooses a Coaching Move, or renders alignment as a number or grade. **WHY:** the backend owns policy and safety (Canon §4), and the alignment_score is never shown as a number (Canon §5).

9. Sync conflicts **MUST** resolve by an explicit, documented strategy (server-authoritative for coaching output, last-writer-wins only for user notes); the app **NEVER** silently drops a user's offline edit. **WHY:** losing something the user wrote breaks trust, which is the product.

10. The "moment" surfaces (capturing an Impulse Moment, the coaching dialogue, Recovery) **MUST** be reachable in the fewest possible taps and remain usable one-handed and under stress. **WHY:** Krug's "don't make me think" applies hardest at the moment of temptation; friction there is a lapse we caused.

11. Product surface copy **MUST NOT** contain any banned word (*fail, failure, cheat, streak-broken, bad, weak, should have, guilt*) and **MUST** frame a Lapse as expected, never a verdict. **WHY:** no shaming, ever (Canon §8); the client is a product surface subject to the banned-word list.

12. Consent-gated features **MUST** check consent state locally before offering a proactive action and reflect revocation immediately. **WHY:** consent is a gate not a checkbox; the client must honor it even before the server confirms.

13. Any client change touching coaching, safety, memory, privacy, notifications, identity, or the moment surfaces is **Sensitive-tier** and **MUST** go through the full feature lifecycle + Design Council. **WHY:** the moment surfaces are where the product either earns or loses trust (Conventions §2).

**How this is enforced:** unit tests on ViewModels (no logic in Views is verified by review); an offline test suite that exercises capture/reflect/read with the network disabled; the banned-word lint on shipped copy in CI; the iOS review skill at Standard tier and Design Council at Sensitive tier.

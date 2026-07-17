import type { AdaptivePhase } from "@/types/adaptiveCoaching";

/**
 * The single source of truth for AE-001's step numbering — every screen
 * that shows a step number reads from here rather than hardcoding one. The
 * sphere itself shows only the bare numeral now (no "Moment" label, no
 * total) — see MomentSphere.tsx. The real journey, verified against the
 * coordinator and each screen's own doc comments (not invented): the
 * Impulse opening screen and the profile-collection screen are both
 * unnumbered (no sphere at all — ProfileCollectionScreen's own doc comment
 * names it "Step 0"). Moment 1 is MomentOneScreen ("AE-001's Moment 1" per
 * its doc comment). Moment 2 is the Vision Canvas review —
 * `generating-inspiration` / `inspiration-vision` / `reviewing` are one
 * continuous screen instance (AdaptiveCoachingCoordinator.tsx's own
 * `screenKey()` groups them for exactly this reason) so they share one step
 * number, not three. Moment 3 is the Understanding Review, the journey's
 * final Moment, shown with state "complete".
 */
const MOMENT_ORDER: readonly AdaptivePhase["status"][][] = [
  ["moment-one"],
  ["generating-inspiration", "inspiration-vision", "reviewing"],
  ["understanding-review"],
];

export const AE001_TOTAL_MOMENTS = MOMENT_ORDER.length;

/** Returns the 1-indexed Moment number for a given phase status, or `null`
 *  for phases with no Moment number (`opening`, `name`, `safety-hand-off`). Derived
 *  from `phase.status` alone — there is no separate "current moment" field
 *  to keep in sync, so back navigation (e.g. `goBackToMomentOne`) restores
 *  the correct number automatically. */
export function momentForPhaseStatus(status: AdaptivePhase["status"]): number | null {
  const index = MOMENT_ORDER.findIndex((group) => group.includes(status));
  return index === -1 ? null : index + 1;
}

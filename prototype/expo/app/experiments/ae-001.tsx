import { AdaptiveCoachingCoordinator } from "@/features/adaptive-coaching/AdaptiveCoachingCoordinator";

/**
 * AE-001's entry point (docs/experiments/AE-001-first-adaptive-coaching-loop.md).
 * Reached at the Expo Router path `/experiments/ae-001` — deliberately not
 * wired into `app/index.tsx`'s default launch path, so this experiment stays
 * fully separate from the shipped onboarding flow and is reachable only by
 * a tester who navigates here directly (dev menu "Enter URL manually", or a
 * deep link), never by a real user's ordinary app launch.
 */
export default function AE001Experiment() {
  return <AdaptiveCoachingCoordinator />;
}

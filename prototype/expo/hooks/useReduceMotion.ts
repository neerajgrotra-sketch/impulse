import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Mirrors the OS "Reduce Motion" setting live (not just at mount) — a user
 * can flip it in Settings while onboarding is open, and the thought stream
 * needs to drop into its simplified transition immediately, not just on
 * next launch.
 */
export function useReduceMotion(): boolean {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotionEnabled(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotionEnabled
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reduceMotionEnabled;
}

import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Mirrors `useReduceMotion`'s pattern for a different accessibility need:
 * transient, timer-driven content (the thought stream) isn't reliably
 * reachable by VoiceOver/TalkBack swipe navigation before it auto-exits.
 * Reduce Motion and an active screen reader are deliberately separate
 * checks — one is about motion sensitivity, the other about giving
 * assistive tech enough time to reach an element at all.
 */
export function useScreenReaderEnabled(): boolean {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (!cancelled) setScreenReaderEnabled(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setScreenReaderEnabled
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return screenReaderEnabled;
}

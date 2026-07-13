import { Easing } from "react-native-reanimated";

/**
 * Timings ported from docs/investor-prototype.md §2 and the Swift prototype's
 * `.task` animation blocks. This flow is never a hard cut or a slide-left —
 * every transition is a soft crossfade or breathe.
 */
export const motion = {
  duration: {
    /** The 400ms signal-underline micro-interaction (§2, questions 3–7). */
    fast: 400,
    /** Standard crossfade between phases. */
    base: 600,
    /** Welcome screen's typewriter-paced line fade-in. */
    slow: 1400,
  },
  delay: {
    /** Pause before the Welcome line begins fading in. */
    lineStart: 300,
    /** Pause after the line lands, before the Begin button appears. */
    buttonReveal: 2000,
  },
  easing: {
    standard: Easing.inOut(Easing.ease),
    in: Easing.in(Easing.ease),
    out: Easing.out(Easing.ease),
  },
} as const;

export type Motion = typeof motion;

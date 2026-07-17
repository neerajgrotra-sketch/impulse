import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BreathingOrb } from "./BreathingOrb";
import type { VoiceOrbState } from "./VoiceOrb";
import { colors } from "@/theme";

type MomentSphereState = "idle" | "thinking" | "complete";

type MomentSphereProps = {
  /** Any positive integer — the sphere shows only this bare numeral, never
   *  a total or "of N". */
  currentMoment: number;
  state: MomentSphereState;
  /** Passthrough overrides for BreathingOrb's richer sub-states, so screens
   *  that already distinguish listening/typing/error don't lose that nuance
   *  under this component's simpler idle/thinking/complete contract. */
  listening?: boolean;
  isTyping?: boolean;
  hasError?: boolean;
  /** BreathingOrb's own "a backend call succeeded" held tint — orthogonal to
   *  `state` (e.g. Vision Canvas wants the green settle once inspiration
   *  arrives, while still on Moment 2, not "complete"). Defaults to true
   *  once `state` reaches "complete", so callers reaching the final Moment
   *  don't need to pass this explicitly. */
  connected?: boolean;
  reduceMotion?: boolean;
  size?: number;
};

const MIN_NUMBER_FONT_SIZE = 48;
const MAX_NUMBER_FONT_SIZE = 64;

/** Scales the numeral to the sphere's own size, clamped to the 48-64pt
 *  range the design calls for — a smaller sphere (e.g. the content-heavy
 *  Understanding Review) still gets a readable, dominant number, never a
 *  number that overflows a larger sphere. */
function numberFontSize(sphereSize: number): number {
  return Math.round(Math.min(MAX_NUMBER_FONT_SIZE, Math.max(MIN_NUMBER_FONT_SIZE, sphereSize * 0.4)));
}

/**
 * Wraps BreathingOrb (left unmodified) with a centered step-number overlay
 * — pure text on top of the orb's existing animated layers, so it never
 * touches BreathingOrb's shared values or timing. One reusable sphere for
 * every AE-001 screen; screens read their step number from
 * `features/adaptive-coaching/journey.ts` rather than hardcoding it.
 *
 * Shows ONLY the bare numeral — no "Moment" word, no total, no "of N". The
 * word "Moment" never appears anywhere in this component; the number alone
 * is what a user should be able to read at a glance, dominant and
 * high-contrast. The number crossfades between steps (keyed by
 * `currentMoment`, so React unmounts/remounts the `Animated.Text` and its
 * entering/exiting transition fires), skipped entirely under Reduce Motion.
 */
export function MomentSphere({
  currentMoment,
  state,
  listening = false,
  isTyping = false,
  hasError = false,
  connected,
  reduceMotion = false,
  size = 140,
}: MomentSphereProps) {
  const orbState: VoiceOrbState = hasError
    ? "error"
    : listening
      ? "listening"
      : isTyping
        ? "typing"
        : state === "thinking"
          ? "processing"
          : state === "complete"
            ? "finished"
            : "idle";

  const accessibilityLabel = `Journey step ${currentMoment}`;

  return (
    // `accessible` + `accessibilityLabel` on this container is sufficient on
    // its own — RN groups the whole subtree into one VoiceOver/TalkBack-
    // focusable unit reading only this label; BreathingOrb's own root is
    // already `accessible={false}` (its own component), so nothing beneath
    // this View is independently announced.
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.wrap}>
      <BreathingOrb
        state={orbState}
        listening={listening}
        connected={connected ?? state === "complete"}
        reduceMotion={reduceMotion}
        size={size}
      />
      <View pointerEvents="none" style={styles.overlay}>
        <Animated.Text
          key={currentMoment}
          entering={reduceMotion ? undefined : FadeIn.duration(220)}
          exiting={reduceMotion ? undefined : FadeOut.duration(160)}
          style={[styles.number, { fontSize: numberFontSize(size), lineHeight: numberFontSize(size) + 6 }]}
        >
          {currentMoment}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    fontWeight: "700",
    color: colors.ink,
  },
});

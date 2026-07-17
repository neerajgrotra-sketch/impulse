import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BreathingOrb } from "./BreathingOrb";
import type { VoiceOrbState } from "./VoiceOrb";
import { colors, typography } from "@/theme";

type MomentSphereState = "idle" | "thinking" | "complete";

type MomentSphereProps = {
  currentMoment: number;
  /** Only used to build the accessibility label ("Moment X of Y") — never
   *  shown visually. Omit it once a journey's length is genuinely open-ended
   *  (the adaptive interview will not know its own total moment count up
   *  front); the label falls back to "Moment X" alone. */
  totalMoments?: number;
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

/**
 * Wraps BreathingOrb (left unmodified) with a centered Moment-number overlay
 * — pure text on top of the orb's existing animated layers, so it never
 * touches BreathingOrb's shared values or timing. One reusable sphere for
 * every AE-001 screen; screens read their Moment number from
 * `features/adaptive-coaching/journey.ts` rather than hardcoding it.
 *
 * Redesigned from an earlier "MOMENT / X of Y" treatment (small, low-contrast,
 * and it baked in a total the adaptive interview won't always have) to a
 * single dominant number with a small "Moment" caption underneath — the
 * number is what a user should be able to read at a glance, the total isn't
 * shown at all. The number crossfades between Moments (keyed by
 * `currentMoment`, so React unmounts/remounts the `Animated.Text` and its
 * entering/exiting transition fires), skipped entirely under Reduce Motion.
 */
export function MomentSphere({
  currentMoment,
  totalMoments,
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

  const accessibilityLabel = totalMoments ? `Moment ${currentMoment} of ${totalMoments}` : `Moment ${currentMoment}`;

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
          style={styles.number}
        >
          {currentMoment}
        </Animated.Text>
        <Text style={[typography.caption, styles.label]}>Moment</Text>
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
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
    color: colors.ink,
  },
  label: {
    marginTop: 2,
    color: colors.inkSecondary,
  },
});

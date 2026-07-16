import { StyleSheet, Text, View } from "react-native";
import { BreathingOrb } from "./BreathingOrb";
import type { VoiceOrbState } from "./VoiceOrb";
import { colors, typography } from "@/theme";

type MomentSphereState = "idle" | "thinking" | "complete";

type MomentSphereProps = {
  currentMoment: number;
  totalMoments: number;
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
 * Wraps BreathingOrb (left unmodified) with a centered "MOMENT X of Y"
 * overlay — pure text on top of the orb's existing animated layers, so it
 * never touches BreathingOrb's shared values or timing. One reusable sphere
 * for every AE-001 screen; screens read their Moment number from
 * `features/adaptive-coaching/journey.ts` rather than hardcoding it.
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

  return (
    // `accessible` + `accessibilityLabel` on this container is sufficient on
    // its own — RN groups the whole subtree into one VoiceOver/TalkBack-
    // focusable unit reading only this label; BreathingOrb's own root is
    // already `accessible={false}` (its own component), so nothing beneath
    // this View is independently announced.
    <View
      accessible
      accessibilityLabel={`Moment ${currentMoment} of ${totalMoments}`}
      style={styles.wrap}
    >
      <BreathingOrb
        state={orbState}
        listening={listening}
        connected={connected ?? state === "complete"}
        reduceMotion={reduceMotion}
        size={size}
      />
      <View pointerEvents="none" style={styles.overlay}>
        <Text style={[typography.caption, styles.label]}>MOMENT</Text>
        <Text style={[typography.bodySecondary, styles.number]}>
          {currentMoment} of {totalMoments}
        </Text>
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
    gap: 2,
  },
  label: {
    letterSpacing: 1.4,
    color: colors.inkSecondary,
    fontSize: 10,
  },
  number: {
    color: colors.ink,
    fontWeight: "600",
  },
});

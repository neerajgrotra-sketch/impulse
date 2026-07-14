import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { VoiceOrb, type VoiceOrbState } from "./VoiceOrb";
import { colors, spacing, typography } from "@/theme";

type BreathingOrbProps = {
  state: VoiceOrbState;
  listening: boolean;
  size?: number;
};

/**
 * Wraps the existing `VoiceOrb` (left unmodified) with the listening-only
 * glow ripple, slight expansion, and "Listening…" label Phase 6 calls for —
 * so the orb component itself stays exactly as it is everywhere else in
 * onboarding, and this extra behavior only ever applies here.
 */
export function BreathingOrb({ state, listening, size = 140 }: BreathingOrbProps) {
  const active = useSharedValue(0);
  const pulse = useSharedValue(0);
  const boost = useSharedValue(1);

  useEffect(() => {
    if (listening) {
      active.value = withTiming(1, { duration: 150 });
      boost.value = withTiming(1.08, { duration: 300 });
      pulse.value = 0;
      pulse.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    } else {
      active.value = withTiming(0, { duration: 200 });
      boost.value = withTiming(1, { duration: 300 });
      cancelAnimation(pulse);
    }
    return () => cancelAnimation(pulse);
  }, [listening, active, boost, pulse]);

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: active.value * (1 - pulse.value) * 0.45,
    transform: [{ scale: 1 + pulse.value * 0.4 }],
  }));

  const boostStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boost.value }],
  }));

  return (
    <View style={styles.wrap} accessible={false}>
      <Animated.View
        pointerEvents="none"
        style={[styles.ripple, { width: size, height: size, borderRadius: size / 2 }, rippleStyle]}
      />
      <Animated.View style={boostStyle}>
        <VoiceOrb state={state} size={size} />
      </Animated.View>
      {listening && <Text style={[typography.caption, styles.label]}>Listening…</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  label: {
    marginTop: spacing.sm,
    color: colors.inkSecondary,
  },
});

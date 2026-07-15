import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { VoiceOrb, type VoiceOrbState } from "./VoiceOrb";
import { colors, spacing, typography } from "@/theme";

type BreathingOrbProps = {
  state: VoiceOrbState;
  listening: boolean;
  /** Bumped by the parent each time a new thought enters while idle — fires a
   *  one-shot micro-pulse without disturbing the base breathing loop. Only
   *  meaningful (and only sent by the parent) while Reduce Motion is off. */
  thoughtPulseSignal?: number;
  /** True once a backend/LLM call this screen depends on has succeeded —
   *  unlike `finished`/`error`, this is a held state, not a one-shot: the
   *  orb slowly settles into a light green tint and stays there for as long
   *  as `connected` stays true. Never animates toward "connected" on its
   *  own — a caller that never sets this true (no LLM call, or one still in
   *  flight) simply leaves the orb at its current color. */
  connected?: boolean;
  /** True the moment Reduce Motion is on, so the one-shot Finished/Error
   *  effects skip their animated build-up and land on their held value
   *  immediately instead of easing there. */
  reduceMotion?: boolean;
  size?: number;
};

/**
 * Wraps the existing `VoiceOrb` (left unmodified) with state-driven glow —
 * an expanding ripple + slight expansion while listening, a soft non-
 * expanding shimmer while processing, a subtle brightness boost while
 * typing, a one-shot acknowledgment pulse when a recording has just
 * settled, and a one-shot soft warm-red tint on error — all built on the
 * same `active`/`pulse`/`boost` shared values so no state introduces a new
 * animation system. The orb itself never stops breathing; these only layer
 * on top.
 */
export function BreathingOrb({
  state,
  listening,
  thoughtPulseSignal,
  connected = false,
  reduceMotion = false,
  size = 140,
}: BreathingOrbProps) {
  const active = useSharedValue(0);
  const pulse = useSharedValue(0);
  const boost = useSharedValue(1);
  // Two separate shared values (not one shared "microPulse") — each is
  // written from exactly one effect below, so the two one-shot gestures
  // never race to modify the same value from different triggers.
  const finishedPulse = useSharedValue(0);
  const thoughtPulse = useSharedValue(0);
  const errorTint = useSharedValue(0);
  const successTint = useSharedValue(0);
  const processing = state === "processing" && !listening;
  const typing = state === "typing" && !listening;
  const finished = state === "finished" && !listening;
  const isError = state === "error" && !listening;

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
    } else if (processing) {
      // Soft shimmer: a slow opacity breathe, no expanding ring — distinct
      // from listening's outward pulse.
      active.value = withTiming(1, { duration: 200 });
      boost.value = withTiming(1, { duration: 300 });
      pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else if (typing) {
      active.value = withTiming(0, { duration: 200 });
      boost.value = withTiming(1.03, { duration: 300 });
      cancelAnimation(pulse);
    } else {
      active.value = withTiming(0, { duration: 200 });
      boost.value = withTiming(1, { duration: 300 });
      cancelAnimation(pulse);
    }
    return () => cancelAnimation(pulse);
  }, [listening, processing, typing, active, boost, pulse]);

  // Finished: a single acknowledgment, never a loop — reads as "message
  // received," not praise, so it's a plain lift with no bounce or overshoot.
  useEffect(() => {
    if (!finished) return;
    if (reduceMotion) {
      finishedPulse.value = 0;
      return;
    }
    finishedPulse.value = withSequence(
      withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) })
    );
  }, [finished, reduceMotion, finishedPulse]);

  // Thought-appearing: an even smaller, faster echo of the same mechanism —
  // only meaningful while idle (see VoiceOrbState precedence in the
  // choreography doc), and the parent only bumps this signal when Reduce
  // Motion is off.
  useEffect(() => {
    if (thoughtPulseSignal === undefined || state !== "idle") return;
    thoughtPulse.value = withSequence(
      withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thoughtPulseSignal]);

  useEffect(() => {
    if (!isError) return;
    if (reduceMotion) {
      errorTint.value = 0;
      return;
    }
    errorTint.value = withSequence(
      withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 350, easing: Easing.in(Easing.ease) })
    );
  }, [isError, reduceMotion, errorTint]);

  // Connected: a slow, held settle into green — not a pulse — so it reads as
  // a status, not an event. Fades back out just as gently if `connected`
  // ever goes false again (e.g. the screen resets). Reduce Motion still
  // needs the color information, so it jumps straight to the target value
  // instead of being suppressed like the one-shot Finished/Error effects.
  useEffect(() => {
    if (reduceMotion) {
      successTint.value = connected ? 1 : 0;
      return;
    }
    successTint.value = withTiming(connected ? 1 : 0, {
      duration: connected ? 1800 : 400,
      easing: Easing.out(Easing.ease),
    });
  }, [connected, reduceMotion, successTint]);

  const rippleStyle = useAnimatedStyle(() => {
    if (processing) {
      return {
        opacity: active.value * pulse.value * 0.35,
        transform: [{ scale: 1 }],
      };
    }
    return {
      opacity: active.value * (1 - pulse.value) * 0.45,
      transform: [{ scale: 1 + pulse.value * 0.4 }],
    };
  });

  const boostStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boost.value * (1 + finishedPulse.value * 0.02 + thoughtPulse.value * 0.007) }],
  }));

  const errorTintStyle = useAnimatedStyle(() => ({
    opacity: errorTint.value * 0.18,
  }));

  const successTintStyle = useAnimatedStyle(() => ({
    opacity: successTint.value * 0.22,
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
      <Animated.View
        pointerEvents="none"
        style={[
          styles.errorTint,
          { width: size, height: size, borderRadius: size / 2 },
          errorTintStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.successTint,
          { width: size, height: size, borderRadius: size / 2 },
          successTintStyle,
        ]}
      />
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
  errorTint: {
    position: "absolute",
    backgroundColor: colors.state.danger,
  },
  successTint: {
    position: "absolute",
    backgroundColor: colors.state.success,
  },
  label: {
    marginTop: spacing.sm,
    color: colors.inkSecondary,
  },
});

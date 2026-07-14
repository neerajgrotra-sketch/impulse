import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Extrapolation,
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

export type VoiceOrbState = "idle" | "listening" | "speaking" | "typing" | "processing" | "finished" | "error";

type VoiceOrbProps = {
  state: VoiceOrbState;
  size?: number;
};

/** Cycle duration per state, in ms — ported from VoiceOrbView.swift's `cycleDuration`.
 *  `typing` and `processing` breathe slightly faster than idle so the orb reads as
 *  subtly more alive during those states without inventing a new animation system.
 *  `finished` and `error` are brief, transient states layered on `BreathingOrb` —
 *  the base breathing loop underneath keeps running at the idle cadence. */
const CYCLE_DURATION: Record<VoiceOrbState, number> = {
  idle: 4000,
  listening: 4000,
  speaking: 1000,
  typing: 3200,
  processing: 2400,
  finished: 4000,
  error: 4000,
};

const GLOW_SCALE = 1.4;

/**
 * The breathing orb — listening / thinking / speaking states via pulse
 * cadence only, same Milestone-1 scope as VoiceOrbView.swift (no amplitude-
 * reactive animation; that needs live TTS amplitude, not available from
 * either AVSpeechSynthesizer or `expo-speech` without extra plumbing).
 *
 * The breathing reads as *light*, not just size: a soft halo layer behind
 * the orb brightens and swells in the same instant the orb itself expands,
 * and dims back down as it contracts — both driven off the one `scale`
 * value (via `interpolate`) so they can never drift out of sync with each
 * other or need a second timing loop.
 */
export function VoiceOrb({ state, size = 140 }: VoiceOrbProps) {
  const scale = useSharedValue(0.94);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.08, { duration: CYCLE_DURATION[state], easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    return () => cancelAnimation(scale);
  }, [state, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scale.value, [0.94, 1.08], [0.35, 0.85], Extrapolation.CLAMP),
    transform: [{ scale: scale.value }],
  }));

  const glowSize = size * GLOW_SCALE;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", width: glowSize, height: glowSize }, glowStyle]}
      >
        <Svg width={glowSize} height={glowSize} viewBox="0 0 140 140">
          <Defs>
            <RadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55} />
              <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.16} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={70} cy={70} r={70} fill="url(#orbGlow)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size} viewBox="0 0 140 140">
          <Defs>
            <RadialGradient id="orbGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.15} />
            </RadialGradient>
          </Defs>
          <Circle cx={70} cy={70} r={70} fill="url(#orbGradient)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

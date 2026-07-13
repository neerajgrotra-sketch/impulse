import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

export type VoiceOrbState = "idle" | "listening" | "speaking";

type VoiceOrbProps = {
  state: VoiceOrbState;
  size?: number;
};

/** Cycle duration per state, in ms — ported from VoiceOrbView.swift's `cycleDuration`. */
const CYCLE_DURATION: Record<VoiceOrbState, number> = {
  idle: 4000,
  listening: 4000,
  speaking: 1000,
};

/**
 * The breathing orb — listening / thinking / speaking states via pulse
 * cadence only, same Milestone-1 scope as VoiceOrbView.swift (no amplitude-
 * reactive animation; that needs live TTS amplitude, not available from
 * either AVSpeechSynthesizer or `expo-speech` without extra plumbing).
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

  return (
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
  );
}

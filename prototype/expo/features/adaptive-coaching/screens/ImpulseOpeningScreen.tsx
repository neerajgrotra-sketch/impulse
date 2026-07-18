import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { GradientBackground, VersionLabel } from "@/components";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { colors, fontFamily } from "@/theme";

const WORDMARK = "IMPULSE".split("");

// Tuned so the whole sequence lands in the 1.2-1.8s window the spec calls
// for: the last letter starts its pulse at (LETTERS-1)*STAGGER_MS = 480ms
// and finishes at 480+PULSE_MS = 930ms; HOLD_MS then gives the settled
// wordmark a beat to actually be read before auto-advancing.
const STAGGER_MS = 80;
const PULSE_MS = 450;
const HOLD_MS = 500;
const TOTAL_MS = (WORDMARK.length - 1) * STAGGER_MS + PULSE_MS + HOLD_MS;

// Reduce Motion: "a simple short crossfade," never the letter-by-letter
// pulse — short on purpose, this is a brand moment, not a loading screen.
const REDUCE_MOTION_MS = 700;

type ImpulseOpeningScreenProps = {
  /** Fired once automatically, after the animation (or its Reduce Motion
   *  crossfade) completes — no user tap required, per spec. */
  onComplete: () => void;
};

/**
 * The very first thing a person sees — a brief, refined brand moment before
 * profile collection, evoking a neural impulse/heartbeat rather than a game
 * splash screen. Auto-advances; there is nothing to tap.
 */
export function ImpulseOpeningScreen({ onComplete }: ImpulseOpeningScreenProps) {
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    const timer = setTimeout(onComplete, reduceMotion ? REDUCE_MOTION_MS : TOTAL_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  return (
    <View style={styles.container} accessible accessibilityLabel="Impulse" accessibilityRole="header">
      <GradientBackground />
      {reduceMotion ? (
        <Animated.Text entering={FadeIn.duration(350)} exiting={FadeOut.duration(250)} style={styles.wordmark}>
          IMPULSE
        </Animated.Text>
      ) : (
        <View style={styles.wordRow} importantForAccessibility="no-hide-descendants">
          {WORDMARK.map((letter, index) => (
            <PulseLetter key={index} letter={letter} index={index} />
          ))}
        </View>
      )}
      <VersionLabel />
    </View>
  );
}

function PulseLetter({ letter, index }: { letter: string; index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * STAGGER_MS, withTiming(1, { duration: PULSE_MS }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.32, 1, 0.92]),
    color: interpolateColor(progress.value, [0, 0.5, 1], [colors.inkTertiary, colors.accent, colors.ink]),
    transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.16, 1]) }],
  }));

  return (
    <Animated.Text style={[styles.wordmark, animatedStyle]} accessibilityElementsHidden importantForAccessibility="no">
      {letter}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.gradientStart,
  },
  wordRow: {
    flexDirection: "row",
  },
  wordmark: {
    fontFamily: fontFamily.serifSemiBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: 6,
    color: colors.ink,
  },
});

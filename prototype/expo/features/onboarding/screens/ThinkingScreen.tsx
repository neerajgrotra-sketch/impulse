import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components";
import { thinkingPhrases } from "@/constants/thinkingPhrases";
import { BlueprintApiError, generateBlueprint, toInvestorSafeMessage } from "@/services/blueprintApi";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { colors, fontFamily, spacing } from "@/theme";

const PHRASE_INTERVAL_MS = 2400;
const CROSSFADE_MS = 600;
const ORB_SIZE = 84;
const ORB_CYCLE_MS = 1800;

/**
 * Screen 4 — the pause before the climax, ported from ThinkingView.swift.
 * Cycles through category labels describing *what kind* of understanding is
 * forming — never a percentage, never a progress bar, never a claim that a
 * specific step has completed. The cycle is untied to the real network
 * call: it loops for exactly as long as this screen exists (§ effect below
 * fires the request once on mount) and is unmounted the instant the
 * Blueprint arrives — it can never finish before, or claim more than, the
 * real answer.
 */
export function ThinkingScreen() {
  const blueprintSucceeded = useOnboardingStore((state) => state.blueprintSucceeded);
  const blueprintFailed = useOnboardingStore((state) => state.blueprintFailed);
  const insets = useSafeAreaInsets();

  const [phraseIndex, setPhraseIndex] = useState(0);
  const scale = useSharedValue(0.9);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.1, { duration: ORB_CYCLE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    return () => cancelAnimation(scale);
  }, [scale]);

  // Phrase cycling — runs for as long as this screen exists (i.e. for as
  // long as the request is pending). No fixed length, no completion state.
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % thinkingPhrases.length);
    }, PHRASE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Fires the Blueprint request exactly once. This screen remounts fresh on
  // every retry (the coordinator swaps it out for ErrorRetryScreen and back
  // in), so "once per mount" is "once per attempt" — the ref guard is a
  // second safety net against React's dev-mode double-invoke, not the
  // primary mechanism. Reads the transcript directly from the store rather
  // than subscribing to it, since it's fixed for the duration of this
  // screen and re-reading reactively would risk re-firing the effect.
  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    const controller = new AbortController();
    const transcript = useOnboardingStore.getState().transcript;

    generateBlueprint(transcript, { signal: controller.signal })
      .then((blueprint) => {
        blueprintSucceeded(blueprint);
      })
      .catch((err) => {
        if (err instanceof BlueprintApiError && err.kind === "aborted") return;
        blueprintFailed(toInvestorSafeMessage(err));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.container}>
      <GradientBackground />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Animated.View style={[{ width: ORB_SIZE, height: ORB_SIZE }, orbStyle]}>
          <Svg width={ORB_SIZE} height={ORB_SIZE} viewBox="0 0 84 84">
            <Defs>
              <RadialGradient id="thinkingOrbGradient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.55} />
                <Stop offset="100%" stopColor={colors.accent} stopOpacity={0.05} />
              </RadialGradient>
            </Defs>
            <Circle cx={42} cy={42} r={42} fill="url(#thinkingOrbGradient)" />
          </Svg>
        </Animated.View>

        <Animated.View key={phraseIndex} entering={FadeIn.duration(CROSSFADE_MS)}>
          <Text style={styles.phrase}>{thinkingPhrases[phraseIndex]}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.gradientStart,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  phrase: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 17,
    lineHeight: 24,
    color: colors.inkSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.xxl,
  },
});

import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground, PrimaryButton } from "@/components";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { colors, motion, spacing, typography } from "@/theme";

/**
 * Screen 1 — cold open. Copy, pacing, and the two-stage fade (line, then a
 * pause, then the button) are ported exactly from WelcomeView.swift — see
 * that file for the source timings this mirrors.
 *
 * No router involved: like PrototypeCoordinator.swift, the whole onboarding
 * funnel is one phase-switch, not a navigation stack — see
 * OnboardingCoordinator.tsx. "Begin" just advances the store's phase.
 */
export function WelcomeScreen() {
  const beginConsentFlow = useOnboardingStore((state) => state.beginConsentFlow);
  const insets = useSafeAreaInsets();

  const lineOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const [buttonReady, setButtonReady] = useState(false);
  const hasBegunRef = useRef(false);

  useEffect(() => {
    lineOpacity.value = withDelay(
      motion.delay.lineStart,
      withTiming(1, { duration: motion.duration.slow, easing: motion.easing.in })
    );

    const revealDelay = motion.delay.lineStart + motion.delay.buttonReveal;
    buttonOpacity.value = withDelay(revealDelay, withTiming(1, { duration: motion.duration.base, easing: motion.easing.in }));

    const timeout = setTimeout(() => setButtonReady(true), revealDelay);
    return () => clearTimeout(timeout);
  }, [buttonOpacity, lineOpacity]);

  const lineStyle = useAnimatedStyle(() => ({ opacity: lineOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));

  function handleBegin() {
    if (hasBegunRef.current) return;
    hasBegunRef.current = true;
    beginConsentFlow();
  }

  return (
    <View style={styles.container}>
      <GradientBackground />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Animated.Text style={[typography.display, styles.line, lineStyle]}>
          Before we begin — who are you becoming?
        </Animated.Text>

        <Animated.View style={[styles.buttonSlot, buttonStyle]}>
          {buttonReady && <PrimaryButton label="Begin" onPress={handleBegin} />}
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
    paddingHorizontal: spacing.xxl,
    gap: spacing.xl,
  },
  line: {
    textAlign: "center",
  },
  buttonSlot: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
});

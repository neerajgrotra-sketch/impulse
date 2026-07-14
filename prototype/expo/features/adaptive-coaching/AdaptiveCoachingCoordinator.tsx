import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { GradientBackground } from "@/components";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";
import { colors, spacing, typography } from "@/theme";
import { DebugOverlay } from "./components/DebugOverlay";
import { CoachingBeatScreen } from "./screens/CoachingBeatScreen";
import { MomentOneScreen } from "./screens/MomentOneScreen";
import { NameCollectionScreen } from "./screens/NameCollectionScreen";
import { SafetyHandoffScreen } from "./screens/SafetyHandoffScreen";
import { VisionCanvasScreen } from "./screens/VisionCanvasScreen";

/**
 * AE-001's coordinator — same mechanism as `features/onboarding/OnboardingCoordinator.tsx`
 * (one switch over a phase union, one `Animated.View` keyed by phase status,
 * `FadeIn`/`FadeOut`), kept fully separate so this experiment stays isolated
 * and reversible. One improvement over the original: this coordinator
 * simplifies its own top-level transition under Reduce Motion, since it's
 * new code and there's no reason not to.
 */
export function AdaptiveCoachingCoordinator() {
  const phase = useAdaptiveCoachingStore((s) => s.phase);
  const setFirstName = useAdaptiveCoachingStore((s) => s.setFirstName);
  const beginMomentOne = useAdaptiveCoachingStore((s) => s.beginMomentOne);
  const submitBecomingResponse = useAdaptiveCoachingStore((s) => s.submitBecomingResponse);
  const reset = useAdaptiveCoachingStore((s) => s.reset);
  const reduceMotion = useReduceMotion();
  const voiceCapture = useVoiceCapture();

  return (
    <View style={styles.container}>
      <Animated.View
        key={phase.status}
        entering={reduceMotion ? undefined : FadeIn.duration(500)}
        exiting={reduceMotion ? undefined : FadeOut.duration(400)}
        style={styles.container}
      >
        {renderPhase()}
      </Animated.View>
      <DebugOverlay />
    </View>
  );

  function renderPhase() {
    switch (phase.status) {
      case "name":
        return (
          <NameCollectionScreen
            onSubmit={(name) => {
              setFirstName(name);
              beginMomentOne();
            }}
          />
        );
      case "moment-one":
        return <MomentOneScreen voiceCapture={voiceCapture} onSubmit={submitBecomingResponse} />;
      case "generating-inspiration":
      case "inspiration-vision":
      case "reviewing":
        return <VisionCanvasScreen voiceCapture={voiceCapture} />;
      case "coaching-beat":
        return <CoachingBeatScreen beat={phase.beat} move={phase.move} message={phase.message} />;
      case "safety-hand-off":
        return <SafetyHandoffScreen message={phase.message} />;
      case "failed":
        return <FailedScreen message={phase.message} onRetry={reset} />;
    }
  }
}

function FailedScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <GradientBackground />
      <View style={styles.failedContent}>
        <Text style={[typography.body, styles.failedText]}>{message}</Text>
        <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button" accessibilityLabel="Start over">
          <Text style={[typography.bodySecondary, styles.retryLabel]}>Start over</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  failedContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  failedText: { textAlign: "center" },
  retryLabel: { textDecorationLine: "underline", color: colors.accent },
});

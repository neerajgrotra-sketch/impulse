import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";
import type { AdaptivePhase } from "@/types/adaptiveCoaching";
import { BuildBadge } from "./components/BuildBadge";
import { DebugOverlay } from "./components/DebugOverlay";
import { MomentOneScreen } from "./screens/MomentOneScreen";
import { NameCollectionScreen } from "./screens/NameCollectionScreen";
import { SafetyHandoffScreen } from "./screens/SafetyHandoffScreen";
import { UnderstandingReviewScreen } from "./screens/UnderstandingReviewScreen";
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
  const becomingResponse = useAdaptiveCoachingStore((s) => s.becomingResponse);
  const setFirstName = useAdaptiveCoachingStore((s) => s.setFirstName);
  const beginMomentOne = useAdaptiveCoachingStore((s) => s.beginMomentOne);
  const submitBecomingResponse = useAdaptiveCoachingStore((s) => s.submitBecomingResponse);
  const reduceMotion = useReduceMotion();
  const voiceCapture = useVoiceCapture();

  return (
    <View style={styles.container}>
      <Animated.View
        key={screenKey(phase.status)}
        entering={reduceMotion ? undefined : FadeIn.duration(500)}
        exiting={reduceMotion ? undefined : FadeOut.duration(400)}
        style={styles.container}
      >
        {renderPhase()}
      </Animated.View>
      <DebugOverlay />
      <BuildBadge />
    </View>
  );

  // "generating-inspiration" / "inspiration-vision" / "reviewing" are all one
  // continuous VisionCanvasScreen instance (its own doc comment says so) —
  // keying this wrapper by raw `phase.status` was remounting that screen
  // from scratch on every one of those internal transitions (most visibly,
  // every single thought-bubble tap, which moves reviewing -> a fresh mount),
  // tearing down ThoughtStream's scheduler and its timers each time. Group
  // them under one stable key so only a transition to a genuinely different
  // screen re-triggers the enter/exit crossfade.
  function screenKey(status: AdaptivePhase["status"]): string {
    if (status === "generating-inspiration" || status === "inspiration-vision" || status === "reviewing") {
      return "vision-canvas";
    }
    return status;
  }

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
        return (
          <MomentOneScreen
            voiceCapture={voiceCapture}
            onSubmit={submitBecomingResponse}
            initialText={becomingResponse}
          />
        );
      case "generating-inspiration":
      case "inspiration-vision":
      case "reviewing":
        return <VisionCanvasScreen voiceCapture={voiceCapture} />;
      case "understanding-review":
        return <UnderstandingReviewScreen />;
      case "safety-hand-off":
        return <SafetyHandoffScreen message={phase.message} />;
    }
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

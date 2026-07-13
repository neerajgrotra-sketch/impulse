import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { PlaceholderScreen } from "@/components";
import { useQuestionVoice } from "@/hooks/useQuestionVoice";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { CoachingTouchScreen } from "./screens/CoachingTouchScreen";
import { ConsentScreen } from "./screens/ConsentScreen";
import { ConversationScreen } from "./screens/ConversationScreen";
import { ErrorRetryScreen } from "./screens/ErrorRetryScreen";
import { IdentityConfirmScreen } from "./screens/IdentityConfirmScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";

/**
 * A single lightweight coordinator for a linear flow — no tab bar, no
 * navigation stack, ported from PrototypeCoordinator.swift. Switches on the
 * store's phase and crossfades between screens; there is deliberately no
 * `router.push` anywhere in this funnel (docs/investor-prototype.md §2:
 * "no back button mid-conversation — this is a conversation, not a form").
 *
 * Owns the two device-capability hooks (voice capture, question TTS) and
 * passes them down — the same shape as Swift's Coordinator owning
 * `SpeechRecognizer`/`QuestionVoicePlayer` and injecting them into screens.
 */
export function OnboardingCoordinator() {
  const phase = useOnboardingStore((state) => state.phase);
  const voiceCapture = useVoiceCapture();
  const questionVoice = useQuestionVoice();

  return (
    <View style={styles.container}>
      <Animated.View
        key={phase.status}
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(400)}
        style={styles.container}
      >
        {renderPhase()}
      </Animated.View>
    </View>
  );

  function renderPhase() {
    switch (phase.status) {
      case "welcome":
        return <WelcomeScreen />;
      case "consent":
        return <ConsentScreen voiceCapture={voiceCapture} />;
      case "conversation":
        return <ConversationScreen voiceCapture={voiceCapture} questionVoice={questionVoice} />;
      case "identity-confirm":
        return <IdentityConfirmScreen />;
      case "coaching-touch":
        return <CoachingTouchScreen />;
      case "thinking":
      case "blueprint":
        // Unreached from onboarding's default flow as of PDR 0006 — kept as
        // valid phases for a future, separately-specced Blueprint feature.
        // ThinkingScreen/ReflectionScreen still exist and still work; they're
        // just not wired into this coordinator's switch. See
        // types/onboarding.ts's OnboardingPhase doc comment.
        return null;
      case "promise":
        return <PlaceholderScreen eyebrow="Milestone 5" message="The Promise arrives in Milestone 5." />;
      case "confirmation":
        return (
          <PlaceholderScreen
            eyebrow="Milestone 6"
            message="Understanding Confirmation arrives in Milestone 6."
          />
        );
      case "failed":
        return <ErrorRetryScreen message={phase.message} />;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

import { useEffect, useRef, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BreathingOrb,
  EditableVisionCard,
  GradientBackground,
  PrimaryButton,
  ThoughtStream,
  VoiceCaptureButton,
} from "@/components";
import type { VoiceOrbState } from "@/components";
import type { Thought } from "@/constants/thoughtLibrary";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import type { QuestionVoice } from "@/hooks/useQuestionVoice";
import { useScreenReaderEnabled } from "@/hooks/useScreenReaderEnabled";
import { useSpeechRecognitionAdapter } from "@/hooks/useSpeechRecognitionAdapter";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";
import { colors, fontFamily, spacing, typography } from "@/theme";
import type { OnboardingQuestion } from "@/types/onboarding";
import { deriveIdentityStatement } from "@/utils/identityStatement";

type IdentityInspirationScreenProps = {
  question: OnboardingQuestion;
  voiceCapture: VoiceCapture;
  questionVoice: QuestionVoice;
  onSubmit: (statement: string) => void;
};

/**
 * The identity-capture screen's coordinator (Phase 2): owns which state
 * each piece is in — thought stream, voice capture, vision card — and wires
 * them together, but contains none of their animation implementation
 * details itself. Those live in `ThoughtStream`, `BreathingOrb`,
 * `VoiceCaptureButton`, and `EditableVisionCard`.
 */
export function IdentityInspirationScreen({
  question,
  voiceCapture,
  questionVoice,
  onSubmit,
}: IdentityInspirationScreenProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const screenReaderEnabled = useScreenReaderEnabled();
  const speechAdapter = useSpeechRecognitionAdapter(voiceCapture);

  const [visionText, setVisionText] = useState("");
  const [cardRevealed, setCardRevealed] = useState(false);
  // A screen only ever mounts while the app is already foregrounded, so
  // start active and rely on the listener below purely for transitions.
  const [appActive, setAppActive] = useState(true);
  const inputRef = useRef<TextInput>(null);
  const lastHandledTranscriptRef = useRef<string | null>(null);
  // Only the tap-a-thought and write-your-own paths pop the keyboard
  // automatically — a voice-completion reveal leaves focus alone so the
  // user can read what was heard before deciding to edit it.
  const pendingAutoFocusRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => setAppActive(next === "active"));
    return () => subscription.remove();
  }, []);

  // Speaks the title once, same as every other question in this flow —
  // and cancels both TTS and any in-flight recording if the user leaves
  // (back button, app close) before finishing.
  useEffect(() => {
    questionVoice.speak(question.text);
    return () => {
      questionVoice.stop();
      speechAdapter.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  useEffect(() => {
    if (speechAdapter.status !== "completed") return;
    const transcript = speechAdapter.finalTranscript.trim();
    if (!transcript || lastHandledTranscriptRef.current === transcript) return;
    lastHandledTranscriptRef.current = transcript;
    setVisionText(deriveIdentityStatement(transcript));
    setCardRevealed(true);
  }, [speechAdapter.status, speechAdapter.finalTranscript]);

  useEffect(() => {
    if (cardRevealed && pendingAutoFocusRef.current) {
      pendingAutoFocusRef.current = false;
      inputRef.current?.focus();
    }
  }, [cardRevealed]);

  function handleSelectThought(thought: Thought) {
    pendingAutoFocusRef.current = true;
    setVisionText(deriveIdentityStatement(thought.text));
    setCardRevealed(true);
  }

  function handleWriteOwn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingAutoFocusRef.current = true;
    setVisionText("");
    setCardRevealed(true);
  }

  // Once the card is revealed the stream never comes back for this screen —
  // "do not automatically continue" cuts both ways, the suggestion phase is
  // over the moment the user commits to one.
  const paused =
    cardRevealed ||
    speechAdapter.status === "listening" ||
    speechAdapter.status === "processing" ||
    !appActive;

  const orbState: VoiceOrbState = questionVoice.isSpeaking
    ? "speaking"
    : speechAdapter.status === "listening"
      ? "listening"
      : "idle";

  const canContinue = visionText.trim().length > 0;

  return (
    <View style={styles.container}>
      <GradientBackground />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          <View style={styles.topGroup}>
            <Text style={styles.title} accessibilityRole="header">
              {question.text}
            </Text>

            {!cardRevealed && (
              <Text style={styles.subtitle}>Tap a thought that fits, or write your own.</Text>
            )}

            <BreathingOrb state={orbState} listening={speechAdapter.status === "listening"} />

            <ThoughtStream
              paused={paused}
              reduceMotion={reduceMotion}
              screenReaderEnabled={screenReaderEnabled}
              onSelectThought={handleSelectThought}
              height={110}
            />

            {!cardRevealed && (
              <Pressable
                onPress={handleWriteOwn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Write your own vision instead"
              >
                <Text style={styles.writeOwn}>Or write your own</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.bottomSlot}>
            {cardRevealed && (
              <Animated.View entering={FadeIn.duration(400)} layout={LinearTransition} style={styles.cardWrap}>
                <EditableVisionCard value={visionText} onChangeText={setVisionText} inputRef={inputRef} />
              </Animated.View>
            )}

            {cardRevealed && (
              <Text style={styles.reviseNote}>You can always come back and change this later.</Text>
            )}

            <VoiceCaptureButton adapter={speechAdapter} />

            <PrimaryButton
              label="Continue"
              onPress={() => onSubmit(visionText)}
              fullWidth
              disabled={!canContinue}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.gradientStart,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  topGroup: {
    width: "100%",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 20,
    lineHeight: 27,
    color: colors.ink,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    ...typography.caption,
    textAlign: "center",
  },
  reviseNote: {
    ...typography.caption,
    textAlign: "center",
  },
  writeOwn: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.inkSecondary,
    textDecorationLine: "underline",
  },
  bottomSlot: {
    width: "100%",
    alignItems: "center",
    gap: spacing.md,
  },
  cardWrap: {
    width: "100%",
  },
});

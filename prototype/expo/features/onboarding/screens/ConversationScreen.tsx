import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, GradientBackground, PrimaryButton, VoiceOrb } from "@/components";
import type { VoiceOrbState } from "@/components";
import { onboardingQuestions } from "@/constants/onboardingQuestions";
import { IdentityInspirationScreen } from "./IdentityInspirationScreen";
import type { QuestionVoice } from "@/hooks/useQuestionVoice";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { colors, fontFamily, spacing, typography } from "@/theme";
import type { OnboardingQuestion } from "@/types/onboarding";

type ConversationScreenProps = {
  voiceCapture: VoiceCapture;
  questionVoice: QuestionVoice;
};

/**
 * Screen 3 — one reusable screen, re-driven by the current question, ported
 * from ConversationView.swift. Speaks the question, then starts listening
 * (voice builds) or focuses a text field (typed fallback — see
 * hooks/useVoiceCapture.ts for why Expo Go always takes this path). A
 * manual "Done" tap ends the answer, same deliberate simplification as the
 * Swift source: automatic silence-detection is a real reliability risk this
 * prototype doesn't take on.
 *
 * Originally had no back button by design ("this is a conversation, not a
 * form"). That held for the old fixed eight-question battery, where a
 * skipped/wrong answer barely mattered next to the sheer length of the
 * flow — but with the whole conversation down to one or two questions
 * (PDR 0006), having no way to revise an earlier answer became a real gap,
 * not a feature. `goBack` now covers it.
 */
export function ConversationScreen({ voiceCapture, questionVoice }: ConversationScreenProps) {
  const phase = useOnboardingStore((state) => state.phase);
  const recordAnswer = useOnboardingStore((state) => state.recordAnswer);
  const skipReflection = useOnboardingStore((state) => state.skipReflection);
  const goBack = useOnboardingStore((state) => state.goBack);
  const insets = useSafeAreaInsets();
  const [typedAnswer, setTypedAnswer] = useState("");
  const inputRef = useRef<TextInput>(null);

  const currentQuestion: OnboardingQuestion | undefined =
    phase.status === "conversation" ? onboardingQuestions[phase.questionIndex] : undefined;

  // Guards `finishAnswer` against a fast double-tap on "Done": without it, a
  // second synchronous call can read the store's already-advanced phase and
  // append the same answer again under the *next* question's key, corrupting
  // the transcript. Reset at the start of every question cycle (below), same
  // shape as ConsentScreen's `inFlight` guard.
  const hasFinishedRef = useRef(false);

  const speakAndListen = useCallback(
    async (question: OnboardingQuestion) => {
      // The identity question owns its own speak/listen lifecycle via
      // `IdentityInspirationScreen` (tap-to-record, not auto-listen) — this
      // screen's generic cycle only drives the reflection question now.
      if (question.kind === "identity") return;
      voiceCapture.stop();
      setTypedAnswer("");
      hasFinishedRef.current = false;
      await questionVoice.speak(question.text);
      if (voiceCapture.isAvailable) {
        voiceCapture.start();
      } else {
        inputRef.current?.focus();
      }
    },
    [voiceCapture, questionVoice]
  );

  // Re-runs only when the question itself changes — mirrors ConversationView.swift's
  // `.task(id: store.currentQuestion?.id)`, not a general reactive effect.
  useEffect(() => {
    if (currentQuestion) {
      speakAndListen(currentQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  // "Resume after interruptions": a phone call or Siri can tear down the
  // recognizer or the TTS session without either side reporting an error.
  // On return to foreground, if we're stuck with neither speaking nor
  // listening mid-question, restart this question's cycle cleanly. Typed
  // mode has no session to interrupt, so this only applies to voice builds.
  const latestRef = useRef({ currentQuestion, voiceCapture, questionVoice, speakAndListen });
  latestRef.current = { currentQuestion, voiceCapture, questionVoice, speakAndListen };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      const { currentQuestion, voiceCapture, questionVoice, speakAndListen } = latestRef.current;
      if (!currentQuestion) return;
      if (currentQuestion.kind === "identity") return;
      if (!voiceCapture.isAvailable) return;
      if (questionVoice.isSpeaking || voiceCapture.isRecording) return;
      speakAndListen(currentQuestion);
    });
    return () => subscription.remove();
  }, []);

  // Lets the user discard whatever's been captured so far (mid-recording or
  // already stopped) and start listening for this same question again.
  // `voiceCapture.start()` already tears down any active session and clears
  // `transcript` before restarting, so this is safe to call in either state.
  function retryRecording() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    voiceCapture.start();
  }

  function finishAnswer() {
    if (hasFinishedRef.current) return;
    const answer = voiceCapture.isAvailable ? voiceCapture.transcript : typedAnswer;
    if (!answer.trim()) return;
    hasFinishedRef.current = true;
    voiceCapture.stop();
    // A fast typed answer can be submitted while the coach is still finishing
    // the question aloud (typed mode has no gate on this the way voice mode's
    // canFinish does) — without this, that audio would keep playing audibly
    // over the transition into the next phase.
    questionVoice.stop();
    recordAnswer(answer);
    setTypedAnswer("");
  }

  // The tiny reflection is freely skippable — no answer recorded for it at
  // all (`05 Onboarding.md` §3 Step 3).
  function skipThisReflection() {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    voiceCapture.stop();
    questionVoice.stop();
    skipReflection();
    setTypedAnswer("");
  }

  function goToPreviousQuestion() {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    voiceCapture.stop();
    questionVoice.stop();
    goBack();
  }

  const orbState: VoiceOrbState = questionVoice.isSpeaking
    ? "speaking"
    : voiceCapture.isRecording
      ? "listening"
      : "idle";

  // Voice mode: keep "Done" available once anything's been captured, even if
  // recognition auto-stopped (some platforms silence-timeout around 3s
  // without `continuous` support) — losing the button would strand the
  // user's answer with no way to submit it.
  const canFinish = voiceCapture.isAvailable
    ? voiceCapture.isRecording || voiceCapture.transcript.trim().length > 0
    : typedAnswer.trim().length > 0;

  // "Try again" only makes sense once there's something captured to discard
  // — and only in voice mode, since typed answers are already directly
  // editable in place.
  const canRetry = voiceCapture.isAvailable && voiceCapture.transcript.trim().length > 0;

  if (!currentQuestion) return null;

  // The identity question (always index 0, no prior question to go back
  // to) gets the thought-stream/vision-card treatment instead of this
  // screen's generic voice-or-typed body — see IdentityInspirationScreen.
  if (currentQuestion.kind === "identity") {
    return (
      <IdentityInspirationScreen
        question={currentQuestion}
        voiceCapture={voiceCapture}
        questionVoice={questionVoice}
        onSubmit={recordAnswer}
      />
    );
  }

  return (
    <View style={styles.container}>
      <GradientBackground />

      {phase.status === "conversation" && phase.questionIndex > 0 && (
        <View style={[styles.backSlot, { top: insets.top + spacing.sm }]}>
          <BackButton onPress={goToPreviousQuestion} />
        </View>
      )}

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
          <View style={styles.orbWrap}>
            <VoiceOrb state={orbState} />
          </View>

          <Animated.View key={currentQuestion.id} entering={FadeIn.duration(500)}>
            <Text style={styles.question}>{currentQuestion.text}</Text>
          </Animated.View>

          <View style={styles.answerBox}>
            {voiceCapture.isAvailable ? (
              <ScrollView>
                <Text style={[typography.body, styles.transcript]}>
                  {voiceCapture.transcript || " "}
                </Text>
              </ScrollView>
            ) : (
              <TextInput
                ref={inputRef}
                style={[typography.body, styles.input]}
                value={typedAnswer}
                onChangeText={setTypedAnswer}
                placeholder="Type your answer…"
                placeholderTextColor={colors.inkTertiary}
                multiline
                textAlignVertical="top"
                submitBehavior="newline"
              />
            )}
          </View>

          {currentQuestion.kind === "reflection" && (
            <Pressable
              onPress={skipThisReflection}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Skip this"
            >
              <Text style={styles.retryLabel}>Skip this</Text>
            </Pressable>
          )}

          <View style={styles.doneSlot}>
            {canFinish && (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.actions}>
                {canRetry && (
                  <Pressable
                    onPress={retryRecording}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Try again"
                  >
                    <Text style={styles.retryLabel}>Try again</Text>
                  </Pressable>
                )}
                <PrimaryButton label="Done" onPress={finishAnswer} />
              </Animated.View>
            )}
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
  backSlot: {
    position: "absolute",
    left: spacing.lg,
    zIndex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  orbWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  question: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 20,
    lineHeight: 27,
    color: colors.ink,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  answerBox: {
    maxHeight: 130,
    minHeight: 80,
    width: "100%",
  },
  transcript: {
    color: colors.inkSecondary,
  },
  input: {
    color: colors.ink,
    minHeight: 80,
  },
  doneSlot: {
    minHeight: 52,
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  retryLabel: {
    ...typography.bodySecondary,
    textDecorationLine: "underline",
  },
});

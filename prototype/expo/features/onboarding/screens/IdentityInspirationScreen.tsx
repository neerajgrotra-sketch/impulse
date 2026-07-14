import { useEffect, useRef, useState } from "react";
import {
  AppState,
  InputAccessoryView,
  Keyboard,
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
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import Svg, { Line, Rect } from "react-native-svg";
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
import { colors, fontFamily, radius, spacing, typography } from "@/theme";
import type { OnboardingQuestion } from "@/types/onboarding";
import { deriveIdentityStatement } from "@/utils/identityStatement";

type IdentityInspirationScreenProps = {
  question: OnboardingQuestion;
  voiceCapture: VoiceCapture;
  questionVoice: QuestionVoice;
  onSubmit: (statement: string) => void;
};

const VISION_INPUT_ACCESSORY_ID = "identity-vision-done-editing";
// How long to hold the thought stream paused after the keyboard hides,
// so "reflection resumes" reads as a settling breath, not an instant snap
// back — see the animation spec this screen implements (PDR 0008).
const THOUGHT_RESUME_DELAY_MS = 500;

/**
 * The identity-capture screen's coordinator (Phase 2): owns which state
 * each piece is in — thought stream, voice capture, vision card — and wires
 * them together, but contains none of their animation implementation
 * details itself. Those live in `ThoughtStream`, `BreathingOrb`,
 * `VoiceCaptureButton`, and `EditableVisionCard`.
 *
 * Interaction model (PDR 0008): Reflection Mode (orb + thoughts + Speak/Type
 * choice, no keyboard) → Capture Mode (Speak keeps the keyboard hidden;
 * Type reveals and focuses the card) → a settled post-edit state (card
 * visible, keyboard dismissed, Continue available). The keyboard only ever
 * appears via the explicit Type action or an explicit tap back into an
 * already-settled card — never as a side effect of picking a thought or
 * finishing a voice recording.
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // Distinct from `keyboardVisible`: this stays true for a beat after the
  // keyboard actually hides, so the thought stream's return reads as a
  // deliberate resettling rather than an instant snap-back.
  const [thoughtsSuppressedByKeyboard, setThoughtsSuppressedByKeyboard] = useState(false);
  // A screen only ever mounts while the app is already foregrounded, so
  // start active and rely on the listener below purely for transitions.
  const [appActive, setAppActive] = useState(true);
  const inputRef = useRef<TextInput>(null);
  const lastHandledTranscriptRef = useRef<string | null>(null);
  // Only the explicit Type action pops the keyboard automatically — a
  // thought tap, "write your own" is gone, and a voice-completion reveal all
  // leave focus alone so the user can see what's there before editing it.
  const pendingAutoFocusRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => setAppActive(next === "active"));
    return () => subscription.remove();
  }, []);

  // Keyboard visibility drives the orb's "typing" state and the thought
  // stream's pause — not TextInput focus directly, since dismissal can come
  // from several places (Done Editing, tap-outside, drag) that all funnel
  // through the same OS keyboard show/hide events.
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
      setKeyboardVisible(true);
      setThoughtsSuppressedByKeyboard(true);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      resumeTimeoutRef.current = setTimeout(() => {
        resumeTimeoutRef.current = null;
        setThoughtsSuppressedByKeyboard(false);
      }, THOUGHT_RESUME_DELAY_MS);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
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
    // Once the card is revealed, the stream is ambient reflection only —
    // never lets a stray tap silently overwrite what the user already has.
    if (cardRevealed) return;
    setVisionText(deriveIdentityStatement(thought.text));
    setCardRevealed(true);
  }

  function handleType() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingAutoFocusRef.current = true;
    setVisionText("");
    setCardRevealed(true);
  }

  function handleDoneEditing() {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }

  const paused =
    thoughtsSuppressedByKeyboard ||
    speechAdapter.status === "listening" ||
    speechAdapter.status === "processing" ||
    !appActive;

  const orbState: VoiceOrbState = questionVoice.isSpeaking
    ? "speaking"
    : speechAdapter.status === "listening"
      ? "listening"
      : speechAdapter.status === "processing"
        ? "processing"
        : keyboardVisible
          ? "typing"
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
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => Keyboard.dismiss()}
            accessible={false}
            style={[
              styles.content,
              { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <View style={styles.topGroup}>
              <Text style={styles.title} accessibilityRole="header">
                {question.text}
              </Text>

              <BreathingOrb state={orbState} listening={speechAdapter.status === "listening"} />

              <ThoughtStream
                paused={paused}
                reduceMotion={reduceMotion}
                screenReaderEnabled={screenReaderEnabled}
                onSelectThought={handleSelectThought}
                height={110}
              />
            </View>

            <View style={styles.bottomSlot}>
              {!cardRevealed && (
                <Animated.View
                  entering={reduceMotion ? undefined : FadeIn.duration(400)}
                  style={styles.choicePanel}
                >
                  <Text style={[typography.eyebrow, styles.label]}>YOUR VISION</Text>
                  <Text style={[typography.caption, styles.choiceHelper]}>
                    You can speak, write, or tap a thought to begin.
                  </Text>

                  <VoiceCaptureButton adapter={speechAdapter} />

                  <View style={styles.dividerRow} accessible={false}>
                    <View style={styles.dividerLine} />
                    <Text style={[typography.caption, styles.dividerText]}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    onPress={handleType}
                    hitSlop={8}
                    style={styles.typeButton}
                    accessibilityRole="button"
                    accessibilityLabel="Type your vision instead"
                  >
                    <TypeIcon />
                    <Text style={[typography.bodySecondary, styles.typeLabel]}>Type</Text>
                  </Pressable>
                </Animated.View>
              )}

              {cardRevealed && (
                <Animated.View
                  entering={reduceMotion ? undefined : FadeIn.duration(400)}
                  layout={reduceMotion ? undefined : LinearTransition}
                  style={styles.cardWrap}
                >
                  <EditableVisionCard
                    value={visionText}
                    onChangeText={setVisionText}
                    inputRef={inputRef}
                    inputAccessoryViewID={Platform.OS === "ios" ? VISION_INPUT_ACCESSORY_ID : undefined}
                  />
                </Animated.View>
              )}

              {cardRevealed && (
                <Text style={styles.reviseNote}>You can always come back and change this later.</Text>
              )}

              {cardRevealed && <VoiceCaptureButton adapter={speechAdapter} />}

              {keyboardVisible && (
                <Pressable
                  onPress={handleDoneEditing}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Done editing your vision"
                >
                  <Text style={[typography.caption, styles.doneEditing]}>Done editing</Text>
                </Pressable>
              )}

              <PrimaryButton
                label="Continue"
                onPress={() => onSubmit(visionText)}
                fullWidth
                disabled={!canContinue}
              />
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={VISION_INPUT_ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            <Pressable
              onPress={handleDoneEditing}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Done editing your vision"
            >
              <Text style={styles.accessoryDone}>Done Editing</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
}

function TypeIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={5} width={20} height={14} rx={2.5} stroke={colors.inkSecondary} strokeWidth={1.6} />
      <Line x1={6} y1={9.5} x2={6} y2={9.5} stroke={colors.inkSecondary} strokeWidth={2} strokeLinecap="round" />
      <Line x1={10} y1={9.5} x2={10} y2={9.5} stroke={colors.inkSecondary} strokeWidth={2} strokeLinecap="round" />
      <Line x1={14} y1={9.5} x2={14} y2={9.5} stroke={colors.inkSecondary} strokeWidth={2} strokeLinecap="round" />
      <Line x1={18} y1={9.5} x2={18} y2={9.5} stroke={colors.inkSecondary} strokeWidth={2} strokeLinecap="round" />
      <Line x1={7} y1={15} x2={17} y2={15} stroke={colors.inkSecondary} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
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
  scrollContent: {
    flexGrow: 1,
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
  reviseNote: {
    ...typography.caption,
    textAlign: "center",
  },
  bottomSlot: {
    width: "100%",
    alignItems: "center",
    gap: spacing.md,
  },
  cardWrap: {
    width: "100%",
  },
  choicePanel: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.overlay.scrim,
    alignItems: "center",
  },
  label: {
    letterSpacing: 1.4,
  },
  choiceHelper: {
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.overlay.hairline,
  },
  dividerText: {
    letterSpacing: 1,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  typeLabel: {
    color: colors.inkSecondary,
  },
  doneEditing: {
    textDecorationLine: "underline",
  },
  accessoryBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.gradientEnd,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.overlay.hairline,
  },
  accessoryDone: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: colors.accent,
  },
});

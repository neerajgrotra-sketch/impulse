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
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
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
// How long to hold the thought stream paused after the keyboard hides, so
// "reflection resumes" reads as a settling breath, not an instant snap back.
const THOUGHT_RESUME_DELAY_MS = 500;
// How long the orb's one-shot "Finished" acknowledgment and the transcript
// overlay's crossfade window stay active after a recording settles.
const FINISHED_WINDOW_MS = 900;

/**
 * The identity-capture screen's coordinator: owns which state each piece is
 * in — thought stream, voice capture, vision card — and wires them
 * together, but contains none of their animation implementation details
 * itself. Those live in `ThoughtStream`, `BreathingOrb`, `VoiceCaptureButton`,
 * and `EditableVisionCard`.
 *
 * Interaction model (PDR 0008, choreographed in PDR 0009 /
 * docs/identity-onboarding-choreography.md): Reflection Mode (orb + thoughts
 * + Speak/Type choice, no keyboard) → Capture Mode (Speak keeps the
 * keyboard hidden, live transcript takes the visual center; Type reveals
 * and focuses the card) → a settled state (card visible, keyboard
 * dismissed, Continue available, Clear/Record-Again always reachable). The
 * keyboard only ever appears via the explicit Type action or an explicit
 * tap back into an already-settled card.
 *
 * Voice transcripts are used verbatim, never blindly wrapped — that
 * wrapping is what produced "I am someone who is i wanna be perfect" in the
 * pre-redesign build. `deriveIdentityStatement` still normalizes the
 * curated thought-library fragments (a controlled, tested input space where
 * the wrap is safe); a confidence-based rewrite *suggestion* for freeform
 * speech/typed text is Phase 2 (PDR 0009 §8.1 — deliberately not built yet).
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
  // Distinct from `keyboardVisible`: stays true for a beat after the
  // keyboard actually hides, so the thought stream's return reads as a
  // deliberate resettling rather than an instant snap-back.
  const [thoughtsSuppressedByKeyboard, setThoughtsSuppressedByKeyboard] = useState(false);
  // Mirrors the live transcript only while actually listening, then holds
  // its last value through the processing settle window — so the
  // transcript overlay has real words to ease down with, not a blank flash.
  const [displayTranscript, setDisplayTranscript] = useState("");
  // Transient window right after a voice recording settles — drives the
  // orb's one-shot Finished pulse and the transcript-overlay crossfade.
  const [justFinishedVoice, setJustFinishedVoice] = useState(false);
  const [thoughtPulseSignal, setThoughtPulseSignal] = useState(0);
  // A screen only ever mounts while the app is already foregrounded, so
  // start active and rely on the listener below purely for transitions.
  const [appActive, setAppActive] = useState(true);
  const inputRef = useRef<TextInput>(null);
  const lastHandledTranscriptRef = useRef<string | null>(null);
  // Only the explicit Type action pops the keyboard automatically — a
  // thought tap or a voice-completion reveal both leave focus alone so the
  // user can see what's there before editing it.
  const pendingAutoFocusRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const micScale = useSharedValue(1);
  const transcriptScale = useSharedValue(1);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);
  const continueEmphasis = useSharedValue(0);

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

  // The live transcript overlay's content: mirrors partial speech while
  // listening, then holds (doesn't clear) through processing so the settle
  // animation has real words to ease down with; clears once truly idle.
  useEffect(() => {
    if (speechAdapter.status === "listening") {
      setDisplayTranscript(speechAdapter.partialTranscript);
    } else if (speechAdapter.status === "idle") {
      setDisplayTranscript("");
    }
  }, [speechAdapter.status, speechAdapter.partialTranscript]);

  useEffect(() => {
    if (speechAdapter.status !== "completed") return;
    // Used verbatim — never re-wrapped. See the function-level doc comment.
    const transcript = speechAdapter.finalTranscript.trim();
    if (!transcript || lastHandledTranscriptRef.current === transcript) return;
    lastHandledTranscriptRef.current = transcript;
    setVisionText(transcript);
    setCardRevealed(true);
    setJustFinishedVoice(true);
    if (finishedTimeoutRef.current) clearTimeout(finishedTimeoutRef.current);
    finishedTimeoutRef.current = setTimeout(() => setJustFinishedVoice(false), FINISHED_WINDOW_MS);
  }, [speechAdapter.status, speechAdapter.finalTranscript]);

  useEffect(
    () => () => {
      if (finishedTimeoutRef.current) clearTimeout(finishedTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    if (cardRevealed && pendingAutoFocusRef.current) {
      pendingAutoFocusRef.current = false;
      inputRef.current?.focus();
    }
  }, [cardRevealed]);

  // Mic gently shrinks the instant it's actively listening — ceding the
  // screen's center to the transcript overlay, not competing with it.
  useEffect(() => {
    if (reduceMotion) {
      micScale.value = 1;
      return;
    }
    micScale.value = withTiming(speechAdapter.status === "listening" ? 0.85 : 1, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [speechAdapter.status, reduceMotion, micScale]);

  // The transcript overlay settles from its large "spoken aloud" size down
  // toward the vision card's normal body size as processing completes —
  // the felt half of the transcript→card morph (the crossfade is the rest).
  useEffect(() => {
    if (reduceMotion) {
      transcriptScale.value = 1;
      return;
    }
    if (speechAdapter.status === "listening") {
      transcriptScale.value = withTiming(1, { duration: 200 });
    } else if (speechAdapter.status === "processing") {
      transcriptScale.value = withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.ease) });
    }
  }, [speechAdapter.status, reduceMotion, transcriptScale]);

  // The card grows into place rather than snapping in — the same
  // "emergence" quality for both the Type path and the voice-completion
  // path. Resets to its pre-entrance values on Clear so the next reveal
  // grows in again instead of already being fully visible.
  useEffect(() => {
    if (!cardRevealed) {
      cardScale.value = 0.92;
      cardOpacity.value = 0;
      return;
    }
    if (reduceMotion) {
      cardScale.value = 1;
      cardOpacity.value = 1;
      return;
    }
    cardScale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.ease) });
    cardOpacity.value = withTiming(1, { duration: 400 });
  }, [cardRevealed, reduceMotion, cardScale, cardOpacity]);

  // Continue doesn't appear active the instant content exists — it eases
  // in once, then holds, so enabling reads as "you've arrived somewhere,"
  // not a form field flipping valid.
  useEffect(() => {
    const visionTrimmedLength = visionText.trim().length;
    continueEmphasis.value = withTiming(visionTrimmedLength > 0 ? 1 : 0, {
      duration: reduceMotion ? 0 : 450,
      easing: Easing.out(Easing.ease),
    });
  }, [visionText, reduceMotion, continueEmphasis]);

  function handleSelectThought(thought: Thought) {
    // Once the card is revealed, the stream is ambient reflection only —
    // never lets a stray tap silently overwrite what the user already has.
    if (cardRevealed) return;
    setVisionText(deriveIdentityStatement(thought.text));
    setCardRevealed(true);
  }

  function handleThoughtAppear() {
    if (reduceMotion) return;
    setThoughtPulseSignal((n) => n + 1);
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

  function handleClear() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    speechAdapter.cancel();
    lastHandledTranscriptRef.current = null;
    pendingAutoFocusRef.current = false;
    setJustFinishedVoice(false);
    setVisionText("");
    setCardRevealed(false);
  }

  const paused =
    thoughtsSuppressedByKeyboard ||
    speechAdapter.status === "listening" ||
    speechAdapter.status === "processing" ||
    !appActive;

  const orbState: VoiceOrbState =
    speechAdapter.status === "error"
      ? "error"
      : questionVoice.isSpeaking
        ? "speaking"
        : speechAdapter.status === "listening"
          ? "listening"
          : speechAdapter.status === "processing"
            ? "processing"
            : justFinishedVoice
              ? "finished"
              : keyboardVisible
                ? "typing"
                : "idle";

  const canContinue = visionText.trim().length > 0;
  const showTranscriptOverlay =
    (speechAdapter.status === "listening" || speechAdapter.status === "processing") &&
    displayTranscript.trim().length > 0;

  const micAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: micScale.value }] }));
  const transcriptAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: transcriptScale.value }] }));
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const continueAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + continueEmphasis.value * 0.45,
    transform: [{ scale: 0.98 + continueEmphasis.value * 0.02 }],
  }));

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

              <BreathingOrb
                state={orbState}
                listening={speechAdapter.status === "listening"}
                thoughtPulseSignal={thoughtPulseSignal}
                reduceMotion={reduceMotion}
              />

              <ThoughtStream
                paused={paused}
                reduceMotion={reduceMotion}
                screenReaderEnabled={screenReaderEnabled}
                onSelectThought={handleSelectThought}
                onThoughtAppear={handleThoughtAppear}
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

                  <Animated.View style={micAnimatedStyle}>
                    <VoiceCaptureButton adapter={speechAdapter} />
                  </Animated.View>

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
                  layout={reduceMotion ? undefined : LinearTransition}
                  style={[styles.cardWrap, cardAnimatedStyle]}
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

              {cardRevealed && (
                <Animated.View style={micAnimatedStyle}>
                  <VoiceCaptureButton adapter={speechAdapter} />
                </Animated.View>
              )}

              {cardRevealed && !keyboardVisible && (
                <Pressable
                  onPress={handleClear}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear your vision and start over"
                >
                  <Text style={[typography.caption, styles.clearLabel]}>Clear</Text>
                </Pressable>
              )}

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

              <Animated.View style={continueAnimatedStyle}>
                <PrimaryButton
                  label="Continue"
                  onPress={() => onSubmit(visionText)}
                  fullWidth
                  disabled={!canContinue}
                />
              </Animated.View>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {showTranscriptOverlay && (
        <View pointerEvents="none" style={styles.transcriptOverlay}>
          <Animated.View style={transcriptAnimatedStyle}>
            <Text style={[typography.display, styles.transcriptText]} numberOfLines={6}>
              {displayTranscript}
            </Text>
          </Animated.View>
        </View>
      )}

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
  clearLabel: {
    textDecorationLine: "underline",
  },
  doneEditing: {
    textDecorationLine: "underline",
  },
  transcriptOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  transcriptText: {
    textAlign: "center",
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

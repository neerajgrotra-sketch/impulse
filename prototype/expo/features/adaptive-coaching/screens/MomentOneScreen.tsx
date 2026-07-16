import { useEffect, useRef, useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EditableVisionCard, GradientBackground, MomentSphere, PrimaryButton, VoiceCaptureButton } from "@/components";
import { AE001_TOTAL_MOMENTS } from "@/features/adaptive-coaching/journey";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useScreenReaderEnabled } from "@/hooks/useScreenReaderEnabled";
import { useSpeechRecognitionAdapter } from "@/hooks/useSpeechRecognitionAdapter";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";
import { colors, fontFamily, spacing, typography } from "@/theme";
import { logTelemetryEvent } from "@/utils/telemetry";

const VISION_INPUT_ACCESSORY_ID = "ae001-moment-one-done-editing";

type MomentOneScreenProps = {
  voiceCapture: VoiceCapture;
  onSubmit: (text: string) => void;
  /** The store's `becomingResponse`, if this screen is being revisited (the
   *  Vision Canvas recovery UI's "Edit statement" action, or the back
   *  button) rather than reached fresh — FAILURE UX's "preserve all user
   *  input" requires the original text still be here, not a blank card. */
  initialText?: string;
};

/**
 * "Who Do You Want To Become?" — AE-001's Moment 1. Deliberately does NOT show a
 * thought stream: nothing is generated yet at this point in the slice
 * (Inspiration content is generated FROM this answer, not curated ahead of
 * it), so this screen is Speak/Type capture only, mirroring
 * `IdentityInspirationScreen`'s Reflection→Capture mechanics without the
 * (not-yet-relevant) thought-tap path.
 */
export function MomentOneScreen({ voiceCapture, onSubmit, initialText = "" }: MomentOneScreenProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const screenReaderEnabled = useScreenReaderEnabled();
  const speechAdapter = useSpeechRecognitionAdapter(voiceCapture);

  const [visionText, setVisionText] = useState(initialText);
  const [displayTranscript, setDisplayTranscript] = useState("");
  const [cardRevealed, setCardRevealed] = useState(initialText.trim().length > 0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [firstInteractionLogged, setFirstInteractionLogged] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const mountTimeRef = useRef(Date.now());
  const lastHandledTranscriptRef = useRef<string | null>(null);
  const pendingAutoFocusRef = useRef(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // The live transcript overlay's content: mirrors partial speech while
  // listening, then holds (doesn't clear) through processing so the settle
  // into the vision card has real words to land on; clears once truly idle.
  // Deliberately separate from `visionText`/`cardRevealed` — the choice
  // panel (with the mic button and its Cancel link) stays on screen for the
  // whole recording, same as before; only the overlay is new.
  useEffect(() => {
    if (speechAdapter.status === "listening") {
      setDisplayTranscript(speechAdapter.partialTranscript);
    } else if (speechAdapter.status === "idle") {
      setDisplayTranscript("");
    }
  }, [speechAdapter.status, speechAdapter.partialTranscript]);

  useEffect(() => {
    if (speechAdapter.status !== "completed") return;
    const transcript = speechAdapter.finalTranscript.trim();
    if (!transcript || lastHandledTranscriptRef.current === transcript) return;
    lastHandledTranscriptRef.current = transcript;
    setVisionText(transcript);
    setCardRevealed(true);
    logFirstInteraction();
    logTelemetryEvent({ type: "input_modality", modality: "voice" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechAdapter.status, speechAdapter.finalTranscript]);

  useEffect(() => {
    if (cardRevealed && pendingAutoFocusRef.current) {
      pendingAutoFocusRef.current = false;
      inputRef.current?.focus();
    }
  }, [cardRevealed]);

  function logFirstInteraction() {
    if (firstInteractionLogged) return;
    setFirstInteractionLogged(true);
    logTelemetryEvent({ type: "time_to_first_interaction", ms: Date.now() - mountTimeRef.current });
  }

  function handleType() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logFirstInteraction();
    logTelemetryEvent({ type: "input_modality", modality: "typed" });
    pendingAutoFocusRef.current = true;
    setVisionText("");
    setCardRevealed(true);
  }

  function handleDoneEditing() {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }

  const canContinue = visionText.trim().length > 0;
  const showTranscriptOverlay =
    (speechAdapter.status === "listening" || speechAdapter.status === "processing") &&
    displayTranscript.trim().length > 0;

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
            style={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={styles.topGroup}>
              <Text style={styles.title} accessibilityRole="header">
                Who Do You Want To Become?
              </Text>
              <MomentSphere
                currentMoment={1}
                totalMoments={AE001_TOTAL_MOMENTS}
                state={speechAdapter.status === "processing" ? "thinking" : "idle"}
                listening={speechAdapter.status === "listening"}
                isTyping={keyboardVisible}
                hasError={speechAdapter.status === "error"}
                reduceMotion={reduceMotion}
              />
            </View>

            <View style={styles.bottomSlot}>
              {!cardRevealed && (
                <Animated.View style={styles.choicePanel}>
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
                    accessibilityLabel="Type your answer instead"
                  >
                    <Text style={[typography.bodySecondary, styles.typeLabel]}>Type</Text>
                  </Pressable>
                </Animated.View>
              )}

              {cardRevealed && (
                <Animated.View layout={reduceMotion ? undefined : LinearTransition} style={styles.cardWrap}>
                  <EditableVisionCard
                    value={visionText}
                    onChangeText={setVisionText}
                    inputRef={inputRef}
                    placeholder="Who Do You Want To Become?"
                    inputAccessoryViewID={Platform.OS === "ios" ? VISION_INPUT_ACCESSORY_ID : undefined}
                  />
                </Animated.View>
              )}

              {keyboardVisible && (
                <Pressable
                  onPress={handleDoneEditing}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Done editing"
                >
                  <Text style={[typography.caption, styles.doneEditing]}>Done editing</Text>
                </Pressable>
              )}

              <PrimaryButton label="Continue" onPress={() => onSubmit(visionText)} fullWidth disabled={!canContinue} />
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {showTranscriptOverlay && (
        <View pointerEvents="none" style={styles.transcriptOverlay}>
          <Animated.Text
            entering={reduceMotion ? undefined : FadeIn.duration(200)}
            style={[typography.display, styles.transcriptText]}
            numberOfLines={6}
          >
            {displayTranscript}
          </Animated.Text>
        </View>
      )}

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={VISION_INPUT_ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            <Pressable onPress={handleDoneEditing} hitSlop={8} accessibilityRole="button" accessibilityLabel="Done editing">
              <Text style={styles.accessoryDone}>Done Editing</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.gradientStart },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg },
  topGroup: { width: "100%", alignItems: "center", gap: spacing.lg, marginTop: spacing.lg },
  title: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 20,
    lineHeight: 27,
    color: colors.ink,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  bottomSlot: { width: "100%", alignItems: "center", gap: spacing.md },
  cardWrap: { width: "100%" },
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
  choicePanel: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.overlay.scrim,
    alignItems: "center",
  },
  dividerRow: { flexDirection: "row", alignItems: "center", width: "100%", gap: spacing.sm },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.overlay.hairline },
  dividerText: { letterSpacing: 1 },
  typeButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  typeLabel: { color: colors.inkSecondary },
  doneEditing: { textDecorationLine: "underline", ...typography.caption },
  accessoryBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.gradientEnd,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.overlay.hairline,
  },
  accessoryDone: { fontSize: 15, lineHeight: 21, fontWeight: "600", color: colors.accent },
});

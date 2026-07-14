import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BreathingOrb, GradientBackground, PrimaryButton, ThoughtStream, VoiceCaptureButton } from "@/components";
import type { VoiceOrbState } from "@/components";
import { VisionCanvas } from "@/components/VisionCanvas";
import type { Thought } from "@/constants/thoughtLibrary";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useScreenReaderEnabled } from "@/hooks/useScreenReaderEnabled";
import { useSpeechRecognitionAdapter } from "@/hooks/useSpeechRecognitionAdapter";
import { useThoughtScheduler } from "@/hooks/useThoughtScheduler";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";
import { isHardStopResponse, requestCoachingBeat, requestInspiration, toCalmUserMessage } from "@/services/onboardingTurnApi";
import { MAX_VISION_FRAGMENTS, useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";
import { colors, spacing, typography } from "@/theme";
import { logTelemetryEvent } from "@/utils/telemetry";

type VisionCanvasScreenProps = {
  voiceCapture: VoiceCapture;
};

/**
 * Covers three of AE-001's phases in one continuous screen instance —
 * generating-inspiration → inspiration-vision → reviewing — so the reveal
 * from "processing" to "here's what came back" is an in-place state change
 * (the orb settling, thoughts fading in) rather than a coordinator-level
 * remount, matching `IdentityInspirationScreen`'s own transcript→card
 * continuity precedent.
 */
export function VisionCanvasScreen({ voiceCapture }: VisionCanvasScreenProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const screenReaderEnabled = useScreenReaderEnabled();
  const speechAdapter = useSpeechRecognitionAdapter(voiceCapture);

  const phase = useAdaptiveCoachingStore((s) => s.phase);
  const firstName = useAdaptiveCoachingStore((s) => s.firstName);
  const becomingResponse = useAdaptiveCoachingStore((s) => s.becomingResponse);
  const thoughtPool = useAdaptiveCoachingStore((s) => s.thoughtPool);
  const rankedDimensions = useAdaptiveCoachingStore((s) => s.rankedDimensions);
  const visionCanvas = useAdaptiveCoachingStore((s) => s.visionCanvas);
  const isSubmitting = useAdaptiveCoachingStore((s) => s.isSubmitting);
  const inspirationReceived = useAdaptiveCoachingStore((s) => s.inspirationReceived);
  const inspirationHardStopped = useAdaptiveCoachingStore((s) => s.inspirationHardStopped);
  const inspirationFailed = useAdaptiveCoachingStore((s) => s.inspirationFailed);
  const addVisionFragment = useAdaptiveCoachingStore((s) => s.addVisionFragment);
  const editVisionFragment = useAdaptiveCoachingStore((s) => s.editVisionFragment);
  const removeVisionFragment = useAdaptiveCoachingStore((s) => s.removeVisionFragment);
  const reorderVisionFragments = useAdaptiveCoachingStore((s) => s.reorderVisionFragments);
  const beginSubmittingForBeat = useAdaptiveCoachingStore((s) => s.beginSubmittingForBeat);
  const beatReceived = useAdaptiveCoachingStore((s) => s.beatReceived);
  const beatHardStopped = useAdaptiveCoachingStore((s) => s.beatHardStopped);
  const beatFailed = useAdaptiveCoachingStore((s) => s.beatFailed);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedCountRef = useRef(0);
  const editedCountRef = useRef(0);
  const deletedCountRef = useRef(0);
  const continueStartRef = useRef(Date.now());

  // Fires the one "generate inspiration" backend call exactly once, when
  // this phase is first reached — cleaned up on unmount via AbortController,
  // same lifecycle-ownership pattern ThinkingScreen already uses for
  // generate-blueprint.
  useEffect(() => {
    if (phase.status !== "generating-inspiration") return;
    const controller = new AbortController();
    (async () => {
      try {
        const result = await requestInspiration(
          { firstName, becomingResponse },
          { signal: controller.signal }
        );
        if (isHardStopResponse(result)) {
          inspirationHardStopped(result.safety.message);
          return;
        }
        inspirationReceived(
          { rankedDimensions: result.rankedDimensions, thoughts: result.thoughts },
          { lastSafetyTier: result.safety.tier, lastLatencyMs: result.latencyMs, lastRawPayload: result }
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        inspirationFailed(toCalmUserMessage(err));
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.status]);

  const thoughtSource = (): Thought[] => {
    const shuffled = [...thoughtPool];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.map((t) => ({ id: t.id, text: t.text, theme: t.dimension }));
  };

  const paused =
    phase.status === "generating-inspiration" ||
    speechAdapter.status === "listening" ||
    speechAdapter.status === "processing" ||
    visionCanvas.length >= MAX_VISION_FRAGMENTS;

  const { thought, phase: bubblePhase } = useThoughtScheduler({
    paused,
    reduceMotion,
    screenReaderEnabled,
    thoughtSource,
  });

  function handleSelectThought(t: Thought) {
    if (visionCanvas.length >= MAX_VISION_FRAGMENTS) return;
    addVisionFragment({ text: t.text, origin: "thought_tap", edited: false });
    selectedCountRef.current += 1;
    logTelemetryEvent({ type: "thoughts_selected", count: selectedCountRef.current });
  }

  function handleRemoveFragment(id: string) {
    removeVisionFragment(id);
    deletedCountRef.current += 1;
    logTelemetryEvent({ type: "thoughts_deleted", count: deletedCountRef.current });
  }

  function handleEditFragment(id: string, text: string) {
    editVisionFragment(id, text);
    editedCountRef.current += 1;
    logTelemetryEvent({ type: "thoughts_edited", count: editedCountRef.current });
  }

  function handleTypeAdd() {
    if (visionCanvas.length >= MAX_VISION_FRAGMENTS) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addVisionFragment({ text: "", origin: "typed", edited: false });
  }

  useEffect(() => {
    if (speechAdapter.status !== "completed") return;
    const transcript = speechAdapter.finalTranscript.trim();
    if (!transcript) return;
    if (visionCanvas.length >= MAX_VISION_FRAGMENTS) return;
    addVisionFragment({ text: transcript, origin: "spoken", edited: false });
    logTelemetryEvent({ type: "input_modality", modality: "voice" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechAdapter.status, speechAdapter.finalTranscript]);

  async function handleContinue() {
    setErrorMessage(null);
    beginSubmittingForBeat();
    const controller = new AbortController();
    try {
      const result = await requestCoachingBeat(
        { firstName, becomingResponse, rankedDimensions, visionCanvas },
        { signal: controller.signal }
      );
      if (isHardStopResponse(result)) {
        beatHardStopped(result.safety.message);
        return;
      }
      logTelemetryEvent({ type: "time_to_continue", ms: Date.now() - continueStartRef.current });
      const acceptedFragments = visionCanvas.filter((f) => f.origin === "thought_tap" && !f.edited).length;
      const editedFragments = visionCanvas.length - acceptedFragments;
      logTelemetryEvent({ type: "ai_wording_accepted_vs_edited", accepted: acceptedFragments, edited: editedFragments });
      logTelemetryEvent({ type: "coaching_beat_chosen", beat: result.chosenBeat });
      beatReceived(
        {
          beat: result.chosenBeat,
          move: result.chosenMove,
          message: result.message,
          psychologicalState: result.psychologicalState,
        },
        { lastSafetyTier: result.safety.tier, lastLatencyMs: result.latencyMs, lastRawPayload: result }
      );
    } catch (err) {
      beatFailed(toCalmUserMessage(err));
    }
  }

  const isGenerating = phase.status === "generating-inspiration";
  const orbState: VoiceOrbState = isGenerating
    ? "processing"
    : isSubmitting
      ? "processing"
      : speechAdapter.status === "listening"
        ? "listening"
        : "idle";

  return (
    <View style={styles.container}>
      <GradientBackground />
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.topGroup}>
          <BreathingOrb state={orbState} listening={speechAdapter.status === "listening"} reduceMotion={reduceMotion} />
          {isGenerating && (
            <Animated.Text entering={reduceMotion ? undefined : FadeIn.duration(400)} style={[typography.bodySecondary, styles.statusText]}>
              Getting to know what matters to you…
            </Animated.Text>
          )}
        </View>

        {!isGenerating && (
          <>
            <ThoughtStream
              paused={paused}
              reduceMotion={reduceMotion}
              screenReaderEnabled={screenReaderEnabled}
              onSelectThought={handleSelectThought}
              height={96}
            />

            <ScrollView style={styles.canvasScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <VisionCanvas
                fragments={visionCanvas}
                maxFragments={MAX_VISION_FRAGMENTS}
                onEditFragment={handleEditFragment}
                onRemoveFragment={handleRemoveFragment}
                onReorderFragment={reorderVisionFragments}
                reduceMotion={reduceMotion}
              />
            </ScrollView>

            <View style={styles.actionsRow}>
              <VoiceCaptureButton adapter={speechAdapter} />
              <Pressable
                onPress={handleTypeAdd}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Type another fragment"
                disabled={visionCanvas.length >= MAX_VISION_FRAGMENTS}
              >
                <Text style={[typography.bodySecondary, styles.typeLabel]}>+ Type</Text>
              </Pressable>
            </View>

            {errorMessage && <Text style={[typography.caption, styles.errorText]}>{errorMessage}</Text>}

            <PrimaryButton
              label="Continue"
              onPress={handleContinue}
              fullWidth
              loading={isSubmitting}
              disabled={visionCanvas.length === 0 || isSubmitting}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.gradientStart },
  content: { flex: 1, alignItems: "center", paddingHorizontal: spacing.lg, gap: spacing.md },
  topGroup: { alignItems: "center", gap: spacing.sm },
  statusText: { color: colors.inkSecondary },
  canvasScroll: { flex: 1, width: "100%" },
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg },
  typeLabel: { color: colors.inkSecondary },
  errorText: { textAlign: "center", color: colors.state.danger },
});

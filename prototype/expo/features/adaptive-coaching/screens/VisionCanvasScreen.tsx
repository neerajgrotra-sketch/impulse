import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground, MomentSphere, PrimaryButton, VoiceCaptureButton } from "@/components";
import { VisionCanvas } from "@/components/VisionCanvas";
import type { LifeDimension } from "@/constants/lifeDimensions";
import { pickContextualThoughts, type ThoughtTheme } from "@/constants/thoughtLibrary";
import { AE001_TOTAL_MOMENTS } from "@/features/adaptive-coaching/journey";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useScreenReaderEnabled } from "@/hooks/useScreenReaderEnabled";
import { useSpeechRecognitionAdapter } from "@/hooks/useSpeechRecognitionAdapter";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";
import { isHardStopResponse, requestInspiration, toCalmUserMessage } from "@/services/onboardingTurnApi";
import { MAX_VISION_FRAGMENTS, useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";
import { colors, fontFamily, radius, spacing, typography } from "@/theme";
import type { GeneratedThought } from "@/types/adaptiveCoaching";
import { logTelemetryEvent } from "@/utils/telemetry";
import { ThoughtOptionsGrid } from "../components/ThoughtOptionsGrid";

type VisionCanvasScreenProps = {
  voiceCapture: VoiceCapture;
};

// Coarse, cosmetic-only mapping from the curated library's theme vocabulary
// to the canonical Life Dimension taxonomy, used solely so a fallback
// (non-AI) thought can satisfy GeneratedThought's typed `dimension` field —
// it is never fed into rankedDimensions or shown to the user. Unmapped
// themes fall back to "Personal Growth", a deliberately neutral default.
const THEME_TO_DIMENSION: Record<ThoughtTheme, LifeDimension> = {
  presence: "Emotional Wellbeing",
  discipline: "Habits & Discipline",
  relationships: "Relationships",
  health: "Health & Energy",
  confidence: "Confidence & Self-Worth",
  "emotional-regulation": "Emotional Wellbeing",
  purpose: "Purpose & Meaning",
  "follow-through": "Habits & Discipline",
};

function toFallbackThoughts(query: string, count: number): GeneratedThought[] {
  return pickContextualThoughts(query, count).map((t) => ({
    id: t.id,
    dimension: THEME_TO_DIMENSION[t.theme as ThoughtTheme] ?? "Personal Growth",
    text: t.text,
    source: "fallback",
  }));
}

/** How long the "still working" reassurance waits before showing, while the
 *  8-second request itself (identityEngine.ts's own budget, mirrored in
 *  onboardingTurnApi.ts's client timeout) is still the actual deadline —
 *  this is a mid-flight status update, not a second timer racing it. */
const DELAYED_MESSAGE_MS = 6_000;

/**
 * Covers three of AE-001's phases in one continuous screen instance —
 * generating-inspiration → inspiration-vision → reviewing — so the reveal
 * from "processing" to "here's what came back" is an in-place state change
 * (the orb settling, thoughts fading in) rather than a coordinator-level
 * remount, matching `IdentityInspirationScreen`'s own transcript→card
 * continuity precedent.
 *
 * The inspiration-generation FAILURE UX (rebuilt vertical slice): loading
 * placeholders appear immediately, a delayed-state message at 6s, and at
 * ~8s (identityEngine.ts's own total budget, so this is the request's real
 * deadline, not a duplicate timer) a Retry / Edit statement / Continue-with-
 * suggestions recovery state — never a silent fallback and never a dead end.
 */
export function VisionCanvasScreen({ voiceCapture }: VisionCanvasScreenProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const screenReaderEnabled = useScreenReaderEnabled();
  const speechAdapter = useSpeechRecognitionAdapter(voiceCapture);

  const firstName = useAdaptiveCoachingStore((s) => s.firstName);
  const becomingResponse = useAdaptiveCoachingStore((s) => s.becomingResponse);
  const thoughtPool = useAdaptiveCoachingStore((s) => s.thoughtPool);
  const visionCanvas = useAdaptiveCoachingStore((s) => s.visionCanvas);
  const inspirationReceived = useAdaptiveCoachingStore((s) => s.inspirationReceived);
  const moreThoughtsReceived = useAdaptiveCoachingStore((s) => s.moreThoughtsReceived);
  const inspirationHardStopped = useAdaptiveCoachingStore((s) => s.inspirationHardStopped);
  const addVisionFragment = useAdaptiveCoachingStore((s) => s.addVisionFragment);
  const editVisionFragment = useAdaptiveCoachingStore((s) => s.editVisionFragment);
  const removeVisionFragment = useAdaptiveCoachingStore((s) => s.removeVisionFragment);
  const reorderVisionFragments = useAdaptiveCoachingStore((s) => s.reorderVisionFragments);
  const beginUnderstandingReview = useAdaptiveCoachingStore((s) => s.beginUnderstandingReview);
  const goBackToMomentOne = useAdaptiveCoachingStore((s) => s.goBackToMomentOne);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // Set inside an effect, never as a `useRef(Date.now())` initializer — the
  // latter calls the impure `Date.now()` on every render pass (React's
  // components-must-be-pure rule flags exactly this; the old carousel-based
  // version of this screen had that same violation).
  const continueStartRef = useRef(0);
  useEffect(() => {
    continueStartRef.current = Date.now();
  }, []);

  // --- Inspiration-generation request lifecycle (this screen owns it, same
  // convention as every other backend call in this store's design). ---
  const [elapsedState, setElapsedState] = useState<"pending" | "delayed" | "timeout">("pending");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [fallbackThoughts, setFallbackThoughts] = useState<GeneratedThought[] | null>(null);
  // A ref, not state: only ever written and read from inside fetchInspiration
  // itself (never rendered), and a `useState` here would go stale — since
  // fetchInspiration is a useCallback whose deps deliberately don't include
  // it, a state closure would keep reading whatever value existed when the
  // callback was last recreated (effectively always 0), silently under-
  // reporting retry_count in the OBSERVABILITY telemetry below.
  const retryCountRef = useRef(0);
  const [regenerating, setRegenerating] = useState(false);
  // The reentrancy gate for handleMoreLikeThis is this ref, not the
  // `regenerating` state above. Two rapid taps dispatched in the same tick
  // both close over the SAME pre-re-render `regenerating` value (`false`) —
  // a state-only guard can race and fire the request twice. A ref is
  // written synchronously and is immune to that; `regenerating` state stays
  // purely for the button's disabled/label rendering.
  const regeneratingRef = useRef(false);
  const inspirationControllerRef = useRef<AbortController | null>(null);
  // "More like this" (handleMoreLikeThis) doesn't go through
  // inspirationControllerRef/AbortController the way fetchInspiration does —
  // it's a background refresh of an already-successful pool, not a request
  // whose failure needs recovery UI. This guard exists for the same
  // stale-response reason the AbortController does elsewhere: without it, a
  // slow "more like this" response that resolves after the user has already
  // navigated away (Edit statement, Back) would silently overwrite
  // thoughtPool/rankedDimensions on an unmounted screen's behalf.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const hasAiThoughts = thoughtPool.length > 0;
  const showingRecovery = !hasAiThoughts && elapsedState === "timeout" && fallbackThoughts === null;
  const showingFallbackGrid = !hasAiThoughts && fallbackThoughts !== null;
  const isGenerating = !hasAiThoughts && !showingRecovery && !showingFallbackGrid;

  const fetchInspiration = useCallback(
    async (isRetry: boolean) => {
      inspirationControllerRef.current?.abort();
      const controller = new AbortController();
      inspirationControllerRef.current = controller;
      setElapsedState("pending");
      setFallbackThoughts(null);
      setDismissedIds(new Set());
      if (isRetry) retryCountRef.current += 1;

      try {
        const result = await requestInspiration({ firstName, becomingResponse }, { signal: controller.signal });
        if (isHardStopResponse(result)) {
          inspirationHardStopped(result.safety.message);
          return;
        }
        inspirationReceived(
          { rankedDimensions: result.rankedDimensions, thoughts: result.thoughts },
          {
            lastSafetyTier: result.safety.tier,
            lastLatencyMs: result.latencyMs,
            lastRawPayload: result,
            lastRequestId: result.requestId,
          }
        );
      } catch (err) {
        // This attempt was intentionally cancelled (unmount, or superseded
        // by a newer fetchInspiration call) — not a real failure to recover
        // from, so no recovery UI for it.
        if (controller.signal.aborted) return;
        logTelemetryEvent({ type: "inspiration_timeout", retry_count: retryCountRef.current });
        setElapsedState("timeout");
        console.error("[VisionCanvasScreen] inspiration request failed:", toCalmUserMessage(err));
      }
    },
    [firstName, becomingResponse, inspirationReceived, inspirationHardStopped]
  );

  // Fires exactly once per screen mount — this screen is only ever reached
  // via a fresh `submitBecomingResponse`, which remounts it (a different
  // becomingResponse each time), so there is no separate "phase" gate to
  // check here the way earlier versions needed.
  useEffect(() => {
    void (async () => {
      await fetchInspiration(false);
    })();
    return () => inspirationControllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 6-second reassurance — a status update mid-flight, never a second
  // deadline. Re-arms every time a fresh attempt sets elapsedState back to
  // "pending" (initial load, Retry, or the auto-fired mount effect).
  //
  // Must also bail once `isGenerating` goes false: `elapsedState` itself
  // never changes on a *successful* response (only the 6s timer or the
  // catch block change it), so without the `isGenerating` guard here, a
  // fast success left this timer armed and ticking for the full 6 seconds
  // regardless — a real dangling-timer leak, not just a cosmetic one, found
  // by a test failure it caused in an unrelated, later-running test.
  useEffect(() => {
    if (elapsedState !== "pending" || !isGenerating) return;
    const timer = setTimeout(() => setElapsedState((s) => (s === "pending" ? "delayed" : s)), DELAYED_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [elapsedState, isGenerating]);

  function handleRetry() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchInspiration(true);
  }

  function handleEditStatement() {
    inspirationControllerRef.current?.abort();
    goBackToMomentOne();
  }

  function handleContinueWithSuggestions() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logTelemetryEvent({ type: "inspiration_fallback_shown" });
    setFallbackThoughts(toFallbackThoughts(becomingResponse, 8));
  }

  async function handleMoreLikeThis() {
    if (regeneratingRef.current) return;
    regeneratingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logTelemetryEvent({ type: "inspiration_more_like_this" });
    setRegenerating(true);
    try {
      const result = await requestInspiration({ firstName, becomingResponse });
      if (!isMountedRef.current) return; // stale — user navigated away while this was in flight
      if (isHardStopResponse(result)) {
        inspirationHardStopped(result.safety.message);
        return;
      }
      setDismissedIds(new Set());
      moreThoughtsReceived({ rankedDimensions: result.rankedDimensions, thoughts: result.thoughts });
    } catch (err) {
      if (!isMountedRef.current) return; // stale — nothing to recover into
      // "More like this" failing just leaves the existing pool in place —
      // never worse than before the tap, so no recovery UI is needed here.
      console.error("[VisionCanvasScreen] more-like-this request failed:", toCalmUserMessage(err));
    } finally {
      regeneratingRef.current = false;
      if (isMountedRef.current) setRegenerating(false);
    }
  }

  const offeredThoughts: GeneratedThought[] = showingFallbackGrid ? (fallbackThoughts ?? []) : thoughtPool;
  const selectedTexts = new Set(visionCanvas.map((f) => f.text));

  function handleSelectThought(t: GeneratedThought) {
    if (visionCanvas.length >= MAX_VISION_FRAGMENTS) return;
    if (visionCanvas.some((f) => f.text === t.text)) return;
    addVisionFragment({ text: t.text, origin: "thought_tap", edited: false, source: t.source });
  }

  function handleDismissThought(t: GeneratedThought) {
    setDismissedIds((prev) => new Set(prev).add(t.id));
  }

  function handleRemoveFragment(id: string) {
    removeVisionFragment(id);
  }

  function handleEditFragment(id: string, text: string) {
    editVisionFragment(id, text);
  }

  function handleTypeAdd() {
    if (visionCanvas.length >= MAX_VISION_FRAGMENTS) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addVisionFragment({ text: "", origin: "typed", edited: false, source: "user" });
  }

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (speechAdapter.status !== "completed") return;
    const transcript = speechAdapter.finalTranscript.trim();
    if (!transcript) return;
    if (visionCanvas.length >= MAX_VISION_FRAGMENTS) return;
    addVisionFragment({ text: transcript, origin: "spoken", edited: false, source: "user" });
    logTelemetryEvent({ type: "input_modality", modality: "voice" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechAdapter.status, speechAdapter.finalTranscript]);

  // A pure phase transition, same shape as MomentOneScreen's onSubmit ->
  // submitBecomingResponse: the actual final-synthesis fetch is owned by
  // UnderstandingReviewScreen (matching this screen's own convention of
  // owning its inspiration fetch), not triggered from here. Dismissed
  // thoughts are resolved against offeredThoughts now, while this screen
  // still has them in scope — they are never persisted to the store
  // otherwise.
  function handleContinue() {
    const dismissedThoughts = offeredThoughts
      .filter((t) => dismissedIds.has(t.id))
      .map((t) => ({ text: t.text, source: t.source }));
    logTelemetryEvent({ type: "time_to_continue", ms: Date.now() - continueStartRef.current });
    const acceptedFragments = visionCanvas.filter((f) => f.origin === "thought_tap" && !f.edited).length;
    const editedFragments = visionCanvas.length - acceptedFragments;
    logTelemetryEvent({ type: "ai_wording_accepted_vs_edited", accepted: acceptedFragments, edited: editedFragments });
    beginUnderstandingReview(dismissedThoughts);
  }

  return (
    <View style={styles.container}>
      <GradientBackground />
      <Pressable
        onPress={() => Keyboard.dismiss()}
        accessible={false}
        style={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={handleEditStatement}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back to the previous question"
          >
            <Text style={[typography.bodySecondary, styles.backLabel]}>{"‹ Back"}</Text>
          </Pressable>
        </View>

        <View style={styles.topGroup}>
          <Text style={styles.title} accessibilityRole="header">
            {"Tell Me More – What's in Your Mind"}
          </Text>
          <MomentSphere
            currentMoment={2}
            totalMoments={AE001_TOTAL_MOMENTS}
            state={isGenerating ? "thinking" : "idle"}
            listening={speechAdapter.status === "listening"}
            hasError={showingRecovery}
            connected={!isGenerating}
            reduceMotion={reduceMotion}
          />
          {isGenerating && elapsedState !== "pending" && (
            <Animated.Text entering={reduceMotion ? undefined : FadeIn.duration(400)} style={[typography.caption, styles.statusText]}>
              Good answers take a little longer — still working…
            </Animated.Text>
          )}
        </View>

        {/* The exact original statement — OUTPUT requires it always be
            visible, never just implied by context. */}
        <View style={styles.originalStatementWrap}>
          <Text style={[typography.caption, styles.originalStatementLabel]}>YOU SAID</Text>
          <Text style={[typography.bodySecondary, styles.originalStatementText]} numberOfLines={3}>
            {becomingResponse}
          </Text>
        </View>

        <ScrollView
          style={styles.canvasScroll}
          contentContainerStyle={{ paddingBottom: keyboardHeight }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {showingRecovery ? (
            <RecoveryPanel onRetry={handleRetry} onEditStatement={handleEditStatement} onContinueWithSuggestions={handleContinueWithSuggestions} />
          ) : (
            <ThoughtOptionsGrid
              loading={isGenerating}
              thoughts={offeredThoughts}
              selectedTexts={selectedTexts}
              dismissedIds={dismissedIds}
              onSelect={handleSelectThought}
              onDismiss={handleDismissThought}
              reduceMotion={reduceMotion}
              screenReaderEnabled={screenReaderEnabled}
            />
          )}

          {showingFallbackGrid && (
            <Text style={[typography.caption, styles.fallbackNotice]}>
              These are general suggestions, not generated from what you said — try Retry above for personalized ones.
            </Text>
          )}

          {hasAiThoughts && (
            <Pressable
              onPress={handleMoreLikeThis}
              disabled={regenerating}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Generate more thoughts like these"
              style={styles.moreLikeThisButton}
            >
              <Text style={[typography.caption, styles.moreLikeThisText]}>
                {regenerating ? "Finding more…" : "More like this"}
              </Text>
            </Pressable>
          )}

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

        <PrimaryButton
          label="Continue"
          onPress={handleContinue}
          fullWidth
          disabled={visionCanvas.length === 0 || isGenerating}
        />
      </Pressable>
    </View>
  );
}

function RecoveryPanel({
  onRetry,
  onEditStatement,
  onContinueWithSuggestions,
}: {
  onRetry: () => void;
  onEditStatement: () => void;
  onContinueWithSuggestions: () => void;
}) {
  return (
    <View style={styles.recoveryPanel}>
      <Text style={[typography.bodySecondary, styles.recoveryText]}>
        This is taking longer than it should.
      </Text>
      <View style={styles.recoveryActions}>
        <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button" accessibilityLabel="Retry generating thoughts">
          <Text style={[typography.body, styles.recoveryPrimaryAction]}>Retry</Text>
        </Pressable>
        <Pressable onPress={onEditStatement} hitSlop={8} accessibilityRole="button" accessibilityLabel="Edit your statement">
          <Text style={[typography.bodySecondary, styles.recoverySecondaryAction]}>Edit statement</Text>
        </Pressable>
        <Pressable
          onPress={onContinueWithSuggestions}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Continue with suggested thoughts instead"
        >
          <Text style={[typography.bodySecondary, styles.recoverySecondaryAction]}>Continue with suggestions</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.gradientStart },
  content: { flex: 1, alignItems: "center", paddingHorizontal: spacing.lg, gap: spacing.md },
  header: { width: "100%", alignItems: "flex-start" },
  backLabel: { color: colors.inkSecondary },
  topGroup: { alignItems: "center", gap: spacing.sm },
  title: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 20,
    lineHeight: 27,
    color: colors.ink,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  statusText: { color: colors.inkSecondary },
  originalStatementWrap: {
    width: "100%",
    borderLeftWidth: 2,
    borderLeftColor: colors.overlay.hairline,
    paddingLeft: spacing.sm,
    gap: 2,
  },
  originalStatementLabel: { letterSpacing: 1.4 },
  originalStatementText: { fontStyle: "italic" },
  canvasScroll: { flex: 1, width: "100%" },
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg },
  typeLabel: { color: colors.inkSecondary },
  moreLikeThisButton: { alignSelf: "center", paddingVertical: spacing.xs },
  moreLikeThisText: { textDecorationLine: "underline", color: colors.accent },
  fallbackNotice: { textAlign: "center", paddingVertical: spacing.xxs },
  recoveryPanel: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.overlay.scrim,
  },
  recoveryText: { textAlign: "center" },
  recoveryActions: { gap: spacing.sm, alignItems: "center" },
  recoveryPrimaryAction: { color: colors.accent, fontWeight: "600" },
  recoverySecondaryAction: { textDecorationLine: "underline" },
});

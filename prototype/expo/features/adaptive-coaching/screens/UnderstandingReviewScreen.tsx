import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground, MomentSphere, PrimaryButton } from "@/components";
import { AE001_TOTAL_MOMENTS } from "@/features/adaptive-coaching/journey";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { isHardStopResponse, requestFinalSynthesis, toCalmUserMessage } from "@/services/onboardingTurnApi";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";
import { colors, radius, spacing, typography } from "@/theme";
import { logTelemetryEvent } from "@/utils/telemetry";
import { AdjustUnderstandingSheet } from "../components/AdjustUnderstandingSheet";
import { StartOverSheet } from "../components/StartOverSheet";

/** How long the "still working" reassurance waits before showing — mirrors
 *  VisionCanvasScreen's own DELAYED_MESSAGE_MS pattern, a mid-flight status
 *  update, never a second deadline racing the request's own timeout. */
const DELAYED_MESSAGE_MS = 6_000;

/**
 * AE-001's terminal screen — a genuine synthesis, not the old
 * CoachingBeatScreen's single concatenated-reading paragraph. Owns its own
 * request lifecycle (AbortController, abort-on-unmount, no store write on
 * failure) matching VisionCanvasScreen's own established convention for the
 * inspiration fetch, so a stale response arriving after Start Over unmounts
 * this screen can never repopulate the store.
 */
export function UnderstandingReviewScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  const firstName = useAdaptiveCoachingStore((s) => s.firstName);
  const becomingResponse = useAdaptiveCoachingStore((s) => s.becomingResponse);
  const visionCanvas = useAdaptiveCoachingStore((s) => s.visionCanvas);
  const dismissedThoughts = useAdaptiveCoachingStore((s) => s.dismissedThoughts);
  const understandingReview = useAdaptiveCoachingStore((s) => s.understandingReview);
  const understandingReviewReceived = useAdaptiveCoachingStore((s) => s.understandingReviewReceived);
  const understandingReviewHardStopped = useAdaptiveCoachingStore((s) => s.understandingReviewHardStopped);

  const [elapsedState, setElapsedState] = useState<"pending" | "delayed" | "timeout">("pending");
  const [regenerating, setRegenerating] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [startOverOpen, setStartOverOpen] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  // Belt and suspenders alongside AbortController, matching
  // VisionCanvasScreen's handleMoreLikeThis convention: a real fetch()
  // rejects once aborted, but this ref is checked explicitly on both the
  // success and failure paths so a stale response can never write into the
  // store no matter how the underlying request implementation behaves.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchSynthesis = useCallback(
    async (isRetry: boolean, correctionNote?: string) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (correctionNote) setRegenerating(true);
      else setElapsedState("pending");
      if (isRetry) retryCountRef.current += 1;

      try {
        const result = await requestFinalSynthesis(
          { firstName, becomingResponse, visionCanvas, dismissedThoughts, correctionNote },
          { signal: controller.signal }
        );
        if (!isMountedRef.current || controller.signal.aborted) return;
        if (isHardStopResponse(result)) {
          understandingReviewHardStopped(result.safety.message);
          return;
        }
        understandingReviewReceived(result.understanding);
        logTelemetryEvent({ type: "understanding_review_confidence", confidence: result.understanding.confidence });
      } catch (err) {
        // Cancelled (unmount, or superseded by a newer fetch) — not a real
        // failure to recover from.
        if (!isMountedRef.current || controller.signal.aborted) return;
        setElapsedState("timeout");
        console.error("[UnderstandingReviewScreen] final synthesis request failed:", toCalmUserMessage(err));
      } finally {
        if (isMountedRef.current) setRegenerating(false);
      }
    },
    [firstName, becomingResponse, visionCanvas, dismissedThoughts, understandingReviewReceived, understandingReviewHardStopped]
  );

  // Fires once per mount, same convention as VisionCanvasScreen's inspiration
  // fetch — this screen is only ever reached via a fresh beginUnderstandingReview.
  useEffect(() => {
    void (async () => {
      await fetchSynthesis(false);
    })();
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = !understandingReview && elapsedState !== "timeout";
  const isFailed = !understandingReview && elapsedState === "timeout";

  useEffect(() => {
    if (elapsedState !== "pending" || !isLoading) return;
    const timer = setTimeout(() => setElapsedState((s) => (s === "pending" ? "delayed" : s)), DELAYED_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [elapsedState, isLoading]);

  function handleRetry() {
    fetchSynthesis(true);
  }

  function handleAdjustSubmit(note: string) {
    setAdjustOpen(false);
    void fetchSynthesis(false, note);
    logTelemetryEvent({ type: "understanding_review_adjusted" });
  }

  return (
    <View style={styles.container}>
      <GradientBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <MomentSphere
          currentMoment={3}
          totalMoments={AE001_TOTAL_MOMENTS}
          state={isLoading ? "thinking" : "complete"}
          size={96}
          reduceMotion={reduceMotion}
        />

        {isLoading && (
          <View style={styles.loadingWrap}>
            <Text style={[typography.caption, styles.statusText]}>
              {elapsedState === "delayed"
                ? "I'm still working on it. This can occasionally take a little longer."
                : "I'm putting everything you've shared together…"}
            </Text>
          </View>
        )}

        {isFailed && (
          <View style={styles.recoveryPanel}>
            <Text style={[typography.bodySecondary, styles.recoveryText]}>I wasn’t able to finish putting this together.</Text>
            <Pressable onPress={handleRetry} hitSlop={8} accessibilityRole="button" accessibilityLabel="Retry building your understanding review">
              <Text style={[typography.body, styles.recoveryAction]}>Retry</Text>
            </Pressable>
          </View>
        )}

        {understandingReview && (
          <>
            <Text style={[typography.headline, styles.header]} accessibilityRole="header">
              Here’s what I think you mean
            </Text>

            <View style={styles.card}>
              <Text style={[typography.body, styles.headline]}>{understandingReview.headline}</Text>
              <Text style={[typography.bodySecondary, styles.coreAspiration]}>{understandingReview.coreAspiration}</Text>
              <Text style={[typography.bodySecondary, styles.paragraph]}>{understandingReview.interpretation}</Text>
            </View>

            <View style={styles.card}>
              <Text style={[typography.eyebrow, styles.cardLabel]}>THE PERSON YOU ARE BECOMING</Text>
              <Text style={[typography.body, styles.paragraph]}>{understandingReview.identityStatement}</Text>
            </View>

            {understandingReview.emergingThemes.length > 0 && (
              <View style={styles.themesRow}>
                {understandingReview.emergingThemes.slice(0, 5).map((theme) => (
                  <View key={theme} style={styles.themeChip}>
                    <Text style={[typography.caption, styles.themeChipText]}>{theme}</Text>
                  </View>
                ))}
              </View>
            )}

            {understandingReview.uncertainties.length > 0 && (
              <View style={styles.card}>
                <Text style={[typography.eyebrow, styles.cardLabel]}>SOMETHING I STILL DON’T KNOW</Text>
                <Text style={[typography.bodySecondary, styles.paragraph]}>{understandingReview.uncertainties[0]}</Text>
              </View>
            )}

            {regenerating && <Text style={[typography.caption, styles.statusText]}>Updating your understanding…</Text>}

            <View style={styles.actions}>
              {confirmed ? (
                <Text style={[typography.bodySecondary, styles.confirmedText]}>Thanks — noted.</Text>
              ) : (
                <PrimaryButton
                  label="This feels right"
                  fullWidth
                  onPress={() => setConfirmed(true)}
                />
              )}
              <Pressable
                onPress={() => setAdjustOpen(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Adjust my understanding"
              >
                <Text style={[typography.bodySecondary, styles.secondaryAction]}>Adjust my understanding</Text>
              </Pressable>
              <Pressable
                onPress={() => setStartOverOpen(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Start over"
              >
                <Text style={[typography.caption, styles.tertiaryAction]}>Start over</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <AdjustUnderstandingSheet visible={adjustOpen} onClose={() => setAdjustOpen(false)} onSubmit={handleAdjustSubmit} />
      <StartOverSheet visible={startOverOpen} onClose={() => setStartOverOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.gradientStart },
  scroll: { flex: 1 },
  content: { alignItems: "stretch", paddingHorizontal: spacing.lg, gap: spacing.md },
  loadingWrap: { alignItems: "center", paddingTop: spacing.sm },
  statusText: { textAlign: "center" },
  recoveryPanel: {
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: colors.overlay.scrim,
  },
  recoveryText: { textAlign: "center" },
  recoveryAction: { color: colors.accent, fontWeight: "600" },
  header: { marginTop: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.overlay.scrim,
  },
  cardLabel: { letterSpacing: 1.4 },
  headline: { fontWeight: "600" },
  coreAspiration: { fontStyle: "italic" },
  paragraph: { textAlign: "left" },
  themesRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  themeChip: {
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  themeChipText: { color: colors.inkSecondary },
  actions: { gap: spacing.md, alignItems: "center", marginTop: spacing.sm },
  confirmedText: { textAlign: "center" },
  secondaryAction: { textDecorationLine: "underline", color: colors.accent },
  tertiaryAction: { textDecorationLine: "underline" },
});

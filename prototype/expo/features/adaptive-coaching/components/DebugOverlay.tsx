import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";

/**
 * Alpha-only developer overlay (docs/experiments/AE-001-first-adaptive-coaching-loop.md).
 * Hard-gated two ways, belt and suspenders: `__DEV__` alone is not assumed
 * reliable inside every EAS build profile, so an explicit env var is also
 * required. Either gate being false means this renders nothing — there is
 * no runtime toggle that can turn it on in a build where both are false.
 */
export function DebugOverlay() {
  const [expanded, setExpanded] = useState(false);

  const rankedDimensions = useAdaptiveCoachingStore((s) => s.rankedDimensions);
  const understandingReview = useAdaptiveCoachingStore((s) => s.understandingReview);
  const debug = useAdaptiveCoachingStore((s) => s.debug);
  const resetJourney = useAdaptiveCoachingStore((s) => s.resetJourney);

  if (!__DEV__ || process.env.EXPO_PUBLIC_AE001_DEBUG_OVERLAY !== "true") {
    return null;
  }

  const topDimensions = [...rankedDimensions].sort((a, b) => b.relevance - a.relevance).slice(0, 3);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.tab}
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Collapse debug overlay" : "Expand debug overlay"}
      >
        <Text style={styles.tabText}>{expanded ? "Hide debug" : "Debug"}</Text>
      </Pressable>

      {expanded && (
        <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
          <Section title="Life Dimensions">
            {topDimensions.length === 0
              ? "—"
              : topDimensions.map((d) => `${d.dimension} (${d.relevance.toFixed(2)})`).join(", ")}
          </Section>

          <Section title="Safety">{debug.lastSafetyTier ? `Tier: ${debug.lastSafetyTier}` : "—"}</Section>

          <Section title="Latency">
            {debug.lastLatencyMs !== null ? `LLM: ${debug.lastLatencyMs}ms` : "—"}
          </Section>

          <Section title="Request ID">{debug.lastRequestId ?? "—"}</Section>

          <Section title="Understanding">
            {understandingReview
              ? `Confidence: ${understandingReview.confidence}\nThemes: ${understandingReview.emergingThemes.join(", ") || "—"}`
              : "—"}
          </Section>

          <Section title="Current JSON payload">
            {debug.lastRawPayload ? JSON.stringify(debug.lastRawPayload, null, 2) : "—"}
          </Section>

          <Pressable
            onPress={() => resetJourney("everything")}
            style={styles.resetButton}
            accessibilityRole="button"
            accessibilityLabel="Reset test session"
          >
            <Text style={styles.resetButtonText}>Reset test session</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[typography.eyebrow, styles.sectionTitle]}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 48,
    right: spacing.sm,
    alignItems: "flex-end",
    zIndex: 999,
  },
  tab: {
    backgroundColor: colors.overlay.scrim,
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  tabText: {
    color: colors.accent,
    fontSize: 12,
  },
  panel: {
    marginTop: spacing.xxs,
    maxHeight: 360,
    width: 280,
    backgroundColor: colors.overlay.scrim,
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.md,
  },
  panelContent: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  section: {
    gap: 2,
  },
  sectionTitle: {
    letterSpacing: 1,
  },
  sectionBody: {
    ...typography.caption,
    color: colors.inkSecondary,
  },
  resetButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.state.danger,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.background.gradientStart,
  },
});

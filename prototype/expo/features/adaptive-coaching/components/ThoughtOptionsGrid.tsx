import { useEffect, useRef } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import type { GeneratedThought } from "@/types/adaptiveCoaching";
import { colors, radius, spacing, typography } from "@/theme";

const SKELETON_COUNT = 8;

type ThoughtOptionsGridProps = {
  /** True while waiting on the backend — renders skeleton placeholders
   *  instead of real bubbles (FAILURE UX: "show loading placeholders
   *  immediately," never a blank screen). */
  loading: boolean;
  thoughts: GeneratedThought[];
  selectedTexts: ReadonlySet<string>;
  dismissedIds: ReadonlySet<string>;
  onSelect: (thought: GeneratedThought) => void;
  onDismiss: (thought: GeneratedThought) => void;
  reduceMotion: boolean;
  /** A sighted user sees the skeleton-to-bubbles transition; nothing
   *  announces that to VoiceOver/TalkBack on its own — same gap and same
   *  fix PDR 0010 required for the Clarification prompt (reusing
   *  `useThoughtScheduler`'s own `AccessibilityInfo.announceForAccessibility`
   *  pattern), applied here to "the offered thoughts arrived." */
  screenReaderEnabled?: boolean;
};

/**
 * Renders every offered thought simultaneously, as a wrapping grid of
 * selectable/dismissible bubbles — replaces the ambient one-at-a-time
 * ThoughtStream carousel for this screen only (AE-001's rebuilt vertical
 * slice). A `source !== "ai"` bubble always carries a visible "Suggested"
 * badge: OUTPUT's "never silently display fallback content as AI output"
 * is a UI guarantee, not just a data-model field.
 */
export function ThoughtOptionsGrid({
  loading,
  thoughts,
  selectedTexts,
  dismissedIds,
  onSelect,
  onDismiss,
  reduceMotion,
  screenReaderEnabled = false,
}: ThoughtOptionsGridProps) {
  // Announces once per genuinely new batch (identity-compared via the
  // thoughts array reference, which both fetchInspiration and "more like
  // this" replace wholesale) — never while still loading, never repeated
  // on an unrelated re-render (selection, dismiss).
  const announcedForRef = useRef<GeneratedThought[] | null>(null);
  useEffect(() => {
    if (loading || !screenReaderEnabled) return;
    if (thoughts.length === 0) return;
    if (announcedForRef.current === thoughts) return;
    announcedForRef.current = thoughts;
    const sourceLabel = thoughts[0]?.source === "fallback" ? "Suggested" : "New";
    AccessibilityInfo.announceForAccessibility(`${sourceLabel} thoughts ready: ${thoughts.length} options`);
  }, [loading, thoughts, screenReaderEnabled]);

  if (loading) {
    return (
      <View style={styles.grid} accessibilityLabel="Loading thought suggestions">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SkeletonBubble key={i} index={i} reduceMotion={reduceMotion} />
        ))}
      </View>
    );
  }

  const visible = thoughts.filter((t) => !dismissedIds.has(t.id));
  if (visible.length === 0) return null;

  return (
    <View style={styles.grid}>
      {visible.map((thought) => {
        const selected = selectedTexts.has(thought.text);
        return (
          <Animated.View key={thought.id} entering={reduceMotion ? undefined : FadeIn.duration(300)}>
            <ThoughtChip
              thought={thought}
              selected={selected}
              onSelect={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(thought);
              }}
              onDismiss={() => onDismiss(thought)}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

function ThoughtChip({
  thought,
  selected,
  onSelect,
  onDismiss,
}: {
  thought: GeneratedThought;
  selected: boolean;
  onSelect: () => void;
  onDismiss: () => void;
}) {
  const isFallback = thought.source === "fallback";
  return (
    <View style={[styles.chip, selected && styles.chipSelected, isFallback && styles.chipFallback]}>
      <Pressable
        onPress={onSelect}
        style={styles.chipPressable}
        accessibilityRole="button"
        accessibilityLabel={`${selected ? "Deselect" : "Select"} thought: ${thought.text}${isFallback ? " (suggested, not AI-generated)" : ""}`}
        accessibilityState={{ selected }}
      >
        {isFallback && <Text style={styles.fallbackBadge}>SUGGESTED</Text>}
        <Text style={[typography.bodySecondary, styles.chipText, selected && styles.chipTextSelected]}>
          {thought.text}
        </Text>
      </Pressable>
      <Pressable
        onPress={onDismiss}
        hitSlop={8}
        style={styles.dismissButton}
        accessibilityRole="button"
        accessibilityLabel={`Dismiss thought: ${thought.text}`}
      >
        <Text style={styles.dismissText}>×</Text>
      </Pressable>
    </View>
  );
}

function SkeletonBubble({ index, reduceMotion }: { index: number; reduceMotion: boolean }) {
  const opacity = useSharedValue(0.35);

  if (!reduceMotion) {
    opacity.value = withRepeat(withTiming(0.7, { duration: 700 }), -1, true);
  }

  const animatedStyle = useAnimatedStyle(() => ({ opacity: reduceMotion ? 0.5 : opacity.value }));
  // Varies width slightly so the placeholder grid doesn't read as a rigid
  // table — a plain, honest "still working" shimmer, not a fake preview of
  // real content.
  const width = 96 + ((index * 37) % 70);

  return <Animated.View style={[styles.skeletonChip, { width }, animatedStyle]} />;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    width: "100%",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.full,
    backgroundColor: colors.overlay.scrim,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xxs,
    paddingVertical: spacing.xxs,
    maxWidth: "100%",
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: "rgba(217, 171, 125, 0.16)",
  },
  chipFallback: {
    borderStyle: "dashed",
  },
  chipPressable: {
    flexShrink: 1,
    paddingVertical: spacing.xxs,
  },
  chipText: {
    flexShrink: 1,
  },
  chipTextSelected: {
    color: colors.ink,
  },
  fallbackBadge: {
    ...typography.caption,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.state.danger,
    marginBottom: 2,
  },
  dismissButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  dismissText: {
    color: colors.inkTertiary,
    fontSize: 16,
    lineHeight: 16,
  },
  skeletonChip: {
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.overlay.hairline,
  },
});

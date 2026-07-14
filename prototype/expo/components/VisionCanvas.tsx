import { useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { EditableVisionCard } from "./EditableVisionCard";
import { colors, spacing, typography } from "@/theme";
import type { VisionFragment } from "@/types/adaptiveCoaching";

type VisionCanvasProps = {
  fragments: VisionFragment[];
  maxFragments: number;
  onEditFragment: (id: string, text: string) => void;
  onRemoveFragment: (id: string) => void;
  onReorderFragment: (fromIndex: number, toIndex: number) => void;
  reduceMotion?: boolean;
};

/**
 * Wraps up to `maxFragments` `EditableVisionCard` instances — decisions/0012's
 * replacement for the single free-text vision card. Each fragment stays a
 * real, always-live `TextInput` (`EditableVisionCard`'s own existing
 * property, reused verbatim); this component only adds the multi-fragment
 * chrome — remove, reorder, and the max-count ceiling — around it.
 *
 * Reordering is up/down controls rather than drag gestures: no drag-gesture
 * library is confirmed to exist in this codebase yet, and up/down buttons
 * satisfy "reorder" without introducing a new dependency for an alpha slice.
 */
export function VisionCanvas({
  fragments,
  maxFragments,
  onEditFragment,
  onRemoveFragment,
  onReorderFragment,
  reduceMotion = false,
}: VisionCanvasProps) {
  const inputRefs = useRef<Map<string, React.RefObject<TextInput | null>>>(new Map());

  function refFor(id: string): React.RefObject<TextInput | null> {
    let ref = inputRefs.current.get(id);
    if (!ref) {
      ref = { current: null };
      inputRefs.current.set(id, ref);
    }
    return ref;
  }

  return (
    <View style={styles.container}>
      {fragments.map((fragment, index) => (
        <Animated.View
          key={fragment.id}
          entering={reduceMotion ? undefined : FadeIn.duration(300)}
          exiting={reduceMotion ? undefined : FadeOut.duration(250)}
          layout={reduceMotion ? undefined : LinearTransition}
          style={styles.fragmentWrap}
        >
          <EditableVisionCard
            value={fragment.text}
            onChangeText={(text) => onEditFragment(fragment.id, text)}
            inputRef={refFor(fragment.id)}
          />
          <View style={styles.controlsRow}>
            <Pressable
              onPress={() => {
                if (index === 0) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onReorderFragment(index, index - 1);
              }}
              disabled={index === 0}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Move this fragment up"
              accessibilityState={{ disabled: index === 0 }}
            >
              <Text style={[typography.caption, styles.controlLabel, index === 0 && styles.controlDisabled]}>
                Move up
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (index === fragments.length - 1) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onReorderFragment(index, index + 1);
              }}
              disabled={index === fragments.length - 1}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Move this fragment down"
              accessibilityState={{ disabled: index === fragments.length - 1 }}
            >
              <Text
                style={[
                  typography.caption,
                  styles.controlLabel,
                  index === fragments.length - 1 && styles.controlDisabled,
                ]}
              >
                Move down
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRemoveFragment(fragment.id);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Remove this fragment"
            >
              <Text style={[typography.caption, styles.removeLabel]}>Remove</Text>
            </Pressable>
          </View>
        </Animated.View>
      ))}

      {fragments.length >= maxFragments && (
        <Text style={[typography.caption, styles.limitNote]}>
          You've reached {maxFragments} — remove one to add another.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: spacing.sm,
  },
  fragmentWrap: {
    width: "100%",
    gap: spacing.xxs,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  controlLabel: {
    textDecorationLine: "underline",
    color: colors.inkSecondary,
  },
  controlDisabled: {
    color: colors.inkTertiary,
    textDecorationLine: "none",
  },
  removeLabel: {
    textDecorationLine: "underline",
    color: colors.state.danger,
  },
  limitNote: {
    textAlign: "center",
    color: colors.inkTertiary,
  },
});

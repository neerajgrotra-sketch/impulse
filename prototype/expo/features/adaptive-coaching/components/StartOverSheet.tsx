import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";
import { colors, radius, spacing, typography } from "@/theme";
import { logTelemetryEvent } from "@/utils/telemetry";
import { BuildBadge } from "./BuildBadge";

type StartOverSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * The confirmation sheet behind "Start over" — routes to the store's one
 * atomic `resetJourney` action, never clears fields individually from here.
 */
export function StartOverSheet({ visible, onClose }: StartOverSheetProps) {
  const resetJourney = useAdaptiveCoachingStore((s) => s.resetJourney);

  function handleRestart() {
    logTelemetryEvent({ type: "journey_reset", scope: "restart" });
    resetJourney("restart");
    onClose();
  }

  function handleResetEverything() {
    logTelemetryEvent({ type: "journey_reset", scope: "everything" });
    resetJourney("everything");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Modal renders in its own native layer above the coordinator-level
          BuildBadge — rendered again here so it stays visible on this
          sheet too (item 9). */}
      <BuildBadge />
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" accessibilityRole="button" />
      <View style={styles.sheet}>
        <Pressable
          onPress={handleRestart}
          hitSlop={8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Restart this reflection"
        >
          <Text style={[typography.body, styles.rowLabel]}>Restart this reflection</Text>
          <Text style={[typography.caption, styles.rowDetail]}>Keeps your name, clears everything else</Text>
        </Pressable>
        <Pressable
          onPress={handleResetEverything}
          hitSlop={8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Reset everything"
        >
          <Text style={[typography.body, styles.rowLabel]}>Reset everything</Text>
          <Text style={[typography.caption, styles.rowDetail]}>Clears your name too — starts fully fresh</Text>
        </Pressable>
        <Pressable onPress={onClose} hitSlop={8} style={styles.cancelRow} accessibilityRole="button" accessibilityLabel="Cancel">
          <Text style={[typography.bodySecondary, styles.cancelLabel]}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay.scrim },
  sheet: {
    backgroundColor: colors.background.gradientEnd,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  rowLabel: { fontWeight: "600" },
  rowDetail: {},
  cancelRow: { alignItems: "center", paddingVertical: spacing.sm },
  cancelLabel: {},
});

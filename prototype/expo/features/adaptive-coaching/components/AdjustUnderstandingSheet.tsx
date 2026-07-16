import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PrimaryButton } from "@/components";
import { colors, radius, spacing, typography } from "@/theme";

type AdjustUnderstandingSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
};

/**
 * A single correction text input and a regenerate action — deliberately not
 * a per-sentence editing system (docs/experiments AE-001 rebuild spec: "a
 * simple correction text input and regenerate action is sufficient. Do not
 * create a large editing system"). The original fragments and their
 * provenance are untouched — only a correctionNote is sent alongside them on
 * regenerate.
 */
export function AdjustUnderstandingSheet({ visible, onClose, onSubmit }: AdjustUnderstandingSheetProps) {
  const [note, setNote] = useState("");

  function handleSubmit() {
    const trimmed = note.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setNote("");
  }

  function handleClose() {
    setNote("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Dismiss" accessibilityRole="button" />
      <View style={styles.sheet}>
        <Text style={[typography.headline, styles.title]} accessibilityRole="header">
          Adjust my understanding
        </Text>
        <Text style={[typography.bodySecondary, styles.subtitle]}>What doesn’t feel right?</Text>
        <TextInput
          style={[typography.body, styles.input]}
          value={note}
          onChangeText={setNote}
          placeholder="Tell me what to fix…"
          placeholderTextColor={colors.inkTertiary}
          multiline
          accessibilityLabel="What doesn’t feel right?"
        />
        <PrimaryButton label="Regenerate" onPress={handleSubmit} fullWidth disabled={note.trim().length === 0} />
        <Pressable onPress={handleClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel">
          <Text style={[typography.caption, styles.cancel]}>Cancel</Text>
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
    gap: spacing.md,
  },
  title: {},
  subtitle: {},
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.md,
    padding: spacing.sm,
    textAlignVertical: "top",
  },
  cancel: { textAlign: "center", textDecorationLine: "underline" },
});

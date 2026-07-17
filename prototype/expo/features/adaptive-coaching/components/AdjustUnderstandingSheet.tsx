import { useState } from "react";
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components";
import { colors, radius, spacing, typography } from "@/theme";
import { BuildBadge } from "./BuildBadge";

const DONE_ACCESSORY_ID = "ae001-adjust-understanding-done";

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
 *
 * Keyboard handling (physical-device UX review, item 8): the previous
 * version had no KeyboardAvoidingView at all, so the keyboard could cover
 * the input and the primary action on iOS. This version wraps the whole
 * modal content in KeyboardAvoidingView (`padding` on iOS, matching every
 * other text-input surface in this feature), scrolls internally so the
 * sheet works on small iPhone heights, keeps the input visible via a
 * bounded `maxHeight` instead of an unconstrained sheet, and offers a Done
 * accessory (iOS) alongside tap-outside-the-input-but-inside-the-sheet
 * keyboard dismissal that never closes the sheet or discards the note.
 * `onClose` never clears `note` — only a successful `onSubmit` does — so
 * closing the sheet (backdrop tap or Cancel) and reopening it preserves
 * whatever was typed, per the "preserve correction if the user temporarily
 * closes the sheet" requirement. The actual network request (and its
 * stale-response safety — AbortController, isMountedRef) lives entirely in
 * UnderstandingReviewScreen, unchanged by this component.
 */
export function AdjustUnderstandingSheet({ visible, onClose, onSubmit }: AdjustUnderstandingSheetProps) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");

  function handleSubmit() {
    const trimmed = note.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setNote("");
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* RN's Modal presents in its own native layer, above everything in
          AdaptiveCoachingCoordinator's tree — the coordinator-level
          BuildBadge is not visible while this sheet is open, so it's
          rendered again here (item 9: the badge must be visible on this
          sheet too). */}
      <BuildBadge />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" accessibilityRole="button" />
        <Pressable
          onPress={() => Keyboard.dismiss()}
          accessible={false}
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={[typography.headline, styles.title]} accessibilityRole="header">
              What did I misunderstand?
            </Text>
            <Text style={[typography.bodySecondary, styles.subtitle]}>Tell me what feels inaccurate or incomplete.</Text>
            <TextInput
              style={[typography.body, styles.input]}
              value={note}
              onChangeText={setNote}
              placeholder="Tell me what to fix…"
              placeholderTextColor={colors.inkTertiary}
              multiline
              returnKeyType="done"
              inputAccessoryViewID={Platform.OS === "ios" ? DONE_ACCESSORY_ID : undefined}
              accessibilityLabel="What did I misunderstand?"
            />
            <PrimaryButton label="Update my understanding" onPress={handleSubmit} fullWidth disabled={note.trim().length === 0} />
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text style={[typography.caption, styles.cancel]}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={DONE_ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Done">
              <Text style={styles.accessoryDone}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    maxHeight: "85%",
    backgroundColor: colors.background.gradientEnd,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  scrollContent: {
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

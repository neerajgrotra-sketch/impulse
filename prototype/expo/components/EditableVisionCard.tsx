import type { RefObject } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, radius, spacing, typography } from "@/theme";

type EditableVisionCardProps = {
  value: string;
  onChangeText: (text: string) => void;
  inputRef: RefObject<TextInput | null>;
  placeholder?: string;
  /** iOS-only: ties this input to an `InputAccessoryView` (the "Done
   *  Editing" bar) rendered by the parent screen. Undefined on Android,
   *  where there's no accessory-view concept. */
  inputAccessoryViewID?: string;
};

/**
 * A real, always-live multiline `TextInput` — never static text with an
 * invisible field laid over it (Phase 7). Editability is communicated
 * structurally: pencil, label, border, helper copy, and a focus glow,
 * rather than left for the user to discover by guessing.
 */
export function EditableVisionCard({
  value,
  onChangeText,
  inputRef,
  placeholder = "I am someone who…",
  inputAccessoryViewID,
}: EditableVisionCardProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={[styles.card, focused && styles.cardFocused]}>
      <View style={styles.header}>
        <PencilIcon />
        <Text style={[typography.eyebrow, styles.label]}>YOUR VISION</Text>
      </View>

      <TextInput
        ref={inputRef}
        style={[typography.body, styles.input]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.inkTertiary}
        multiline
        textAlignVertical="top"
        inputAccessoryViewID={inputAccessoryViewID}
        accessibilityLabel="Your vision"
        accessibilityHint="Edit the identity statement you want to carry into onboarding"
        accessibilityActions={[{ name: "escape", label: "Done editing" }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "escape") {
            inputRef.current?.blur();
          }
        }}
      />

      {!focused && <Text style={[typography.caption, styles.helper]}>Tap anywhere to edit</Text>}
    </Pressable>
  );
}

function PencilIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20l4-1 11-11-3-3L5 16l-1 4z"
        stroke={colors.inkTertiary}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.overlay.scrim,
  },
  cardFocused: {
    borderColor: colors.accent,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  label: {
    letterSpacing: 1.4,
  },
  input: {
    minHeight: 88,
    color: colors.ink,
  },
  helper: {
    color: colors.inkTertiary,
  },
});

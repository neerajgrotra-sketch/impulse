import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground, PrimaryButton } from "@/components";
import { colors, fontFamily, spacing, typography } from "@/theme";

type NameCollectionScreenProps = {
  onSubmit: (firstName: string) => void;
};

/**
 * Step 0 of AE-001, per decisions/0013's Part 7 recommendation (Option B):
 * first name only — a relational nicety, not a demographic data point.
 * Everything else (life stage, current focus) is inferred from conversation
 * rather than asked here.
 */
export function NameCollectionScreen({ onSubmit }: NameCollectionScreenProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const inputRef = useRef<TextInput>(null);

  const canContinue = name.trim().length > 0;

  return (
    <View style={styles.container}>
      <GradientBackground />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.topGroup}>
            <Text style={styles.title} accessibilityRole="header">
              What should I call you?
            </Text>
            <TextInput
              ref={inputRef}
              style={[typography.display, styles.input]}
              value={name}
              onChangeText={setName}
              placeholder="Your first name"
              placeholderTextColor={colors.inkTertiary}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => canContinue && onSubmit(name.trim())}
              accessibilityLabel="Your first name"
            />
          </View>

          <PrimaryButton label="Continue" onPress={() => onSubmit(name.trim())} fullWidth disabled={!canContinue} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.gradientStart,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  topGroup: {
    gap: spacing.lg,
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  title: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 22,
    lineHeight: 29,
    color: colors.ink,
    textAlign: "center",
  },
  input: {
    width: "100%",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.overlay.hairline,
    paddingBottom: spacing.sm,
  },
});

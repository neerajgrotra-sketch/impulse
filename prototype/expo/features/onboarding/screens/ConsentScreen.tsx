import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground, PrimaryButton } from "@/components";
import { useOnboardingStore } from "@/stores/onboardingStore";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";
import { colors, spacing, typography } from "@/theme";

type ConsentScreenProps = {
  voiceCapture: VoiceCapture;
};

/**
 * Screen 2 — consent-as-gate, ported from ConsentView.swift. The copy
 * adapts to whether on-device voice capture actually resolved as available
 * on this build (see hooks/useVoiceCapture.ts) — the Swift copy promises
 * "I'll record your voice"; saying that while silently typing-only would be
 * exactly the kind of small dishonesty the Covenant exists to rule out.
 */
export function ConsentScreen({ voiceCapture }: ConsentScreenProps) {
  const beginConversation = useOnboardingStore((state) => state.beginConversation);
  const insets = useSafeAreaInsets();
  const [requesting, setRequesting] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);
  // A fast double-tap can fire two onPress events before `requesting` state
  // re-renders the button as disabled — this ref closes that window so a
  // second permission request can't be kicked off mid-flight.
  const inFlight = useRef(false);

  async function handleAgree() {
    if (inFlight.current) return;

    if (!voiceCapture.isAvailable) {
      beginConversation();
      return;
    }

    inFlight.current = true;
    setRequesting(true);
    const granted = await voiceCapture.requestPermission();
    setRequesting(false);
    inFlight.current = false;

    if (granted) {
      beginConversation();
    } else {
      setDeniedMessage(
        "I need microphone and speech access to hear you — enable it in Settings, then come back."
      );
    }
  }

  return (
    <View style={styles.container}>
      <GradientBackground />

      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
        <ScrollView
          style={styles.copyScroll}
          contentContainerStyle={styles.copy}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.headline, styles.title]}>Before we talk</Text>

          <Text style={[typography.body, styles.body]}>
            {voiceCapture.isAvailable
              ? "I'll record your voice and turn it into text so I can actually understand what you tell me. It's stored securely, never sold, and you can delete it any time. Nothing is shared with anyone else."
              : "I'll turn what you tell me into understanding — typed here, since voice capture isn't available in this build. It's stored securely, never sold, and you can delete it any time. Nothing is shared with anyone else."}
          </Text>

          {deniedMessage && (
            <Text style={[typography.caption, styles.denied]}>{deniedMessage}</Text>
          )}
        </ScrollView>

        <PrimaryButton
          label="Agree & begin"
          onPress={handleAgree}
          fullWidth
          loading={requesting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.gradientStart,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  copyScroll: {
    flexGrow: 0,
    maxHeight: "70%",
  },
  copy: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 22,
  },
  body: {
    color: colors.inkSecondary,
  },
  denied: {
    color: colors.state.danger,
  },
});

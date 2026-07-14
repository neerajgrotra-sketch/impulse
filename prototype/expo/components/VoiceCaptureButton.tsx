import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Rect } from "react-native-svg";
import type { SpeechRecognitionAdapter } from "@/hooks/useSpeechRecognitionAdapter";
import { colors, spacing, typography } from "@/theme";

type VoiceCaptureButtonProps = {
  adapter: SpeechRecognitionAdapter;
  size?: number;
};

/**
 * Stays visible throughout the inspiration state (Phase 6) — tap to start,
 * tap again to stop. Renders nothing if this build has no on-device
 * recognizer available, same "never promise voice capture that isn't real"
 * rule `ConsentScreen`'s copy already follows.
 */
export function VoiceCaptureButton({ adapter, size = 64 }: VoiceCaptureButtonProps) {
  const { status, isAvailable, error, partialTranscript } = adapter;

  if (!isAvailable) return null;

  const busy = status === "requestingPermission" || status === "processing";
  const listening = status === "listening";

  function handlePress() {
    if (busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (listening) {
      adapter.stop();
    } else {
      adapter.start();
    }
  }

  function handleCancel() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    adapter.cancel();
  }

  const label = listening
    ? "Stop recording your vision"
    : status === "requestingPermission"
      ? "Requesting microphone permission"
      : status === "processing"
        ? "Processing your recording"
        : status === "error"
          ? "Try recording again"
          : "Record your vision by voice";

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handlePress}
        disabled={busy}
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          listening && styles.buttonActive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: busy, busy }}
        hitSlop={8}
      >
        {busy ? (
          <ActivityIndicator color={colors.ink} size="small" />
        ) : listening ? (
          <Svg width={20} height={20} viewBox="0 0 20 20">
            <Rect x={2} y={2} width={16} height={16} rx={4} fill={colors.state.danger} />
          </Svg>
        ) : (
          <Svg width={22} height={22} viewBox="0 0 22 22">
            <Circle cx={11} cy={11} r={9} stroke={colors.ink} strokeWidth={1.5} fill="none" />
            <Circle cx={11} cy={11} r={4} fill={colors.accent} />
          </Svg>
        )}
      </Pressable>

      {listening && partialTranscript.trim().length > 0 && (
        <Text
          style={[typography.bodySecondary, styles.partialTranscript]}
          numberOfLines={3}
          accessibilityLabel={`What I'm hearing so far: ${partialTranscript}`}
        >
          {partialTranscript}
        </Text>
      )}

      {listening && (
        <Pressable
          onPress={handleCancel}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cancel recording and discard what you said"
        >
          <Text style={[typography.caption, styles.cancelLabel]}>Cancel</Text>
        </Pressable>
      )}

      {status === "error" && error && (
        <Text style={[typography.caption, styles.error]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.xs,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    backgroundColor: colors.overlay.scrim,
  },
  buttonActive: {
    borderColor: colors.state.danger,
  },
  partialTranscript: {
    fontStyle: "italic",
    color: colors.inkSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
  cancelLabel: {
    textDecorationLine: "underline",
  },
  error: {
    color: colors.state.danger,
    textAlign: "center",
    maxWidth: 220,
  },
});

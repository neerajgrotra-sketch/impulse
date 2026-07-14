import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path, Rect } from "react-native-svg";
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
 *
 * Mic-only: the live partial transcript used to render here as a small
 * caption. The transcript is the most important thing on screen while
 * recording, so it now renders large and centered at the screen level
 * (`IdentityInspirationScreen`) instead of tucked under this control.
 */
export function VoiceCaptureButton({ adapter, size = 64 }: VoiceCaptureButtonProps) {
  const { status, isAvailable, error } = adapter;

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
        {busy ? <ActivityIndicator color={colors.ink} size="small" /> : <MicGlyph listening={listening} />}
      </Pressable>

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

      {status === "error" && error && <Text style={[typography.caption, styles.error]}>{error}</Text>}
    </View>
  );
}

/**
 * A real microphone — capsule body, stand, and base — not a plain dot, so a
 * first-time user reads "this is where I speak" without a caption. Idle:
 * thin outline. Listening: the whole glyph swaps to a plain stop square
 * (the same shape every "recording — tap to stop" affordance uses), so the
 * button itself says "tap to stop" without requiring a caption to explain
 * it — a subtler inset-square-on-a-mic version of this was tried first and
 * user testing found it not obvious enough.
 */
function MicGlyph({ listening }: { listening: boolean }) {
  if (listening) {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Rect x={4} y={4} width={16} height={16} rx={4} fill={colors.state.danger} />
      </Svg>
    );
  }

  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M11 2.75a2.75 2.75 0 0 1 2.75 2.75v4.5a2.75 2.75 0 1 1-5.5 0v-4.5A2.75 2.75 0 0 1 11 2.75z"
        stroke={colors.ink}
        strokeWidth={1.5}
      />
      <Path
        d="M5.75 9.75v.5a5.25 5.25 0 0 0 10.5 0v-.5"
        stroke={colors.ink}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path d="M11 15.5V18.5" stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 18.5H14" stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
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
  cancelLabel: {
    textDecorationLine: "underline",
  },
  error: {
    color: colors.state.danger,
    textAlign: "center",
    maxWidth: 220,
  },
});

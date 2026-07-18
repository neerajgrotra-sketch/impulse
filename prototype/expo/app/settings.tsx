import { useRouter } from "expo-router";
import { SettingsScreen } from "@/features/settings/screens/SettingsScreen";

/**
 * Reached at `/settings` — currently the only route to this screen (no
 * settings entry point exists elsewhere yet in the AE-001-only navigation
 * shell; a future pass wires a real entry point into the shipped app). Also
 * where a tapped location check-in notification deep-links to, since it's
 * the screen this feature actually lives on (see `app/_layout.tsx`).
 */
export default function Settings() {
  const router = useRouter();
  return <SettingsScreen onBack={() => router.back()} />;
}

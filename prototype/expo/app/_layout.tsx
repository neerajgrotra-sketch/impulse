import "react-native-gesture-handler";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { useRouter, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Side-effect import only: registers the location check-in background task
// and the foreground notification handler at module scope. Must be imported
// once, early, from the app root — never inside a component — so the task
// is already registered if iOS relaunches the JS runtime in the background.
import { NOTIFICATION_DATA_TYPE } from "@/services/locationCheckInService";
import { colors, fontsToLoad } from "@/theme";

SplashScreen.preventAutoHideAsync();

/**
 * Root layout — owns font loading and the navigation shell. This app has no
 * light mode (see app.json's `userInterfaceStyle: "dark"`); every screen
 * shares the same dusk gradient, so the stack itself stays chrome-free
 * (no headers) and lets each screen paint its own background.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontsToLoad);
  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Tapping a location check-in notification opens Settings — the existing
  // screen this feature lives on, not a new workflow.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.type === NOTIFICATION_DATA_TYPE) {
        router.push("/settings");
      }
    });
    return () => subscription.remove();
  }, [router]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ErrorBoundary>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: colors.background.gradientStart },
            }}
          />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

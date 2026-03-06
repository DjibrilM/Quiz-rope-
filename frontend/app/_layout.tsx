import "../src/styles/global.css";
import "../src/i18n";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useEffect, useCallback, useRef } from "react";
import { useFonts } from "expo-font";
import i18n, { SUPPORTED_LANGUAGES } from "../src/i18n";
import type { SupportedLanguage } from "../src/i18n";
import { LuckiestGuy_400Regular } from "@expo-google-fonts/luckiest-guy";
import { Bungee_400Regular } from "@expo-google-fonts/bungee";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import * as SplashScreen from "expo-splash-screen";
import { firebaseAuthService } from "../src/services/firebase";
import { soundService } from "../src/services/sound";
import { ErrorBoundary } from "../src/components/common/ErrorBoundary";
import { useGameStore } from "../src/stores/gameStore";
import { apiService } from "../src/services/api";

SplashScreen.preventAutoHideAsync();

const PUBLIC_ROUTES = ["index", "login", "signup", "child-join"];

function useLocaleSync() {
  const { locale, _hasHydrated } = useGameStore();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!_hasHydrated || hasSynced.current) return;
    hasSynced.current = true;

    if (locale && locale !== i18n.language) {
      i18n.changeLanguage(locale);
    }

    const isRtl = SUPPORTED_LANGUAGES[locale as SupportedLanguage]?.rtl ?? false;
    if (I18nManager.isRTL !== isRtl) {
      I18nManager.forceRTL(isRtl);
      I18nManager.allowRTL(isRtl);
    }
  }, [_hasHydrated, locale]);
}

function useProtectedRoute(isLayoutReady: boolean) {
  const segments = useSegments();
  const { isAuthenticated, _hasHydrated, authToken } = useGameStore();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!_hasHydrated || !isLayoutReady) return;

    // Restore token to API service on hydration
    if (authToken) {
      apiService.setToken(authToken);
    }

    const currentRoute = segments[0] || "index";
    const isPublicRoute = PUBLIC_ROUTES.includes(currentRoute);

    // Debounce to avoid double navigation
    if (hasNavigated.current) return;

    if (isAuthenticated && isPublicRoute && currentRoute !== "child-join") {
      hasNavigated.current = true;
      router.replace("/home");
      setTimeout(() => { hasNavigated.current = false; }, 500);
    } else if (!isAuthenticated && !isPublicRoute) {
      hasNavigated.current = true;
      router.replace("/");
      setTimeout(() => { hasNavigated.current = false; }, 500);
    }
  }, [isAuthenticated, segments, _hasHydrated, authToken, isLayoutReady]);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LuckiestGuy_400Regular,
    Bungee_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Wire up 401 handler to trigger logout
  useEffect(() => {
    apiService.setOnUnauthorized(() => {
      const store = useGameStore.getState();
      apiService.clearToken();
      store.logout();
    });
  }, []);

  useEffect(() => {
    try {
      firebaseAuthService.configure(
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      );
    } catch (error) {
      console.warn("Firebase configuration skipped:", error);
    }

    soundService.loadAll();

    return () => {
      soundService.unloadAll();
    };
  }, []);

  useLocaleSync();
  useProtectedRoute(!!fontsLoaded);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0D0B14" },
                animation: "slide_from_right",
              }}
            />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

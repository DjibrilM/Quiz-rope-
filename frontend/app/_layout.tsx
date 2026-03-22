import "../src/styles/global.css";
import "../src/i18n";
import { Stack, router, useSegments } from "expo-router";
import { FONTS, FORTNITE_COLORS } from "../src/constants/theme";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useEffect, useCallback, useRef } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
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
import { initGuestDb, clearAllGuestData } from "../src/services/guestDb";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider, useToast } from "../src/context/ToastContext";

const queryClient = new QueryClient();

function ApiToastBridge() {
  const { showToast } = useToast();
  useEffect(() => {
    apiService.setOnApiError(showToast);
    return () => {
      apiService.setOnApiError(null);
    };
  }, [showToast]);
  return null;
}

SplashScreen.preventAutoHideAsync();

const PUBLIC_ROUTES = [
  "index",
  "auth", // covers auth/login, auth/signup, auth/child-join, auth/forgot-password, auth/guest-setup, auth/verify-email
];

function useLocaleSync() {
  const { locale, _hasHydrated } = useGameStore();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!_hasHydrated || hasSynced.current) return;
    hasSynced.current = true;
    initGuestDb().catch(() => {});

    if (locale && locale !== i18n.language) {
      i18n.changeLanguage(locale);
    }

    const isRtl =
      SUPPORTED_LANGUAGES[locale as SupportedLanguage]?.rtl ?? false;
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

    const isChildJoin = segments[0] === "auth" && segments[1] === "child-join";
    if (isAuthenticated && isPublicRoute && !isChildJoin) {
      hasNavigated.current = true;
      router.replace("/home");
      setTimeout(() => {
        hasNavigated.current = false;
      }, 500);
    } else if (!isAuthenticated && !isPublicRoute) {
      hasNavigated.current = true;
      router.replace("/");
      setTimeout(() => {
        hasNavigated.current = false;
      }, 500);
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

  // Default the entire app to portrait. Individual screens (game/lobby for parent)
  // override this with their own lock. Using a global default ensures no screen
  // ever starts with a free/unlocked orientation.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  // Wire up 401 handler to trigger logout
  useEffect(() => {
    apiService.setOnUnauthorized(() => {
      const store = useGameStore.getState();
      clearAllGuestData().catch(() => {});
      apiService.clearToken();
      store.logout();
      queryClient.clear();
    });
  }, []);

  useEffect(() => {
    try {
      firebaseAuthService.configure(
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
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
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <SafeAreaProvider>
            <ToastProvider>
              <ApiToastBridge />
              <BottomSheetModalProvider>
                <StatusBar style="light" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    headerStyle: { backgroundColor: FORTNITE_COLORS.bgDark },
                    headerTitleStyle: {
                      fontFamily: FONTS.heading,
                      fontSize: 20,
                      color: FORTNITE_COLORS.textPrimary,
                    },
                    headerTintColor: FORTNITE_COLORS.textPrimary,
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: FORTNITE_COLORS.bgDark },
                  }}
                />
              </BottomSheetModalProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

import "../src/styles/global.css";
import "../src/i18n";
import { Stack, router, useSegments } from "expo-router";
import { FONTS, FORTNITE_COLORS } from "../src/constants/theme";
import { StatusBar } from "expo-status-bar";
import { I18nManager, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useEffect, useCallback, useRef, useState } from "react";
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
import { socketService } from "../src/services/socket";
import { AnimatedLoader } from "../src/components/common/AnimatedLoader";
import { AppTitle } from "../src/components/auth/AppTitle";
import { NotificationService } from "../src/services/NotificationService";
import * as Notifications from 'expo-notifications';

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

function ChildSessionWatcher() {
  const { showToast, showInfo } = useToast();
  const { isAuthenticated, childSession } = useGameStore();

  // Sync child profile from backend on app open
  useEffect(() => {
    if (isAuthenticated && childSession?.childId) {
      apiService.syncBackendDataToLocal().catch(() => {});
      apiService.reportChildActive(childSession.childId).catch(() => {});
    }
  }, [isAuthenticated, childSession?.childId]);

  useEffect(() => {
    const { childSession, logout } = useGameStore.getState();
    if (!childSession?.sessionToken) return;

    const socket = socketService.connect();
    socket.emit("session:watch", { sessionToken: childSession.sessionToken });

    const handleChildDeleted = (data: { childId: string }) => {
      if (data.childId === childSession.childId) {
        showInfo("Your profile was removed by your parent.", "Profile Removed");
        clearAllGuestData().catch(() => {});
        apiService.clearToken();
        logout();
        queryClient.clear();
        router.replace("/auth/child-deleted");
      }
    };

    socket.on("child:deleted", handleChildDeleted);

    return () => {
      socket.off("child:deleted", handleChildDeleted);
    };
  }, [isAuthenticated, childSession?.sessionToken, showToast, showInfo]);

  return null;
}

function NotificationWatcher() {
  const { isAuthenticated, userRole, childProfile, streak } = useGameStore();
  const notificationListener = useRef<Notifications.Subscription>(null!);
  const responseListener = useRef<Notifications.Subscription>(null!);

  useEffect(() => {
    // 1. Register for permissions
    NotificationService.registerForPushNotificationsAsync();

    // 2. Listen for notifications while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // console.log('Notification Received:', notification);
    });

    // 3. Listen for interactions (tapping a notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen;
      if (screen) {
        router.push(screen as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Schedule routine notifications when the child profile is active
  useEffect(() => {
    if (isAuthenticated && userRole === 'child' && childProfile) {
      const childId = useGameStore.getState().childSession?.childId;
      if (childId) {
        apiService.getChildStats(childId)
          .then(performance => {
            NotificationService.scheduleRoutineNotifications(childProfile, performance, streak);
          })
          .catch(() => {
            // Fallback if stats fail
            NotificationService.scheduleRoutineNotifications(childProfile, undefined, streak);
          });
      }
    }
  }, [isAuthenticated, userRole, childProfile?.displayName, streak]);

  return null;
}

SplashScreen.preventAutoHideAsync();

const PUBLIC_ROUTES = [
  "index",
  "auth", // covers auth/login, auth/signup, auth/child-join, auth/forgot-password, auth/guest-setup, auth/verify-email
];

function ProfileSplash() {
  const { userRole, childProfile } = useGameStore();
  const isChild = userRole === "child";

  const message = isChild && childProfile?.displayName
    ? `Welcome back, ${childProfile.displayName}!`
    : "Loading your profile...";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0D0B14",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      <AppTitle />
      <AnimatedLoader size="lg" message={message} />
    </View>
  );
}

/**
 * Runs once after Zustand hydration for authenticated (non-guest) users.
 * Calls the backend to verify the stored token and refresh profile data.
 * Signs the user out if credentials are no longer valid.
 * Returns true when the verification pass is complete (or not needed).
 */
function useProfileVerification() {
  const { _hasHydrated, isAuthenticated, userRole, authToken } = useGameStore();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    // Guests only have local data — nothing to verify server-side
    if (!isAuthenticated || userRole === "guest") {
      setIsVerified(true);
      return;
    }

    if (!authToken) {
      // No token in store — treat as invalid session
      apiService.clearToken();
      useGameStore.getState().logout();
      setIsVerified(true);
      return;
    }

    apiService.setToken(authToken);

    (async () => {
      try {
        if (userRole === "parent") {
          const [user, children] = await Promise.all([
            apiService.getMe(),
            apiService.getChildren(),
          ]);
          const store = useGameStore.getState();
          store.updateParentUser(user as any);
          store.setChildren(
            (children as any[]).map((c) => ({ ...c, id: c._id ?? c.id }))
          );
        } else if (userRole === "child") {
          // Verify the child JWT and store their fresh profile directly
          const me = (await apiService.getMe()) as any;
          if (me) {
            useGameStore.getState().setChildProfile({
              displayName: me.displayName ?? "",
              avatarUrl: me.avatarUrl ?? "",
              grade: me.grade ?? "",
            });
          }
        }
      } catch (err: any) {
        // Only sign out on explicit auth rejection (401/403).
        // Network errors (offline, timeout) let the user continue with cached data.
        const status = err?.response?.status ?? 0;
        const isAuthError = status === 401 || status === 403;
        if (isAuthError) {
          clearAllGuestData().catch(() => {});
          apiService.clearToken();
          useGameStore.getState().logout();
          queryClient.clear();
        }
      } finally {
        setIsVerified(true);
      }
    })();
  // Only run once after the store has hydrated
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated]);

  return isVerified;
}

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

function useProtectedRoute(isLayoutReady: boolean, isVerified: boolean) {
  const segments = useSegments();
  const { isAuthenticated, _hasHydrated, authToken } = useGameStore();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!_hasHydrated || !isLayoutReady || !isVerified) return;

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
  }, [isAuthenticated, segments, _hasHydrated, authToken, isLayoutReady, isVerified]);
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
  const isVerified = useProfileVerification();
  useProtectedRoute(!!fontsLoaded, isVerified);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Show a branded loading screen while we verify the stored credentials
  // and refresh the user's profile from the backend.
  if (!isVerified) {
    return (
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <ProfileSplash />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <SafeAreaProvider>
            <ToastProvider>
              <ApiToastBridge />
              <ChildSessionWatcher />
              <NotificationWatcher />
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

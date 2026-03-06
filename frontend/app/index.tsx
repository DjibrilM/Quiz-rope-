import { View, ScrollView, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { useGameStore } from "../src/stores/gameStore";
import { AppTitle } from "../src/components/auth";
import { ActionCard, StaggeredList, LanguageSelector, FlashingGlobeButton } from "../src/components/common";

function ParentIcon() {
  return (
    <View style={{ marginBottom: 12 }}>
      <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="parentGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E8A0BF" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </LinearGradient>
        </Defs>
        <Circle cx="9" cy="5.5" r="3" fill="url(#parentGrad)" />
        <Path
          d="M3 18v-1.5c0-2.5 3-4.5 6-4.5s6 2 6 4.5V18"
          stroke="url(#parentGrad)"
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="18" cy="8" r="2.2" fill="url(#parentGrad)" />
        <Path
          d="M14 18v-1c0-1.8 1.8-3.2 4-3.2s4 1.4 4 3.2v1"
          stroke="url(#parentGrad)"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M13 7.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5c0 1.8-1.5 2.8-1.5 2.8S13 9.3 13 7.5Z"
          fill="#E85D75"
          opacity={0.8}
        />
      </Svg>
    </View>
  );
}

function StudentIcon() {
  return (
    <View style={{ marginBottom: 12 }}>
      <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="studentGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#C4B5FD" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </LinearGradient>
        </Defs>
        <Path
          d="M12 3L2 8l10 5 10-5-10-5Z"
          fill="url(#studentGrad)"
        />
        <Path
          d="M6 10.5v4.5c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"
          stroke="url(#studentGrad)"
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M20 8v6"
          stroke="#FFD93D"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <Circle cx="20" cy="15" r="1.2" fill="#FFD93D" />
        <Path
          d="M12 12.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2L9.1 14.6l2-.3.9-1.8Z"
          fill="#FFD93D"
          opacity={0.9}
        />
      </Svg>
    </View>
  );
}

function DevIcon() {
  return (
    <View style={{ marginBottom: 12 }}>
      <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="devGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#B8A9C9" />
            <Stop offset="1" stopColor="#E2E8F0" />
          </LinearGradient>
        </Defs>
        <Rect
          x="2"
          y="3"
          width="20"
          height="18"
          rx="3"
          stroke="url(#devGrad)"
          strokeWidth={1.6}
          fill="none"
        />
        <Circle cx="6" cy="6.5" r="1" fill="#EF4444" />
        <Circle cx="9.5" cy="6.5" r="1" fill="#FFD93D" />
        <Circle cx="13" cy="6.5" r="1" fill="#22C55E" />
        <Path
          d="M6 12l4 3-4 3"
          stroke="url(#devGrad)"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13 18h5"
          stroke="#22C55E"
          strokeWidth={1.8}
          strokeLinecap="round"
          opacity={0.8}
        />
      </Svg>
    </View>
  );
}

export default function RoleSelectScreen() {
  const { t } = useTranslation("auth");
  const langSheetRef = useRef<BottomSheetModal>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const { setAuth } = useGameStore();
  usePortrait();

  useEffect(() => {
    apiService
      .getAuthStatus()
      .then((s) => setIsMockMode(s.mockMode))
      .catch(() => setIsMockMode(true));
  }, []);

  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      const result = await apiService.login("mock-token");
      apiService.setToken(result.token || "mock-token");
      const user = (result.user || result) as unknown as Record<string, unknown>;
      setAuth({ ...result.user, ...user } as any, true, result.token || "mock-token");
      router.replace("/home");
    } catch {
      setAuth(
        {
          id: "mock-parent",
          email: "parent@test.com",
          displayName: "Test Parent",
          children: [],
          createdAt: new Date(),
        },
        true,
        "mock-token",
      );
      router.replace("/home");
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <View style={{ position: "absolute", top: 52, right: 20, zIndex: 10 }}>
        <FlashingGlobeButton onPress={() => langSheetRef.current?.present()} size={44} />
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 40,
          gap: 16,
        }}
      >
        <AppTitle />

        <View className="w-full max-w-sm" style={{ gap: 16 }}>
          <StaggeredList staggerMs={100}>
            <ActionCard
              icon={<ParentIcon />}
              title={t("roleSelect.parent")}
              description={t("roleSelect.parentDesc")}
              onPress={() => router.push("/login")}
              variant="primary"
            />

            <ActionCard
              icon={<StudentIcon />}
              title={t("roleSelect.player")}
              description={t("roleSelect.playerDesc")}
              onPress={() => router.push("/child-join")}
              variant="secondary"
            />

            {__DEV__ && isMockMode && (
              <ActionCard
                icon={<DevIcon />}
                title={t("roleSelect.devMode")}
                description={t("roleSelect.devModeDesc")}
                onPress={handleDevLogin}
                variant="outline"
                loading={devLoading}
              />
            )}
          </StaggeredList>
        </View>
      </ScrollView>

      <LanguageSelector ref={langSheetRef} />
    </SafeAreaView>
  );
}

import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useCallback, useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { useGameStore } from "../src/stores/gameStore";
import { firebaseAuthService } from "../src/services/firebase";
import * as guestDb from "../src/services/guestDb";
import {
  AnimatedLoader,
  EmptyState,
  ScreenHeader,
  Button,
} from "../src/components/common";
import {
  KidProfileView,
} from "../src/components/children/KidProfileView";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { Text } from "react-native";
import { FONTS } from "../src/constants/theme";

export default function ProfileScreen() {
  usePortrait();
  const { t } = useTranslation(["leaderboard", "common", "auth", "profile"]);
  const { children, userRole, parentUser, guestProfile, childSession, logout } =
    useGameStore();
  const queryClient = useQueryClient();
  const isGuest = userRole === "guest";
  const isChild = userRole === "child";
  const uid = isChild
    ? childSession?.parentId
    : parentUser?._id ?? parentUser?.id ?? guestProfile?.guestId ?? null;
  const logoutSheetRef = useRef<BottomSheetModal>(null);

  const {
    data: rawEntries = [],
    isLoading: leaderboardLoading,
  } = useQuery({
    queryKey: ["leaderboard", uid],
    queryFn: () => apiService.getLeaderboard(),
    enabled: isChild,
  });

  // Always fetch the child's cached profile from SQLite (populated by syncBackendDataToLocal)
  const { data: cachedChildProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["cachedChildProfile", childSession?.childId],
    queryFn: () => guestDb.getChildProfile(childSession!.childId!),
    enabled: isChild && !!childSession?.childId,
  });

  // Guest: fetch real stats from local SQLite
  const { data: guestStats, isLoading: guestStatsLoading } = useQuery({
    queryKey: ["guestProfileStats"],
    queryFn: guestDb.getGuestProfileStats,
    enabled: isGuest,
  });

  const isLoading = isChild ? (leaderboardLoading || profileLoading) : (isGuest ? guestStatsLoading : false);

  const guestEntry = useMemo(() => {
    if (!isGuest || !guestProfile) return null;
    return {
      playerId: guestProfile.guestId,
      displayName: guestProfile.displayName,
      correctAnswers: guestStats?.correctAnswers ?? 0,
      totalAnswers: guestStats?.totalAnswers ?? 0,
      accuracy: guestStats?.accuracy ?? 0,
      gamesPlayed: guestStats?.gamesPlayed ?? 0,
      avatarUrl: guestProfile.avatarId,
    };
  }, [isGuest, guestProfile, guestStats]);

  // Build child display entry: leaderboard stats + profile avatar/name from SQLite
  const myChildEntry = useMemo(() => {
    if (!isChild || !childSession?.childId) return null;
    const leaderboardEntry = rawEntries.find((e) => e.playerId === childSession.childId);
    if (leaderboardEntry) {
      return {
        ...leaderboardEntry,
        avatarUrl: leaderboardEntry.avatarUrl || cachedChildProfile?.avatarUrl,
        displayName: leaderboardEntry.displayName || cachedChildProfile?.displayName || "Kid",
      };
    }
    // No leaderboard entry yet — build from cached profile
    if (cachedChildProfile) {
      return {
        playerId: childSession.childId,
        displayName: cachedChildProfile.displayName,
        avatarUrl: cachedChildProfile.avatarUrl || undefined,
        correctAnswers: 0,
        totalAnswers: 0,
        accuracy: 0,
        gamesPlayed: 0,
      };
    }
    return null;
  }, [isChild, childSession?.childId, rawEntries, cachedChildProfile]);

  const handleLogout = useCallback(() => {
    logoutSheetRef.current?.present();
  }, []);

  const executeLogout = useCallback(async () => {
    logoutSheetRef.current?.dismiss();
    try {
      await firebaseAuthService.signOut();
    } catch {
      // non-critical
    }
    guestDb.clearAllGuestData().catch(() => {});
    apiService.clearToken();
    logout();
    queryClient.clear();
    router.replace("/");
  }, [logout, queryClient]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    [],
  );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-game-bg">
      <ScreenHeader title={t("common:profile", "Profile")} />

      <ScrollView
        className="flex-1 px-8"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {isLoading && isChild && (
          <View className="items-center py-20">
            <AnimatedLoader
              size="lg"
              message={t("leaderboard:loadingMessage")}
            />
          </View>
        )}

        {isGuest && !isLoading && guestEntry && (
          <KidProfileView entry={guestEntry} onLogout={handleLogout} />
        )}

        {isGuest && isLoading && (
          <View className="items-center py-20">
            <AnimatedLoader size="lg" />
          </View>
        )}

        {isChild && !isLoading && myChildEntry && (
          <KidProfileView entry={myChildEntry} onLogout={handleLogout} />
        )}

        {isChild && !isLoading && !myChildEntry && (
          <View className="items-center">
            <EmptyState
              illustration="noRankings"
              title={t("leaderboard:emptyTitle")}
              subtitle={t("leaderboard:emptySubtitleChild")}
            />
            <Button
              label={t("auth:logout.button")}
              variant="danger"
              onPress={handleLogout}
              className="w-full mt-4"
            />
          </View>
        )}

        {!isGuest && !isChild && (
           <EmptyState
            illustration="error"
            title="Parent Profile"
            subtitle="Please use the parent dashboard to manage your account."
          />
        )}
      </ScrollView>

      {/* Logout confirmation sheet */}
      <BottomSheetModal
        ref={logoutSheetRef}
        enablePanDownToClose
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: "#1A1520",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        handleIndicatorStyle={{
          backgroundColor: "#5A4B6B",
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView
          style={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 22,
              textAlign: "center",
              marginBottom: 12,
              fontFamily: "LuckiestGuy_400Regular",
            }}
          >
            {t("auth:logout.title")}
          </Text>
          <Text
            style={{
              color: "#B8A9C9",
              fontSize: 15,
              textAlign: "center",
              marginBottom: 32,
              fontFamily: FONTS.body,
            }}
          >
            {t("auth:logout.confirmation")}
          </Text>
          <View style={{ gap: 12 }}>
            <Button
              label={t("auth:logout.button")}
              variant="danger"
              onPress={executeLogout}
              className="min-w-full max-w-none"
            />
            <Button
              label={t("common:buttons.cancel")}
              variant="secondary"
              onPress={() => logoutSheetRef.current?.dismiss()}
              className="w-full min-w-full max-w-none"
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

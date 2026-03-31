import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useCallback, useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import type { LeaderboardEntry } from "../src/services/api";
import { useGameStore } from "../src/stores/gameStore";
import { firebaseAuthService } from "../src/services/firebase";
import * as guestDb from "../src/services/guestDb";
import {
  AnimatedLoader,
  EmptyState,
  StaggeredList,
  AvatarIcon,
  BouncePress,
  Button,
  ScreenHeader,
} from "../src/components/common";
import { FONTS } from "../src/constants/theme";
import { getSubjectTheme } from "../src/config/subjectThemes";
import { KidProfileView, SubjectStatRow, MatchHistoryRow } from "../src/components/children/KidProfileView";
import type { ChildMatchSummary } from "@shared/types/analytics.types";

import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

function MedalIcon({ rank }: { rank: number }) {
  const colors: Record<number, [string, string]> = {
    1: ["#FFD93D", "#D97706"],
    2: ["#C0C0C0", "#9CA3AF"],
    3: ["#CD7F32", "#92400E"],
  };
  const [top, bottom] = colors[rank] || ["#9B59B6", "#7B6B8A"];

  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id={`medal${rank}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2l2.5 5.5H20l-4.5 3.5 1.5 6L12 14l-5 3 1.5-6L4 7.5h5.5z"
        fill={`url(#medal${rank})`}
      />
    </Svg>
  );
}



function ChildDetailSheet({
  entry,
  onClose,
  onLogout,
}: {
  entry: LeaderboardEntry & { avatarUrl?: string };
  onClose: () => void;
  onLogout?: () => void;
}) {
  const { t } = useTranslation(["leaderboard", "common"]);
  const { children, userRole } = useGameStore();
  const isGuest = userRole === "guest";

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["childStats", entry.playerId],
    queryFn: () => apiService.getChildStats(entry.playerId),
    enabled: !isGuest,
  });

  const { data: matchHistory = [], isLoading: historyLoading } = useQuery<
    ChildMatchSummary[]
  >({
    queryKey: ["childMatchHistory", entry.playerId],
    queryFn: () => apiService.getChildMatchHistory(entry.playerId),
    enabled: !isGuest,
  });

  // Check if this child belongs to the current parent
  const ownChild = children.find((c) => c.id === entry.playerId);

  const recentMatches = matchHistory.slice(0, 5);

  return (
    <BottomSheetScrollView
      contentContainerStyle={{
        width: "100%",
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 10,
      }}
    >
      {/* Avatar + name */}
      <View
        className="w-full"
        style={{ alignItems: "center", marginBottom: 20 }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: "#9B59B6",
            borderRadius: 40,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            borderWidth: 3,
            borderColor: "#3D2E4A",
          }}
        >
          <AvatarIcon avatarId={entry.avatarUrl} size={50} />
        </View>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            fontFamily: "LuckiestGuy_400Regular",
          }}
        >
          {entry.displayName}
        </Text>
        <Text
          style={{
            color: "#B8A9C9",
            fontSize: 14,
            fontFamily: FONTS.body,
            marginTop: 4,
          }}
        >
          {t("leaderboard:gamesPlayed", { count: entry.gamesPlayed })}
        </Text>
      </View>

      {/* Global stats */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "#0D0B14",
            padding: 16,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#10B981",
              fontSize: 28,
              fontFamily: "LuckiestGuy_400Regular",
            }}
          >
            {entry.correctAnswers}
          </Text>
          <Text
            style={{
              color: "#7B6B8A",
              fontSize: 12,
              fontFamily: FONTS.bodySemiBold,
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            {t("leaderboard:correct")}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: "#0D0B14",
            padding: 16,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#FFD93D",
              fontSize: 28,
              fontFamily: "LuckiestGuy_400Regular",
            }}
          >
            {entry.accuracy}%
          </Text>
          <Text
            style={{
              color: "#7B6B8A",
              fontSize: 12,
              fontFamily: FONTS.bodySemiBold,
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            {t("leaderboard:accuracy")}
          </Text>
        </View>
      </View>

      {/* Recent match history */}
      <Text
        style={{
          color: "#7B6B8A",
          fontSize: 11,
          fontFamily: FONTS.bodySemiBold,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Recent Matches
      </Text>

      {historyLoading && (
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <AnimatedLoader size="sm" />
        </View>
      )}

      {!historyLoading && recentMatches.length === 0 && (
        <Text
          style={{
            color: "#7B6B8A",
            fontSize: 13,
            fontFamily: FONTS.body,
            textAlign: "center",
            paddingVertical: 12,
            marginBottom: 16,
          }}
        >
          No matches played yet
        </Text>
      )}

      {!historyLoading && recentMatches.length > 0 && (
        <View style={{ gap: 8, marginBottom: 24 }}>
          {recentMatches.map((m) => (
            <MatchHistoryRow key={m.matchId} summary={m} />
          ))}
        </View>
      )}

      {/* Per-subject breakdown */}
      <Text
        style={{
          color: "#7B6B8A",
          fontSize: 11,
          fontFamily: FONTS.bodySemiBold,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        By Subject
      </Text>

      {statsLoading && (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <AnimatedLoader size="sm" />
        </View>
      )}

      {!statsLoading && stats && stats.subjectStats.length === 0 && (
        <Text
          style={{
            color: "#7B6B8A",
            fontSize: 13,
            fontFamily: FONTS.body,
            textAlign: "center",
            paddingVertical: 12,
          }}
        >
          No subject data yet
        </Text>
      )}

      {!statsLoading && stats && (
        <View style={{ gap: 10, marginBottom: 24 }}>
          {stats.subjectStats.map((s) => (
            <SubjectStatRow
              key={s.subject}
              subject={s.subject}
              correctAnswers={s.correctAnswers}
              totalQuestions={s.totalQuestions}
              accuracy={s.accuracy}
            />
          ))}
        </View>
      )}

      {/* View full profile — only for parent's own children */}
      {ownChild && (
        <Button
          label="View Full Profile"
          variant="primary"
          className="w-full max-w-none mb-3"
          onPress={() => {
            onClose();
            router.push({
              pathname: "/child/stats" as any,
              params: { childId: entry.playerId },
            });
          }}
        />
      )}

      {onLogout && (
        <Button
          label="Log out"
          variant="danger"
          className="w-full min-w-full mb-3"
          onPress={onLogout}
        />
      )}

      <Button
        label={t("common:buttons.close")}
        variant="secondary"
        className="w-full max-w-none"
        onPress={onClose}
      />
    </BottomSheetScrollView>
  );
}



export default function LeaderboardScreen() {
  usePortrait();
  const { t } = useTranslation(["leaderboard", "common", "auth"]);
  const { children, userRole, parentUser, guestProfile, childProfile, childSession, logout } =
    useGameStore();
  const queryClient = useQueryClient();
  const isGuest = userRole === "guest";
  const isChild = userRole === "child";
  const isParent = !isGuest && !isChild;
  const uid = isChild
    ? childSession?.parentId ?? null
    : parentUser?._id ?? parentUser?.id ?? guestProfile?.guestId ?? null;
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const logoutSheetRef = useRef<BottomSheetModal>(null);
  const [selectedEntry, setSelectedEntry] = useState<
    (LeaderboardEntry & { avatarUrl?: string }) | null
  >(null);

  const {
    data: rawEntries = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["leaderboard", uid],
    queryFn: () => apiService.getLeaderboard(),
    enabled: !isGuest,
  });

  // Guest stats from local SQLite
  const { data: localGuestStats } = useQuery({
    queryKey: ["guestProfileStats"],
    queryFn: guestDb.getGuestProfileStats,
    enabled: isGuest,
  });

  const entries = rawEntries.map((entry) => {
    // For the logged-in child's own entry, prefer the freshly-fetched childProfile
    const isOwnEntry = isChild && entry.playerId === childSession?.childId;
    const child = children.find((c) => c.id === entry.playerId);
    return {
      ...entry,
      displayName:
        (isOwnEntry ? childProfile?.displayName : null) ||
        child?.displayName ||
        entry.displayName ||
        entry.playerId,
      // Prefer childProfile for own entry, then children array, then backend value
      avatarUrl:
        (isOwnEntry ? childProfile?.avatarUrl : null) ||
        child?.avatarUrl ||
        entry.avatarUrl,
    };
  });

  const errorMessage = error instanceof Error ? error.message : "";

  const guestEntry = useMemo<
    (LeaderboardEntry & { avatarUrl?: string }) | null
  >(() => {
    if (!isGuest || !guestProfile) return null;
    return {
      playerId: guestProfile.guestId,
      displayName: guestProfile.displayName,
      correctAnswers: localGuestStats?.correctAnswers ?? 0,
      totalAnswers: localGuestStats?.totalAnswers ?? 0,
      accuracy: localGuestStats?.accuracy ?? 0,
      gamesPlayed: localGuestStats?.gamesPlayed ?? 0,
      avatarUrl: guestProfile.avatarId,
    };
  }, [isGuest, guestProfile, localGuestStats]);

  const myChildEntry = useMemo(() => {
    if (!isChild || !childSession?.childId) return null;
    return entries.find((e) => e.playerId === childSession.childId) ?? null;
  }, [isChild, childSession?.childId, entries]);

  const handleLogout = useCallback(() => {
    logoutSheetRef.current?.present();
  }, []);

  const executeLogout = useCallback(async () => {
    logoutSheetRef.current?.dismiss();
    bottomSheetRef.current?.dismiss();
    try {
      await firebaseAuthService.signOut();
    } catch {
      // non-critical for guest/child
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

  const handleEntryPress = (
    entry: LeaderboardEntry & { avatarUrl?: string },
  ) => {
    setSelectedEntry(entry);
    bottomSheetRef.current?.present();
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-game-bg">
      <ScreenHeader title={t("leaderboard:title")} />

      <ScrollView
        className="flex-1 px-8"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── CHILD / GUEST: full inline profile ── */}
        {(isChild || isGuest) && (
          <>
            {isChild && isLoading && (
              <View className="items-center py-20">
                <AnimatedLoader
                  size="lg"
                  message={t("leaderboard:loadingMessage")}
                />
              </View>
            )}

            {isGuest && guestEntry && (
              <KidProfileView entry={guestEntry} onLogout={handleLogout} />
            )}

            {isChild && !isLoading && myChildEntry && (
              <KidProfileView entry={myChildEntry} onLogout={handleLogout} />
            )}

            {isChild && !isLoading && !myChildEntry && (
              <EmptyState
                illustration="noRankings"
                title={t("leaderboard:emptyTitle")}
                subtitle={t("leaderboard:emptySubtitleChild")}
              />
            )}
          </>
        )}

        {/* ── PARENT: full leaderboard list ── */}
        {isParent && (
          <>
            {isLoading && (
              <View className="items-center py-20">
                <AnimatedLoader
                  size="lg"
                  message={t("leaderboard:loadingMessage")}
                />
              </View>
            )}

            {isError && !isLoading && (
              <EmptyState
                illustration="error"
                title={t("common:errors.somethingWentWrong")}
                subtitle={errorMessage}
                action={{
                  label: t("common:buttons.tryAgain"),
                  onPress: refetch,
                }}
              />
            )}

            {!isLoading && !isError && entries.length === 0 && (
              <EmptyState
                illustration="noRankings"
                title={t("leaderboard:emptyTitle")}
                subtitle={t("leaderboard:emptySubtitle")}
              />
            )}

            {!isLoading && !isError && entries.length > 0 && (
              <StaggeredList staggerMs={60}>
                {entries.map((entry, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <BouncePress
                      key={entry.playerId}
                      onPress={() => handleEntryPress(entry)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 20,
                        borderRadius: 16,
                        marginBottom: 12,
                        backgroundColor: "#1A1520",
                        borderWidth: 1,
                        borderColor: isTop3
                          ? "rgba(255, 217, 61, 0.3)"
                          : "#3D2E4A",
                      }}
                    >
                      <View style={{ width: 48, alignItems: "center" }}>
                        {isTop3 ? (
                          <MedalIcon rank={rank} />
                        ) : (
                          <Text
                            style={{
                              color: "#B8A9C9",
                              fontSize: 20,
                              fontFamily: FONTS.bodyBold,
                            }}
                          >
                            #{rank}
                          </Text>
                        )}
                      </View>

                      <View
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: "#9B59B6",
                          borderRadius: 24,
                          alignItems: "center",
                          justifyContent: "center",
                          marginHorizontal: 12,
                        }}
                      >
                        <AvatarIcon avatarId={entry.avatarUrl} size={30} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 18,
                            fontFamily: FONTS.bodyBold,
                          }}
                          numberOfLines={1}
                        >
                          {entry.displayName}
                        </Text>
                        <Text
                          style={{
                            color: "#B8A9C9",
                            fontSize: 13,
                            fontFamily: FONTS.body,
                          }}
                        >
                          {t("leaderboard:gamesPlayed", {
                            count: entry.gamesPlayed,
                          })}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", gap: 16 }}>
                        <View style={{ alignItems: "center" }}>
                          <Text
                            style={{
                              color: "#10B981",
                              fontSize: 18,
                              fontFamily: FONTS.bodyBold,
                            }}
                          >
                            {entry.correctAnswers}
                          </Text>
                          <Text
                            style={{
                              color: "#7B6B8A",
                              fontSize: 11,
                              fontFamily: FONTS.body,
                            }}
                          >
                            {t("leaderboard:correct")}
                          </Text>
                        </View>
                        <View style={{ alignItems: "center" }}>
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 18,
                              fontFamily: FONTS.bodyBold,
                            }}
                          >
                            {entry.accuracy}%
                          </Text>
                          <Text
                            style={{
                              color: "#7B6B8A",
                              fontSize: 11,
                              fontFamily: FONTS.body,
                            }}
                          >
                            {t("leaderboard:accuracy")}
                          </Text>
                        </View>
                      </View>
                    </BouncePress>
                  );
                })}
              </StaggeredList>
            )}
          </>
        )}
      </ScrollView>

      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={["75%"]}
        enablePanDownToClose
        enableDynamicSizing={false}
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
        {selectedEntry && (
          <ChildDetailSheet
            entry={selectedEntry}
            onClose={() => bottomSheetRef.current?.dismiss()}
          />
        )}
      </BottomSheetModal>

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

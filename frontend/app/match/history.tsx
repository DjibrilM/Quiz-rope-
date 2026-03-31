import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePortrait } from "../../src/hooks/useOrientation";
import { apiService } from "../../src/services/api";
import * as guestDb from "../../src/services/guestDb";
import { useGameStore } from "../../src/stores/gameStore";
import {
  AnimatedLoader,
  EmptyState,
  StaggeredList,
  ScreenHeader,
} from "../../src/components/common";
import { MatchHistoryCard, SubjectIcon } from "../../src/components/match";
import { FONTS } from "../../src/constants/theme";
import type { ChildMatchSummary } from "@shared/types/analytics.types";

function ChildMatchCard({
  summary,
  onPress,
}: {
  summary: ChildMatchSummary;
  onPress: () => void;
}) {
  const subjectLabel =
    summary.subject.charAt(0) + summary.subject.slice(1).toLowerCase();
  const score = summary.correctAnswers * 10;
  const maxScore = summary.totalQuestions * 10;
  const dateStr = new Date(summary.date).toLocaleDateString();
  const isSolo = summary.gameMode === "solo";
  const outcomeColor = summary.didWin ? "#10B981" : "#EF4444";
  const outcomeLabel = summary.didWin ? "Won" : "Lost";

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#1A1520",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: !isSolo && summary.didWin ? "#10B98130" : "#3D2E4A",
        marginBottom: 12,
        gap: 12,
      }}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <SubjectIcon subject={summary.subject} size={30} />
          <View>
            <Text
              style={{
                fontSize: 16,
                fontFamily: FONTS.bodyBold,
                color: "#FFFFFF",
              }}
            >
              {subjectLabel}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: FONTS.body,
                color: "#7B6B8A",
              }}
            >
              {summary.difficulty} · {dateStr}
            </Text>
          </View>
        </View>
        {!isSolo && (
          <View
            style={{
              backgroundColor: `${outcomeColor}15`,
              borderWidth: 1,
              borderColor: `${outcomeColor}50`,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: FONTS.bodyBold,
                color: outcomeColor,
              }}
            >
              {outcomeLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: FONTS.bodySemiBold,
              color: "#7B6B8A",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            Score
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontFamily: FONTS.bodyBold,
              color: "#A78BFA",
            }}
          >
            {score}{" "}
            <Text style={{ fontSize: 13, color: "#5A4B6B" }}>/ {maxScore}</Text>
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: FONTS.bodySemiBold,
              color: "#7B6B8A",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            Correct
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontFamily: FONTS.bodyBold,
              color: "#FFFFFF",
            }}
          >
            {summary.correctAnswers}
            <Text style={{ fontSize: 13, color: "#5A4B6B" }}>
              /{summary.totalQuestions}
            </Text>
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: FONTS.bodySemiBold,
              color: "#7B6B8A",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            Accuracy
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontFamily: FONTS.bodyBold,
              color:
                summary.accuracy >= 70
                  ? "#10B981"
                  : summary.accuracy >= 40
                    ? "#F59E0B"
                    : "#EF4444",
            }}
          >
            {summary.accuracy}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function MatchHistoryScreen() {
  usePortrait();
  const { t } = useTranslation(["match", "common"]);
  const { children, userRole, parentUser, guestProfile, childSession } = useGameStore();
  const isGuest = userRole === "guest";
  const isChild = userRole === "child";
  const uid = parentUser?._id ?? parentUser?.id ?? guestProfile?.guestId ?? null;
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // For child users, always show their own history directly
  const activeChildId = isChild ? (childSession?.childId ?? null) : selectedChildId;

  // All-matches query (no child filter) — parent/guest only
  const allMatchesQuery = useQuery({
    queryKey: ["matches", uid],
    queryFn: async () => {
      const local = await guestDb.getMatches();
      if (isGuest) return local;

      try {
        const remote = await apiService.getMatches();
        // Sync to local in background (for offline access later)
        guestDb.syncFromBackend({ matches: remote, homeworkSessions: [] }).catch(console.error);
        return remote;
      } catch (err) {
        // If offline or error, fallback to local
        if (local.length > 0) return local;
        throw err;
      }
    },
    enabled: activeChildId === null,
  });

  // Per-child query
  const childMatchesQuery = useQuery({
    queryKey: ["childMatches", uid, activeChildId],
    queryFn: () => apiService.getChildMatchHistory(activeChildId!),
    enabled: !isGuest && activeChildId !== null,
  });

  const isLoading =
    activeChildId === null
      ? allMatchesQuery.isLoading
      : childMatchesQuery.isLoading;
  const isError =
    activeChildId === null
      ? allMatchesQuery.isError
      : childMatchesQuery.isError;
  const isFetching =
    activeChildId === null
      ? allMatchesQuery.isFetching
      : childMatchesQuery.isFetching;
  const error =
    activeChildId === null ? allMatchesQuery.error : childMatchesQuery.error;
  const refetch =
    activeChildId === null ? allMatchesQuery.refetch : childMatchesQuery.refetch;

  const allMatches = allMatchesQuery.data ?? [];
  const childMatches = childMatchesQuery.data ?? [];

  const errorMessage = error instanceof Error ? error.message : "";

  const isEmpty =
    activeChildId === null ? allMatches.length === 0 : childMatches.length === 0;

  return (
    <View className="flex-1 bg-game-bg">
      <ScreenHeader title={t("match:history.title")} />

      {/* Child filter tabs — parent only */}
      {!isChild && children.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          {/* "All" tab */}
          <Pressable
            onPress={() => setSelectedChildId(null)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: selectedChildId === null ? "#A78BFA" : "#3D2E4A",
              backgroundColor:
                selectedChildId === null ? "#A78BFA20" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: FONTS.bodySemiBold,
                color: selectedChildId === null ? "#A78BFA" : "#7B6B8A",
              }}
            >
              All Matches
            </Text>
          </Pressable>

          {/* One tab per child */}
          {children
            .filter((c) => c?.displayName)
            .map((child) => (
              <Pressable
                key={child.id}
                onPress={() => setSelectedChildId(child.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor:
                    selectedChildId === child.id ? "#A78BFA" : "#3D2E4A",
                  backgroundColor:
                    selectedChildId === child.id ? "#A78BFA20" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: FONTS.bodySemiBold,
                    color:
                      selectedChildId === child.id ? "#A78BFA" : "#7B6B8A",
                  }}
                >
                  {child.displayName}
                </Text>
              </Pressable>
            ))}
        </ScrollView>
      )}

      <ScrollView
        className="flex-1 px-8 pt-2"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#A78BFA"
            colors={["#A78BFA"]}
          />
        }
      >
        {isLoading && (
          <View className="items-center py-20">
            <AnimatedLoader
              size="lg"
              message={t("match:history.loadingMessage")}
            />
          </View>
        )}

        {isError && !isLoading && (
          <EmptyState
            illustration="error"
            title={t("common:errors.somethingWentWrong")}
            subtitle={errorMessage}
            action={{ label: t("common:buttons.tryAgain"), onPress: refetch }}
          />
        )}

        {!isLoading && !isError && isEmpty && (
          <EmptyState
            illustration="noMatches"
            title={t("match:history.emptyTitle")}
            subtitle={t("match:history.emptySubtitle")}
          />
        )}

        {/* All-matches view */}
        {!isLoading && !isError && activeChildId === null && allMatches.length > 0 && (
          <StaggeredList staggerMs={60}>
            {allMatches.map((match: any) => (
              <View key={match._id}>
                <MatchHistoryCard
                  match={match}
                  onPress={() => {
                    if (!isGuest) {
                      router.push({
                        pathname: "/match/detail" as any,
                        params: { matchId: match._id },
                      });
                    }
                  }}
                />
                {match.status === "COMPLETED" && (
                  <Pressable
                    onPress={() =>
                      isGuest
                        ? router.push({
                            pathname: "/match/correction" as any,
                            params: { matchId: match._id },
                          })
                        : router.push({
                            pathname: "/match/review" as any,
                            params: {
                              matchId: match._id,
                              childId:
                                (match as any).gameMode === "splitscreen"
                                  ? "player-red"
                                  : "mock-player",
                              subject: match.subject,
                            },
                          })
                    }
                    style={{
                      marginTop: -6,
                      marginBottom: 12,
                      marginHorizontal: 8,
                      paddingVertical: 10,
                      backgroundColor: "#231C2B",
                      borderWidth: 1,
                      borderColor: "#3D2E4A",
                      borderTopWidth: 0,
                      borderBottomLeftRadius: 12,
                      borderBottomRightRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#C4B0D8",
                        fontSize: 13,
                        fontFamily: FONTS.bodySemiBold,
                      }}
                    >
                      {t("match:history.review")}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </StaggeredList>
        )}

        {/* Per-child match view */}
        {!isLoading && !isError && activeChildId !== null && childMatches.length > 0 && (
          <StaggeredList staggerMs={60}>
            {childMatches.map((summary) => (
              <ChildMatchCard
                key={summary.matchId}
                summary={summary}
                onPress={() =>
                  router.push({
                    pathname: "/match/detail" as any,
                    params: { matchId: summary.matchId },
                  })
                }
              />
            ))}
          </StaggeredList>
        )}
      </ScrollView>
    </View>
  );
}

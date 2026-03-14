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
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { useGameStore } from "../src/stores/gameStore";
import {
  AnimatedLoader,
  EmptyState,
  StaggeredList,
  ScreenHeader,
} from "../src/components/common";
import { MatchHistoryCard, SubjectIcon } from "../src/components/match";
import { FONTS } from "../src/constants/theme";
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
        borderColor: summary.didWin ? "#10B98130" : "#3D2E4A",
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
  const { children } = useGameStore();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // All-matches query (no child filter)
  const allMatchesQuery = useQuery({
    queryKey: ["matches"],
    queryFn: () => apiService.getMatches(),
    enabled: selectedChildId === null,
  });

  // Per-child query
  const childMatchesQuery = useQuery({
    queryKey: ["childMatches", selectedChildId],
    queryFn: () => apiService.getChildMatchHistory(selectedChildId!),
    enabled: selectedChildId !== null,
  });

  const isLoading =
    selectedChildId === null
      ? allMatchesQuery.isLoading
      : childMatchesQuery.isLoading;
  const isError =
    selectedChildId === null
      ? allMatchesQuery.isError
      : childMatchesQuery.isError;
  const isFetching =
    selectedChildId === null
      ? allMatchesQuery.isFetching
      : childMatchesQuery.isFetching;
  const error =
    selectedChildId === null ? allMatchesQuery.error : childMatchesQuery.error;
  const refetch =
    selectedChildId === null ? allMatchesQuery.refetch : childMatchesQuery.refetch;

  const allMatches = allMatchesQuery.data ?? [];
  const childMatches = childMatchesQuery.data ?? [];

  const errorMessage = error instanceof Error ? error.message : "";

  const isEmpty =
    selectedChildId === null ? allMatches.length === 0 : childMatches.length === 0;

  return (
    <View className="flex-1 bg-game-bg">
      <ScreenHeader title={t("match:history.title")} />

      {/* Child filter tabs */}
      {children.length > 0 && (
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
        {!isLoading && !isError && selectedChildId === null && allMatches.length > 0 && (
          <StaggeredList staggerMs={60}>
            {allMatches.map((match) => (
              <View key={match._id}>
                <MatchHistoryCard
                  match={match}
                  onPress={() => {
                    router.push({
                      pathname: "/match-detail" as any,
                      params: { matchId: match._id },
                    });
                  }}
                />
                {match.status === "COMPLETED" && (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/match-review" as any,
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
        {!isLoading && !isError && selectedChildId !== null && childMatches.length > 0 && (
          <StaggeredList staggerMs={60}>
            {childMatches.map((summary) => (
              <ChildMatchCard
                key={summary.matchId}
                summary={summary}
                onPress={() =>
                  router.push({
                    pathname: "/match-detail" as any,
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

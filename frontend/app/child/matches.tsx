import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../../src/hooks/useOrientation";
import { apiService } from "../../src/services/api";
import { AnimatedLoader, EmptyState, StaggeredList, BouncePress, ScreenHeader } from "../../src/components/common";
import { getSubjectTheme } from "../../src/config/subjectThemes";
import { FONTS, FORTNITE_COLORS } from "../../src/constants/theme";
import type { ChildMatchSummary } from "@shared/types/analytics.types";

function MatchCard({
  match,
  onPress,
  t,
}: {
  match: ChildMatchSummary;
  onPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const theme = getSubjectTheme(match.subject);
  const isSolo = match.gameMode === "solo";
  const isSplitscreen = match.gameMode === "splitscreen";
  const date = new Date(match.date);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const modeLabel = isSolo ? "SOLO" : isSplitscreen ? "SPLIT" : "ONLINE";
  const modeColor = isSolo ? "#A78BFA" : isSplitscreen ? "#F59E0B" : "#3B82F6";
  const accuracyColor =
    match.accuracy >= 70 ? "#10B981" : match.accuracy >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <BouncePress onPress={onPress}>
      <View
        style={{
          backgroundColor: FORTNITE_COLORS.bgCard,
          borderRadius: 16,
          padding: 16,
          gap: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#2D2440",
        }}
      >
        {/* Top row: badges + date */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1, flexWrap: "wrap" }}>
            {/* Subject */}
            <View
              style={{
                backgroundColor: theme.accentColor + "20",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: FONTS.bodySemiBold, color: theme.accentColor }}>
                {theme.label}
              </Text>
            </View>
            {/* Mode */}
            <View
              style={{
                backgroundColor: modeColor + "20",
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: FONTS.bodySemiBold, color: modeColor }}>
                {modeLabel}
              </Text>
            </View>
            {/* Won/Lost — only for non-solo */}
            {!isSolo && (
              <View
                style={{
                  backgroundColor: match.didWin ? "#10B98120" : "#EF444420",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: FONTS.bodySemiBold,
                    color: match.didWin ? "#10B981" : "#EF4444",
                  }}
                >
                  {match.didWin ? t("analytics:history.won") : t("analytics:history.lost")}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 11, fontFamily: FONTS.body, color: FORTNITE_COLORS.textMuted, marginLeft: 8 }}>
            {dateStr}
          </Text>
        </View>

        {/* Score + accuracy bar */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 15, fontFamily: FONTS.bodyBold, color: FORTNITE_COLORS.textPrimary }}>
              {match.correctAnswers}
              <Text style={{ fontSize: 13, fontFamily: FONTS.body, color: FORTNITE_COLORS.textSecondary }}>
                /{match.totalQuestions} correct
              </Text>
            </Text>
            <Text style={{ fontSize: 15, fontFamily: FONTS.accent, color: accuracyColor }}>
              {match.accuracy}%
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: "#3D2E4A", borderRadius: 3, overflow: "hidden" }}>
            <View
              style={{
                height: "100%",
                width: `${match.accuracy}%` as any,
                backgroundColor: accuracyColor,
                borderRadius: 3,
              }}
            />
          </View>
        </View>

        {/* Bottom: difficulty + tap hint */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 11, fontFamily: FONTS.body, color: FORTNITE_COLORS.textMuted, textTransform: "capitalize" }}>
            {match.difficulty.charAt(0) + match.difficulty.slice(1).toLowerCase()} difficulty
          </Text>
          <Text style={{ fontSize: 11, fontFamily: FONTS.body, color: "#4A3D5A" }}>
            Tap to review →
          </Text>
        </View>
      </View>
    </BouncePress>
  );
}

export default function ChildMatchesScreen() {
  usePortrait();
  const { t } = useTranslation(["analytics", "common"]);
  const { childId, childName } = useLocalSearchParams();
  const { data: matches = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["childMatches", childId],
    queryFn: () => apiService.getChildMatchHistory(childId as string),
    enabled: !!childId,
    staleTime: 0,
  });

  const errorMessage = error instanceof Error ? error.message : "";

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: FORTNITE_COLORS.bgDark }}>
      <ScreenHeader title={t("analytics:history.title")} />

      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {isLoading && (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <AnimatedLoader size="lg" />
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

        {!isLoading && !isError && matches.length === 0 && (
          <EmptyState
            illustration="noMatches"
            title={t("analytics:history.noMatches")}
            subtitle={t("analytics:history.noMatchesSubtitle")}
          />
        )}

        {!isLoading && !isError && matches.length > 0 && (
          <StaggeredList staggerMs={60}>
            {matches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                t={t}
                onPress={() =>
                  router.push({
                    pathname: "/match/review" as any,
                    params: {
                      matchId: match.matchId,
                      childId: childId as string,
                      subject: match.subject,
                    },
                  })
                }
              />
            ))}
          </StaggeredList>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { ScreenHeader, AnimatedLoader, EmptyState, StaggeredList, BouncePress } from "../src/components/common";
import { getSubjectTheme } from "../src/config/subjectThemes";
import { FONTS, FORTNITE_COLORS } from "../src/constants/theme";
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
  const date = new Date(match.date);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <BouncePress onPress={onPress}>
      <View
        style={{
          backgroundColor: FORTNITE_COLORS.bgCard,
          borderRadius: 16,
          padding: 16,
          gap: 10,
        }}
      >
        {/* Top row: subject + date + win/loss */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: theme.accentColor + "20",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: FONTS.bodySemiBold,
                  color: theme.accentColor,
                }}
              >
                {theme.label}
              </Text>
            </View>
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
          </View>
          <Text
            style={{
              fontSize: 12,
              fontFamily: FONTS.body,
              color: FORTNITE_COLORS.textMuted,
            }}
          >
            {dateStr}
          </Text>
        </View>

        {/* Score row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: FONTS.bodyBold,
              color: FORTNITE_COLORS.textPrimary,
            }}
          >
            {match.correctAnswers}/{match.totalQuestions}{" "}
            <Text style={{ fontFamily: FONTS.body, color: FORTNITE_COLORS.textSecondary }}>
              correct
            </Text>
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: FONTS.bodySemiBold,
              color:
                match.accuracy >= 70
                  ? "#10B981"
                  : match.accuracy >= 40
                    ? "#F59E0B"
                    : "#EF4444",
            }}
          >
            {t("analytics:history.accuracy", { accuracy: match.accuracy })}
          </Text>
        </View>

        {/* Difficulty */}
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONTS.body,
            color: FORTNITE_COLORS.textMuted,
          }}
        >
          {match.difficulty}
        </Text>
      </View>
    </BouncePress>
  );
}

export default function ChildMatchesScreen() {
  usePortrait();
  const { t } = useTranslation(["analytics", "common"]);
  const { childId, childName } = useLocalSearchParams();
  const [matches, setMatches] = useState<ChildMatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!childId) return;
    loadMatches();
  }, [childId]);

  const loadMatches = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiService.getChildMatchHistory(childId as string);
      setMatches(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load matches";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: FORTNITE_COLORS.bgDark }}>
      <ScreenHeader title={t("analytics:history.title")} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {loading && (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <AnimatedLoader size="lg" />
          </View>
        )}

        {error && !loading && (
          <EmptyState
            illustration="error"
            title={t("common:errors.somethingWentWrong")}
            subtitle={error}
            action={{ label: t("common:buttons.tryAgain"), onPress: loadMatches }}
          />
        )}

        {!loading && !error && matches.length === 0 && (
          <EmptyState
            illustration="noMatches"
            title={t("analytics:history.noMatches")}
            subtitle={t("analytics:history.noMatchesSubtitle")}
          />
        )}

        {!loading && !error && matches.length > 0 && (
          <StaggeredList staggerMs={60}>
            {matches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                t={t}
                onPress={() =>
                  router.push({
                    pathname: "/match-review" as any,
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

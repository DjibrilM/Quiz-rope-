import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { ScreenHeader, AnimatedLoader, EmptyState, AvatarIcon, BouncePress } from "../src/components/common";
import { getSubjectTheme } from "../src/config/subjectThemes";
import { FONTS, FORTNITE_COLORS } from "../src/constants/theme";
import type { ChildPerformance, SubjectStats } from "@shared/types/analytics.types";

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: FORTNITE_COLORS.bgCard,
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontFamily: FONTS.accent,
          color: color || FORTNITE_COLORS.textPrimary,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontFamily: FONTS.bodySemiBold,
          color: FORTNITE_COLORS.textMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function SubjectRow({
  stat,
  isBest,
  isWeakest,
  t,
}: {
  stat: SubjectStats;
  isBest: boolean;
  isWeakest: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const theme = getSubjectTheme(stat.subject);
  const barWidth = `${Math.max(stat.accuracy, 4)}%`;

  return (
    <View
      style={{
        backgroundColor: FORTNITE_COLORS.bgCard,
        borderRadius: 16,
        padding: 16,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: theme.accentColor,
            }}
          />
          <Text
            style={{
              fontSize: 15,
              fontFamily: FONTS.bodyBold,
              color: FORTNITE_COLORS.textPrimary,
            }}
          >
            {theme.label}
          </Text>
          {isBest && (
            <View
              style={{
                backgroundColor: "#10B98120",
                borderColor: "#10B981",
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: FONTS.bodySemiBold, color: "#10B981" }}>
                {t("analytics:dashboard.bestSubject")}
              </Text>
            </View>
          )}
          {isWeakest && (
            <View
              style={{
                backgroundColor: "#F59E0B20",
                borderColor: "#F59E0B",
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: FONTS.bodySemiBold, color: "#F59E0B" }}>
                {t("analytics:dashboard.weakestSubject")}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            fontSize: 16,
            fontFamily: FONTS.accent,
            color: theme.accentColor,
          }}
        >
          {stat.accuracy}%
        </Text>
      </View>

      {/* Accuracy bar */}
      <View
        style={{
          height: 8,
          backgroundColor: "#3D2E4A",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: barWidth,
            backgroundColor: theme.accentColor,
            borderRadius: 4,
          }}
        />
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, fontFamily: FONTS.body, color: FORTNITE_COLORS.textSecondary }}>
          {t("analytics:dashboard.correct", {
            correct: stat.correctAnswers,
            total: stat.totalQuestions,
          })}
        </Text>
        <Text style={{ fontSize: 12, fontFamily: FONTS.body, color: FORTNITE_COLORS.textMuted }}>
          {t("analytics:dashboard.avgTime", {
            time: (stat.avgResponseTime / 1000).toFixed(1),
          })}
        </Text>
        <Text style={{ fontSize: 12, fontFamily: FONTS.body, color: FORTNITE_COLORS.textMuted }}>
          {stat.matchesPlayed} {stat.matchesPlayed === 1 ? "match" : "matches"}
        </Text>
      </View>
    </View>
  );
}

export default function ChildStatsScreen() {
  usePortrait();
  const { t } = useTranslation(["analytics", "common"]);
  const { childId, childName, avatarUrl } = useLocalSearchParams();
  const [data, setData] = useState<ChildPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!childId) return;
    loadStats();
  }, [childId]);

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiService.getChildStats(childId as string);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load stats";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: FORTNITE_COLORS.bgDark }}>
      <ScreenHeader title={t("analytics:dashboard.title", { name: childName })} />

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
            action={{ label: t("common:buttons.tryAgain"), onPress: loadStats }}
          />
        )}

        {!loading && !error && data && data.totalMatches === 0 && (
          <EmptyState
            illustration="noMatches"
            title={t("analytics:dashboard.noData")}
            subtitle={t("analytics:dashboard.noDataSubtitle")}
          />
        )}

        {!loading && !error && data && data.totalMatches > 0 && (
          <View style={{ gap: 16, paddingTop: 8 }}>
            {/* Child header */}
            <View style={{ alignItems: "center", gap: 8, paddingVertical: 8 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  borderWidth: 3,
                  borderColor: FORTNITE_COLORS.glowPurple,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: FORTNITE_COLORS.glowPurple + "15",
                }}
              >
                <AvatarIcon avatarId={avatarUrl as string} size={48} />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: FONTS.heading,
                  color: FORTNITE_COLORS.textPrimary,
                }}
              >
                {childName}
              </Text>
            </View>

            {/* Overall stats */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatCard
                label={t("analytics:dashboard.totalMatches")}
                value={String(data.totalMatches)}
              />
              <StatCard
                label={t("analytics:dashboard.totalQuestions")}
                value={String(data.totalQuestions)}
              />
              <StatCard
                label={t("analytics:dashboard.overallAccuracy")}
                value={`${data.overallAccuracy}%`}
                color={
                  data.overallAccuracy >= 70
                    ? "#10B981"
                    : data.overallAccuracy >= 40
                      ? "#F59E0B"
                      : "#EF4444"
                }
              />
            </View>

            {/* Subject breakdown */}
            <Text
              style={{
                fontSize: 16,
                fontFamily: FONTS.accent,
                color: FORTNITE_COLORS.textPrimary,
                marginTop: 8,
              }}
            >
              {t("analytics:dashboard.subjectBreakdown")}
            </Text>

            {data.subjectStats.map((stat) => (
              <SubjectRow
                key={stat.subject}
                stat={stat}
                isBest={stat.subject === data.bestSubject}
                isWeakest={stat.subject === data.weakestSubject && data.subjectStats.length > 1}
                t={t}
              />
            ))}

            {/* View Match History button */}
            <BouncePress
              onPress={() =>
                router.push({
                  pathname: "/child-matches" as any,
                  params: { childId: childId as string, childName: childName as string },
                })
              }
            >
              <View
                style={{
                  backgroundColor: FORTNITE_COLORS.glowPurple,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: FONTS.accent,
                    color: FORTNITE_COLORS.textPrimary,
                  }}
                >
                  {t("analytics:dashboard.viewHistory")}
                </Text>
              </View>
            </BouncePress>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

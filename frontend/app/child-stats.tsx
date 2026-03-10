import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { AnimatedLoader, EmptyState, AvatarIcon, BouncePress, ScreenHeader } from "../src/components/common";
import { getSubjectTheme } from "../src/config/subjectThemes";
import { FONTS, FORTNITE_COLORS } from "../src/constants/theme";
import type { ChildPerformance, SubjectStats } from "@shared/types/analytics.types";

function PerformanceBadge({ accuracy, t }: { accuracy: number; t: (k: string) => string }) {
  const isExcellent = accuracy >= 75;
  const isGood = accuracy >= 50;
  const color = isExcellent ? "#10B981" : isGood ? "#F59E0B" : "#EF4444";
  const label = isExcellent
    ? t("analytics:dashboard.performanceBadge.excellent")
    : isGood
      ? t("analytics:dashboard.performanceBadge.good")
      : t("analytics:dashboard.performanceBadge.needsWork");

  return (
    <View
      style={{
        alignSelf: "center",
        backgroundColor: `${color}15`,
        borderWidth: 1.5,
        borderColor: color,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 6,
      }}
    >
      <Text style={{ fontSize: 13, fontFamily: FONTS.bodySemiBold, color }}>
        {label}
      </Text>
    </View>
  );
}

function LearningReport({
  data,
  t,
}: {
  data: ChildPerformance;
  t: (k: string, opts?: Record<string, unknown>) => string;
}) {
  const weakSubjects = data.subjectStats.filter((s) => s.accuracy < 60);
  const strongSubjects = data.subjectStats.filter((s) => s.accuracy >= 70);

  const avgTime =
    data.subjectStats.length > 0
      ? data.subjectStats.reduce((sum, s) => sum + s.avgResponseTime, 0) /
        data.subjectStats.length
      : 0;
  const avgSecs = (avgTime / 1000).toFixed(1);
  const isQuick = avgTime > 0 && avgTime < 10000;

  return (
    <View
      style={{
        backgroundColor: FORTNITE_COLORS.bgCard,
        borderRadius: 16,
        padding: 16,
        gap: 14,
        borderWidth: 1,
        borderColor: "#2D2440",
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: FONTS.accent,
          color: FORTNITE_COLORS.textPrimary,
          letterSpacing: 0.5,
        }}
      >
        {t("analytics:dashboard.report.title")}
      </Text>

      {/* Strong subjects */}
      {strongSubjects.length > 0 && (
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: FONTS.bodySemiBold,
              color: "#10B981",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {t("analytics:dashboard.report.strongAt")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {strongSubjects.map((s) => {
              const theme = getSubjectTheme(s.subject);
              return (
                <View
                  key={s.subject}
                  style={{
                    backgroundColor: "#10B98115",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#10B98140",
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.accentColor,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: FONTS.bodySemiBold,
                      color: "#10B981",
                    }}
                  >
                    {theme.label} · {s.accuracy}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Subjects needing practice */}
      <View style={{ gap: 6 }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONTS.bodySemiBold,
            color: "#F59E0B",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {t("analytics:dashboard.report.practiceNeeded")}
        </Text>
        {weakSubjects.length > 0 ? (
          weakSubjects.map((s) => {
            const theme = getSubjectTheme(s.subject);
            return (
              <View
                key={s.subject}
                style={{
                  backgroundColor: "#F59E0B10",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#F59E0B30",
                  padding: 10,
                  gap: 2,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.accentColor,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: FONTS.bodyBold,
                      color: FORTNITE_COLORS.textPrimary,
                    }}
                  >
                    {theme.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: FONTS.bodyBold,
                      color: "#EF4444",
                    }}
                  >
                    {s.accuracy}%
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: FONTS.body,
                    color: FORTNITE_COLORS.textMuted,
                    paddingLeft: 14,
                  }}
                >
                  {t("analytics:dashboard.report.practiceHint", {
                    subject: theme.label,
                  })}
                </Text>
              </View>
            );
          })
        ) : (
          <Text
            style={{
              fontSize: 12,
              fontFamily: FONTS.body,
              color: FORTNITE_COLORS.textMuted,
            }}
          >
            {t("analytics:dashboard.report.noWeakSubject")}
          </Text>
        )}
      </View>

      {/* Response time insight */}
      {avgTime > 0 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#1A1520",
            borderRadius: 10,
            padding: 10,
          }}
        >
          <View style={{ gap: 2 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: FONTS.bodySemiBold,
                color: FORTNITE_COLORS.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {t("analytics:dashboard.report.avgResponseTime")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: FONTS.bodyBold,
                color: FORTNITE_COLORS.textPrimary,
              }}
            >
              {t("analytics:dashboard.report.avgResponseValue", {
                time: avgSecs,
              })}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 11,
              fontFamily: FONTS.body,
              color: isQuick ? "#10B981" : "#A78BFA",
              maxWidth: 140,
              textAlign: "right",
            }}
          >
            {isQuick
              ? t("analytics:dashboard.report.fastNote")
              : t("analytics:dashboard.report.slowNote")}
          </Text>
        </View>
      )}
    </View>
  );
}

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
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["childStats", childId],
    queryFn: () => apiService.getChildStats(childId as string),
    enabled: !!childId,
  });

  const errorMessage = error instanceof Error ? error.message : "";

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: FORTNITE_COLORS.bgDark }}>
      <ScreenHeader title={t("analytics:dashboard.title", { name: childName })} />

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
          />
        )}

        {!isLoading && !isError && data && data.totalMatches === 0 && (
          <EmptyState
            illustration="noMatches"
            title={t("analytics:dashboard.noData")}
            subtitle={t("analytics:dashboard.noDataSubtitle")}
          />
        )}

        {!isLoading && !isError && data && data.totalMatches > 0 && (
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
              <PerformanceBadge accuracy={data.overallAccuracy} t={t} />
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

            {/* Learning Report */}
            <LearningReport data={data} t={t} />

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

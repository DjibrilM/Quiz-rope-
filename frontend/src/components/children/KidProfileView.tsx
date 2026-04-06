import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiService, type LeaderboardEntry } from "../../services/api";
import { useGameStore } from "../../stores/gameStore";
import * as guestDb from "../../services/guestDb";
import {
  AnimatedLoader,
  AvatarIcon,
  Button,
} from "../common";
import { FONTS } from "../../constants/theme";
import { getSubjectTheme } from "../../config/subjectThemes";
import type { ChildMatchSummary } from "@shared/types/analytics.types";

export function SubjectStatRow({
  subject,
  correctAnswers,
  totalQuestions,
  accuracy,
}: {
  subject: string;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
}) {
  const theme = getSubjectTheme(subject);
  const score = correctAnswers * 10;
  const maxScore = totalQuestions * 10;
  const accuracyColor =
    accuracy >= 70 ? "#10B981" : accuracy >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <View
      style={{
        backgroundColor: "#0D0B14",
        borderRadius: 12,
        padding: 14,
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
              fontSize: 14,
              fontFamily: FONTS.bodyBold,
              color: "#FFFFFF",
            }}
          >
            {theme.label}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 13,
            fontFamily: FONTS.bodyBold,
            color: accuracyColor,
          }}
        >
          {accuracy}%
        </Text>
      </View>

      {/* Accuracy bar */}
      <View
        style={{
          height: 6,
          backgroundColor: "#3D2E4A",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${Math.max(accuracy, 2)}%`,
            backgroundColor: accuracyColor,
            borderRadius: 3,
          }}
        />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text
          style={{ fontSize: 12, fontFamily: FONTS.body, color: "#B8A9C9" }}
        >
          Score: {score} / {maxScore}
        </Text>
        <Text
          style={{ fontSize: 12, fontFamily: FONTS.body, color: "#7B6B8A" }}
        >
          {correctAnswers}/{totalQuestions} correct
        </Text>
      </View>
    </View>
  );
}

export function MatchHistoryRow({ summary }: { summary: ChildMatchSummary }) {
  const theme = getSubjectTheme(summary.subject);
  const date = new Date(summary.date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const isSolo = summary.gameMode === "solo";
  const outcomeColor = summary.didWin ? "#10B981" : "#EF4444";

  return (
    <View
      style={{
        backgroundColor: "#0D0B14",
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.accentColor,
          flexShrink: 0,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: "#FFFFFF", fontSize: 13, fontFamily: FONTS.bodyBold }}
        >
          {theme.label}
        </Text>
        <Text
          style={{
            color: "#7B6B8A",
            fontSize: 11,
            fontFamily: FONTS.body,
            marginTop: 1,
          }}
        >
          {date} · {summary.accuracy}% accuracy
        </Text>
      </View>
      {!isSolo && (
        <View
          style={{
            backgroundColor: `${outcomeColor}20`,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text
            style={{
              color: outcomeColor,
              fontSize: 11,
              fontFamily: FONTS.bodyBold,
            }}
          >
            {summary.didWin ? "Won" : "Lost"}
          </Text>
        </View>
      )}
    </View>
  );
}

export function KidProfileView({
  entry,
  onLogout,
}: {
  entry: LeaderboardEntry & { avatarUrl?: string };
  onLogout: () => void;
}) {
  const { t } = useTranslation(["leaderboard", "common"]);
  const { userRole } = useGameStore();
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

  // Guest: fetch aggregated stats from local SQLite
  const { data: guestStats, isLoading: guestStatsLoading } = useQuery({
    queryKey: ["guestProfileStats"],
    queryFn: guestDb.getGuestProfileStats,
    enabled: isGuest,
  });

  // For children, fetch cached profile from local SQLite as fallback
  const { data: cachedProfile } = useQuery({
    queryKey: ["cachedChildProfile", entry.playerId],
    queryFn: () => guestDb.getChildProfile(entry.playerId),
    enabled: !isGuest,
  });

  const displayName = entry.displayName || cachedProfile?.displayName || "Kid";
  const avatarUrl = entry.avatarUrl || cachedProfile?.avatarUrl;

  const recentMatches = isGuest
    ? ((guestStats?.recentMatches ?? []) as any[])
    : matchHistory.slice(0, 5);

  const subjectStats = isGuest
    ? (guestStats?.subjectStats ?? [])
    : (stats?.subjectStats ?? []);

  const isHistoryLoading = isGuest ? guestStatsLoading : historyLoading;
  const isSubjectLoading = isGuest ? guestStatsLoading : statsLoading;

  const sectionLabel = {
    color: "#7B6B8A",
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
    marginBottom: 12,
  };

  return (
    <View>
      {/* ── Avatar header ── */}
      <View
        style={{
          alignItems: "center",
          paddingTop: 16,
          paddingBottom: 28,
          gap: 8,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: "#9B59B6",
            borderRadius: 50,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 4,
            borderColor: "#3D2E4A",
            marginBottom: 4,
          }}
        >
          <AvatarIcon avatarId={avatarUrl} size={62} />
        </View>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 28,
            fontFamily: "LuckiestGuy_400Regular",
          }}
        >
          {displayName}
        </Text>
        <Text
          style={{
            color: "#B8A9C9",
            fontSize: 14,
            fontFamily: FONTS.body,
          }}
        >
          {t("leaderboard:gamesPlayed", { count: entry.gamesPlayed })}
        </Text>
      </View>

      {/* ── Global stats ── */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
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
              fontSize: 30,
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
              fontSize: 30,
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

      {/* ── Recent matches ── */}
      <Text style={sectionLabel}>{t("leaderboard:recentMatches", "Recent Matches")}</Text>


      {isHistoryLoading && (
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <AnimatedLoader size="sm" />
        </View>
      )}

      {!isHistoryLoading && recentMatches.length === 0 && (
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

      {!isHistoryLoading && recentMatches.length > 0 && (
        <View style={{ gap: 8, marginBottom: 28 }}>
          {recentMatches.map((m) => (
            <MatchHistoryRow key={m.matchId} summary={m} />
          ))}
        </View>
      )}

      {/* ── By subject ── */}
      <Text style={sectionLabel}>{t("leaderboard:bySubject", "By Subject")}</Text>


      {isSubjectLoading && (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <AnimatedLoader size="sm" />
        </View>
      )}

      {!isSubjectLoading && subjectStats.length === 0 && (
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
          No subject data yet
        </Text>
      )}

      {!isSubjectLoading && subjectStats.length > 0 && (
        <View style={{ gap: 10, marginBottom: 28 }}>
          {subjectStats.map((s) => (
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

      {/* ── Logout ── */}
      <Button
        label="Log out"
        variant="danger"
        className="w-full min-w-full"
        onPress={onLogout}
      />
    </View>
  );
}

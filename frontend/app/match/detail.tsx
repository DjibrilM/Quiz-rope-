import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import Svg, { Circle } from "react-native-svg";
import { usePortrait } from "../../src/hooks/useOrientation";
import { apiService } from "../../src/services/api";
import { ScreenHeader } from "../../src/components/common";
import { SubjectIcon } from "../../src/components/match/SubjectIcons";
import { FONTS, FORTNITE_COLORS } from "../../src/constants/theme";
import type { PlayerStats } from "@shared/types/game.types";
import type { Match } from "@shared/types/match.types";
import { useQuery } from "@tanstack/react-query";

// ─── Accuracy ring (SVG) ────────────────────────────────────────────────────
const RADIUS = 44;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AccuracyRing({ accuracy }: { accuracy: number }) {
  const offset = CIRCUMFERENCE * (1 - accuracy / 100);
  const color =
    accuracy >= 70 ? "#10B981" : accuracy >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg
        width={RADIUS * 2 + STROKE * 2}
        height={RADIUS * 2 + STROKE * 2}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* Track */}
        <Circle
          cx={RADIUS + STROKE}
          cy={RADIUS + STROKE}
          r={RADIUS}
          stroke="#2D2440"
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={RADIUS + STROKE}
          cy={RADIUS + STROKE}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontFamily: FONTS.heading,
            color: color,
          }}
        >
          {accuracy}%
        </Text>
        <Text
          style={{
            fontSize: 10,
            fontFamily: FONTS.bodySemiBold,
            color: FORTNITE_COLORS.textMuted,
            letterSpacing: 1,
          }}
        >
          ACCURACY
        </Text>
      </View>
    </View>
  );
}

// ─── Score bar for two teams ─────────────────────────────────────────────────
function TeamScoreBar({
  leftScore,
  rightScore,
}: {
  leftScore: number;
  rightScore: number;
}) {
  const total = leftScore + rightScore || 1;
  const leftPct = (leftScore / total) * 100;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text
          style={{
            fontSize: 22,
            fontFamily: FONTS.heading,
            color: FORTNITE_COLORS.teamRed,
          }}
        >
          {leftScore}
        </Text>
        <Text
          style={{
            fontSize: 22,
            fontFamily: FONTS.heading,
            color: FORTNITE_COLORS.teamBlue,
          }}
        >
          {rightScore}
        </Text>
      </View>
      <View
        style={{
          height: 12,
          borderRadius: 6,
          overflow: "hidden",
          flexDirection: "row",
          backgroundColor: "#2D2440",
        }}
      >
        <View
          style={{
            width: `${leftPct}%`,
            backgroundColor: FORTNITE_COLORS.teamRed,
            borderRadius: 6,
          }}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: FORTNITE_COLORS.teamBlue,
            borderRadius: 6,
          }}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text
          style={{
            fontSize: 12,
            fontFamily: FONTS.bodySemiBold,
            color: FORTNITE_COLORS.teamRed,
          }}
        >
          Red Team
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: FONTS.bodySemiBold,
            color: FORTNITE_COLORS.teamBlue,
          }}
        >
          Blue Team
        </Text>
      </View>
    </View>
  );
}

// ─── Rope bar ────────────────────────────────────────────────────────────────
function RopeBar({ position }: { position: number }) {
  const leftPct = ((5 - position) / 10) * 100;

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          height: 10,
          borderRadius: 5,
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        <View
          style={{
            width: `${leftPct}%`,
            backgroundColor: "#EF444460",
            borderRadius: 5,
          }}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: "#3B82F660",
            borderRadius: 5,
          }}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONTS.body,
            color: "#EF444490",
          }}
        >
          ← Red
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONTS.body,
            color: FORTNITE_COLORS.textMuted,
          }}
        >
          Center
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONTS.body,
            color: "#3B82F690",
          }}
        >
          Blue →
        </Text>
      </View>
    </View>
  );
}

// ─── Stat chip ───────────────────────────────────────────────────────────────
function StatChip({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: "#231C2B",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 8,
        gap: 4,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontFamily: FONTS.heading,
          color: valueColor ?? FORTNITE_COLORS.textPrimary,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontFamily: FONTS.bodySemiBold,
          color: FORTNITE_COLORS.textMuted,
          letterSpacing: 0.5,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Review button ───────────────────────────────────────────────────────────
function ReviewButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#3D2E4A",
        borderWidth: 1.5,
        borderColor: "#6D4C8A",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "#C4B0D8",
          fontSize: 15,
          fontFamily: FONTS.accent,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Solo detail view ────────────────────────────────────────────────────────
function SoloDetail({
  match,
  stats,
  t,
}: {
  match: Match;
  stats: PlayerStats[];
  t: (k: string, opts?: Record<string, unknown>) => string;
}) {
  const player = stats[0];
  // Derive from match data directly (10 pts per correct answer in solo mode)
  const matchLeft = (match as any).teamScoreLeft ?? 0;
  const matchRounds = (match as any).rounds ?? (match as any).maxRounds ?? 0;
  const correctAnswers = player?.correctAnswers ?? Math.round(matchLeft / 10);
  const totalAnswers = player?.totalAnswers ?? matchRounds;
  const avgMs = player?.avgResponseTime ?? 0;
  const accuracy =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  const isCompleted = match.status === "COMPLETED";

  return (
    <View style={{ gap: 16 }}>
      {/* Completion banner */}
      {isCompleted && (
        <View
          style={{
            backgroundColor: "#10B98115",
            borderWidth: 1.5,
            borderColor: "#10B981",
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: FONTS.heading,
              color: "#10B981",
            }}
          >
            {t("match:detail.soloComplete")}
          </Text>
        </View>
      )}

      {/* Accuracy ring + stat chips */}
      {totalAnswers > 0 ? (
        <>
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <AccuracyRing accuracy={accuracy} />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatChip
              label={t("match:detail.correct")}
              value={`${correctAnswers}/${totalAnswers}`}
              valueColor="#10B981"
            />
            <StatChip
              label={t("match:detail.rounds")}
              value={`${match.rounds}/${match.maxRounds}`}
            />
            <StatChip
              label={t("match:detail.avgTime")}
              value={`${(avgMs / 1000).toFixed(1)}s`}
            />
          </View>
        </>
      ) : (
        <View
          style={{
            alignItems: "center",
            paddingVertical: 32,
            backgroundColor: "#231C2B",
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: FONTS.body,
              color: FORTNITE_COLORS.textMuted,
            }}
          >
            {t("match:detail.noStats")}
          </Text>
        </View>
      )}

      {/* Review button */}
      {isCompleted && (
        <ReviewButton
          label={t("match:detail.reviewAnswers")}
          onPress={() =>
            router.push({
              pathname: "/match/review" as any,
              params: {
                matchId: (match as any)._id || match._id,
                childId: "mock-player",
                subject: match.subject,
              },
            })
          }
        />
      )}
    </View>
  );
}

// ─── Split-screen detail view ─────────────────────────────────────────────────
function SplitDetail({
  match,
  stats,
  t,
}: {
  match: Match;
  stats: PlayerStats[];
  t: (k: string, opts?: Record<string, unknown>) => string;
}) {
  const isCompleted = match.status === "COMPLETED";
  const leftScore = (match as any).teamScoreLeft ?? 0;
  const rightScore = (match as any).teamScoreRight ?? 0;

  const winnerLabel =
    match.winner === "LEFT"
      ? t("match:detail.redWins")
      : match.winner === "RIGHT"
        ? t("match:detail.blueWins")
        : match.winner
          ? t("match:detail.draw")
          : null;

  const winnerColor =
    match.winner === "LEFT"
      ? FORTNITE_COLORS.teamRed
      : match.winner === "RIGHT"
        ? FORTNITE_COLORS.teamBlue
        : "#A78BFA";

  return (
    <View style={{ gap: 16 }}>
      {/* Winner banner */}
      {winnerLabel && (
        <View
          style={{
            backgroundColor: `${winnerColor}15`,
            borderWidth: 1.5,
            borderColor: winnerColor,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontFamily: FONTS.heading,
              color: winnerColor,
            }}
          >
            {winnerLabel}
          </Text>
        </View>
      )}

      {/* Team scores */}
      <View
        style={{
          backgroundColor: FORTNITE_COLORS.bgCard,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: "#2D2440",
          gap: 16,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONTS.bodySemiBold,
            color: FORTNITE_COLORS.textMuted,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {t("match:detail.teamScores")}
        </Text>
        <TeamScoreBar leftScore={leftScore} rightScore={rightScore} />
      </View>

      {/* Rope position */}
      <View
        style={{
          backgroundColor: FORTNITE_COLORS.bgCard,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: "#2D2440",
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONTS.bodySemiBold,
            color: FORTNITE_COLORS.textMuted,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {t("match:detail.ropePosition")}
        </Text>
        <RopeBar position={match.ropePosition} />
      </View>

      {/* Round stats chip row */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <StatChip
          label={t("match:detail.rounds")}
          value={`${match.rounds}/${match.maxRounds}`}
        />
        <StatChip
          label={t("match:detail.players")}
          value={String(stats.length || "—")}
        />
      </View>

      {/* Per-player stats */}
      {stats.length > 0 && (
        <View
          style={{
            backgroundColor: FORTNITE_COLORS.bgCard,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: "#2D2440",
            gap: 12,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: FONTS.bodySemiBold,
              color: FORTNITE_COLORS.textMuted,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {t("match:detail.playerStatistics")}
          </Text>
          {stats.map((stat, idx) => {
            const acc =
              stat.totalAnswers > 0
                ? Math.round((stat.correctAnswers / stat.totalAnswers) * 100)
                : 0;
            const accColor =
              acc >= 70 ? "#10B981" : acc >= 40 ? "#F59E0B" : "#EF4444";
            return (
              <View
                key={stat.playerId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderTopWidth: idx > 0 ? 1 : 0,
                  borderTopColor: "#2D2440",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: "#3D2E4A",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: FONTS.bodyBold,
                      color: FORTNITE_COLORS.textSecondary,
                    }}
                  >
                    {idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: FONTS.bodyBold,
                      color: FORTNITE_COLORS.textPrimary,
                    }}
                    numberOfLines={1}
                  >
                    {(stat as any).displayName || stat.playerId}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: FONTS.body,
                      color: FORTNITE_COLORS.textMuted,
                    }}
                  >
                    {stat.correctAnswers}/{stat.totalAnswers} correct
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: FONTS.heading,
                      color: accColor,
                    }}
                  >
                    {acc}%
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: FONTS.body,
                      color: FORTNITE_COLORS.textMuted,
                    }}
                  >
                    {(stat.avgResponseTime / 1000).toFixed(1)}s avg
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Review button */}
      {isCompleted && (
        <ReviewButton
          label={t("match:detail.reviewAnswers")}
          onPress={() =>
            router.push({
              pathname: "/match/review" as any,
              params: {
                matchId: (match as any)._id || match._id,
                childId: "player-red",
                subject: match.subject,
              },
            })
          }
        />
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function MatchDetailScreen() {
  usePortrait();
  const { t } = useTranslation(["match", "common"]);
  const { matchId } = useLocalSearchParams();

  const {
    data: match,
    isLoading,
    error: matchError,
  } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => apiService.getMatch(matchId as string),
    enabled: !!matchId,
  });

  const { data: stats = [] } = useQuery({
    queryKey: ["matchStats", matchId],
    queryFn: () => apiService.getMatchStats(matchId as string),
    enabled: !!matchId,
    retry: false,
  });

  const error = matchError
    ? matchError instanceof Error
      ? matchError.message
      : String(matchError)
    : "";

  const isSolo = (match as any)?.gameMode === "solo";
  const dateStr = match
    ? new Date(match.createdAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const modeBadgeColor = isSolo ? "#10B981" : "#A78BFA";
  const modeLabel = isSolo
    ? t("match:detail.soloMode")
    : t("match:detail.splitMode");

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: FORTNITE_COLORS.bgDark }}
    >
      <ScreenHeader title={t("match:detail.title")} />

      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 48,
          gap: 16,
        }}
      >
        {/* Loading */}
        {isLoading && (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        )}

        {/* Error */}
        {!!error && !isLoading && (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text
              style={{
                color: "#F87171",
                fontSize: 14,
                fontFamily: FONTS.body,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Content */}
        {!isLoading && match && (
          <>
            {/* ── Match identity card ── */}
            <View
              style={{
                backgroundColor: FORTNITE_COLORS.bgCard,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: "#2D2440",
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: "#231C2B",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SubjectIcon subject={match.subject} size={32} />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: FONTS.heading,
                    color: FORTNITE_COLORS.textPrimary,
                  }}
                >
                  {match.subject.charAt(0) +
                    match.subject.slice(1).toLowerCase()}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      backgroundColor: `${modeBadgeColor}20`,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderWidth: 1,
                      borderColor: `${modeBadgeColor}50`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: FONTS.bodySemiBold,
                        color: modeBadgeColor,
                      }}
                    >
                      {modeLabel}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: FONTS.body,
                      color: FORTNITE_COLORS.textMuted,
                    }}
                  >
                    {match.difficulty}
                  </Text>
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
            </View>

            {/* ── Mode-specific content ── */}
            {isSolo ? (
              <SoloDetail match={match} stats={stats} t={t} />
            ) : (
              <SplitDetail match={match} stats={stats} t={t} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

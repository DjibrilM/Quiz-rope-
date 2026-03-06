import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { ScreenHeader } from "../src/components/common";
import type { PlayerStats } from "@shared/types/game.types";
import type { Match } from "@shared/types/match.types";

export default function MatchDetailScreen() {
  usePortrait();
  const { t } = useTranslation(["match", "common"]);
  const { matchId } = useLocalSearchParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!matchId) return;
    loadData();
  }, [matchId]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [matchData, statsData] = await Promise.all([
        apiService.getMatch(matchId as string),
        apiService.getMatchStats(matchId as string),
      ]);
      setMatch(matchData);
      setStats(statsData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load match details";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isRedWinner = match?.winner === "LEFT";
  const winnerLabel = isRedWinner ? t("common:teams.redTeam") : t("common:teams.blueTeam");
  const winnerColor = isRedWinner ? "text-team-red" : "text-team-blue";

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ScreenHeader title={t("match:detail.title")} />

      <ScrollView
        className="flex-1 px-8"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {loading && (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        )}

        {error && !loading && (
          <View className="items-center py-20">
            <Text className="text-red-400 text-lg text-center">{error}</Text>
          </View>
        )}

        {!loading && match && (
          <>
            {/* Match info */}
            <View className="bg-card-bg rounded-3xl p-6 mb-6 border border-slate-700">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl text-white" style={{ fontFamily: "LuckiestGuy_400Regular" }}>
                  {match.subject}
                </Text>
                <Text className="text-slate-400 text-base">
                  {match.difficulty}
                </Text>
              </View>

              <View className="flex-row justify-between mb-4">
                <View className="items-center flex-1">
                  <Text className="text-slate-400 text-sm">{t("match:detail.rounds")}</Text>
                  <Text className="text-white text-xl font-bold">
                    {match.rounds}/{match.maxRounds}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-slate-400 text-sm">{t("match:detail.ropePosition")}</Text>
                  <Text className="text-white text-xl font-bold">
                    {Math.abs(match.ropePosition).toFixed(1)}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-slate-400 text-sm">{t("match:detail.status")}</Text>
                  <Text className="text-white text-xl font-bold">
                    {match.status}
                  </Text>
                </View>
              </View>

              {match.winner && (
                <View className="items-center">
                  <Text className="text-slate-400 text-sm mb-1">{t("match:detail.winner")}</Text>
                  <Text className={`text-2xl ${winnerColor}`} style={{ fontFamily: "LuckiestGuy_400Regular" }}>
                    {winnerLabel}
                  </Text>
                </View>
              )}
            </View>

            {/* Mini rope visualization */}
            <View className="bg-card-bg rounded-3xl p-4 mb-6 border border-slate-700">
              <Text className="text-sm text-white mb-3 text-center" style={{ fontFamily: "Bungee_400Regular" }}>
                {t("match:detail.ropePosition")}
              </Text>
              <View className="h-4 bg-slate-800 rounded-full overflow-hidden flex-row">
                <View
                  className="h-full bg-team-red/60 rounded-l-full"
                  style={{ width: `${((5 - match.ropePosition) / 10) * 100}%` }}
                />
                <View
                  className="h-full bg-team-blue/60 rounded-r-full"
                  style={{ width: `${((5 + match.ropePosition) / 10) * 100}%` }}
                />
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-team-red text-xs">{t("common:teams.red")}</Text>
                <Text className="text-slate-500 text-xs">{t("match:detail.center")}</Text>
                <Text className="text-team-blue text-xs">{t("common:teams.blue")}</Text>
              </View>
            </View>

            {/* Player stats */}
            {stats.length > 0 && (
              <View className="bg-card-bg rounded-3xl p-6 border border-slate-700">
                <Text className="text-base text-white mb-4" style={{ fontFamily: "Bungee_400Regular" }}>
                  {t("match:detail.playerStatistics")}
                </Text>
                {stats.map((stat) => {
                  const accuracy = stat.totalAnswers > 0
                    ? Math.round((stat.correctAnswers / stat.totalAnswers) * 100)
                    : 0;
                  return (
                    <View
                      key={stat.playerId}
                      className="flex-row items-center py-3 border-b border-slate-800"
                    >
                      <View className="flex-1">
                        <Text className="text-white text-base font-medium">
                          {stat.displayName || stat.playerId}
                        </Text>
                      </View>
                      <View className="flex-row gap-6">
                        <View className="items-center">
                          <Text className="text-game-success text-base font-bold">
                            {stat.correctAnswers}/{stat.totalAnswers}
                          </Text>
                          <Text className="text-slate-500 text-xs">{t("match:detail.score")}</Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-white text-base font-bold">
                            {accuracy}%
                          </Text>
                          <Text className="text-slate-500 text-xs">{t("match:detail.accuracy")}</Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-slate-400 text-base">
                            {(stat.avgResponseTime / 1000).toFixed(1)}s
                          </Text>
                          <Text className="text-slate-500 text-xs">{t("match:detail.avgTime")}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

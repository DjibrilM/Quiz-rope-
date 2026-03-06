import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import type { LeaderboardEntry } from "../src/services/api";
import { useGameStore } from "../src/stores/gameStore";
import { ScreenHeader, AnimatedLoader, EmptyState, StaggeredList, AvatarIcon } from "../src/components/common";
import { FONTS } from "../src/constants/theme";
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from "react-native-svg";

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
      <Path d="M12 2l2.5 5.5H20l-4.5 3.5 1.5 6L12 14l-5 3 1.5-6L4 7.5h5.5z" fill={`url(#medal${rank})`} />
    </Svg>
  );
}

export default function LeaderboardScreen() {
  usePortrait();
  const { t } = useTranslation(["leaderboard", "common"]);
  const { children } = useGameStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiService.getLeaderboard();
      const enriched = result.map((entry) => {
        const child = children.find((c) => c.id === entry.playerId);
        return {
          ...entry,
          displayName: child?.displayName || entry.displayName || entry.playerId,
          avatarUrl: child?.avatarUrl,
        };
      });
      setEntries(enriched);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load leaderboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ScreenHeader title={t("leaderboard:title")} />

      <ScrollView
        className="flex-1 px-8"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {loading && (
          <View className="items-center py-20">
            <AnimatedLoader size="lg" message={t("leaderboard:loadingMessage")} />
          </View>
        )}

        {error && !loading && (
          <EmptyState
            illustration="error"
            title={t("common:errors.somethingWentWrong")}
            subtitle={error}
            action={{ label: t("common:buttons.tryAgain"), onPress: loadLeaderboard }}
          />
        )}

        {!loading && !error && entries.length === 0 && (
          <EmptyState
            illustration="noRankings"
            title={t("leaderboard:emptyTitle")}
            subtitle={t("leaderboard:emptySubtitle")}
          />
        )}

        {!loading && !error && entries.length > 0 && (
          <StaggeredList staggerMs={60}>
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;

              return (
                <View
                  key={entry.playerId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 20,
                    borderRadius: 16,
                    marginBottom: 12,
                    backgroundColor: "#1A1520",
                    borderWidth: 1,
                    borderColor: isTop3 ? "rgba(255, 217, 61, 0.3)" : "#3D2E4A",
                  }}
                >
                  <View style={{ width: 48, alignItems: "center" }}>
                    {isTop3 ? (
                      <MedalIcon rank={rank} />
                    ) : (
                      <Text style={{ color: "#B8A9C9", fontSize: 20, fontFamily: FONTS.bodyBold }}>#{rank}</Text>
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
                    <AvatarIcon avatarId={(entry as LeaderboardEntry & { avatarUrl?: string }).avatarUrl} size={30} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#FFFFFF", fontSize: 18, fontFamily: FONTS.bodyBold }} numberOfLines={1}>
                      {entry.displayName}
                    </Text>
                    <Text style={{ color: "#B8A9C9", fontSize: 13, fontFamily: FONTS.body }}>
                      {t("leaderboard:gamesPlayed", { count: entry.gamesPlayed })}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ color: "#10B981", fontSize: 18, fontFamily: FONTS.bodyBold }}>
                        {entry.correctAnswers}
                      </Text>
                      <Text style={{ color: "#7B6B8A", fontSize: 11, fontFamily: FONTS.body }}>{t("leaderboard:correct")}</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ color: "#FFFFFF", fontSize: 18, fontFamily: FONTS.bodyBold }}>
                        {entry.accuracy}%
                      </Text>
                      <Text style={{ color: "#7B6B8A", fontSize: 11, fontFamily: FONTS.body }}>{t("leaderboard:accuracy")}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </StaggeredList>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

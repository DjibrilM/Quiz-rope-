import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { ScreenHeader, AnimatedLoader, EmptyState, StaggeredList } from "../src/components/common";
import { MatchHistoryCard } from "../src/components/match";
import type { Match } from "@shared/types/match.types";

export default function MatchHistoryScreen() {
  usePortrait();
  const { t } = useTranslation(["match", "common"]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiService.getMatches();
      setMatches(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load matches";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ScreenHeader title={t("match:history.title")} />

      <ScrollView
        className="flex-1 px-8"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {loading && (
          <View className="items-center py-20">
            <AnimatedLoader size="lg" message={t("match:history.loadingMessage")} />
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
            title={t("match:history.emptyTitle")}
            subtitle={t("match:history.emptySubtitle")}
          />
        )}

        {!loading && !error && matches.length > 0 && (
          <StaggeredList staggerMs={60}>
            {matches.map((match) => (
              <MatchHistoryCard
                key={match.id}
                match={match}
                onPress={() => router.push({ pathname: "/match-detail" as any, params: { matchId: match.id } })}
              />
            ))}
          </StaggeredList>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

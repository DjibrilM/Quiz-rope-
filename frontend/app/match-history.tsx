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
import { useQuery } from "@tanstack/react-query";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import {
  AnimatedLoader,
  EmptyState,
  StaggeredList,
  ScreenHeader,
} from "../src/components/common";
import { MatchHistoryCard } from "../src/components/match";
import { FONTS } from "../src/constants/theme";

export default function MatchHistoryScreen() {
  usePortrait();
  const { t } = useTranslation(["match", "common"]);
  const {
    data: matches = [],
    isLoading,
    isError,
    isFetching,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["matches"],
    queryFn: () => apiService.getMatches(),
  });

  const errorMessage = error instanceof Error ? error.message : "";

  return (
    <View className="flex-1">
      <ScreenHeader title={t("match:history.title")} />

      <ScrollView
        className="flex-1 px-8 pt-6"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching || isRefetching}
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

        {!isLoading && !isError && matches.length === 0 && (
          <EmptyState
            illustration="noMatches"
            title={t("match:history.emptyTitle")}
            subtitle={t("match:history.emptySubtitle")}
          />
        )}

        {!isLoading && !isError && matches.length > 0 && (
          <StaggeredList staggerMs={60}>
            {matches.map((match) => (
              <View key={match._id}>
                <MatchHistoryCard
                  match={match}
                  onPress={() => {
                    console.log("match", match);
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
      </ScrollView>
    </View>
  );
}

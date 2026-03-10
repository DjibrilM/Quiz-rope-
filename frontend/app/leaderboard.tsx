import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import type { LeaderboardEntry } from "../src/services/api";
import { useGameStore } from "../src/stores/gameStore";
import {
  AnimatedLoader,
  EmptyState,
  StaggeredList,
  AvatarIcon,
  BouncePress,
  Button,
  ScreenHeader,
} from "../src/components/common";
import { FONTS } from "../src/constants/theme";
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

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
      <Path
        d="M12 2l2.5 5.5H20l-4.5 3.5 1.5 6L12 14l-5 3 1.5-6L4 7.5h5.5z"
        fill={`url(#medal${rank})`}
      />
    </Svg>
  );
}

export default function LeaderboardScreen() {
  usePortrait();
  const { t } = useTranslation(["leaderboard", "common"]);
  const { children } = useGameStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  const { data: rawEntries = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => apiService.getLeaderboard(),
  });

  const entries = rawEntries.map((entry) => {
    const child = children.find((c) => c.id === entry.playerId);
    return {
      ...entry,
      displayName: child?.displayName || entry.displayName || entry.playerId,
      avatarUrl: child?.avatarUrl,
    };
  });

  const errorMessage = error instanceof Error ? error.message : "";

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    [],
  );

  const handleEntryPress = (entry: LeaderboardEntry) => {
    setSelectedEntry(entry);
    bottomSheetRef.current?.present();
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-game-bg">
      <ScreenHeader title={t("leaderboard:title")} />

      <ScrollView
        className="flex-1 px-8"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {isLoading && (
          <View className="items-center py-20">
            <AnimatedLoader
              size="lg"
              message={t("leaderboard:loadingMessage")}
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

        {!isLoading && !isError && entries.length === 0 && (
          <EmptyState
            illustration="noRankings"
            title={t("leaderboard:emptyTitle")}
            subtitle={t("leaderboard:emptySubtitle")}
          />
        )}

        {!isLoading && !isError && entries.length > 0 && (
          <StaggeredList staggerMs={60}>
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;

              return (
                <BouncePress
                  key={entry.playerId}
                  onPress={() => handleEntryPress(entry)}
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
                      <Text
                        style={{
                          color: "#B8A9C9",
                          fontSize: 20,
                          fontFamily: FONTS.bodyBold,
                        }}
                      >
                        #{rank}
                      </Text>
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
                    <AvatarIcon
                      avatarId={
                        (entry as LeaderboardEntry & { avatarUrl?: string })
                          .avatarUrl
                      }
                      size={30}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 18,
                        fontFamily: FONTS.bodyBold,
                      }}
                      numberOfLines={1}
                    >
                      {entry.displayName}
                    </Text>
                    <Text
                      style={{
                        color: "#B8A9C9",
                        fontSize: 13,
                        fontFamily: FONTS.body,
                      }}
                    >
                      {t("leaderboard:gamesPlayed", {
                        count: entry.gamesPlayed,
                      })}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          color: "#10B981",
                          fontSize: 18,
                          fontFamily: FONTS.bodyBold,
                        }}
                      >
                        {entry.correctAnswers}
                      </Text>
                      <Text
                        style={{
                          color: "#7B6B8A",
                          fontSize: 11,
                          fontFamily: FONTS.body,
                        }}
                      >
                        {t("leaderboard:correct")}
                      </Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 18,
                          fontFamily: FONTS.bodyBold,
                        }}
                      >
                        {entry.accuracy}%
                      </Text>
                      <Text
                        style={{
                          color: "#7B6B8A",
                          fontSize: 11,
                          fontFamily: FONTS.body,
                        }}
                      >
                        {t("leaderboard:accuracy")}
                      </Text>
                    </View>
                  </View>
                </BouncePress>
              );
            })}
          </StaggeredList>
        )}
      </ScrollView>

      <BottomSheetModal
        ref={bottomSheetRef}
        enablePanDownToClose
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: "#1A1520",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        handleIndicatorStyle={{
          backgroundColor: "#5A4B6B",
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView
          style={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 }}
        >
          {selectedEntry && (
            <View>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    backgroundColor: "#9B59B6",
                    borderRadius: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    borderWidth: 3,
                    borderColor: "#3D2E4A",
                  }}
                >
                  <AvatarIcon
                    avatarId={
                      (
                        selectedEntry as LeaderboardEntry & {
                          avatarUrl?: string;
                        }
                      ).avatarUrl
                    }
                    size={50}
                  />
                </View>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 24,
                    fontFamily: "LuckiestGuy_400Regular",
                  }}
                >
                  {selectedEntry.displayName}
                </Text>
                <Text
                  style={{
                    color: "#B8A9C9",
                    fontSize: 14,
                    fontFamily: FONTS.body,
                    marginTop: 4,
                  }}
                >
                  {t("leaderboard:gamesPlayed", {
                    count: selectedEntry.gamesPlayed,
                  })}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
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
                      fontSize: 28,
                      fontFamily: "LuckiestGuy_400Regular",
                    }}
                  >
                    {selectedEntry.correctAnswers}
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
                      fontSize: 28,
                      fontFamily: "LuckiestGuy_400Regular",
                    }}
                  >
                    {selectedEntry.accuracy}%
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

              <Button
                label={t("common:buttons.close")}
                variant="secondary"
                className="w-full max-w-none"
                onPress={() => bottomSheetRef.current?.dismiss()}
              />
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

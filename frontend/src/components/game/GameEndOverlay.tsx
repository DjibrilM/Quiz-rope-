import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { soundService } from "../../services/sound";
import { hapticsService } from "../../services/haptics";
import { ConfettiOverlay } from "../common/ConfettiOverlay";
import { FONTS } from "../../constants/theme";
import { useGameStore } from "../../stores/gameStore";
import type { GameEndResult, PlayerStats } from "@shared/types/game.types";

interface GameEndOverlayProps {
  result: GameEndResult;
  onPlayAgain: () => void;
  onExit: () => void;
  onReview?: () => void;
}

function TrophyIcon() {
  return (
    <View style={{ marginBottom: 16 }}>
      <Svg width={72} height={72} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="trophyGold" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFD93D" />
            <Stop offset="1" stopColor="#D97706" />
          </LinearGradient>
        </Defs>
        <Path d="M6 3h12v6a6 6 0 01-12 0V3z" fill="url(#trophyGold)" />
        <Path
          d="M6 5H3a1 1 0 00-1 1v1a4 4 0 004 4"
          stroke="#FFD93D"
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M18 5h3a1 1 0 011 1v1a4 4 0 01-4 4"
          stroke="#FFD93D"
          strokeWidth="1.5"
          fill="none"
        />
        <Rect x="10" y="15" width="4" height="4" rx="1" fill="#D97706" />
        <Rect x="7" y="19" width="10" height="2" rx="1" fill="#92400E" />
      </Svg>
    </View>
  );
}

export function GameEndOverlay({
  result,
  onPlayAgain,
  onExit,
  onReview,
}: GameEndOverlayProps) {
  const { t } = useTranslation(["game", "common"]);
  const currentMatch = useGameStore((s) => s.currentMatch);
  const isSoloMode = currentMatch?.gameMode === "solo";
  const titleScale = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  const isRedWinner =
    result.winnerTeamId === "left" ||
    result.winnerTeamId === "LEFT" ||
    (result.teamScores && result.teamScores.left > result.teamScores.right);
  const scoreDiff = Math.abs(
    (result.teamScores?.left ?? 0) - (result.teamScores?.right ?? 0),
  );
  const isCloseMatch = scoreDiff <= 10;

  useEffect(() => {
    titleScale.value = withSpring(1, { damping: 18, stiffness: 160 });
    buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    soundService.play("gameEnd");
    hapticsService.heavy();
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  const winnerBg = isRedWinner ? "bg-team-red" : "bg-team-blue";

  return (
    <Animated.View
      className={"px-4"}
      entering={FadeIn.duration(300)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(13, 11, 20, 0.95)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <ConfettiOverlay visible={true} />

      <View style={{ width: "100%", maxWidth: 500, alignItems: "center" }}>
        <TrophyIcon />

        <Animated.View
          style={[titleStyle, { alignItems: "center", marginBottom: 24 }]}
        >
          {isSoloMode ? (
            /* Solo end screen */
            <>
              <Text
                style={{
                  fontSize: 36,
                  color: "#FFFFFF",
                  fontFamily: "LuckiestGuy_400Regular",
                  marginBottom: 8,
                }}
              >
                {t("game:end.wellDone")}
              </Text>
              <View
                style={{
                  backgroundColor: "#A78BFA",
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 16,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 24,
                    fontFamily: "LuckiestGuy_400Regular",
                  }}
                >
                  {t("game:end.finalScore", {
                    score: result.teamScores?.left ?? 0,
                  })}
                </Text>
              </View>
            </>
          ) : (
            /* Multiplayer end screen */
            <>
              <Text
                style={{
                  fontSize: 36,
                  color: "#FFFFFF",
                  fontFamily: "LuckiestGuy_400Regular",
                  marginBottom: 8,
                }}
              >
                {isCloseMatch
                  ? t("game:end.closeMatch")
                  : t("game:end.greatGame")}
              </Text>
              <View className={`${winnerBg} px-8 py-4 rounded-2xl`}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 24,
                    fontFamily: "LuckiestGuy_400Regular",
                  }}
                >
                  {isRedWinner
                    ? t("common:teams.redTeam")
                    : t("common:teams.blueTeam")}{" "}
                  {t("game:end.champions")}
                </Text>
              </View>
              <Text
                style={{
                  color: "#B8A9C9",
                  fontSize: 14,
                  fontFamily: FONTS.body,
                  marginTop: 8,
                }}
              >
                {t("game:end.bothAmazing")}
              </Text>
            </>
          )}
        </Animated.View>

        {/* Score display */}
        {!isSoloMode && (
          <View
            style={{
              backgroundColor: "#1A1520",
              borderRadius: 24,
              paddingHorizontal: 40,
              paddingVertical: 24,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 32,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: "#B8A9C9",
                  fontSize: 14,
                  fontFamily: FONTS.body,
                  marginBottom: 4,
                }}
              >
                {t("common:teams.red")}
              </Text>
              <Text
                style={{
                  fontSize: 30,
                  color: "#ff6b6b",
                  fontFamily: "Bungee_400Regular",
                }}
              >
                {result.teamScores?.left ?? 0}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 20,
                color: "#7B6B8A",
                fontFamily: "Bungee_400Regular",
              }}
            >
              -
            </Text>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: "#B8A9C9",
                  fontSize: 14,
                  fontFamily: FONTS.body,
                  marginBottom: 4,
                }}
              >
                {t("common:teams.blue")}
              </Text>
              <Text
                style={{
                  fontSize: 30,
                  color: "#4ecdc4",
                  fontFamily: "Bungee_400Regular",
                }}
              >
                {result.teamScores?.right ?? 0}
              </Text>
            </View>
          </View>
        )}

        {/* Stats Table */}
        {result.stats && result.stats.length > 0 && (
          <View
            style={{
              backgroundColor: "#1A1520",
              borderRadius: 24,
              paddingHorizontal: 32,
              paddingVertical: 20,
              marginBottom: 24,
              width: "100%",
              maxWidth: 480,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: FONTS.bodyBold,
                color: "#FFFFFF",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {t("game:end.playerStats")}
            </Text>
            <View
              style={{
                flexDirection: "row",
                borderBottomWidth: 1,
                borderBottomColor: "#3D2E4A",
                paddingBottom: 8,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  color: "#B8A9C9",
                  fontSize: 12,
                  fontFamily: FONTS.bodyBold,
                }}
              >
                {t("game:end.player")}
              </Text>
              <Text
                style={{
                  width: 80,
                  color: "#B8A9C9",
                  fontSize: 12,
                  fontFamily: FONTS.bodyBold,
                  textAlign: "center",
                }}
              >
                {t("game:end.score")}
              </Text>
              <Text
                style={{
                  width: 80,
                  color: "#B8A9C9",
                  fontSize: 12,
                  fontFamily: FONTS.bodyBold,
                  textAlign: "center",
                }}
              >
                {t("game:end.accuracy")}
              </Text>
              <Text
                style={{
                  width: 80,
                  color: "#B8A9C9",
                  fontSize: 12,
                  fontFamily: FONTS.bodyBold,
                  textAlign: "center",
                }}
              >
                {t("game:end.avgTime")}
              </Text>
            </View>
            {result.stats.map((stat: PlayerStats) => {
              const accuracy =
                stat.totalAnswers > 0
                  ? Math.round((stat.correctAnswers / stat.totalAnswers) * 100)
                  : 0;
              return (
                <View
                  key={stat.playerId}
                  style={{
                    flexDirection: "row",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#231C2B",
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontFamily: FONTS.body,
                    }}
                    numberOfLines={1}
                  >
                    {stat.displayName}
                  </Text>
                  <Text
                    style={{
                      width: 80,
                      color: "#10B981",
                      fontSize: 13,
                      fontFamily: FONTS.bodyBold,
                      textAlign: "center",
                    }}
                  >
                    {stat.correctAnswers}/{stat.totalAnswers}
                  </Text>
                  <Text
                    style={{
                      width: 80,
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontFamily: FONTS.body,
                      textAlign: "center",
                    }}
                  >
                    {accuracy}%
                  </Text>
                  <Text
                    style={{
                      width: 80,
                      color: "#B8A9C9",
                      fontSize: 13,
                      fontFamily: FONTS.body,
                      textAlign: "center",
                    }}
                  >
                    {(stat.avgResponseTime / 1000).toFixed(1)}s
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <Animated.View style={[buttonsStyle, { gap: 10, alignItems: "center", width: "100%" }]}>
          <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
            <Pressable
              onPress={onPlayAgain}
              style={{ flex: 1, backgroundColor: "#10B981", paddingVertical: 20, borderRadius: 16, alignItems: "center" }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "Bungee_400Regular" }}>
                {t("game:end.playAgain")}
              </Text>
            </Pressable>

            <Pressable
              onPress={onExit}
              style={{
                flex: 1,
                backgroundColor: "#1A1520",
                borderWidth: 2,
                borderColor: "#3D2E4A",
                paddingVertical: 20,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "Bungee_400Regular" }}>
                {t("game:end.backToHome")}
              </Text>
            </Pressable>
          </View>

          {onReview && (
            <Pressable
              onPress={onReview}
              style={{
                width: "100%",
                backgroundColor: "#3D2E4A",
                borderWidth: 1,
                borderColor: "#6D4C8A",
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#C4B0D8", fontSize: 15, fontFamily: "Bungee_400Regular" }}>
                {t("game:end.reviewAnswers")}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ConnectionStatus } from "../common/ConnectionStatus";
import { MascotBuddy } from "../common";
import { QuestionCard } from "./QuestionCard";
import { TimerBar } from "./TimerBar";
import { RoundResultOverlay } from "./RoundResultOverlay";
import { GameEndOverlay } from "./GameEndOverlay";
import { StreakBadge } from "./StreakBadge";
import { ScorePop } from "./ScorePop";
import { FONTS } from "../../constants/theme";
import type { StoreQuestion, StoreRoundResult } from "../../stores/gameStore";
import type { GameEndResult } from "@shared/types/game.types";

interface SoloMultiplayerLayoutProps {
  isSoloMode: boolean;
  isChildDevice: boolean;
  scorePopKey: { left: number; right: number };
  teamScores: { left: number; right: number };
  timeRemaining: number;
  currentRound: number;
  maxRounds: number;
  currentQuestion: StoreQuestion | null;
  selectedAnswerLeft: number | null;
  selectedAnswerRight: number | null;
  roundResult: StoreRoundResult | null;
  showResult: boolean;
  showGameEnd: boolean;
  gameEndResult: GameEndResult | null;
  onAbandon: () => void;
  onAnswer: (index: number, side: "LEFT" | "RIGHT") => void;
  onPlayAgain: () => void;
  onExit: () => void;
  onReview: () => void;
  buddyMessage: string;
  buddyVisible: boolean;
  onHideBuddy: () => void;
}

export function SoloMultiplayerLayout({
  isSoloMode,
  isChildDevice,
  scorePopKey,
  teamScores,
  timeRemaining,
  currentRound,
  maxRounds,
  currentQuestion,
  selectedAnswerLeft,
  selectedAnswerRight,
  roundResult,
  showResult,
  showGameEnd,
  gameEndResult,
  onAbandon,
  onAnswer,
  onPlayAgain,
  onExit,
  onReview,
  buddyMessage,
  buddyVisible,
  onHideBuddy,
}: SoloMultiplayerLayoutProps) {
  const { t } = useTranslation(["game", "common"]);

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ConnectionStatus />

      {/* Scoreboard */}
      <View style={{ paddingTop: 6, paddingBottom: 2, alignItems: "center" }}>
        <Pressable
          onPress={onAbandon}
          style={{
            position: "absolute",
            left: 12,
            top: 6,
            width: 30,
            height: 30,
            backgroundColor: "rgba(26, 21, 32, 0.5)",
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <Text style={{ color: "#7B6B8A", fontSize: 13, fontWeight: "bold" }}>
            {"\u2715"}
          </Text>
        </Pressable>

        <View
          style={{
            backgroundColor: "#1A1520",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#3D2E4A",
            paddingHorizontal: 20,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
          }}
        >
          {isSoloMode ? (
            <>
              <View style={{ alignItems: "center", gap: 4 }}>
                <Text
                  style={{
                    color: "#7B6B8A",
                    fontSize: 10,
                    fontFamily: "LuckiestGuy_400Regular",
                    letterSpacing: 1,
                  }}
                >
                  {t("game:roundLabel", { current: currentRound, max: maxRounds })}
                </Text>
                <TimerBar timeRemaining={timeRemaining} maxTime={30} />
              </View>
              <View style={{ alignItems: "center", minWidth: 50 }}>
                <Text
                  style={{
                    color: "#A78BFA",
                    fontSize: 10,
                    fontFamily: "LuckiestGuy_400Regular",
                    letterSpacing: 1,
                  }}
                >
                  {t("game:scoreboard.score")}
                </Text>
                <View style={{ position: "relative" }}>
                  {scorePopKey.left > 0 && (
                    <ScorePop key={`left-${scorePopKey.left}`} side="left" />
                  )}
                  <Text style={{ color: "#ffffff", fontSize: 24, fontFamily: "Bungee_400Regular" }}>
                    {teamScores.left}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={{ alignItems: "center", minWidth: 40 }}>
                <Text
                  style={{
                    color: "#B8A9C9",
                    fontSize: 10,
                    fontFamily: "LuckiestGuy_400Regular",
                    letterSpacing: 1,
                  }}
                >
                  {t("common:teams.red")}
                </Text>
                <View style={{ position: "relative" }}>
                  {scorePopKey.left > 0 && (
                    <ScorePop key={`left-${scorePopKey.left}`} side="left" />
                  )}
                  <Text style={{ color: "#ffffff", fontSize: 24, fontFamily: "Bungee_400Regular" }}>
                    {teamScores.left}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: "center", gap: 4 }}>
                <Text
                  style={{
                    color: "#7B6B8A",
                    fontSize: 10,
                    fontFamily: "LuckiestGuy_400Regular",
                    letterSpacing: 1,
                  }}
                >
                  {t("game:roundLabel", { current: currentRound, max: maxRounds })}
                </Text>
                <TimerBar timeRemaining={timeRemaining} maxTime={30} />
              </View>

              <View style={{ alignItems: "center", minWidth: 40 }}>
                <Text
                  style={{
                    color: "#B8A9C9",
                    fontSize: 10,
                    fontFamily: "LuckiestGuy_400Regular",
                    letterSpacing: 1,
                  }}
                >
                  {t("common:teams.blue")}
                </Text>
                <View style={{ position: "relative" }}>
                  {scorePopKey.right > 0 && (
                    <ScorePop key={`right-${scorePopKey.right}`} side="right" />
                  )}
                  <Text style={{ color: "#ffffff", fontSize: 24, fontFamily: "Bungee_400Regular" }}>
                    {teamScores.right}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Progress + Streak + Dominance */}
      <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Text style={{ color: "#7B6B8A", fontSize: 11, fontFamily: FONTS.body }}>
            {t("game:questionProgress", { current: currentRound, max: maxRounds })}
          </Text>
          <StreakBadge />
        </View>
        <View style={{ height: 4, backgroundColor: "#1A1520", borderRadius: 2, overflow: "hidden" }}>
          <View
            style={{
              height: "100%",
              borderRadius: 2,
              backgroundColor: "#9B59B6",
              width: `${(currentRound / maxRounds) * 100}%`,
            }}
          />
        </View>
        {!isSoloMode && (
          <View>
            <View
              style={{
                height: 8,
                backgroundColor: "#1A1520",
                borderRadius: 4,
                overflow: "hidden",
                flexDirection: "row",
              }}
            >
              <View
                style={{
                  flex: Math.max(teamScores.left, 1),
                  backgroundColor: "#ff6b6b",
                  borderTopLeftRadius: 4,
                  borderBottomLeftRadius: 4,
                }}
              />
              <View
                style={{
                  flex: Math.max(teamScores.right, 1),
                  backgroundColor: "#4ecdc4",
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
              <Text
                style={{
                  color: teamScores.left > teamScores.right ? "#ff6b6b" : "#5A4B6B",
                  fontSize: 9,
                  fontFamily: FONTS.bodySemiBold,
                }}
              >
                {teamScores.left > teamScores.right ? t("common:teams.red") + " ▲" : ""}
              </Text>
              <Text
                style={{
                  color: teamScores.right > teamScores.left ? "#4ecdc4" : "#5A4B6B",
                  fontSize: 9,
                  fontFamily: FONTS.bodySemiBold,
                }}
              >
                {teamScores.right > teamScores.left ? "▲ " + t("common:teams.blue") : ""}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Question cards */}
      <View
        className={`flex-1 px-3 pb-3 ${isSoloMode || isChildDevice ? "flex-col" : "flex-row"}`}
        style={{ gap: 8 }}
      >
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswerLeft}
          correctIndex={isSoloMode ? currentQuestion?.correctIndex : undefined}
          roundResult={showResult ? roundResult : null}
          onAnswer={(index) => onAnswer(index, "LEFT")}
          teamSide="LEFT"
          teamColor={isSoloMode ? "#A78BFA" : "#ff6b6b"}
        />
        {!isSoloMode && !isChildDevice && (
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswerRight}
            roundResult={showResult ? roundResult : null}
            onAnswer={(index) => onAnswer(index, "RIGHT")}
            teamSide="RIGHT"
            teamColor="#4ecdc4"
          />
        )}
      </View>

      {showResult && roundResult && !showGameEnd && (
        <RoundResultOverlay result={roundResult} />
      )}
      {showGameEnd && gameEndResult && (
        <GameEndOverlay
          result={gameEndResult}
          onPlayAgain={onPlayAgain}
          onExit={onExit}
          onReview={onReview}
        />
      )}

      <MascotBuddy
        message={buddyMessage}
        visible={buddyVisible}
        onHide={onHideBuddy}
        displayDurationMs={2500}
      />
    </SafeAreaView>
  );
}

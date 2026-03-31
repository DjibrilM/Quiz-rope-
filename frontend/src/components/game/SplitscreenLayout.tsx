import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import { ConnectionStatus } from "../common/ConnectionStatus";
import { QuestionCard } from "./QuestionCard";
import { GameEndOverlay } from "./GameEndOverlay";
import { ScorePop } from "./ScorePop";
import { FONTS } from "../../constants/theme";
import type { StoreQuestion } from "../../stores/gameStore";
import type { GameEndResult } from "@shared/types/game.types";

interface SplitscreenLayoutProps {
  p1Name: string;
  p2Name: string;
  p1Id?: string;
  matchId: string | string[] | undefined;
  subject: string;
  scorePopKey: { left: number; right: number };
  teamScores: { left: number; right: number };
  currentQuestion: StoreQuestion | null;
  selectedAnswerLeft: number | null;
  selectedAnswerRight: number | null;
  allAnswered: boolean;
  timeRemaining: number;
  currentRound: number;
  maxRounds: number;
  onAnswer: (index: number, side: "LEFT" | "RIGHT") => void;
  onAbandon: () => void;
  showGameEnd: boolean;
  gameEndResult: GameEndResult | null;
  onPlayAgain: () => void;
  onExit: () => void;
  onReview: () => void;
}

export function SplitscreenLayout({
  p1Name,
  p2Name,
  scorePopKey,
  teamScores,
  currentQuestion,
  selectedAnswerLeft,
  selectedAnswerRight,
  allAnswered,
  timeRemaining,
  currentRound,
  maxRounds,
  onAnswer,
  onAbandon,
  showGameEnd,
  gameEndResult,
  onPlayAgain,
  onExit,
  onReview,
}: SplitscreenLayoutProps) {
  useEffect(() => {
    if (showGameEnd) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
  }, [showGameEnd]);

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#0D0B14" }}
    >
      <ConnectionStatus />
      <View style={{ flex: 1, flexDirection: "row" }}>

        {/* ── P1 LEFT HALF ── normal orientation */}
        <View style={{ flex: 1, flexDirection: "column" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#EF4444", fontSize: 13, fontFamily: FONTS.bodyBold }}>
              {p1Name || "Red Team"}
            </Text>
            <View style={{ position: "relative" }}>
              {scorePopKey.left > 0 && (
                <ScorePop key={`left-${scorePopKey.left}`} side="left" />
              )}
              <Text style={{ color: "#FFFFFF", fontSize: 22, fontFamily: FONTS.bodyExtraBold }}>
                {teamScores.left}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, padding: 6 }}>
            <QuestionCard
              question={currentQuestion}
              selectedAnswer={selectedAnswerLeft}
              correctIndex={allAnswered ? currentQuestion?.correctIndex : undefined}
              roundResult={null}
              onAnswer={(index) => onAnswer(index, "LEFT")}
              teamSide="LEFT"
              teamColor="#EF4444"
              compact
            />
          </View>
        </View>

        {/* ── CENTER VERTICAL DIVIDER ── */}
        <View
          style={{
            width: 52,
            backgroundColor: "rgba(0,0,0,0.2)",
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.05)",
            flexDirection: "column",
            alignItems: "center",
            paddingVertical: 12,
            gap: 8,
          }}
        >
          <Pressable
            onPress={onAbandon}
            style={{
              width: 28,
              height: 28,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#7B6B8A", fontSize: 13, fontWeight: "bold" }}>
              {"\u2715"}
            </Text>
          </Pressable>

          <Text
            style={{
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: 10,
              fontFamily: FONTS.bodyExtraBold,
              textAlign: "center",
            }}
          >
            {currentRound}/{maxRounds}
          </Text>

          <Text
            style={{
              color: timeRemaining <= 5 ? "#EF4444" : "rgba(255, 255, 255, 0.9)",
              fontSize: 22,
              fontFamily: FONTS.bodyExtraBold,
              textAlign: "center",
            }}
          >
            {timeRemaining}
          </Text>

          {/* Vertical dominance bar */}
          <View
            style={{
              flex: 1,
              width: 10,
              borderRadius: 5,
              overflow: "hidden",
              flexDirection: "column",
            }}
          >
            <View style={{ flex: Math.max(teamScores.left, 1), backgroundColor: "#EF4444" }} />
            <View style={{ flex: Math.max(teamScores.right, 1), backgroundColor: "#3B82F6" }} />
          </View>
        </View>

        {/* ── P2 RIGHT HALF ── rotated 180° */}
        <View
          style={{
            flex: 1,
            flexDirection: "column",
            transform: [{ rotate: "180deg" }],
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#3B82F6", fontSize: 13, fontFamily: FONTS.bodyBold }}>
              {p2Name || "Blue Team"}
            </Text>
            <View style={{ position: "relative" }}>
              {scorePopKey.right > 0 && (
                <ScorePop key={`right-${scorePopKey.right}`} side="right" />
              )}
              <Text style={{ color: "#FFFFFF", fontSize: 22, fontFamily: FONTS.bodyExtraBold }}>
                {teamScores.right}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, padding: 6 }}>
            <QuestionCard
              question={currentQuestion}
              selectedAnswer={selectedAnswerRight}
              correctIndex={allAnswered ? currentQuestion?.correctIndex : undefined}
              roundResult={null}
              onAnswer={(index) => onAnswer(index, "RIGHT")}
              teamSide="RIGHT"
              teamColor="#3B82F6"
              compact
            />
          </View>
        </View>

      </View>

      {showGameEnd && gameEndResult && (
        <GameEndOverlay
          result={gameEndResult}
          onPlayAgain={onPlayAgain}
          onExit={onExit}
          onReview={onReview}
        />
      )}
    </SafeAreaView>
  );
}

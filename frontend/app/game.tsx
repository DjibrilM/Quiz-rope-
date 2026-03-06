import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGameOrientation } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { socketService } from "../src/services/socket";
import { soundService } from "../src/services/sound";
import { hapticsService } from "../src/services/haptics";
import { ConnectionStatus } from "../src/components/common/ConnectionStatus";
import {
  QuestionCard,
  TimerBar,
  RoundResultOverlay,
  GameEndOverlay,
  StreakBadge,
} from "../src/components/game";
import { FONTS } from "../src/constants/theme";
import type { StoreQuestion, StoreRoundResult } from "../src/stores/gameStore";
import { SAMPLE_QUESTIONS } from "../src/constants/sampleQuestions";

const MOCK_QUESTIONS: StoreQuestion[] = SAMPLE_QUESTIONS;

export default function GameScreen() {
  const { t } = useTranslation(["game", "common"]);
  const userRole = useGameOrientation();
  const isChildDevice = userRole === "child";
  const { matchId } = useLocalSearchParams();
  const {
    teamScores,
    setTeamScores,
    updateTeamScore,
    currentQuestion,
    setCurrentQuestion,
    timeRemaining,
    setTimeRemaining,
    roundResult,
    setRoundResult,
    gameEndResult,
    setGameEndResult,
    currentMatch,
    resetGame,
    incrementStreak,
    resetStreak,
  } = useGameStore();

  const isSoloMode = currentMatch?.gameMode === "solo";

  const [currentRound, setCurrentRound] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showGameEnd, setShowGameEnd] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTimeRef = useRef(30);

  useEffect(() => {
    soundService.play('gameStart');

    setCurrentQuestion(MOCK_QUESTIONS[0]);
    setTimeRemaining(30);
    setTeamScores({ left: 0, right: 0 });

    const socket = socketService.getSocket();
    if (socket) {
      socket.on("game:question", (data: unknown) => {
        setCurrentQuestion(data as StoreQuestion);
        setSelectedAnswer(null);
        setShowResult(false);
      });
      socket.on("game:score-update", (data: unknown) => {
        const d = data as { left: number; right: number };
        setTeamScores(d);
      });
      socket.on("game:round-result", (data: unknown) => {
        setRoundResult(data as StoreRoundResult);
        setShowResult(true);
      });
      socket.on("game:timer", (data: unknown) => {
        const d = data as { timeRemaining: number };
        setTimeRemaining(d.timeRemaining);
      });
      socket.on("game:end", (data: unknown) => {
        setGameEndResult(data as typeof gameEndResult);
        setShowGameEnd(true);
        soundService.play('gameEnd');
        hapticsService.heavy();
      });
    }

    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (socket) {
        socket.off("game:question");
        socket.off("game:score-update");
        socket.off("game:round-result");
        socket.off("game:timer");
        socket.off("game:end");
      }
    };
  }, []);

  useEffect(() => {
    if (timeRemaining <= 5 && timeRemaining > 0 && prevTimeRef.current !== timeRemaining) {
      soundService.play('countdown');
      hapticsService.light();
    }
    prevTimeRef.current = timeRemaining;
  }, [timeRemaining]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let t = 30;
    setTimeRemaining(30);
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeRemaining(t);
      if (t <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);
  };

  const handleAnswer = useCallback(
    (answerIndex: number, teamSide: "LEFT" | "RIGHT") => {
      if (selectedAnswer !== null) return;
      setSelectedAnswer(answerIndex);
      if (timerRef.current) clearInterval(timerRef.current);

      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit("game:answer", {
          matchId,
          playerId: "mock-player",
          teamSide,
          answerIndex,
          responseTime: (30 - timeRemaining) * 1000,
        });
        return;
      }

      const currentQ = MOCK_QUESTIONS[(currentRound - 1) % MOCK_QUESTIONS.length];
      const isCorrect = answerIndex === currentQ.correctIndex;

      // Points-based scoring: +10 for correct answer
      if (isCorrect) {
        updateTeamScore(teamSide.toLowerCase() as "left" | "right", 10);
        incrementStreak();
        soundService.play('correct');
        hapticsService.success();
      } else {
        resetStreak();
        soundService.play('wrong');
        hapticsService.error();
      }

      const newLeftScore = teamScores.left + (isCorrect && teamSide === "LEFT" ? 10 : 0);
      const newRightScore = teamScores.right + (isCorrect && teamSide === "RIGHT" ? 10 : 0);

      const result: StoreRoundResult = {
        isCorrect,
        correctIndex: currentQ.correctIndex,
        ropeMovement: 0,
        newRopePosition: 0,
      };
      setShowResult(true);
      setRoundResult(result);

      setTimeout(() => {
        const nextRound = currentRound + 1;
        const maxRounds = currentMatch?.maxRounds || 10;

        if (nextRound > maxRounds) {
          if (isSoloMode) {
            setShowGameEnd(true);
            soundService.play('gameEnd');
            hapticsService.heavy();
            setGameEndResult({
              matchId: matchId as string,
              winnerTeamId: "LEFT",
              finalRopePosition: 0,
              teamScores: { left: newLeftScore, right: 0 },
              stats: [
                {
                  playerId: "solo-player",
                  displayName: "You",
                  correctAnswers: newLeftScore / 10,
                  totalAnswers: nextRound - 1,
                  avgResponseTime: Math.round(Math.random() * 5000 + 2000),
                },
              ],
            });
          } else {
            const winner = newLeftScore >= newRightScore ? "LEFT" : "RIGHT";
            setShowGameEnd(true);
            soundService.play('gameEnd');
            hapticsService.heavy();
            setGameEndResult({
              matchId: matchId as string,
              winnerTeamId: winner,
              finalRopePosition: 0,
              teamScores: { left: newLeftScore, right: newRightScore },
              stats: [
                {
                  playerId: "player-red-1",
                  displayName: "Red Player",
                  correctAnswers: newLeftScore / 10,
                  totalAnswers: nextRound - 1,
                  avgResponseTime: Math.round(Math.random() * 5000 + 2000),
                },
                {
                  playerId: "player-blue-1",
                  displayName: "Blue Player",
                  correctAnswers: newRightScore / 10,
                  totalAnswers: nextRound - 1,
                  avgResponseTime: Math.round(Math.random() * 5000 + 2000),
                },
              ],
            });
          }
        } else {
          setCurrentRound(nextRound);
          const nextQ = MOCK_QUESTIONS[(nextRound - 1) % MOCK_QUESTIONS.length];
          setCurrentQuestion(nextQ);
          setSelectedAnswer(null);
          setShowResult(false);
          startTimer();
        }
      }, 2500);
    },
    [selectedAnswer, timeRemaining, currentRound, currentMatch, teamScores, isSoloMode]
  );

  const handleAbandon = useCallback(() => {
    Alert.alert(
      t("game:quit.title"),
      t("game:quit.message"),
      [
        { text: t("game:quit.keepPlaying"), style: "cancel" },
        {
          text: t("game:quit.quitButton"),
          style: "destructive",
          onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            const socket = socketService.getSocket();
            if (socket?.connected) {
              socket.emit("game:abandon", { matchId, playerId: "mock-player" });
            }
            resetGame();
            hapticsService.medium();
            router.replace("/home");
          },
        },
      ]
    );
  }, [matchId, resetGame, t]);

  const handlePlayAgain = () => {
    setShowGameEnd(false);
    setCurrentRound(1);
    setSelectedAnswer(null);
    setShowResult(false);
    setTeamScores({ left: 0, right: 0 });
    resetStreak();
    setCurrentQuestion(MOCK_QUESTIONS[0]);
    soundService.play('gameStart');
    startTimer();
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ConnectionStatus />

      {/* Scoreboard */}
      <View style={{ paddingTop: 6, paddingBottom: 2, alignItems: "center" }}>
        <Pressable
          onPress={handleAbandon}
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
            /* Solo scoreboard: single centered score */
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
                  {t("game:roundLabel", { current: currentRound, max: currentMatch?.maxRounds || 10 })}
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
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 24,
                    fontFamily: "Bungee_400Regular",
                  }}
                >
                  {teamScores.left}
                </Text>
              </View>
            </>
          ) : (
            /* Multiplayer scoreboard: RED vs BLUE */
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
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 24,
                    fontFamily: "Bungee_400Regular",
                  }}
                >
                  {teamScores.left}
                </Text>
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
                  {t("game:roundLabel", { current: currentRound, max: currentMatch?.maxRounds || 10 })}
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
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 24,
                    fontFamily: "Bungee_400Regular",
                  }}
                >
                  {teamScores.right}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Progress bar + Streak */}
      <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Text
            style={{
              color: "#7B6B8A",
              fontSize: 11,
              fontFamily: FONTS.body,
            }}
          >
            {t("game:questionProgress", { current: currentRound, max: currentMatch?.maxRounds || 10 })}
          </Text>
          <StreakBadge />
        </View>
        <View
          style={{
            height: 4,
            backgroundColor: "#1A1520",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              borderRadius: 2,
              backgroundColor: "#9B59B6",
              width: `${(currentRound / (currentMatch?.maxRounds || 10)) * 100}%`,
            }}
          />
        </View>
      </View>

      {/* Question cards */}
      <View
        className={`flex-1 px-3 pb-3 ${isSoloMode || isChildDevice ? "flex-col" : "flex-row"}`}
        style={{ gap: 8 }}
      >
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          roundResult={showResult ? roundResult : null}
          onAnswer={(index: number) => handleAnswer(index, "LEFT")}
          teamSide="LEFT"
          teamColor={isSoloMode ? "#A78BFA" : "#ff6b6b"}
        />
        {!isSoloMode && !isChildDevice && (
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            roundResult={showResult ? roundResult : null}
            onAnswer={(index: number) => handleAnswer(index, "RIGHT")}
            teamSide="RIGHT"
            teamColor="#4ecdc4"
          />
        )}
      </View>

      {/* Overlays */}
      {showResult && roundResult && !showGameEnd && (
        <RoundResultOverlay result={roundResult} />
      )}
      {showGameEnd && gameEndResult && (
        <GameEndOverlay
          result={gameEndResult}
          onPlayAgain={handlePlayAgain}
          onExit={() => router.replace("/home")}
        />
      )}
    </SafeAreaView>
  );
}

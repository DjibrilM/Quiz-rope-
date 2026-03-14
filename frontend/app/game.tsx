import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback, useRef, memo } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useGameOrientation } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { socketService } from "../src/services/socket";
import { soundService } from "../src/services/sound";
import { hapticsService } from "../src/services/haptics";
import { apiService } from "../src/services/api";
import { ConnectionStatus } from "../src/components/common/ConnectionStatus";
import {
  QuestionCard,
  TimerBar,
  RoundResultOverlay,
  GameEndOverlay,
  StreakBadge,
} from "../src/components/game";
import { MascotBuddy } from "../src/components/common";
import { FONTS } from "../src/constants/theme";
import type {
  StoreQuestion,
  StoreRoundResult,
  CorrectionItem,
} from "../src/stores/gameStore";
import { SAMPLE_QUESTIONS } from "../src/constants/sampleQuestions";

const FALLBACK_QUESTIONS: StoreQuestion[] = SAMPLE_QUESTIONS;

/** Shuffle a question's options using Fisher-Yates, keeping correctIndex in sync. */
function shuffleOptions(q: StoreQuestion): StoreQuestion {
  const options = [...q.options];
  const n = options.length;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const correctIndex = options.indexOf(q.options[q.correctIndex]);
  return { ...q, options, correctIndex };
}

// Floating "+10" that pops up and fades when the score increments
const ScorePop = memo(function ScorePop({ side }: { side: "left" | "right" }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = 0;
    opacity.value = 1;
    translateY.value = withTiming(-32, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(0, { duration: 500 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    position: "absolute" as const,
    bottom: "100%",
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none" as any,
  }));

  return (
    <Animated.View style={style}>
      <Text
        style={{
          color: "#10B981",
          fontSize: 16,
          fontFamily: "Bungee_400Regular",
        }}
      >
        +10
      </Text>
    </Animated.View>
  );
});

export default function GameScreen() {
  const { t } = useTranslation(["game", "common"]);
  const userRole = useGameOrientation();
  const insets = useSafeAreaInsets();
  const isChildDevice = userRole === "child" || userRole === "guest";
  const { matchId, p1Name, p2Name } = useLocalSearchParams();
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
    pushCorrection,
    clearCorrection,
  } = useGameStore();

  const isSoloMode = currentMatch?.gameMode === "solo";
  const isSplitscreen = currentMatch?.gameMode === "splitscreen";
  // Both solo and splitscreen run locally (no socket required)
  const isLocalMode = isSoloMode || isSplitscreen;

  // Questions: fetched from backend (Gemini/AI), fallback to local samples on error
  const questionsRef = useRef<StoreQuestion[]>(FALLBACK_QUESTIONS);
  // Track correct answers per side without depending on Zustand closure values
  const correctCountRef = useRef({ left: 0, right: 0 });

  const [currentRound, setCurrentRound] = useState(1);
  const [selectedAnswerLeft, setSelectedAnswerLeft] = useState<number | null>(null);
  const [selectedAnswerRight, setSelectedAnswerRight] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showGameEnd, setShowGameEnd] = useState(false);
  // allAnswered: true when the round is over and correct answers should be revealed
  const [allAnswered, setAllAnswered] = useState(false);
  // Key increments each correct answer to re-mount ScorePop and re-trigger its animation
  const [scorePopKey, setScorePopKey] = useState<{
    left: number;
    right: number;
  }>({ left: 0, right: 0 });

  // Mascot Buddy State
  const [buddyVisible, setBuddyVisible] = useState(false);
  const [buddyMessage, setBuddyMessage] = useState("");
  const { streak } = useGameStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTimeRef = useRef(30);

  // Refs to break circular dependency between startTimer and handleTimeout
  const handleTimeoutRef = useRef<(() => void) | null>(null);
  const startTimerRef = useRef<(() => void) | null>(null);

  const startTimer = useCallback(() => {
    // Remote multiplayer: server drives the timer via game:timer events
    if (!isLocalMode) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    let t = 30;
    setTimeRemaining(30);
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeRemaining(t);
      if (t <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        handleTimeoutRef.current?.();
      }
    }, 1000);
  }, [setTimeRemaining]);

  // Keep startTimerRef pointing to the latest startTimer
  startTimerRef.current = startTimer;

  useEffect(() => {
    soundService.play("gameStart");
    setTeamScores({ left: 0, right: 0 });
    clearCorrection();

    const socket = socketService.getSocket();

    if (!isLocalMode && socket?.connected) {
      // Multiplayer: rejoin the room (server drives questions and timer via events).
      // The first question was already set in the store by lobby's game:question listener.
      socket.emit("match:join", {
        matchId,
        playerId: "game-player",
        teamSide: "LEFT",
      });

      socket.on("game:question", (data: unknown) => {
        setCurrentQuestion(data as StoreQuestion);
        setSelectedAnswerLeft(null);
        setSelectedAnswerRight(null);
        setAllAnswered(false);
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
        soundService.play("gameEnd");
        hapticsService.heavy();
      });
    } else {
      // Solo: fetch AI-generated questions from backend then start local timer.
      // Timer deferred until after fetch so the countdown begins on a real question.
      const loadQuestionsAndStart = async () => {
        try {
          if (matchId) {
            const match = (await apiService.getMatch(matchId as string)) as any;
            const fetched: StoreQuestion[] = (match?.questions || [])
              .filter((q: any) => q?.text && Array.isArray(q.options))
              .map((q: any) =>
                shuffleOptions({
                  id: q._id || q.id || "",
                  text: q.text,
                  options: q.options,
                  correctIndex: q.correctIndex,
                  explanation: q.explanation || "",
                  subject: q.subject || "",
                }),
              );
            if (fetched.length > 0) {
              questionsRef.current = fetched;
              setCurrentQuestion(fetched[0]);
            } else {
              setCurrentQuestion(FALLBACK_QUESTIONS[0]);
            }
          } else {
            setCurrentQuestion(FALLBACK_QUESTIONS[0]);
          }
        } catch {
          setCurrentQuestion(FALLBACK_QUESTIONS[0]);
        }
        startTimerRef.current?.();
      };
      loadQuestionsAndStart();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = null;
      }
      setBuddyVisible(false);
      const s = socketService.getSocket();
      if (s) {
        s.off("game:question");
        s.off("game:score-update");
        s.off("game:round-result");
        s.off("game:timer");
        s.off("game:end");
      }
    };
  }, []);

  useEffect(() => {
    if (
      timeRemaining <= 5 &&
      timeRemaining > 0 &&
      prevTimeRef.current !== timeRemaining
    ) {
      soundService.play("countdown");
      hapticsService.light();
    }
    prevTimeRef.current = timeRemaining;
  }, [timeRemaining]);

  // Called when a round ends (either by answer or timeout) to trigger game end or next round
  const endRound = useCallback(
    (nextRound: number, newLeftScore: number, newRightScore: number) => {
      const maxRounds = currentMatch?.maxRounds || 10;

      if (nextRound > maxRounds) {
        setShowGameEnd(true);
        soundService.play("gameEnd");
        hapticsService.heavy();

        if (matchId) {
          const winner = newLeftScore >= newRightScore ? "LEFT" : "RIGHT";
          apiService
            .completeMatch(matchId as string, {
              winner,
              rounds: nextRound - 1,
            })
            .catch(() => {
              /* best-effort */
            });
        }

        const totalRounds = nextRound - 1;
        if (isSoloMode) {
          setGameEndResult({
            matchId: matchId as string,
            winnerTeamId: "LEFT",
            finalRopePosition: 0,
            teamScores: { left: newLeftScore, right: 0 },
            stats: [
              {
                playerId: "solo-player",
                displayName: "You",
                correctAnswers: correctCountRef.current.left,
                totalAnswers: totalRounds,
                avgResponseTime: Math.round(Math.random() * 5000 + 2000),
              },
            ],
          });
        } else {
          const winner = newLeftScore >= newRightScore ? "LEFT" : "RIGHT";
          const p1 = (p1Name as string) || "Red Player";
          const p2 = (p2Name as string) || "Blue Player";
          setGameEndResult({
            matchId: matchId as string,
            winnerTeamId: winner,
            finalRopePosition: 0,
            teamScores: { left: newLeftScore, right: newRightScore },
            stats: [
              {
                playerId: isSplitscreen ? p1 : "player-red-1",
                displayName: isSplitscreen ? p1 : "Red Player",
                correctAnswers: correctCountRef.current.left,
                totalAnswers: totalRounds,
                avgResponseTime: Math.round(Math.random() * 5000 + 2000),
              },
              {
                playerId: isSplitscreen ? p2 : "player-blue-1",
                displayName: isSplitscreen ? p2 : "Blue Player",
                correctAnswers: correctCountRef.current.right,
                totalAnswers: totalRounds,
                avgResponseTime: Math.round(Math.random() * 5000 + 2000),
              },
            ],
          });
        }
      } else {
        if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
        // Solo: 1200ms is enough for kids to see the result and stay engaged.
        // Splitscreen: 1800ms gives both players time to see the answer reveal.
        resultTimeoutRef.current = setTimeout(
          () => {
            setCurrentRound(nextRound);
            setCurrentQuestion(
              questionsRef.current[
                (nextRound - 1) % questionsRef.current.length
              ],
            );
            setSelectedAnswerLeft(null);
            setSelectedAnswerRight(null);
            setAllAnswered(false);
            setShowResult(false);
            startTimerRef.current?.();
          },
          isSplitscreen ? 1800 : 1200,
        );
      }
    },
    [currentMatch, isSoloMode, isSplitscreen, matchId, p1Name, p2Name, setGameEndResult, setCurrentQuestion],
  );

  // Called when timer runs out with no answer — treats round as wrong/skipped
  const handleTimeout = useCallback(() => {
    // Remote multiplayer: server handles timeout
    if (!isLocalMode) return;

    // Solo: LEFT player already answered. Splitscreen: both already answered.
    const soloAnswered = isSoloMode && selectedAnswerLeft !== null;
    const splitAnswered = !isSoloMode && selectedAnswerLeft !== null && selectedAnswerRight !== null;
    if (soloAnswered || splitAnswered) return;

    const currentQ =
      questionsRef.current[(currentRound - 1) % questionsRef.current.length];

    pushCorrection({
      questionText: currentQ.text,
      options: currentQ.options,
      correctIndex: currentQ.correctIndex,
      explanation: currentQ.explanation || "",
      userAnswerIndex: -1,
      isCorrect: false,
    } as CorrectionItem);

    // Buddy feedback for timeout
    if (Math.random() > 0.5) {
      setBuddyMessage(
        t("game:buddy.timeout", "Too slow! Let's get the next one! ⏰"),
      );
      setBuddyVisible(true);
    }

    resetStreak();
    soundService.play("wrong");
    hapticsService.error();

    const result: StoreRoundResult = {
      isCorrect: false,
      correctIndex: currentQ.correctIndex,
      ropeMovement: 0,
      newRopePosition: 0,
    };
    setRoundResult(result);
    setShowResult(true);
    setAllAnswered(true);

    endRound(currentRound + 1, teamScores.left, teamScores.right);
  }, [
    isSoloMode,
    selectedAnswerLeft,
    selectedAnswerRight,
    currentRound,
    teamScores,
    resetStreak,
    setRoundResult,
    pushCorrection,
    endRound,
  ]);

  // Keep handleTimeoutRef pointing to the latest handleTimeout
  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  }, [handleTimeout]);

  const handleAnswer = useCallback(
    (answerIndex: number, teamSide: "LEFT" | "RIGHT") => {
      // Per-side guard: each player can only answer once per round
      if (teamSide === "LEFT" && selectedAnswerLeft !== null) return;
      if (teamSide === "RIGHT" && selectedAnswerRight !== null) return;
      if (teamSide === "LEFT") setSelectedAnswerLeft(answerIndex);
      else setSelectedAnswerRight(answerIndex);

      // In solo mode stop the timer immediately. In splitscreen keep it running
      // so the other player still has a chance to answer before time runs out.
      const isSecondSplitscreenAnswer =
        !isSoloMode &&
        ((teamSide === "LEFT" && selectedAnswerRight !== null) ||
          (teamSide === "RIGHT" && selectedAnswerLeft !== null));
      if (isSoloMode || isSecondSplitscreenAnswer) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }

      const currentQ =
        questionsRef.current[(currentRound - 1) % questionsRef.current.length];
      const isCorrect = answerIndex === currentQ.correctIndex;

      // Persist answer to backend (best-effort, non-blocking)
      // Use real player names as playerIds for splitscreen analytics
      if (matchId) {
        const playerId = isSoloMode
          ? "mock-player"
          : isSplitscreen
            ? (teamSide === "LEFT"
                ? ((p1Name as string) || "player-red")
                : ((p2Name as string) || "player-blue"))
            : teamSide === "LEFT"
              ? "player-red"
              : "player-blue";
        apiService
          .submitAnswer(matchId as string, {
            playerId,
            teamSide,
            answerIndex,
            responseTime: (30 - timeRemaining) * 1000,
            questionId: currentQ.id,
            isCorrect,
          })
          .catch(() => {
            /* best-effort */
          });
      }

      pushCorrection({
        questionText: currentQ.text,
        options: currentQ.options,
        correctIndex: currentQ.correctIndex,
        explanation: currentQ.explanation || "",
        userAnswerIndex: answerIndex,
        isCorrect,
      } as CorrectionItem);

      if (isCorrect) {
        const side = teamSide.toLowerCase() as "left" | "right";
        correctCountRef.current[side] += 1;
        updateTeamScore(side, 10);
        incrementStreak();
        soundService.play("correct");
        hapticsService.success();
        setScorePopKey((prev) => ({ ...prev, [side]: prev[side] + 1 }));

        // Buddy feedback for streaks / fast answers
        const currentStreak = streak + 1;
        if (currentStreak === 3) {
          setBuddyMessage(t("game:buddy.streak3", "On fire! 3 in a row! 🔥"));
          setBuddyVisible(true);
        } else if (currentStreak === 5) {
          setBuddyMessage(t("game:buddy.streak5", "Unstoppable! 🚀"));
          setBuddyVisible(true);
        } else if (timeRemaining > 25 && Math.random() > 0.3) {
          setBuddyMessage(t("game:buddy.fast", "Lightning fast! ⚡️"));
          setBuddyVisible(true);
        }
      } else {
        // Occasional encouragement on wrong answer
        if (streak > 2) {
          setBuddyMessage(
            t("game:buddy.streakLost", "Oh no, streak lost! Rebuild it! 💪"),
          );
          setBuddyVisible(true);
        }
        resetStreak();
        soundService.play("wrong");
        hapticsService.error();
      }

      const newLeftScore =
        teamScores.left + (isCorrect && teamSide === "LEFT" ? 10 : 0);
      const newRightScore =
        teamScores.right + (isCorrect && teamSide === "RIGHT" ? 10 : 0);

      const result: StoreRoundResult = {
        isCorrect,
        correctIndex: currentQ.correctIndex,
        ropeMovement: 0,
        newRopePosition: 0,
      };
      setRoundResult(result);
      setShowResult(true);

      // Solo: end round immediately. Splitscreen: end only when both players answered.
      if (isSoloMode || isSecondSplitscreenAnswer) {
        setAllAnswered(true);
        endRound(currentRound + 1, newLeftScore, newRightScore);
      }
    },
    [
      selectedAnswerLeft,
      selectedAnswerRight,
      timeRemaining,
      currentRound,
      currentMatch,
      matchId,
      teamScores,
      isSoloMode,
      isSplitscreen,
      p1Name,
      p2Name,
      endRound,
      updateTeamScore,
      incrementStreak,
      resetStreak,
      setRoundResult,
      pushCorrection,
      setScorePopKey,
    ],
  );

  const handleAbandon = useCallback(() => {
    Alert.alert(t("game:quit.title"), t("game:quit.message"), [
      { text: t("game:quit.keepPlaying"), style: "cancel" },
      {
        text: t("game:quit.quitButton"),
        style: "destructive",
        onPress: () => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (resultTimeoutRef.current) {
            clearTimeout(resultTimeoutRef.current);
            resultTimeoutRef.current = null;
          }
          if (!isSoloMode) {
            socketService
              .getSocket()
              ?.emit("game:abandon", { matchId, playerId: "mock-player" });
          }
          resetGame();
          hapticsService.medium();
          router.back();
        },
      },
    ]);
  }, [matchId, resetGame, t]);

  const handlePlayAgain = () => {
    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = null;
    }
    correctCountRef.current = { left: 0, right: 0 };
    setShowGameEnd(false);
    setCurrentRound(1);
    setSelectedAnswerLeft(null);
    setSelectedAnswerRight(null);
    setAllAnswered(false);
    setShowResult(false);
    setTeamScores({ left: 0, right: 0 });
    resetStreak();
    setCurrentQuestion(questionsRef.current[0]);
    soundService.play("gameStart");
    startTimerRef.current?.();
  };

  // ─── Splitscreen portrait top/bottom layout (Army of Two style) ─────────
  // Portrait orientation, phone lying between two players on a table.
  // P1 sits at the TOP end → top half, normal orientation.
  // P2 sits at the BOTTOM end → bottom half, rotated 180° so they read it right-side-up.
  if (isSplitscreen) {
    return (
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        style={{ flex: 1, backgroundColor: "#0D0B14" }}
      >
        <ConnectionStatus />
        <View style={{ flex: 1, flexDirection: "column" }}>

          {/* ── P1 TOP HALF ── normal orientation */}
          <View style={{ flex: 1, flexDirection: "column" }}>
            {/* P1 score header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 13,
                  fontFamily: FONTS.bodyBold,
                }}
              >
                {(p1Name as string) || "Red Team"}
              </Text>
              <View style={{ position: "relative" }}>
                {scorePopKey.left > 0 && (
                  <ScorePop key={`left-${scorePopKey.left}`} side="left" />
                )}
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontFamily: "Bungee_400Regular",
                  }}
                >
                  {teamScores.left}
                </Text>
              </View>
            </View>
            {/* P1 question card */}
            <View style={{ flex: 1, padding: 8 }}>
              <QuestionCard
                question={currentQuestion}
                selectedAnswer={selectedAnswerLeft}
                correctIndex={allAnswered ? currentQuestion?.correctIndex : undefined}
                roundResult={null}
                onAnswer={(index: number) => handleAnswer(index, "LEFT")}
                teamSide="LEFT"
                teamColor="#EF4444"
              />
            </View>
          </View>

          {/* ── CENTER DIVIDER ── horizontal strip, visible to both */}
          <View
            style={{
              height: 64,
              backgroundColor: "#130F1A",
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: "#2A1F38",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              gap: 10,
            }}
          >
            {/* Quit button */}
            <Pressable
              onPress={handleAbandon}
              style={{
                width: 28,
                height: 28,
                backgroundColor: "#1A1520",
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#7B6B8A", fontSize: 13, fontWeight: "bold" }}
              >
                {"\u2715"}
              </Text>
            </Pressable>

            {/* Timer countdown — large, readable from both ends */}
            <Text
              style={{
                color: timeRemaining <= 5 ? "#EF4444" : "#A78BFA",
                fontSize: 28,
                fontFamily: "Bungee_400Regular",
                minWidth: 36,
                textAlign: "center",
              }}
            >
              {timeRemaining}
            </Text>

            {/* Horizontal dominance bar — RED (P1) left, BLUE (P2) right */}
            <View
              style={{
                flex: 1,
                height: 10,
                borderRadius: 5,
                overflow: "hidden",
                flexDirection: "row",
              }}
            >
              <View
                style={{
                  flex: Math.max(teamScores.left, 1),
                  backgroundColor: "#EF4444",
                }}
              />
              <View
                style={{
                  flex: Math.max(teamScores.right, 1),
                  backgroundColor: "#3B82F6",
                }}
              />
            </View>

            {/* Round counter */}
            <Text
              style={{
                color: "#7B6B8A",
                fontSize: 10,
                fontFamily: FONTS.bodySemiBold,
                textAlign: "center",
              }}
            >
              {currentRound}/{currentMatch?.maxRounds || 10}
            </Text>
          </View>

          {/* ── P2 BOTTOM HALF ── rotated 180° for the player at the bottom end */}
          <View
            style={{
              flex: 1,
              flexDirection: "column",
              transform: [{ rotate: "180deg" }],
            }}
          >
            {/* P2 score header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  color: "#3B82F6",
                  fontSize: 13,
                  fontFamily: FONTS.bodyBold,
                }}
              >
                {(p2Name as string) || "Blue Team"}
              </Text>
              <View style={{ position: "relative" }}>
                {scorePopKey.right > 0 && (
                  <ScorePop key={`right-${scorePopKey.right}`} side="right" />
                )}
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontFamily: "Bungee_400Regular",
                  }}
                >
                  {teamScores.right}
                </Text>
              </View>
            </View>
            {/* P2 question card */}
            <View style={{ flex: 1, padding: 8 }}>
              <QuestionCard
                question={currentQuestion}
                selectedAnswer={selectedAnswerRight}
                correctIndex={allAnswered ? currentQuestion?.correctIndex : undefined}
                roundResult={null}
                onAnswer={(index: number) => handleAnswer(index, "RIGHT")}
                teamSide="RIGHT"
                teamColor="#3B82F6"
              />
            </View>
          </View>

        </View>

        {/* Shared overlays */}
        {showGameEnd && gameEndResult && (
          <GameEndOverlay
            result={gameEndResult}
            onPlayAgain={handlePlayAgain}
            onExit={() => router.back()}
            onReview={() =>
              router.push({
                pathname: "/match-review" as any,
                params: {
                  matchId: matchId as string,
                  childId: (p1Name as string) || "player-red",
                  subject: currentMatch?.subject || "",
                },
              })
            }
          />
        )}
        <MascotBuddy
          message={buddyMessage}
          visible={buddyVisible}
          onHide={() => setBuddyVisible(false)}
          displayDurationMs={2500}
        />
      </SafeAreaView>
    );
  }

  // ─── Solo / remote-multiplayer layout ────────────────────────────────────
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
                  {t("game:roundLabel", {
                    current: currentRound,
                    max: currentMatch?.maxRounds || 10,
                  })}
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
                <View style={{ position: "relative" }}>
                  {scorePopKey.left > 0 && (
                    <ScorePop key={`left-${scorePopKey.left}`} side="left" />
                  )}
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
                  {t("game:roundLabel", {
                    current: currentRound,
                    max: currentMatch?.maxRounds || 10,
                  })}
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
              </View>
            </>
          )}
        </View>
      </View>

      {/* Progress bar + Streak + Score dominance */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 6,
          paddingBottom: 10,
          gap: 6,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Text
            style={{
              color: "#7B6B8A",
              fontSize: 11,
              fontFamily: FONTS.body,
            }}
          >
            {t("game:questionProgress", {
              current: currentRound,
              max: currentMatch?.maxRounds || 10,
            })}
          </Text>
          <StreakBadge />
        </View>
        {/* Round progress bar */}
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
        {/* Score dominance bar (multiplayer only) */}
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
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 2,
              }}
            >
              <Text
                style={{
                  color:
                    teamScores.left > teamScores.right ? "#ff6b6b" : "#5A4B6B",
                  fontSize: 9,
                  fontFamily: FONTS.bodySemiBold,
                }}
              >
                {teamScores.left > teamScores.right
                  ? t("common:teams.red") + " ▲"
                  : ""}
              </Text>
              <Text
                style={{
                  color:
                    teamScores.right > teamScores.left ? "#4ecdc4" : "#5A4B6B",
                  fontSize: 9,
                  fontFamily: FONTS.bodySemiBold,
                }}
              >
                {teamScores.right > teamScores.left
                  ? "▲ " + t("common:teams.blue")
                  : ""}
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
          onAnswer={(index: number) => handleAnswer(index, "LEFT")}
          teamSide="LEFT"
          teamColor={isSoloMode ? "#A78BFA" : "#ff6b6b"}
        />
        {!isSoloMode && !isChildDevice && (
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswerRight}
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
          onExit={() => router.back()}
          onReview={() =>
            isSoloMode
              ? router.push("/correction" as any)
              : router.push({
                  pathname: "/match-review" as any,
                  params: {
                    matchId: matchId as string,
                    childId: "mock-player",
                    subject: currentMatch?.subject || "",
                  },
                })
          }
        />
      )}

      {/* Floating Mascot Buddy */}
      <MascotBuddy
        message={buddyMessage}
        visible={buddyVisible}
        onHide={() => setBuddyVisible(false)}
        displayDurationMs={2500}
      />
    </SafeAreaView>
  );
}

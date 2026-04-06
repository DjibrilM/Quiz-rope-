import { useState, useCallback, forwardRef } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { apiService } from "../../services/api";
import { useGameStore } from "../../stores/gameStore";
import { AnimatedLoader, Button } from "../common";
import { MatchStatus } from "@shared/types/match.types";

export interface QuizScore {
  correct: number;
  total: number;
  accuracy: number;
}

interface HomeworkQuizSheetProps {
  sessionId: string;
  session: any;
  onSessionUpdate: (updatedSession: any) => void;
}

export const HomeworkQuizSheet = forwardRef<
  BottomSheetModal,
  HomeworkQuizSheetProps
>(({ sessionId, session, onSessionUpdate }, ref) => {
  const { t } = useTranslation("homework");
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { setCurrentMatch, setCorrections } = useGameStore();

  const [quizScores, setQuizScores] = useState<Record<string, QuizScore>>({});
  const [loadingScores, setLoadingScores] = useState(false);

  const linkedMatchIds: string[] = session?.linkedMatchIds?.length
    ? session.linkedMatchIds
    : session?.linkedMatchId
      ? [session.linkedMatchId]
      : [];

  const quizCount = linkedMatchIds.length;

  const fetchScores = async () => {
    if (linkedMatchIds.length === 0) return;

    const missing = linkedMatchIds.filter((id) => !quizScores[id]);
    if (missing.length === 0) return;

    setLoadingScores(true);
    const fetched: Record<string, QuizScore> = {};
    await Promise.all(
      missing.map(async (matchId) => {
        try {
          const items = await apiService.getSoloMatchCorrection(matchId);
          const correct = (items as any[]).filter((i) => i.isCorrect).length;
          const total = (items as any[]).length;
          fetched[matchId] = {
            correct,
            total,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          };
        } catch {
          // score stays undefined — handled in UI
        }
      }),
    );
    setQuizScores((prev) => ({ ...prev, ...fetched }));
    setLoadingScores(false);
  };

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index >= 0) {
        fetchScores();
      }
    },
    [linkedMatchIds, quizScores],
  );

  const openCorrectionMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const items = await apiService.getSoloMatchCorrection(matchId);
      return { matchId, items };
    },
    onSuccess: ({ items }) => {
      setCorrections(items as any);
      if (ref && "current" in ref && ref.current) {
        ref.current.dismiss();
      }
      router.push({ pathname: "/match/correction", params: { sessionId } });
    },
    onError: (err) => {
      console.error("Failed to load correction:", err);
    },
  });

  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const created = await apiService.createMatch({
        subject: session.subject || "SCIENCE",
        difficulty: "EASY",
        maxRounds: 8,
        gameMode: "solo",
        context: session.answersMarkdown,
        teams: [
          { name: "Player", color: "#6C5CE7", side: "LEFT" },
          { name: "AI", color: "#E85D75", side: "RIGHT" },
        ],
      });

      await apiService
        .linkHomeworkMatch(sessionId, (created as any)._id)
        .catch(() => {});
      return created;
    },
    onSuccess: (created) => {
      const updatedSession = {
        ...session,
        quizTaken: true,
        linkedMatchIds: [
          ...(session.linkedMatchIds || []),
          (created as any)._id,
        ],
        linkedMatchId: (created as any)._id,
      };

      onSessionUpdate(updatedSession);

      const match = {
        ...(created as any),
        id: (created as any)._id,
        gameMode: "solo" as const,
        teams: ((created as any).teams || []).map((t: any, i: number) => ({
          id: t._id || `team-${i}`,
          name: t.name,
          color: t.color,
          side: t.side,
          players: t.players || [],
        })),
        ropePosition: 0,
        currentQuestionIndex: 0,
        status: MatchStatus.IN_PROGRESS,
        rounds: 0,
        maxRounds: 8,
        createdAt: (created as any).createdAt || new Date(),
      };

      setCurrentMatch(match);
      if (ref && "current" in ref && ref.current) {
        ref.current.dismiss();
      }
      router.push({ pathname: "/match/game", params: { matchId: match.id } });
    },
    onError: (err) => {
      console.error("Failed to start quiz:", err);
    },
  });

  const handleStartQuiz = () => {
    if (!session) return;
    startQuizMutation.mutate();
  };

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

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["93%", "93%"]}
      enablePanDownToClose
      enableDynamicSizing={false}
      onChange={handleSheetChanges}
      keyboardBehavior="extend"
      backdropComponent={renderBackdrop}
      containerStyle={{ flex: 1, height: "100%" }}
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
        className="justify-between"
        style={{ flex: 1, paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      >
        {/* Sheet header */}
        <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
          <Text className="text-white font-['Bungee_400Regular'] text-xl">
            {t("quiz.title")}
          </Text>
          <Pressable
            onPress={() => {
              if (ref && "current" in ref && ref.current) {
                ref.current.dismiss();
              }
            }}
            className="w-8 h-8 rounded-full bg-[#2D1F3D] items-center justify-center"
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Quiz list or empty state */}
        {quizCount === 0 ? (
          <View
            className="items-center py-8 px-6 gap-2"
            style={{ height: screenHeight * 0.72 }}
          >
            <View className="w-16 h-16 rounded-full bg-[#2D1F3D] items-center justify-center mb-1">
              <Ionicons name="trophy-outline" size={32} color="#3D2E4A" />
            </View>
            <Text className="text-[#B8A9C9] font-['Bungee_400Regular'] text-base">
              {t("quiz.emptyTitle")}
            </Text>
            <Text className="text-white/60 font-body text-[13px] text-center leading-5">
              {t("quiz.emptySubtitle")}
            </Text>
          </View>
        ) : (
          <View style={{ height: screenHeight * 0.72 }}>
            <BottomSheetScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: 10,
              }}
            >
              {linkedMatchIds.map((matchId, i) => {
                const score = quizScores[matchId];
                const isLoading =
                  openCorrectionMutation.isPending &&
                  openCorrectionMutation.variables === matchId;
                const scoreColor = score
                  ? score.accuracy >= 70
                    ? "#10B981"
                    : score.accuracy >= 40
                      ? "#F59E0B"
                      : "#EF4444"
                  : "#6C5CE7";

                return (
                  <Pressable
                    key={matchId}
                    onPress={() => openCorrectionMutation.mutate(matchId)}
                    disabled={openCorrectionMutation.isPending}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      borderLeftColor: scoreColor,
                    })}
                    className="bg-[#1E1828] bg-bg rounded-2xl border border-white/5 p-4 gap-2"
                  >
                    {/* Top row */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2.5">
                        <View
                          className="w-[30px] h-[30px] rounded-full items-center justify-center"
                          style={{ backgroundColor: scoreColor + "22" }}
                        >
                          <Ionicons
                            name="trophy"
                            size={15}
                            color={scoreColor}
                          />
                        </View>
                        <Text className="text-white font-['Bungee_400Regular'] text-sm tracking-[0.3px]">
                          {t("quiz.attempt", { number: i + 1 })}
                        </Text>
                      </View>

                      {score ? (
                        <View
                          className="px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: scoreColor + "22" }}
                        >
                          <Text
                            className="font-bodyBold text-[15px]"
                            style={{ color: scoreColor }}
                          >
                            {score.accuracy}%
                          </Text>
                        </View>
                      ) : loadingScores ? (
                        <AnimatedLoader size="sm" color="#5A4B6B" />
                      ) : null}
                    </View>

                    {/* Progress bar */}
                    <View className="my-4 h-2 rounded-full bg-white/5 overflow-hidden">
                      <View
                        className="h-2 rounded-full"
                        style={{
                          width: score ? (`${score.accuracy}%` as any) : "0%",
                          backgroundColor: scoreColor,
                        }}
                      />
                    </View>

                    {/* Bottom row */}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-white/60 font-body text-xs">
                        {score
                          ? t("quiz.scoreDetail", { correct: score.correct, wrong: score.total - score.correct })
                          : t("quiz.tapToView")}
                      </Text>

                      {isLoading ? (
                        <AnimatedLoader size="sm" color="#6C5CE7" />
                      ) : (
                        <View className="flex-row items-center gap-1">
                          <Text className="text-[#6C5CE7] font-bodyBold text-xs">
                            {t("quiz.viewResults")}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={13}
                            color="#6C5CE7"
                          />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </BottomSheetScrollView>
          </View>
        )}

        <View className="mt-auto border-t border-white/5 pb-3 pt-2 px-4 bg-[#1A1520]">
          <Button
            onPress={handleStartQuiz}
            loading={startQuizMutation.isPending}
            label={quizCount === 0 ? t("quiz.startFirst") : t("quiz.startNew")}
            className="min-w-full"
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
HomeworkQuizSheet.displayName = "HomeworkQuizSheet";

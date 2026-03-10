import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { AnimatedLoader, ScreenHeader } from "../src/components/common";
import { getSubjectTheme } from "../src/config/subjectThemes";
import { FONTS, FORTNITE_COLORS } from "../src/constants/theme";
import Svg, { Path } from "react-native-svg";
import type { AnswerDetail } from "@shared/types/analytics.types";

const OPTION_LABELS = ["A", "B", "C", "D"];

function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke="#10B981"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function XIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke="#EF4444"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QuestionReviewCard({
  answer,
  index,
  t,
}: {
  answer: AnswerDetail;
  index: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const hasRecordedAnswer = answer.childAnswerIndex !== -1;

  return (
    <View
      style={{
        backgroundColor: FORTNITE_COLORS.bgCard,
        borderRadius: 16,
        padding: 16,
        gap: 12,
      }}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontFamily: FONTS.accent,
            color: !hasRecordedAnswer
              ? FORTNITE_COLORS.textMuted
              : answer.isCorrect
                ? "#10B981"
                : "#EF4444",
          }}
        >
          {t("analytics:review.question", { number: index + 1 })}
        </Text>
        {hasRecordedAnswer && answer.responseTime > 0 && (
          <View
            style={{
              backgroundColor: "#3D2E4A",
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: FONTS.bodySemiBold,
                color: FORTNITE_COLORS.textMuted,
              }}
            >
              {t("analytics:review.responseTime", {
                time: (answer.responseTime / 1000).toFixed(1),
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Question text */}
      <Text
        style={{
          fontSize: 14,
          fontFamily: FONTS.bodySemiBold,
          color: FORTNITE_COLORS.textPrimary,
          lineHeight: 20,
        }}
      >
        {answer.questionText}
      </Text>

      {/* Options */}
      <View style={{ gap: 6 }}>
        {answer.options.map((option, i) => {
          const isCorrect = i === answer.correctIndex;
          const isChildAnswer = hasRecordedAnswer && i === answer.childAnswerIndex;
          const isWrongAnswer = isChildAnswer && !answer.isCorrect;

          let borderColor = "#3D2E4A";
          let bgColor = "transparent";
          if (isCorrect) {
            borderColor = "#10B981";
            bgColor = "#10B98110";
          } else if (isWrongAnswer) {
            borderColor = "#EF4444";
            bgColor = "#EF444410";
          }

          return (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderWidth: 1.5,
                borderColor,
                backgroundColor: bgColor,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: isCorrect
                    ? "#10B98130"
                    : isWrongAnswer
                      ? "#EF444430"
                      : "#3D2E4A",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: FONTS.accent,
                    color: isCorrect
                      ? "#10B981"
                      : isWrongAnswer
                        ? "#EF4444"
                        : FORTNITE_COLORS.textMuted,
                  }}
                >
                  {OPTION_LABELS[i]}
                </Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontFamily: FONTS.body,
                  color: isCorrect
                    ? "#10B981"
                    : isWrongAnswer
                      ? "#EF4444"
                      : FORTNITE_COLORS.textSecondary,
                }}
              >
                {option}
              </Text>
              {isCorrect && <CheckIcon />}
              {isWrongAnswer && <XIcon />}
            </View>
          );
        })}
      </View>

      {/* Explanation */}
      {answer.explanation ? (
        <View
          style={{
            backgroundColor: "#3D2E4A30",
            borderRadius: 10,
            padding: 12,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: FONTS.bodySemiBold,
              color: FORTNITE_COLORS.textMuted,
              marginBottom: 4,
            }}
          >
            {t("analytics:review.explanation")}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: FONTS.body,
              color: FORTNITE_COLORS.textSecondary,
              lineHeight: 18,
            }}
          >
            {answer.explanation}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function MatchReviewScreen() {
  usePortrait();
  const { t } = useTranslation(["analytics", "common"]);
  const { matchId, childId, subject } = useLocalSearchParams();
  const theme = getSubjectTheme((subject as string) || "");

  const {
    data: answers = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["matchReview", matchId, childId],
    queryFn: () =>
      apiService.getMatchReview(matchId as string, childId as string),
    enabled: !!matchId && !!childId,
  });

  const errorMessage = error instanceof Error ? error.message : "";
  // Only count answers where the child actually responded
  const recordedAnswers = answers.filter(
    (a: AnswerDetail) => (a as any).childAnswerIndex !== -1,
  );
  const correctCount = recordedAnswers.filter(
    (a: AnswerDetail) => a.isCorrect,
  ).length;
  const totalCount = recordedAnswers.length || answers.length;
  const accuracy =
    recordedAnswers.length > 0
      ? Math.round((correctCount / recordedAnswers.length) * 100)
      : 0;

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: FORTNITE_COLORS.bgDark }}
    >
      <ScreenHeader title={t("analytics:review.title")} />

      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 12,
        }}
      >
        {isLoading && (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <AnimatedLoader size="lg" />
          </View>
        )}

        {isError && !isLoading && (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text
              style={{ color: "#F87171", fontSize: 14, fontFamily: FONTS.body }}
            >
              {errorMessage}
            </Text>
          </View>
        )}

        {!isLoading && !isError && answers.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text
              style={{
                color: "#7B6B8A",
                fontSize: 15,
                fontFamily: FONTS.body,
                textAlign: "center",
              }}
            >
              {t("analytics:review.noQuestions")}
            </Text>
          </View>
        )}

        {!isLoading && !isError && answers.length > 0 && (
          <>
            {/* Summary card */}
            <View
              style={{
                backgroundColor: FORTNITE_COLORS.bgCard,
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.accentColor,
                  }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: FONTS.accent,
                    color: FORTNITE_COLORS.textPrimary,
                  }}
                >
                  {theme.label}
                </Text>
              </View>
              {recordedAnswers.length > 0 ? (
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: FONTS.bodySemiBold,
                    color:
                      accuracy >= 70
                        ? "#10B981"
                        : accuracy >= 40
                          ? "#F59E0B"
                          : "#EF4444",
                  }}
                >
                  {t("analytics:review.summary", {
                    correct: correctCount,
                    total: recordedAnswers.length,
                    accuracy,
                  })}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: FONTS.bodySemiBold,
                    color: FORTNITE_COLORS.textMuted,
                  }}
                >
                  {answers.length} questions
                </Text>
              )}
            </View>

            {/* Question cards */}
            {answers.map((answer, i) => (
              <QuestionReviewCard key={i} answer={answer} index={i} t={t} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

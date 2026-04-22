import React, { useEffect, useMemo } from "react";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";
import { View, Text, Linking } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { AnimatedOption } from "./AnimatedOption";
import { MathMarkdown } from "../common/MathMarkdown";
import { FONTS } from "../../constants/theme";

interface QuestionCardProps {
  question: {
    id: string;
    text: string;
    options: string[];
    subject: string;
  } | null;
  selectedAnswer: number | null;
  correctIndex?: number;
  roundResult: {
    isCorrect: boolean;
    correctIndex: number;
    ropeMovement: number;
  } | null;
  onAnswer: (index: number) => void;
  teamSide: "LEFT" | "RIGHT";
  teamColor: string;
  compact?: boolean;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

// brightenMath removed as it is now handled by MathMarkdown component


export function QuestionCard({
  question,
  selectedAnswer,
  correctIndex,
  roundResult,
  onAnswer,
  teamSide,
  teamColor,
  compact = false,
}: QuestionCardProps) {
  const { t } = useTranslation("common");

  const questionScale = useSharedValue(0.95);
  const questionOpacity = useSharedValue(0);

  useEffect(() => {
    if (!question) return;

    questionScale.value = 0.95;
    questionOpacity.value = 0;

    questionScale.value = withSpring(1, { damping: 30, stiffness: 600 });
    questionOpacity.value = withSpring(1, { damping: 30, stiffness: 600 });
  }, [question?.id]);

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: questionScale.value }],
    opacity: questionOpacity.value,
  }));

// processedMarkdown removed as MathMarkdown handles it internally


  if (!question) return null;

  const resolvedCorrectIndex = correctIndex ?? roundResult?.correctIndex;

  const getVariant = (
    index: number,
  ): "default" | "selected" | "correct" | "wrong" => {
    if (selectedAnswer !== null && resolvedCorrectIndex !== undefined) {
      if (index === resolvedCorrectIndex) return "correct";
      if (index === selectedAnswer) return "wrong";
      return "default";
    }

    if (roundResult) {
      if (index === roundResult.correctIndex) return "correct";
      if (index === selectedAnswer && !roundResult.isCorrect) return "wrong";
      return "default";
    }

    if (index === selectedAnswer) return "selected";
    return "default";
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
      }}
    >
      {/* Question */}
      <Animated.View
        style={[
          questionAnimatedStyle,
          {
            paddingHorizontal: compact ? 12 : 20,
            paddingTop: compact ? 12 : 20,
            paddingBottom: compact ? 8 : 12,
          },
        ]}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: compact ? 9 : 11,
            fontFamily: FONTS.bodyExtraBold,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: compact ? 4 : 8,
          }}
        >
          {teamSide === "LEFT" ? t("teams.redTeam") : t("teams.blueTeam")}
        </Text>

        <View
          style={{
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MathMarkdown
            content={question.text}
            isFitted
            style={{
              paragraph: {
                color: "#D1D5DB",
                fontSize: compact ? 15 : 18,
                fontFamily: FONTS.bodySemiBold,
                textAlign: "center",
                marginBottom: 10,
              },
              h1: { textAlign: "center", color: "#FFFFFF" },
              h2: { textAlign: "center", color: "#F3F4F6" },
              h3: { textAlign: "center", color: "#E5E7EB" },
              code: {
                backgroundColor: "#1F2937",
                color: "#F9FAFB",
                fontFamily: "Menlo",
                fontSize: 14,
              },
              codeBlock: {
                backgroundColor: "#020617",
                color: "#E2E8F0",
                padding: 12,
                borderRadius: 8,
                fontFamily: "Menlo",
                fontSize: 14,
              },
            }}
          />
        </View>
      </Animated.View>

      {/* Options */}
      <View
        style={{
          paddingHorizontal: compact ? 12 : 20,
          paddingBottom: compact ? 12 : 20,
          gap: compact ? 8 : 12,
          justifyContent: "space-between",
        }}
      >
        {question.options.map((option, i) => {
          const isLong = option.length > 25 || question.options.length <= 2;

          return (
            <View
              key={i}
              style={{
                width: "100%",
              }}
            >
              <AnimatedOption
                label={OPTION_LABELS[i]}
                optionText={option}
                index={i}
                questionId={question.id}
                staggerDelay={i * 15}
                variant={getVariant(i)}
                teamColor={teamColor}
                disabled={selectedAnswer !== null}
                onPress={() => onAnswer(i)}
                compact={compact}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

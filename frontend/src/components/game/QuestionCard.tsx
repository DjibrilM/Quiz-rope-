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

/**
 * 🔥 Fix dim math by forcing LaTeX color
 */
const brightenMath = (text: string) => {
  if (!text) return text;

  return (
    text
      // block math $$...$$ (handle first to avoid conflicts)
      .replace(/\$\$(.*?)\$\$/gs, (_, expr) => {
        return `$$\\color{#fab143}{${expr}}$$`;
      })
      // inline math $...$
      .replace(/\$(.*?)\$/g, (_, expr) => {
        return `$\\color{#fab143}{${expr}}$`;
      })
  );
};

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

  const processedMarkdown = useMemo(() => {
    return question ? brightenMath(question.text) : "";
  }, [question?.text]);

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
          <EnrichedMarkdownText
            flavor="github"
            markdown={processedMarkdown}
            onLinkPress={({ url }) => Linking.openURL(url)}
            markdownStyle={{
              // Base text

              paragraph: {
                color: "#D1D5DB",
                marginBottom: 10,
                textAlign: "center",
              },

              // Headings
              h1: {
                fontSize: 24,
                fontWeight: "700",
                color: "#FFFFFF",
                marginBottom: 8,
                marginTop: 16,
                textAlign: "center",
              },
              h2: {
                fontSize: 20,
                fontWeight: "700",
                color: "#F3F4F6",
                marginBottom: 6,
                marginTop: 14,
                textAlign: "center",
              },
              h3: {
                fontSize: 18,
                fontWeight: "600",
                color: "#E5E7EB",
                marginBottom: 4,
                marginTop: 12,
                textAlign: "center",
              },

              // Links
              link: {
                color: "#60A5FA",
              },

              // Lists
              list: {
                marginBottom: 10,
              },

              // Inline code
              code: {
                backgroundColor: "#1F2937",
                color: "#F9FAFB",

                fontFamily: "Menlo",
                fontSize: 14,
              },

              // Code blocks
              codeBlock: {
                backgroundColor: "#020617",
                color: "#E2E8F0",
                padding: 12,
                borderRadius: 8,
                fontFamily: "Menlo",
                fontSize: 14,
              },

              // Blockquote
              blockquote: {
                color: "#9CA3AF",
              },

              // Tables
              table: {
                borderColor: "#374151",
                borderRadius: 8,
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
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        {question.options.map((option, i) => {
          const isLong = option.length > 25 || question.options.length <= 2;

          return (
            <View
              key={i}
              style={{
                width: isLong ? "100%" : "48%",
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

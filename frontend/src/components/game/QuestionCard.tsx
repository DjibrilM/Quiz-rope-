import React, { useEffect } from "react";
import { View, Text } from "react-native";
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
  roundResult: {
    isCorrect: boolean;
    correctIndex: number;
    ropeMovement: number;
  } | null;
  onAnswer: (index: number) => void;
  teamSide: "LEFT" | "RIGHT";
  teamColor: string;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export function QuestionCard({
  question,
  selectedAnswer,
  roundResult,
  onAnswer,
  teamSide,
  teamColor,
}: QuestionCardProps) {
  const { t } = useTranslation("common");

  const questionScale = useSharedValue(0.92);
  const questionOpacity = useSharedValue(0);

  useEffect(() => {
    if (!question) return;
    questionScale.value = 0.92;
    questionOpacity.value = 0;
    questionScale.value = withSpring(1, { damping: 20, stiffness: 180 });
    questionOpacity.value = withSpring(1, { damping: 20, stiffness: 180 });
  }, [question?.id]);

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: questionScale.value }],
    opacity: questionOpacity.value,
  }));

  if (!question) return null;

  const getVariant = (
    index: number,
  ): "default" | "selected" | "correct" | "wrong" => {
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
        backgroundColor: "#1A1520",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#3D2E4A",
      }}
    >
      {/* Question display */}
      <Animated.View
        style={[
          questionAnimatedStyle,
          {
            marginHorizontal: 10,
            marginTop: 10,
            marginBottom: 8,
            backgroundColor: "#0D0B14",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
          },
        ]}
      >
        <Text
          style={{
            color: "#B8A9C9",
            fontSize: 10,
            fontFamily: "LuckiestGuy_400Regular",
            letterSpacing: 2,
            marginBottom: 6,
          }}
        >
          {teamSide === "LEFT" ? t("teams.redTeam") : t("teams.blueTeam")}
        </Text>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 17,
            fontFamily: FONTS.bodySemiBold,
            lineHeight: 24,
            textAlign: "center",
          }}
        >
          {question.text}
        </Text>
      </Animated.View>

      {/* 2x2 Keypad */}
      <View style={{ paddingHorizontal: 10, paddingBottom: 14, paddingTop: 4, gap: 8 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {question.options.slice(0, 2).map((option, i) => (
            <AnimatedOption
              key={i}
              label={OPTION_LABELS[i]}
              optionText={option}
              index={i}
              questionId={question.id}
              staggerDelay={i * 80}
              variant={getVariant(i)}
              teamColor={teamColor}
              disabled={selectedAnswer !== null}
              onPress={() => onAnswer(i)}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {question.options.slice(2, 4).map((option, ci) => {
            const i = ci + 2;
            return (
              <AnimatedOption
                key={i}
                label={OPTION_LABELS[i]}
                optionText={option}
                index={i}
                questionId={question.id}
                staggerDelay={i * 80}
                variant={getVariant(i)}
                teamColor={teamColor}
                disabled={selectedAnswer !== null}
                onPress={() => onAnswer(i)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

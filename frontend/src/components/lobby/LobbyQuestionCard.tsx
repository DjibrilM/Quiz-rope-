import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { getSubjectTheme } from "../../config/subjectThemes";
import { AnimatedOption } from "../game/AnimatedOption";
import { SubjectIcon } from "../match/SubjectIcons";
import { FONTS } from "../../constants/theme";

interface LobbyQuestionCardProps {
  question: {
    id: string;
    text: string;
    options: string[];
    subject: string;
  };
  teamSide: "LEFT" | "RIGHT";
}

const OPTION_LABELS = ["A", "B", "C", "D"];
const STAGGER_DELAY = 120;
const noop = () => {};

export function LobbyQuestionCard({ question, teamSide }: LobbyQuestionCardProps) {
  const { t } = useTranslation("common");
  const theme = getSubjectTheme(question.subject);

  const questionScale = useSharedValue(0.95);
  const questionOpacity = useSharedValue(0);

  useEffect(() => {
    questionScale.value = 0.95;
    questionOpacity.value = 0;
    questionScale.value = withSpring(1, { damping: 20, stiffness: 180 });
    questionOpacity.value = withSpring(1, { damping: 20, stiffness: 180 });
  }, [question.id]);

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: questionScale.value }],
    opacity: questionOpacity.value,
  }));

  const borderColor = teamSide === "LEFT" ? "border-team-red" : "border-team-blue";
  const headerBg = teamSide === "LEFT" ? "bg-team-red" : "bg-team-blue";

  return (
    <View
      className={`flex-1 bg-card-bg/50 rounded-3xl border-2 ${borderColor} overflow-hidden`}
    >
      {/* Team Header */}
      <View className={`${headerBg} px-4 py-2`}>
        <Text
          className="text-white text-center text-lg"
          style={{ fontFamily: FONTS.bodyExtraBold }}
        >
          {teamSide === "LEFT" ? t("teams.redTeam") : t("teams.blueTeam")}
        </Text>
      </View>

      {/* Subject Strip */}
      <View
        className={`${theme.headerAccentClass} flex-row items-center justify-center px-4 py-1.5`}
      >
        <SubjectIcon subject={question.subject} size={18} />
        <Text
          className="text-white text-sm tracking-wide"
          style={{ fontFamily: FONTS.bodyBold }}
        >
          {t(`subjects.${question.subject.toUpperCase()}`)}

        </Text>
      </View>

      {/* Question */}
      <Animated.View className="px-5 pt-4 pb-3" style={questionAnimatedStyle}>
        <Text
          className="text-white text-xl text-center leading-7"
          style={{ fontFamily: FONTS.bodyBold }}
        >
          {question.text}
        </Text>
      </Animated.View>

      {/* Answer Options */}
      <View className="px-4 pb-4 gap-3">
        {question.options.map((option, index) => (
          <AnimatedOption
            key={index}
            label={OPTION_LABELS[index]}
            optionText={option}
            index={index}
            questionId={question.id}
            staggerDelay={index * STAGGER_DELAY}
            variant="default"
            teamColor={teamSide === "LEFT" ? "#ff6b6b" : "#4ecdc4"}
            disabled={true}
            onPress={noop}
          />
        ))}
      </View>
    </View>
  );
}

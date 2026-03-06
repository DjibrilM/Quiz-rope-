import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { hapticsService } from "../../services/haptics";
import { SubjectIcon } from "./SubjectIcons";
import { BouncePress } from "../common/BouncePress";
import { FONTS } from "../../constants/theme";

const SUBJECT_STYLES: Record<string, { bg: string; bgSelected: string; accent: string; glow: string }> = {
  MATH:      { bg: "#1A1520", bgSelected: "#1C1525", accent: "#60A5FA", glow: "#3B82F620" },
  SCIENCE:   { bg: "#1A1520", bgSelected: "#181825", accent: "#A78BFA", glow: "#7C3AED20" },
  ENGLISH:   { bg: "#1A1520", bgSelected: "#1E1A15", accent: "#FBBF24", glow: "#F59E0B20" },
  HISTORY:   { bg: "#1A1520", bgSelected: "#1E1520", accent: "#F472B6", glow: "#DB277720" },
  GEOGRAPHY: { bg: "#1A1520", bgSelected: "#151E1A", accent: "#34D399", glow: "#05966920" },
};

const FALLBACK = { bg: "#1A1520", bgSelected: "#1A1520", accent: "#9B59B6", glow: "#9B59B620" };

interface SubjectCardProps {
  subject: string;
  selected?: boolean;
  onPress: (subject: string) => void;
}

export function SubjectCard({ subject, selected, onPress }: SubjectCardProps) {
  const { t } = useTranslation(["common", "match"]);
  const style = SUBJECT_STYLES[subject] || FALLBACK;
  const label = t(`common:subjects.${subject.toUpperCase()}`);

  return (
    <BouncePress
      onPress={() => {
        hapticsService.selection();
        onPress(subject);
      }}
      style={{
        flex: 1,
        minWidth: "45%",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 16,
        backgroundColor: selected ? style.bgSelected : style.bg,
        borderWidth: 0,
        borderColor: "transparent",
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
    >
      {/* Icon container with accent glow */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: selected ? style.accent + "20" : style.glow,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <SubjectIcon subject={subject} size={40} />
      </View>

      <Text
        style={{
          color: selected ? style.accent : "#FFFFFF",
          fontSize: 16,
          fontFamily: FONTS.heading,
          textAlign: "center",
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: selected ? style.accent + "90" : "#5A4B6B",
          fontSize: 11,
          fontFamily: FONTS.body,
          textAlign: "center",
          marginTop: 4,
        }}
      >
        {t(`match:create.subjectHint.${subject}`)}
      </Text>
    </BouncePress>
  );
}

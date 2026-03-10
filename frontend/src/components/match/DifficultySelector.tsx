import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { hapticsService } from "../../services/haptics";
import { IconEasy, IconMedium, IconHard } from "./SubjectIcons";
import { BouncePress } from "../common/BouncePress";
import { FONTS } from "../../constants/theme";

const DIFFICULTIES = [
  {
    id: "EASY",
    labelKey: "easy",
    descKey: "easyDesc",
    Icon: IconEasy,
    color: "#10B981",
  },
  {
    id: "MEDIUM",
    labelKey: "medium",
    descKey: "mediumDesc",
    Icon: IconMedium,
    color: "#F59E0B",
  },
  {
    id: "HARD",
    labelKey: "hard",
    descKey: "hardDesc",
    Icon: IconHard,
    color: "#EF4444",
  },
];

interface DifficultySelectorProps {
  selected: string;
  onSelect: (difficulty: string) => void;
}

export function DifficultySelector({
  selected,
  onSelect,
}: DifficultySelectorProps) {
  const { t } = useTranslation(["match", "common"]);

  const handleSelect = (id: string) => {
    hapticsService.selection();
    onSelect(id);
  };

  return (
    <View className="mb-8">
      <Text
        style={{
          color: "#7B6B8A",
          fontSize: 11,
          fontFamily: FONTS.bodySemiBold,
          letterSpacing: 1.5,
          marginBottom: 12,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {t("match:selectors.difficulty")}
      </Text>
      <View className="flex-row gap-3">
        {DIFFICULTIES.map((d) => {
          const label = t(`common:difficulties.${d.labelKey}`);
          const desc = t(`common:difficulties.${d.descKey}`);
          return (
            <BouncePress
              key={d.id}
              onPress={() => handleSelect(d.id)}
              style={{
                flex: 1,
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                borderWidth: 2,
                backgroundColor: selected === d.id ? `${d.color}15` : "#1A1520",
                borderColor: selected === d.id ? d.color : "#3D2E4A",
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === d.id }}
              accessibilityLabel={t("common:accessibility.difficultyLabel", {
                label,
                desc,
              })}
            >
              <View className="mb-3">
                <d.Icon size={32} />
              </View>
              <Text
                style={{
                  color: selected === d.id ? d.color : "#FFFFFF",
                  fontSize: 14,
                  fontFamily: "Bungee_400Regular",
                  marginBottom: 4,
                }}
              >
                {label}
              </Text>
              <Text
                style={{
                  color: selected === d.id ? d.color + "99" : "#7B6B8A",
                  fontSize: 11,
                  fontFamily: FONTS.body,
                  textAlign: "center",
                }}
              >
                {desc}
              </Text>
            </BouncePress>
          );
        })}
      </View>
    </View>
  );
}

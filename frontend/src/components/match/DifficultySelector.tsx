import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { hapticsService } from "../../services/haptics";
import { IconEasy, IconMedium, IconHard } from "./SubjectIcons";

const DIFFICULTIES = [
  { id: "EASY", labelKey: "easy", descKey: "easyDesc", Icon: IconEasy },
  { id: "MEDIUM", labelKey: "medium", descKey: "mediumDesc", Icon: IconMedium },
  { id: "HARD", labelKey: "hard", descKey: "hardDesc", Icon: IconHard },
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
      <Text className="text-sm text-slate-400 uppercase tracking-widest mb-3">
        {t("match:selectors.difficulty")}
      </Text>
      <View className="flex-row gap-3">
        {DIFFICULTIES.map((d) => {
          const label = t(`common:difficulties.${d.labelKey}`);
          const desc = t(`common:difficulties.${d.descKey}`);
          return (
            <Pressable
              key={d.id}
              onPress={() => handleSelect(d.id)}
              className={`flex-1 py-4 rounded-xl items-center border ${
                selected === d.id
                  ? "bg-game-indigo border-game-indigo"
                  : "bg-transparent border-slate-700"
              }`}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === d.id }}
              accessibilityLabel={t("common:accessibility.difficultyLabel", { label, desc })}
            >
              <View className="mb-2">
                <d.Icon size={28} />
              </View>
              <Text
                className={`text-sm font-semibold ${
                  selected === d.id ? "text-white" : "text-slate-300"
                }`}
              >
                {label}
              </Text>
              <Text
                className={`text-xs mt-1 ${
                  selected === d.id ? "text-indigo-200" : "text-slate-600"
                }`}
              >
                {desc}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

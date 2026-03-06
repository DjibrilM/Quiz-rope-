import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { hapticsService } from "../../services/haptics";

const ROUND_OPTIONS = [5, 10, 15, 20];

interface RoundsSelectorProps {
  selected: number;
  onSelect: (rounds: number) => void;
}

export function RoundsSelector({ selected, onSelect }: RoundsSelectorProps) {
  const { t } = useTranslation(["match", "common"]);

  const handleSelect = (r: number) => {
    hapticsService.selection();
    onSelect(r);
  };

  return (
    <View className="mb-10">
      <Text className="text-sm text-slate-400 uppercase tracking-widest mb-3">
        {t("match:selectors.rounds")}
      </Text>
      <View className="flex-row gap-3">
        {ROUND_OPTIONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => handleSelect(r)}
            className={`flex-1 py-4 rounded-xl items-center border ${
              selected === r
                ? "bg-game-indigo border-game-indigo"
                : "bg-transparent border-slate-700"
            }`}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === r }}
            accessibilityLabel={t("common:accessibility.roundsLabel", { count: r })}
          >
            <Text
              className={`text-base font-semibold ${
                selected === r ? "text-white" : "text-slate-400"
              }`}
            >
              {r}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

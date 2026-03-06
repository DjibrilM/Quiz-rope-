import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { hapticsService } from "../../services/haptics";
import { IconMath, IconScience, IconEnglish, IconHistory, IconGeography } from "./SubjectIcons";

const SUBJECTS = [
  { id: "MATH", Icon: IconMath },
  { id: "SCIENCE", Icon: IconScience },
  { id: "ENGLISH", Icon: IconEnglish },
  { id: "HISTORY", Icon: IconHistory },
  { id: "GEOGRAPHY", Icon: IconGeography },
];

interface SubjectSelectorProps {
  selected: string;
  onSelect: (subject: string) => void;
}

export function SubjectSelector({ selected, onSelect }: SubjectSelectorProps) {
  const { t } = useTranslation(["match", "common"]);

  const handleSelect = (id: string) => {
    hapticsService.selection();
    onSelect(id);
  };

  return (
    <View className="mb-8">
      <Text className="text-sm text-slate-400 uppercase tracking-widest mb-3">
        {t("match:selectors.subject")}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {SUBJECTS.map((s) => {
          const label = t(`common:subjects.${s.id}`);
          return (
            <Pressable
              key={s.id}
              onPress={() => handleSelect(s.id)}
              className={`px-5 py-3 rounded-xl border flex-row items-center ${
                selected === s.id
                  ? "bg-game-indigo border-game-indigo"
                  : "bg-transparent border-slate-700"
              }`}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === s.id }}
              accessibilityLabel={t("common:accessibility.subjectLabel", { subject: label })}
            >
              <View className="mr-2">
                <s.Icon size={20} />
              </View>
              <Text
                className={`text-sm font-semibold ${
                  selected === s.id ? "text-white" : "text-slate-400"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

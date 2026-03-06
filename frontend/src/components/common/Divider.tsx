import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  const { t } = useTranslation("common");
  const displayLabel = label ?? t("labels.or");
  return (
    <View className="flex-row items-center w-full max-w-md mb-8">
      <View className="flex-1 h-px bg-slate-700" />
      <Text className="text-slate-500 mx-4 text-base">{displayLabel}</Text>
      <View className="flex-1 h-px bg-slate-700" />
    </View>
  );
}

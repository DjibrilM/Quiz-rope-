import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

interface MatchCodeDisplayProps {
  code: string;
}

export function MatchCodeDisplay({ code }: MatchCodeDisplayProps) {
  const { t } = useTranslation("common");

  return (
    <View className="bg-card-bg rounded-2xl px-8 py-4 mb-8 items-center">
      <Text className="text-slate-500 text-xs mb-1" style={{ fontFamily: "Bungee_400Regular", letterSpacing: 2 }}>{t("labels.gameCode")}</Text>
      <Text className="text-2xl text-white" style={{ fontFamily: "Bungee_400Regular", letterSpacing: 6 }}>
        {code}
      </Text>
    </View>
  );
}

import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

interface SessionCodeDisplayProps {
  code: string;
}

export function SessionCodeDisplay({ code }: SessionCodeDisplayProps) {
  const { t } = useTranslation("common");

  return (
    <View className="bg-card-bg rounded-2xl px-8 py-4 items-center mb-4 border border-slate-700">
      <Text className="text-slate-500 text-xs mb-1"
        style={{ fontFamily: "Bungee_400Regular", letterSpacing: 2 }}
      >
        {t("labels.sessionCode")}
      </Text>
      <Text
        className="text-3xl text-game-warning"
        style={{ fontFamily: "Bungee_400Regular", letterSpacing: 8 }}
      >
        {code}
      </Text>
    </View>
  );
}

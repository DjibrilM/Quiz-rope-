import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

interface TeamPanelProps {
  name: string;
  color: "red" | "blue";
  players?: string[];
}

export function TeamPanel({ name, color, players = [] }: TeamPanelProps) {
  const { t } = useTranslation("common");
  const borderColor = color === "red" ? "border-team-red" : "border-team-blue";
  const bgColor = color === "red" ? "bg-team-red/20" : "bg-team-blue/20";
  const textColor = color === "red" ? "text-team-red" : "text-team-blue";

  return (
    <View
      className={`flex-1 ${bgColor} border-2 ${borderColor} rounded-3xl p-6 items-center`}
    >
      <Text className={`text-xl ${textColor} mb-4`} style={{ fontFamily: "LuckiestGuy_400Regular" }}>
        {name}
      </Text>
      <View className="bg-card-bg w-full rounded-2xl p-4 min-h-[120px] items-center justify-center">
        {players.length === 0 ? (
          <Text className="text-slate-500 text-lg">
            {t("labels.waitingForPlayers")}
          </Text>
        ) : (
          players.map((player, i) => (
            <Text key={i} className="text-white text-lg">
              {player}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

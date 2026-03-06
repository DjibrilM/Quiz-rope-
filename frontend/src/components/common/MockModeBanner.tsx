import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

interface MockModeBannerProps {
  compact?: boolean;
}

export function MockModeBanner({ compact = false }: MockModeBannerProps) {
  const { t } = useTranslation("common");

  if (compact) {
    return (
      <View className="mx-8 bg-game-warning/10 border border-game-warning/30 rounded-xl px-4 py-2 mb-4">
        <Text className="text-game-warning text-sm text-center">
          {t("dev.mockModeBanner")}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-game-warning/20 border border-game-warning rounded-2xl px-6 py-3 mb-8">
      <Text className="text-game-warning text-center text-base font-medium">
        {t("dev.developmentMode")}
      </Text>
    </View>
  );
}

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { hapticsService } from "../../services/haptics";
import { BouncePress } from "../common/BouncePress";
import { FONTS } from "../../constants/theme";

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
        {t("match:selectors.rounds")}
      </Text>
      <View className="flex-row gap-3">
        {ROUND_OPTIONS.map((r) => (
          <BouncePress
            key={r}
            onPress={() => handleSelect(r)}
            style={{
              flex: 1,
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              borderWidth: 2,
              backgroundColor: selected === r ? "#9B59B615" : "#1A1520",
              borderColor: selected === r ? "#9B59B6" : "#3D2E4A",
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === r }}
            accessibilityLabel={t("common:accessibility.roundsLabel", {
              count: r,
            })}
          >
            <Text
              style={{
                color: selected === r ? "#FFFFFF" : "#7B6B8A",
                fontSize: 24,
                fontFamily: "LuckiestGuy_400Regular",
              }}
            >
              {r}
            </Text>
          </BouncePress>
        ))}
      </View>
    </View>
  );
}

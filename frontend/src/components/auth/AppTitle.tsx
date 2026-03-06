import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { FONT_SIZES } from "../../constants/theme";
import { getHeadingFont, getAccentFont } from "../../utils/fontForLocale";

export function AppTitle() {
  const { t } = useTranslation("auth");

  return (
    <View style={{ alignItems: "center", marginBottom: 32 }}>
      <Text
        style={{
          fontFamily: getHeadingFont(),
          fontSize: FONT_SIZES["7xl"],
          color: "#FFFFFF",
          letterSpacing: 2,
        }}
      >
        {t("appTitle")}
      </Text>

      <Text
        style={{
          fontFamily: getAccentFont(),
          fontSize: FONT_SIZES.lg,
          color: "#FFD93D",
          letterSpacing: 6,
          marginTop: 4,
          textAlign: "center",
        }}
      >
        {t("appSubtitle")}
      </Text>
    </View>
  );
}

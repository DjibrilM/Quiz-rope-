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
          fontSize: 48,
          color: "#FFFFFF",
          letterSpacing: 2,
        }}
      >
        {t("appTitle")}
      </Text>
    </View>
  );
}

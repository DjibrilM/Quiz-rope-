import { Stack } from "expo-router";
import { FORTNITE_COLORS, FONTS } from "../../src/constants/theme";

export default function MatchLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: FORTNITE_COLORS.bgDark },
        headerTitleStyle: {
          fontFamily: FONTS.heading,
          fontSize: 20,
          color: FORTNITE_COLORS.textPrimary,
        },
        headerTintColor: FORTNITE_COLORS.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: FORTNITE_COLORS.bgDark },
      }}
    />
  );
}

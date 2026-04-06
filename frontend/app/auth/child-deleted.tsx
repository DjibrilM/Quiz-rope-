import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button } from "../../src/components/common";
import { SadBrainMascot } from "../../src/components/common/Mascots";
import { FONTS, FORTNITE_COLORS } from "../../src/constants/theme";
import { AppTitle } from "../../src/components/auth/AppTitle";

export default function ChildDeletedScreen() {
  const { t } = useTranslation(["auth", "common"]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AppTitle />
        
        <View style={styles.illustrationContainer}>
           <SadBrainMascot size={220} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {t("auth:childDeleted.title", "Profile Removed")}
          </Text>
          <Text style={styles.subtitle}>
            {t("auth:childDeleted.subtitle", "Your profile and data have been safely deleted by your parent.")}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            label={t("common:buttons.backToLogin", "Back to Start")}
            variant="primary"
            onPress={() => router.replace("/")}
            className="w-full"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FORTNITE_COLORS.bgDark,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  illustrationContainer: {
    width: 220,
    height: 220,
    marginVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontFamily: "LuckiestGuy_400Regular",
    fontSize: 32,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: "#B8A9C9",
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
  },
});

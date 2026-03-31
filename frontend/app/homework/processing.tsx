import { useEffect, useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { apiService } from "../../src/services/api";
import { AnimatedLoader } from "../../src/components/common";
import { FONTS } from "../../src/constants/theme";
import { useTranslation } from "react-i18next";




export default function HomeworkProcessingScreen() {
  const { t } = useTranslation("homework");
  const STEPS = t("processing.steps", { returnObjects: true }) as string[];
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [stepIndex, setStepIndex] = useState(0);


  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 5000);

    const pollInterval = setInterval(async () => {
      try {
        const session = await apiService.getHomeworkSession(sessionId);
        if (session.status === "READY") {
          clearInterval(pollInterval);
          clearInterval(stepInterval);
          router.replace(`/homework/session/${sessionId}` as any);
        } else if (session.status === "FAILED") {
          clearInterval(pollInterval);
          clearInterval(stepInterval);
          Alert.alert(
            t("errors.analysisFailed"),
            session.errorMessage ?? t("errors.analysisFailedDesc"),
            [{ text: t("common:buttons.ok"), onPress: () => router.back() }],
          );

        }
      } catch {
        // network blip — keep polling
      }
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      clearInterval(stepInterval);
    };
  }, [sessionId]);

  return (
    <SafeAreaView style={styles.bg}>
      <View style={styles.center}>
        <AnimatedLoader size="lg" color="#6C5CE7" />
        <Text style={styles.title}>{t("processing.title")}</Text>
        <Text style={styles.step}>{STEPS[stepIndex]}</Text>
        <Text style={styles.hint}>{t("processing.hint")}</Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#0D0B14" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  title: { color: "#FFFFFF", fontSize: 20, fontFamily: "Bungee_400Regular", marginTop: 28, textAlign: "center" },
  step: { color: "#9B59B6", fontSize: 14, fontFamily: FONTS.body, marginTop: 12, textAlign: "center" },
  hint: { color: "#4A3D5A", fontSize: 12, fontFamily: FONTS.body, marginTop: 8 },
});

import { useState } from "react";
import {
  View,
  Text,
  Image,
  Alert,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { router, Stack, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { apiService } from "../../src/services/api";
import * as guestDb from "../../src/services/guestDb";
import { useGameStore } from "../../src/stores/gameStore";
import { AnimatedLoader, Button } from "../../src/components/common";
import { FONTS } from "../../src/constants/theme";
import { useTranslation } from "react-i18next";


import { getDailyCount, incrementDailyCount, UPLOAD_LIMIT } from "../../src/hooks/useHomeworkLimit";

const MAX_DIMENSION = 1280;

async function compressForAnalysis(uri: string): Promise<{ uri: string; base64: string }> {
  const imageRef = await ImageManipulator.manipulate(uri)
    .resize({ width: MAX_DIMENSION })
    .renderAsync();
  const result = await imageRef.saveAsync({ compress: 0.8, format: SaveFormat.JPEG, base64: true });
  return { uri: result.uri, base64: result.base64! };
}

export default function CaptureScreen() {
  const { t } = useTranslation("homework");
  const { childId } = useLocalSearchParams<{ childId?: string }>();

  const { userRole, parentUser, guestProfile } = useGameStore();
  const userId = parentUser?._id ?? parentUser?.id ?? guestProfile?.guestId ?? "anonymous";

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const processImage = async (uri: string) => {
    setCompressing(true);
    try {
      const compressed = await compressForAnalysis(uri);
      setCapturedUri(compressed.uri);
      setCapturedBase64(compressed.base64);
    } catch {
      Alert.alert(t("common:errors.error"), t("errors.processFailed"));

    } finally {
      setCompressing(false);
    }
  };

  // Opens system camera without crop UI
  const handleCapture = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setCapturedBase64(null);
  };

  const handleSubmit = async () => {
    if (!capturedBase64) return;

    if (!__DEV__) {
      const count = await getDailyCount(userId);
      if (count >= UPLOAD_LIMIT) {
        Alert.alert(
          t("errors.limitReached"),
          t("errors.limitDesc", { limit: UPLOAD_LIMIT }),
        );
        return;
      }
    }

    setUploading(true);
    try {
      if (userRole === "guest") {
        const result = await apiService.analyzeGuestHomework(capturedBase64);
        const sessionId = Crypto.randomUUID();
        await guestDb.saveHomeworkSession({
          id: sessionId,
          title: result.title,
          subject: result.subject,
          status: result.status as any,
          topics: result.topics,
          answersMarkdown: result.answersMarkdown,
          imageBase64: capturedBase64,
          imageMimeType: "image/jpeg",
          quizTaken: false,
          linkedMatchIds: [],
          createdAt: Date.now(),
        });
        await incrementDailyCount(userId);
        router.replace(`/homework/session/${sessionId}` as any);
      } else {
        const session = await apiService.analyzeHomework(capturedBase64, undefined, childId);
        await incrementDailyCount(userId);
        router.replace(`/homework/processing?sessionId=${session._id}` as any);
      }
    } catch (err: any) {
      setUploading(false);
      Alert.alert(t("errors.uploadFailed"), err?.message ?? t("common:buttons.tryAgain"));

    }
  };

  if (!permission) return <View style={styles.bg} />;

  if (compressing) {
    return (
      <SafeAreaView style={[styles.bg, styles.center]}>
        <AnimatedLoader size="lg" />
        <Text style={[styles.hint, { marginTop: 16 }]}>{t("capture.preparing")}</Text>

      </SafeAreaView>
    );
  }

  // ── Preview after capture / pick ──────────────────────────────────────────
  if (capturedUri) {
    return (
      <>
        {Platform.OS === "ios" && (
          <Stack.Screen options={{ headerShown: true, title: t("session.reviewTitle") }} />

        )}
        <SafeAreaView style={styles.bg} edges={["bottom"]}>
          {Platform.OS === "android" && (
            <Pressable onPress={handleRetake} style={styles.androidBack} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
          )}
          <Image
            source={{ uri: capturedUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
          <View className="py-5" style={[styles.sheet, styles.sheetAbsolute]}>
            <View style={styles.sheetHandle} />
            <View style={styles.previewActions}>
              <Button
                variant="outline"
                label={t("actions.retake")}

                onPress={handleRetake}
                disabled={uploading}
                className="flex-1 max-w-none"
              />
              <Button
                label={uploading ? undefined : t("actions.analyze")}

                onPress={handleSubmit}
                disabled={uploading}
                className="flex-1 max-w-none"
              >
                {uploading ? <AnimatedLoader size="sm" color="#fff" /> : undefined}
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // ── Capture screen ─────────────────────────────────────────────────────────
  return (
    <>
      {Platform.OS === "ios" && (
        <Stack.Screen options={{ headerShown: true, title: t("title") }} />

      )}
      <SafeAreaView style={styles.bg} edges={["bottom"]}>
        {/* Live camera viewfinder as background */}
        {permission.granted && (
          <CameraView style={StyleSheet.absoluteFill} facing="back" />
        )}

        {Platform.OS === "android" && (
          <Pressable onPress={() => router.back()} style={styles.androidBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Bottom sheet */}
        <View className="m-10 py-10" style={[styles.sheet, styles.sheetAbsolute]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.hint}>{t("capture.hint")}</Text>

          <View style={styles.captureRow}>
            {/* Gallery picker */}
            <Pressable style={styles.sideBtn} onPress={handlePickFromGallery} hitSlop={12}>
              <Ionicons name="images-outline" size={26} color="#B8A9C9" />
              <Text style={styles.sideBtnLabel}>{t("actions.library")}</Text>

            </Pressable>

            {/* Shutter — opens system camera with crop */}
            <Pressable
              style={styles.captureBtn}
              onPress={permission.granted ? handleCapture : requestPermission}
            >
              <Ionicons name="camera" size={32} color="#FFFFFF" />
            </Pressable>

            {/* Balance spacer */}
            <View style={styles.sideBtn} />
          </View>

          {!permission.granted && (
            <Text style={[styles.hint, { marginTop: 8, marginBottom: 0 }]}>
              {t("capture.allowAccess")}

            </Text>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#0D0B14" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },

  sheetAbsolute: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: "#1A1520",
    borderRadius: 28,
    marginHorizontal: 22,
    marginBottom: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3D2E4A",
    alignSelf: "center",
    marginBottom: 16,
  },

  hint: {
    color: "#7B6B8A",
    fontSize: 13,
    fontFamily: FONTS.body,
    textAlign: "center",
    marginBottom: 20,
  },
  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#6C5CE7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C5CE7",
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  sideBtn: {
    width: 60,
    alignItems: "center",
    gap: 4,
  },
  sideBtnLabel: {
    color: "#7B6B8A",
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
  },

  previewActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },

  androidBack: {
    position: "absolute",
    top: 48,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
});

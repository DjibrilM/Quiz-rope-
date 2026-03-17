import { useState, useRef } from "react";
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
import { router, Stack, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../../src/services/api";
import { AnimatedLoader, Button } from "../../src/components/common";
import { FONTS } from "../../src/constants/theme";

const UPLOAD_LIMIT = 3;
const UPLOAD_KEY = "@hw_daily_uploads";

async function getDailyCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(UPLOAD_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    const today = new Date().toDateString();
    return date === today ? count : 0;
  } catch {
    return 0;
  }
}

async function incrementDailyCount(): Promise<void> {
  try {
    const count = await getDailyCount();
    await AsyncStorage.setItem(
      UPLOAD_KEY,
      JSON.stringify({ date: new Date().toDateString(), count: count + 1 }),
    );
  } catch {}
}


export default function CaptureScreen() {
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.45,
        base64: true,
      });
      if (photo) {
        setCapturedUri(photo.uri);
        setCapturedBase64(photo.base64 ?? null);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo. Try again.");
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.45,
      base64: true,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCapturedUri(asset.uri);
      setCapturedBase64(asset.base64 ?? null);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setCapturedBase64(null);
  };

  const handleSubmit = async () => {
    if (!capturedBase64) return;

    const count = await getDailyCount();
    if (count >= UPLOAD_LIMIT) {
      Alert.alert(
        "Daily limit reached",
        `You can scan up to ${UPLOAD_LIMIT} homework pages per day. Come back tomorrow!`,
      );
      return;
    }

    setUploading(true);
    try {
      const session = await apiService.analyzeHomework(capturedBase64, undefined, childId);
      await incrementDailyCount();
      router.replace(`/homework/processing?sessionId=${session._id}` as any);
    } catch (err: any) {
      setUploading(false);
      Alert.alert("Upload failed", err?.message ?? "Try again.");
    }
  };

  if (!permission) return <View style={styles.bg} />;

  if (!permission.granted) {
    return (
      <>
        {Platform.OS === "ios" && (
          <Stack.Screen
            options={{ headerShown: true, title: "Homework Assist" }}
          />
        )}
        <SafeAreaView style={styles.bg}>
          <View style={styles.center}>
            <Text style={styles.permTitle}>Camera access needed</Text>
            <Text style={styles.permSub}>
              We need camera access to photograph your homework.
            </Text>
            <Button onPress={requestPermission} label="Allow Camera" />
            <Pressable
              onPress={handlePickFromGallery}
              style={styles.galleryFallback}
            >
              <Text style={styles.galleryFallbackText}>
                Or choose from library
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // ── Preview after capture / pick ──────────────────────────────────────────
  if (capturedUri) {
    return (
      <>
        {Platform.OS === "ios" && (
          <Stack.Screen
            options={{ headerShown: true, title: "Review Photo" }}
          />
        )}
        <SafeAreaView style={styles.bg} edges={["bottom"]}>
          <Image
            source={{ uri: capturedUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />

          {/* Bottom sheet panel — floats over preview */}
          <View className="py-5" style={[styles.sheet, styles.sheetAbsolute]}>
            <View style={styles.sheetHandle} />
            <View style={styles.previewActions}>
              <Button
                variant="outline"
                label="Retake"
                onPress={handleRetake}
                disabled={uploading}
                className="flex-1 max-w-none"
              />
              <Button
                label={uploading ? undefined : "Analyze"}
                onPress={handleSubmit}
                disabled={uploading}
                className="flex-1 max-w-none"
              >
                {uploading ? (
                  <AnimatedLoader size="sm" color="#fff" />
                ) : undefined}
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // ── Live camera ───────────────────────────────────────────────────────────
  return (
    <>
      {Platform.OS === "ios" && (
        <Stack.Screen
          options={{ headerShown: true, title: "Homework Assist" }}
        />
      )}
      <SafeAreaView style={styles.bg} edges={["bottom"]}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
        />

        {/* Bottom sheet panel — floats over camera */}
        <View
          className="m-10 py-10"
          style={[styles.sheet, styles.sheetAbsolute]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.hint}>Point the camera at your homework</Text>
          <View style={styles.captureRow}>
            {/* Gallery picker */}
            <Pressable
              style={styles.sideBtn}
              onPress={handlePickFromGallery}
              hitSlop={12}
            >
              <Ionicons name="images-outline" size={26} color="#B8A9C9" />
              <Text style={styles.sideBtnLabel}>Library</Text>
            </Pressable>

            {/* Shutter */}
            <Pressable style={styles.captureBtn} onPress={handleCapture}>
              <Ionicons name="camera" size={32} color="#FFFFFF" />
            </Pressable>

            {/* Balance spacer */}
            <View style={styles.sideBtn} />
          </View>
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
  permTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Bungee_400Regular",
    textAlign: "center",
    marginBottom: 12,
  },
  permSub: {
    color: "#7B6B8A",
    fontSize: 14,
    fontFamily: FONTS.body,
    textAlign: "center",
    marginBottom: 28,
  },
  galleryFallback: { marginTop: 16, paddingVertical: 8 },
  galleryFallbackText: {
    color: "#6C5CE7",
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
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
});

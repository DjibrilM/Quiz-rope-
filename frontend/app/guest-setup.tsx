import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as Crypto from "expo-crypto";
import { usePortrait } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { hapticsService } from "../src/services/haptics";
import { AVATARS } from "../src/config/avatars";
import { AvatarIcon } from "../src/components/common/AvatarIcons";
import { FONTS } from "../src/constants/theme";

const RANDOM_AVATAR = AVATARS[Math.floor(Math.random() * AVATARS.length)].id;

export default function GuestSetupScreen() {
  const { t } = useTranslation(["common", "auth"]);
  usePortrait();

  const { setGuestProfile } = useGameStore();
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(RANDOM_AVATAR);
  const [nameError, setNameError] = useState("");

  const handleStart = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t("common:errors.nameRequired"));
      return;
    }
    if (trimmed.length > 20) {
      setNameError(t("common:errors.nameTooLong"));
      return;
    }

    hapticsService.success();

    const guestId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `guest-${Date.now()}-${Math.random()}`,
    ).then((h) => h.slice(0, 16));

    setGuestProfile({ guestId, displayName: trimmed, avatarId: selectedAvatar });
    router.replace("/home");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0B14" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingVertical: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 32,
              color: "#FFFFFF",
              fontFamily: "LuckiestGuy_400Regular",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {t("auth:guest.setupTitle")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#B8A9C9",
              fontFamily: FONTS.body,
              textAlign: "center",
              marginBottom: 36,
            }}
          >
            {t("auth:guest.setupSubtitle")}
          </Text>

          {/* Selected avatar preview */}
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: "#1A1520",
              borderWidth: 3,
              borderColor: "#9B59B6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            <AvatarIcon avatarId={selectedAvatar} size={64} />
          </View>

          {/* Avatar picker */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            {AVATARS.map((avatar) => (
              <Pressable
                key={avatar.id}
                onPress={() => {
                  hapticsService.selection();
                  setSelectedAvatar(avatar.id);
                }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    selectedAvatar === avatar.id ? "#9B59B6" : "#1A1520",
                  borderWidth: 2,
                  borderColor:
                    selectedAvatar === avatar.id ? "#C084FC" : "transparent",
                }}
              >
                <AvatarIcon avatarId={avatar.id} size={34} />
              </Pressable>
            ))}
          </View>

          {/* Name input */}
          <View style={{ width: "100%", marginBottom: 28 }}>
            <Text
              style={{
                color: "#B8A9C9",
                fontSize: 13,
                fontFamily: FONTS.bodySemiBold,
                marginBottom: 8,
                letterSpacing: 0.5,
              }}
            >
              {t("auth:guest.nameLabel")}
            </Text>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                setNameError("");
              }}
              placeholder={t("auth:guest.namePlaceholder")}
              placeholderTextColor="#5A4B6B"
              maxLength={20}
              style={{
                backgroundColor: "#1A1520",
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 14,
                fontSize: 18,
                color: "#FFFFFF",
                fontFamily: FONTS.bodyBold,
                borderWidth: 1.5,
                borderColor: nameError ? "#EF4444" : "#3D2E4A",
              }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleStart}
            />
            {nameError !== "" && (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 12,
                  fontFamily: FONTS.body,
                  marginTop: 6,
                }}
              >
                {nameError}
              </Text>
            )}
          </View>

          {/* Start button */}
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => ({
              width: "100%",
              backgroundColor: pressed ? "#7C3AED" : "#9B59B6",
              paddingVertical: 18,
              borderRadius: 20,
              alignItems: "center",
              shadowColor: "#9B59B6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 12,
              elevation: 8,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontFamily: "LuckiestGuy_400Regular",
                letterSpacing: 1,
              }}
            >
              {t("auth:guest.startButton")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { firebaseAuthService } from "../src/services/firebase";
import { AppTitle } from "../src/components/auth";
import { BackButton, AnimatedLoader, Button } from "../src/components/common";
import { FONTS } from "../src/constants/theme";

type Step = "email" | "check-email";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation(["auth"]);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  usePortrait();

  const handleSendResetLink = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("auth:forgotPassword.errorInvalidEmail"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await firebaseAuthService.sendPasswordResetEmail(trimmedEmail);
      setStep("check-email");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found") {
        setError(t("auth:forgotPassword.errorUserNotFound"));
      } else if (code === "auth/invalid-email") {
        setError(t("auth:forgotPassword.errorInvalidEmail"));
      } else if (code === "auth/too-many-requests") {
        setError(t("auth:forgotPassword.errorTooManyRequests"));
      } else {
        setError(err?.message || t("auth:forgotPassword.errorInvalidEmail"));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: "#0D0B14",
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONTS.body,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3D2E4A",
    marginBottom: 12,
  };

  // ── Step: check-email ──────────────────────────────────────────────────────
  // Firebase handles the new-password form on their hosted page.
  // After the user resets, they come back and log in normally.
  if (step === "check-email") {
    return (
      <SafeAreaView className="flex-1 bg-game-bg">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            paddingVertical: 40,
          }}
        >
          <AppTitle />
          <View className="w-full max-w-sm items-center">
            <Text style={{ fontSize: 40, marginBottom: 16 }}>📬</Text>
            <Text
              className="text-white text-xl mb-4 text-center"
              style={{ fontFamily: "Bungee_400Regular" }}
            >
              {t("auth:forgotPassword.checkEmailTitle", "Check your email")}
            </Text>
            <Text
              style={{
                color: "#7B6B8A",
                fontSize: 14,
                fontFamily: FONTS.body,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {t(
                "auth:forgotPassword.checkEmailMessage",
                "We sent a reset link to",
              )}
            </Text>
            <Text
              style={{
                color: "#9B59B6",
                fontSize: 13,
                fontFamily: FONTS.bodySemiBold,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {email}
            </Text>
            <Text
              style={{
                color: "#5A4D6A",
                fontSize: 13,
                fontFamily: FONTS.body,
                textAlign: "center",
                marginBottom: 32,
                lineHeight: 20,
              }}
            >
              {t(
                "auth:forgotPassword.tapLinkInstruction",
                "Tap the link in the email to set a new password, then come back here to log in.",
              )}
            </Text>

            <Pressable
              onPress={() => router.replace("/login")}
              className="w-full bg-game-indigo py-4 rounded-2xl items-center active:bg-indigo-700 mb-4"
            >
              <Text
                className="text-white text-lg font-bold"
                style={{ fontFamily: "Bungee_400Regular", letterSpacing: 0.5 }}
              >
                {t("auth:forgotPassword.goToLogin")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setStep("email");
                setError("");
              }}
              style={{ paddingVertical: 12, alignItems: "center" }}
            >
              <Text
                style={{
                  color: "#9B59B6",
                  fontSize: 14,
                  fontFamily: FONTS.bodyBold,
                }}
              >
                {t("auth:forgotPassword.wrongEmail", "Wrong email? Try again")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step: email ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <BackButton absolute />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            paddingVertical: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <AppTitle />

          <View className="w-full max-w-sm">
            <Text
              className="text-white text-xl mb-2 text-center"
              style={{ fontFamily: "Bungee_400Regular" }}
            >
              {t("auth:forgotPassword.title")}
            </Text>
            <Text
              style={{
                color: "#7B6B8A",
                fontSize: 14,
                fontFamily: FONTS.body,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              {t("auth:forgotPassword.instruction")}
            </Text>

            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError("");
              }}
              placeholder={t("auth:forgotPassword.emailPlaceholder")}
              placeholderTextColor="#7B6B8A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />

            {error ? (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 14,
                  fontFamily: FONTS.body,
                  marginBottom: 16,
                  marginLeft: 8,
                }}
              >
                {error}
              </Text>
            ) : (
              <View style={{ marginBottom: 16 }} />
            )}

            <Button
              onPress={handleSendResetLink}
              disabled={loading}
              style={loading ? { opacity: 0.7 } : undefined}
            >
              {loading ? (
                <AnimatedLoader color="#FFFFFF" size="sm" />
              ) : (
                <Text
                  className="text-white text-lg font-bold"
                  style={{
                    fontFamily: "Bungee_400Regular",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("auth:forgotPassword.sendCode")}
                </Text>
              )}
            </Button>
          </View>

          <View className="mt-6 flex-row items-center">
            <Text
              style={{ color: "#7B6B8A", fontSize: 14, fontFamily: FONTS.body }}
            >
              {t("auth:forgotPassword.noAccount")}{" "}
            </Text>
            <Text
              style={{
                color: "#9B59B6",
                fontSize: 14,
                fontFamily: FONTS.bodyBold,
              }}
              onPress={() => router.push("/signup" as any)}
            >
              {t("auth:forgotPassword.signUpLink")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

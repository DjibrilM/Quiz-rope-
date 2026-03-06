import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { AppTitle } from "../src/components/auth";
import { BackButton, AnimatedLoader } from "../src/components/common";
import { FONTS } from "../src/constants/theme";

type Step = 1 | 2 | 3 | "success";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation(["auth"]);
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  usePortrait();

  const clearError = () => { if (error) setError(""); };

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("auth:forgotPassword.errorInvalidEmail"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiService.sendOtp(trimmedEmail);
      setStep(2);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("User not found")) {
        setError(t("auth:forgotPassword.errorUserNotFound"));
      } else if (msg.includes("invalid") || msg.includes("Invalid")) {
        setError(t("auth:forgotPassword.errorInvalidEmail"));
      } else if (msg.includes("Too many") || msg.includes("too many")) {
        setError(t("auth:forgotPassword.errorTooManyRequests"));
      } else {
        setError(msg || t("auth:forgotPassword.errorInvalidEmail"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (code.trim().length !== 6) {
      setError(t("auth:forgotPassword.errorInvalidOtp"));
      return;
    }
    setError("");
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError(t("auth:forgotPassword.errorWeakPassword"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth:forgotPassword.errorPasswordMismatch"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiService.resetPassword(email.trim(), code.trim(), newPassword);
      setStep("success");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Invalid or expired")) {
        setError(t("auth:forgotPassword.errorExpiredOtp"));
      } else if (msg.includes("weak") || msg.includes("Weak")) {
        setError(t("auth:forgotPassword.errorWeakPassword"));
      } else {
        setError(msg || t("auth:forgotPassword.errorInvalidOtp"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else router.back();
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

  const renderStepContent = () => {
    if (step === "success") {
      return (
        <View className="w-full max-w-sm items-center">
          <Text style={{ fontSize: 40, marginBottom: 16 }}>✅</Text>
          <Text
            className="text-white text-xl mb-4 text-center"
            style={{ fontFamily: "Bungee_400Regular" }}
          >
            {t("auth:forgotPassword.successTitle")}
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
            {t("auth:forgotPassword.successMessage")}
          </Text>
          <Pressable
            onPress={() => router.replace("/login")}
            className="w-full bg-game-indigo py-4 rounded-2xl items-center active:bg-indigo-700"
          >
            <Text
              className="text-white text-lg font-bold"
              style={{ fontFamily: "Bungee_400Regular", letterSpacing: 0.5 }}
            >
              {t("auth:forgotPassword.goToLogin")}
            </Text>
          </Pressable>
        </View>
      );
    }

    if (step === 1) {
      return (
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
            onChangeText={(v) => { setEmail(v); clearError(); }}
            placeholder={t("auth:forgotPassword.emailPlaceholder")}
            placeholderTextColor="#7B6B8A"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={inputStyle}
          />

          {error ? (
            <Text style={{ color: "#EF4444", fontSize: 14, fontFamily: FONTS.body, marginBottom: 16, marginLeft: 8 }}>{error}</Text>
          ) : (
            <View style={{ marginBottom: 16 }} />
          )}

          <Pressable
            onPress={handleSendOtp}
            disabled={loading}
            className="w-full bg-game-indigo py-4 rounded-2xl items-center active:bg-indigo-700 mb-6"
            style={loading ? { opacity: 0.7 } : undefined}
          >
            {loading ? (
              <AnimatedLoader color="#FFFFFF" size="sm" />
            ) : (
              <Text
                className="text-white text-lg font-bold"
                style={{ fontFamily: "Bungee_400Regular", letterSpacing: 0.5 }}
              >
                {t("auth:forgotPassword.sendCode")}
              </Text>
            )}
          </Pressable>
        </View>
      );
    }

    if (step === 2) {
      return (
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
            {t("auth:forgotPassword.otpInstruction")}
          </Text>

          <TextInput
            value={code}
            onChangeText={(v) => { setCode(v.replace(/[^0-9]/g, "").slice(0, 6)); clearError(); }}
            placeholder={t("auth:forgotPassword.otpPlaceholder")}
            placeholderTextColor="#7B6B8A"
            keyboardType="number-pad"
            maxLength={6}
            style={{
              ...inputStyle,
              textAlign: "center",
              fontSize: 24,
              letterSpacing: 8,
            }}
          />

          {error ? (
            <Text style={{ color: "#EF4444", fontSize: 14, fontFamily: FONTS.body, marginBottom: 16, marginLeft: 8 }}>{error}</Text>
          ) : (
            <View style={{ marginBottom: 16 }} />
          )}

          <Pressable
            onPress={handleVerifyOtp}
            className="w-full bg-game-indigo py-4 rounded-2xl items-center active:bg-indigo-700 mb-4"
          >
            <Text
              className="text-white text-lg font-bold"
              style={{ fontFamily: "Bungee_400Regular", letterSpacing: 0.5 }}
            >
              {t("auth:forgotPassword.verify")}
            </Text>
          </Pressable>

          <Pressable onPress={handleSendOtp} disabled={loading}>
            <Text
              style={{
                color: "#9B59B6",
                fontSize: 14,
                fontFamily: FONTS.bodyBold,
                textAlign: "center",
              }}
            >
              {loading ? "..." : t("auth:forgotPassword.resendCode")}
            </Text>
          </Pressable>
        </View>
      );
    }

    // Step 3: New password
    return (
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
          {t("auth:forgotPassword.newPasswordInstruction")}
        </Text>

        <TextInput
          value={newPassword}
          onChangeText={(v) => { setNewPassword(v); clearError(); }}
          placeholder={t("auth:forgotPassword.newPasswordPlaceholder")}
          placeholderTextColor="#7B6B8A"
          secureTextEntry
          style={inputStyle}
        />

        <TextInput
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); clearError(); }}
          placeholder={t("auth:forgotPassword.confirmPasswordPlaceholder")}
          placeholderTextColor="#7B6B8A"
          secureTextEntry
          style={inputStyle}
        />

        {error ? (
          <Text style={{ color: "#EF4444", fontSize: 14, fontFamily: FONTS.body, marginBottom: 16, marginLeft: 8 }}>{error}</Text>
        ) : (
          <View style={{ marginBottom: 16 }} />
        )}

        <Pressable
          onPress={handleResetPassword}
          disabled={loading}
          className="w-full bg-game-indigo py-4 rounded-2xl items-center active:bg-indigo-700 mb-6"
          style={loading ? { opacity: 0.7 } : undefined}
        >
          {loading ? (
            <AnimatedLoader color="#FFFFFF" size="sm" />
          ) : (
            <Text
              className="text-white text-lg font-bold"
              style={{ fontFamily: "Bungee_400Regular", letterSpacing: 0.5 }}
            >
              {t("auth:forgotPassword.resetButton")}
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <BackButton absolute onPress={step === 1 ? undefined : handleBack} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          {renderStepContent()}

          {step !== "success" && (
            <View className="mt-6 flex-row items-center">
              <Text style={{ color: "#7B6B8A", fontSize: 14, fontFamily: FONTS.body }}>
                {t("auth:forgotPassword.noAccount")}{" "}
              </Text>
              <Text
                style={{ color: "#9B59B6", fontSize: 14, fontFamily: FONTS.bodyBold }}
                onPress={() => router.push("/signup" as any)}
              >
                {t("auth:forgotPassword.signUpLink")}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

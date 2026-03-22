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
import Svg, { Path, Line } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../../src/hooks/useOrientation";
import { apiService } from "../../src/services/api";
import { firebaseAuthService } from "../../src/services/firebase";
import { useGameStore } from "../../src/stores/gameStore";
import { AppTitle, LoginButton } from "../../src/components/auth";
import {
  ScreenHeader,
  Divider,
  AnimatedLoader,
  Button,
} from "../../src/components/common";
import { FONTS } from "../../src/constants/theme";
import { useToast } from "../../src/context/ToastContext";

export default function LoginScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useGameStore();
  const { showError, showApiError } = useToast();
  usePortrait();

  const validate = (): boolean => {
    if (!email.trim()) {
      showError(t("auth:validation.emailRequired"), "Validation");
      return false;
    }
    if (!password) {
      showError(t("auth:validation.passwordRequired"), "Validation");
      return false;
    }
    if (password.length < 6) {
      showError(t("auth:validation.passwordMinLength"), "Validation");
      return false;
    }
    return true;
  };

  const handleLogin = async (idToken: string) => {
    const result = await apiService.login(idToken);
    apiService.setToken(result.token);
    const user = result.user as unknown as Record<string, unknown>;
    setAuth(
      { ...result.user, ...user },
      result.mockMode ?? false,
      result.token,
    );

    // Subscription disabled — app is free for now

    router.replace("/home");
  };

  const handleMockLogin = async () => {
    try {
      const result = await apiService.login("mock-token");
      apiService.setToken(result.token || "mock-token");
      const user = (result.user || result) as unknown as Record<
        string,
        unknown
      >;
      setAuth(
        { ...result.user, ...user } as any,
        true,
        result.token || "mock-token",
      );
      router.replace("/home");
    } catch {
      setAuth(
        {
          id: "mock-parent",
          email: "parent@test.com",
          displayName: "Test Parent",
          children: [],
          createdAt: new Date(),
        },
        true,
        "mock-token",
      );
      router.replace("/home");
    }
  };

  const handleEmailSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (!firebaseAuthService.isConfigured()) {
        await handleMockLogin();
        return;
      }
      const { idToken } = await firebaseAuthService.signInWithEmail(
        email.trim(),
        password,
      );
      if (!firebaseAuthService.isEmailVerified()) {
        await firebaseAuthService.sendEmailVerification();
        router.replace({
          pathname: "/auth/verify-email" as any,
          params: { email: email.trim() },
        });
        return;
      }
      await handleLogin(idToken);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (!firebaseAuthService.isConfigured()) {
        await handleMockLogin();
        return;
      }
      const { idToken } = await firebaseAuthService.signInWithGoogle();
      await handleLogin(idToken);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ScreenHeader title={t("auth:login.signIn")} />

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
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
              }}
              placeholder={t("auth:login.emailPlaceholder")}
              placeholderTextColor="#7B6B8A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
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
              }}
            />

            <View style={{ position: "relative", marginBottom: 4 }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t("auth:login.passwordPlaceholder")}
                placeholderTextColor="#7B6B8A"
                secureTextEntry={!showPassword}
                style={{
                  backgroundColor: "#0D0B14",
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontFamily: FONTS.body,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  paddingRight: 52,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#3D2E4A",
                }}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 16,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
                hitSlop={8}
              >
                {showPassword ? (
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
                      stroke="#7B6B8A"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
                      stroke="#7B6B8A"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M10.73 10.73a3 3 0 104.54 4.54"
                      stroke="#7B6B8A"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                    />
                    <Line
                      x1="1"
                      y1="1"
                      x2="23"
                      y2="23"
                      stroke="#7B6B8A"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                    />
                  </Svg>
                ) : (
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      stroke="#7B6B8A"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12 9a3 3 0 100 6 3 3 0 000-6z"
                      stroke="#7B6B8A"
                      strokeWidth={1.8}
                    />
                  </Svg>
                )}
              </Pressable>
            </View>

            <Pressable onPress={handleForgotPassword} className="self-end mb-5">
              <Text
                style={{
                  color: "#9B59B6",
                  fontSize: 12,
                  fontFamily: FONTS.body,
                }}
              >
                {t("auth:login.forgotPassword")}
              </Text>
            </Pressable>

            <Button
              loading={loading}
              label={t("auth:login.signIn")}
              variant="primary"
              className="bg-game-indigo! w-full mb-2"
              onPress={handleEmailSignIn}
            />

            <Divider />

            <View className="items-center">
              <LoginButton
                onPress={handleGoogleSignIn}
                loading={loading}
                label={t("auth:login.continueWithGoogle")}
                variant="google"
              />
            </View>
          </View>

          <View className="mt-6 flex-row items-center">
            <Text
              style={{ color: "#7B6B8A", fontSize: 14, fontFamily: FONTS.body }}
            >
              {t("auth:login.noAccount")}{" "}
            </Text>
            <Text
              style={{
                color: "#9B59B6",
                fontSize: 14,
                fontFamily: FONTS.bodyBold,
              }}
              onPress={() => router.push("/auth/signup" as any)}
            >
              {t("auth:login.signUpLink")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

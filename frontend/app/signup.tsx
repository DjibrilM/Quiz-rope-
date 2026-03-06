import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { firebaseAuthService } from "../src/services/firebase";
import { useGameStore } from "../src/stores/gameStore";
import { AppTitle, LoginButton } from "../src/components/auth";
import { BackButton, Divider, AnimatedLoader } from "../src/components/common";
import { FONTS } from "../src/constants/theme";

export default function SignupScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuth } = useGameStore();
  usePortrait();

  const validate = (): boolean => {
    if (!email.trim()) {
      setError(t("auth:validation.emailRequired"));
      return false;
    }
    if (password.length < 6) {
      setError(t("auth:validation.passwordMinLength"));
      return false;
    }
    return true;
  };

  const handleLogin = async (idToken: string) => {
    const result = await apiService.login(idToken);
    apiService.setToken(result.token);
    const user = result.user as unknown as Record<string, unknown>;
    setAuth({ ...result.user, ...user }, result.mockMode ?? false, result.token);
    router.replace("/home");
  };

  const handleMockSignUp = async () => {
    try {
      const result = await apiService.login("mock-token");
      apiService.setToken(result.token || "mock-token");
      const user = (result.user || result) as unknown as Record<string, unknown>;
      setAuth({ ...result.user, ...user } as any, true, result.token || "mock-token");
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

  const handleEmailSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      if (!firebaseAuthService.isConfigured()) {
        await handleMockSignUp();
        return;
      }
      const { idToken } = await firebaseAuthService.signUpWithEmail(
        email.trim(),
        password,
        email.trim().split("@")[0]
      );
      await handleLogin(idToken);
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        setError(t("auth:errors.emailExists"));
      } else if (code === "auth/invalid-email") {
        setError(t("auth:errors.invalidEmail"));
      } else if (code === "auth/weak-password") {
        setError(t("auth:errors.weakPassword"));
      } else {
        setError(err.message || t("auth:errors.signUpFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError("");
    try {
      if (!firebaseAuthService.isConfigured()) {
        await handleMockSignUp();
        return;
      }
      const { idToken } = await firebaseAuthService.signInWithGoogle();
      await handleLogin(idToken);
    } catch (err: any) {
      setError(err.message || t("auth:errors.googleSignUpFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <BackButton absolute />

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

        <Text
          className="text-white text-xl mb-6 text-center"
          style={{ fontFamily: "Bungee_400Regular" }}
        >
          {t("auth:signup.title")}
        </Text>

        <View className="w-full max-w-sm">
          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError("");
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

          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError("");
            }}
            placeholder={t("auth:login.passwordPlaceholder")}
            placeholderTextColor="#7B6B8A"
            secureTextEntry
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
              marginBottom: 4,
            }}
          />

          {error ? (
            <Text style={{ color: "#EF4444", fontSize: 14, fontFamily: FONTS.body, marginBottom: 16, marginLeft: 8 }}>{error}</Text>
          ) : (
            <View style={{ marginBottom: 16 }} />
          )}

          <Pressable
            onPress={handleEmailSignUp}
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
                {t("auth:signup.createAccount")}
              </Text>
            )}
          </Pressable>

          <Divider />

          <View className="items-center">
            <LoginButton
              onPress={handleGoogleSignUp}
              loading={loading}
              label={t("auth:signup.signUpWithGoogle")}
              variant="google"
            />
          </View>
        </View>

        <View className="mt-6 flex-row items-center">
          <Text style={{ color: "#7B6B8A", fontSize: 14, fontFamily: FONTS.body }}>
            {t("auth:signup.hasAccount")}{" "}
          </Text>
          <Text
            style={{ color: "#9B59B6", fontSize: 14, fontFamily: FONTS.bodyBold }}
            onPress={() => router.replace("/login")}
          >
            {t("auth:signup.signInLink")}
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

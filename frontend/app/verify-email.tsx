import { View, Text, Pressable, AppState, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { firebaseAuthService } from "../src/services/firebase";
import { apiService } from "../src/services/api";
import { useGameStore } from "../src/stores/gameStore";
import { BackButton, AnimatedLoader } from "../src/components/common";
import { FONTS } from "../src/constants/theme";
import Svg, { Path, Circle } from "react-native-svg";

function EmailIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" fill="#1A1520" stroke="#6C5CE7" strokeWidth="1.5" />
      <Path
        d="M4 8l8 5 8-5"
        stroke="#9B59B6"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 8h16v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8z"
        stroke="#9B59B6"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function VerifyEmailScreen() {
  const { t } = useTranslation("auth");
  const { email } = useLocalSearchParams<{ email: string }>();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const { setAuth } = useGameStore();
  const appStateRef = useRef(AppState.currentState);
  const navigatedRef = useRef(false);
  usePortrait();

  // Auto-detect verification via deep link (quizrope://verify-email) or AppState
  useEffect(() => {
    const tryAutoVerify = async () => {
      if (navigatedRef.current) return;
      try {
        await firebaseAuthService.reloadUser();
        if (!firebaseAuthService.isEmailVerified()) return;
        navigatedRef.current = true;
        const idToken = await firebaseAuthService.getIdToken();
        const result = await apiService.login(idToken);
        apiService.setToken(result.token);
        const user = result.user as unknown as Record<string, unknown>;
        setAuth({ ...result.user, ...user }, result.mockMode ?? false, result.token);
        router.replace("/home");
      } catch {
        // silently ignore — user can tap the button manually
      }
    };

    // Deep link: fired when app is already open and a quizrope:// URL arrives
    const linkingSub = Linking.addEventListener("url", ({ url }) => {
      if (url.includes("verify-email")) tryAutoVerify();
    });

    // Deep link: fired when app was cold-started via the link
    Linking.getInitialURL().then((url) => {
      if (url?.includes("verify-email")) tryAutoVerify();
    });

    // AppState: fires when user switches back from the email client
    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        tryAutoVerify();
      }
      appStateRef.current = nextState;
    });

    return () => {
      linkingSub.remove();
      appStateSub.remove();
    };
  }, [setAuth]);

  const handleVerified = async () => {
    setLoading(true);
    setError("");
    try {
      await firebaseAuthService.reloadUser();
      if (!firebaseAuthService.isEmailVerified()) {
        setError(t("verifyEmail.notVerifiedError"));
        return;
      }
      const idToken = await firebaseAuthService.getIdToken();
      const result = await apiService.login(idToken);
      apiService.setToken(result.token);
      const user = result.user as unknown as Record<string, unknown>;
      setAuth({ ...result.user, ...user }, result.mockMode ?? false, result.token);
      router.replace("/home");
    } catch {
      setError(t("verifyEmail.notVerifiedError"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError("");
    try {
      await firebaseAuthService.sendEmailVerification();
      setResendSuccess(true);
    } catch {
      setError(t("verifyEmail.resendError"));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <BackButton absolute onPress={() => router.replace("/login")} />

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <EmailIcon />

        <Text
          style={{
            fontFamily: FONTS.heading,
            fontSize: 28,
            color: "#FFFFFF",
            textAlign: "center",
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          {t("verifyEmail.title")}
        </Text>

        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 15,
            color: "#B8A9C9",
            textAlign: "center",
            marginBottom: 8,
            lineHeight: 22,
          }}
        >
          {t("verifyEmail.subtitle", { email: email ?? "" })}
        </Text>

        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 14,
            color: "#7B6B8A",
            textAlign: "center",
            marginBottom: 12,
            lineHeight: 20,
          }}
        >
          {t("verifyEmail.instruction")}
        </Text>

        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: "#5A4D6A",
            textAlign: "center",
            marginBottom: 40,
            lineHeight: 18,
          }}
        >
          {t("verifyEmail.spamNote")}
        </Text>

        {error ? (
          <Text
            style={{
              color: "#EF4444",
              fontSize: 14,
              fontFamily: FONTS.body,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        ) : null}

        {resendSuccess ? (
          <Text
            style={{
              color: "#10B981",
              fontSize: 14,
              fontFamily: FONTS.body,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {t("verifyEmail.resendSuccess")}
          </Text>
        ) : null}

        <Pressable
          onPress={handleVerified}
          disabled={loading}
          style={({ pressed }) => ({
            width: "100%",
            backgroundColor: pressed ? "#5B4BD6" : "#6C5CE7",
            paddingVertical: 16,
            borderRadius: 20,
            alignItems: "center",
            marginBottom: 12,
            opacity: loading ? 0.7 : 1,
          })}
        >
          {loading ? (
            <AnimatedLoader color="#FFFFFF" size="sm" />
          ) : (
            <Text style={{ fontFamily: FONTS.subheading, fontSize: 16, color: "#FFFFFF" }}>
              {t("verifyEmail.verifiedButton")}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleResend}
          disabled={resendLoading}
          style={{ paddingVertical: 12, alignItems: "center" }}
        >
          {resendLoading ? (
            <AnimatedLoader color="#9B59B6" size="sm" />
          ) : (
            <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: "#9B59B6" }}>
              {t("verifyEmail.resendButton")}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

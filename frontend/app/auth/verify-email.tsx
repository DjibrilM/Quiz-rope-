import { View, Text, Pressable, AppState, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../../src/hooks/useOrientation";
import { firebaseAuthService } from "../../src/services/firebase";
import { apiService } from "../../src/services/api";
import { useGameStore } from "../../src/stores/gameStore";
import { ScreenHeader, AnimatedLoader } from "../../src/components/common";
import { FONTS } from "../../src/constants/theme";
import { useToast } from "../../src/context/ToastContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Svg, { Path, Circle } from "react-native-svg";

function EmailIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="11"
        fill="rgba(255, 255, 255, 0.04)"
        stroke="#A78BFA"
        strokeWidth="1.5"
      />
      <Path
        d="M4 8l8 5 8-5"
        stroke="#A78BFA"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 8h16v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8z"
        stroke="#A78BFA"
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
  const [verifying, setVerifying] = useState(false);
  const { setAuth } = useGameStore();
  const { showError, showSuccess } = useToast();
  const appStateRef = useRef(AppState.currentState);
  const navigatedRef = useRef(false);
  usePortrait();

  // Auto-detect verification via deep link (quizrope://verify-email) or AppState
  useEffect(() => {
    const tryAutoVerify = async () => {
      if (navigatedRef.current) return;
      setVerifying(true);
      try {
        await firebaseAuthService.reloadUser();
        if (!firebaseAuthService.isEmailVerified()) {
          // Not yet verified — stop spinner, let user wait
          setVerifying(false);
          return;
        }
        const idToken = await firebaseAuthService.getFirebaseIdToken();
        const result = await apiService.login(idToken);
        navigatedRef.current = true;
        apiService.setToken(result.token);
        const user = result.user as unknown as Record<string, unknown>;
        setAuth(
          { ...result.user, ...user },
          result.mockMode ?? false,
          result.token,
        );
        router.replace("/home");
      } catch {
        // Backend rejects if not yet verified — stop spinner, let user wait
        setVerifying(false);
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
    try {
      // reloadUser() forces a fresh token from Firebase's servers — the
      // backend's verifyIdToken will then see email_verified: true from the
      // token claims, which is more reliable than the SDK's cached property.
      await firebaseAuthService.reloadUser();
      const idToken = await firebaseAuthService.getFirebaseIdToken();
      const result = await apiService.login(idToken);
      apiService.setToken(result.token);
      const user = result.user as unknown as Record<string, unknown>;
      setAuth(
        { ...result.user, ...user },
        result.mockMode ?? false,
        result.token,
      );
      router.replace("/home");
    } catch (err: any) {
      console.error("[VerifyEmail] Verification Error:", err);
      apiService.reportError({
        context: "auth_verify_email",
        message: err.message || "Email verification check failed",
        stack: err.stack,
        metadata: { email },
      });
      showError(t("verifyEmail.notVerifiedError"), "Not Verified");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await firebaseAuthService.sendEmailVerification();
      showSuccess(t("verifyEmail.resendSuccess"), "Email Sent");
    } catch (err: any) {
      console.error("[VerifyEmail] Resend Error:", err);
      apiService.reportError({
        context: "auth_resend_verification",
        message: err.message || "Failed to resend verification email",
        stack: err.stack,
        metadata: { email },
      });
      showError(t("verifyEmail.resendError"), "Failed");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ScreenHeader title={t("verifyEmail.title")} />

      <View
        className="space-y-10"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 12,
        }}
      >
        <View
          className="mb-4 items-center justify-center rounded-full p-6"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.08)",
          }}
        >
          <MaterialCommunityIcons
            name="email-fast-outline"
            size={42}
            color="#A78BFA"
          />
        </View>

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

        {verifying ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 12,
              marginBottom: 8,
            }}
          >
            <AnimatedLoader color="#A78BFA" size="sm" />
            <Text
              style={{
                color: "#A78BFA",
                fontSize: 14,
                fontFamily: FONTS.bodySemiBold,
              }}
            >
              {t("verifyEmail.checkingVerification", "Checking verification…")}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleVerified}
          disabled={loading || verifying}
          style={({ pressed }) => ({
            width: "100%",
            backgroundColor: pressed ? "#5B4BD6" : "#6C5CE7",
            paddingVertical: 16,
            borderRadius: 20,
            alignItems: "center",
            marginBottom: 12,
            opacity: loading || verifying ? 0.5 : 1,
          })}
        >
          {loading ? (
            <AnimatedLoader color="#FFFFFF" size="sm" />
          ) : (
            <Text
              style={{
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
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
            <AnimatedLoader color="#A78BFA" size="sm" />
          ) : (
            <Text
              style={{ fontFamily: FONTS.body, fontSize: 14, color: "#A78BFA" }}
            >
              {t("verifyEmail.resendButton")}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

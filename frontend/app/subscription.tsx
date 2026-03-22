import { View, Text, Pressable, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { useGameStore } from "../src/stores/gameStore";
import { firebaseAuthService } from "../src/services/firebase";
import * as guestDb from "../src/services/guestDb";
import { FlutterwaveWebView } from "../src/components/payment";
import { FONTS } from "../src/constants/theme";

const FEATURE_KEYS = [
  "features.unlimitedGames",
  "features.allSubjects",
  "features.multiDevice",
  "features.progressTracking",
  "features.manageChildren",
] as const;

export default function SubscriptionScreen() {
  usePortrait();
  const queryClient = useQueryClient();
  const { t } = useTranslation(["subscription", "auth", "common"]);
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [txRef, setTxRef] = useState("");
  const { isMockMode, setSubscriptionStatus } = useGameStore();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const result = await apiService.initializeSubscription();
      setPaymentLink(result.paymentLink);
      setTxRef(result.txRef);
      setShowWebView(true);
    } catch (error: any) {
      Alert.alert(t("common:errors.error"), t("subscription:errors.paymentStartFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    setShowWebView(false);
    setLoading(true);
    try {
      const result = await apiService.verifySubscription(transactionId, txRef);
      if (result.verified) {
        setSubscriptionStatus("active", result.subscription?.currentPeriodEnd);
        router.replace("/home");
      } else {
        Alert.alert(t("subscription:errors.paymentFailedTitle"), t("subscription:errors.paymentVerifyFailed"));
      }
    } catch {
      Alert.alert(t("common:errors.error"), t("subscription:errors.paymentVerifyError"));
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewClose = () => {
    setShowWebView(false);
  };

  const handleMockActivate = async () => {
    setLoading(true);
    try {
      const result = await apiService.mockActivateSubscription();
      if (result.activated) {
        setSubscriptionStatus(
          "active",
          result.subscription?.currentPeriodEnd,
        );
        router.replace("/home");
      }
    } catch {
      Alert.alert(t("common:errors.error"), t("subscription:errors.mockActivationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseAuthService.signOut();
    } catch (err) {
      console.warn("Firebase sign-out error (non-critical):", err);
    }
    guestDb.clearAllGuestData().catch(() => {});
    apiService.clearToken();
    useGameStore.getState().logout();
    queryClient.clear();
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg items-center justify-center px-8">
      {/* Pricing Card */}
      <View style={{ backgroundColor: "#1A1520", borderRadius: 24, padding: 32, width: "100%", maxWidth: 400 }}>
        <Text
          style={{ color: "#FFFFFF", fontSize: 24, textAlign: "center", marginBottom: 8, fontFamily: "LuckiestGuy_400Regular" }}
        >
          {t("auth:appTitle")}
        </Text>
        <Text style={{ color: "#B8A9C9", fontSize: 14, textAlign: "center", marginBottom: 24, fontFamily: FONTS.body }}>
          {t("subscription:subtitle")}
        </Text>

        {/* Price */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text
              style={{ color: "#FFFFFF", fontSize: 48, fontFamily: "LuckiestGuy_400Regular" }}
            >
              {t("subscription:price")}
            </Text>
            <Text style={{ color: "#B8A9C9", fontSize: 18, marginLeft: 4, fontFamily: FONTS.body }}>{t("subscription:pricePeriod")}</Text>
          </View>
        </View>

        {/* Features */}
        <View style={{ marginBottom: 32 }}>
          {FEATURE_KEYS.map((key, index) => (
            <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(16, 185, 129, 0.2)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Text style={{ color: "#34D399", fontSize: 14, fontWeight: "bold" }}>{"\u2713"}</Text>
              </View>
              <Text style={{ color: "#B8A9C9", fontSize: 16, flex: 1, fontFamily: FONTS.body }}>{t(`subscription:${key}`)}</Text>
            </View>
          ))}
        </View>

        {/* Subscribe Button */}
        <Pressable
          onPress={handleSubscribe}
          disabled={loading}
          style={{
            backgroundColor: "#6C5CE7",
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
            opacity: loading ? 0.5 : 1,
          }}
        >
          <Text
            style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "Bungee_400Regular" }}
          >
            {loading ? t("subscription:processing") : t("subscription:subscribeNow")}
          </Text>
        </Pressable>

        {/* Mock Mode Button */}
        {isMockMode && (
          <Pressable
            onPress={handleMockActivate}
            disabled={loading}
            style={{
              backgroundColor: "#D97706",
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              marginTop: 12,
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "Bungee_400Regular" }}
            >
              {t("subscription:mockActivate")}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Logout Link */}
      <Pressable onPress={handleLogout} style={{ marginTop: 32 }}>
        <Text style={{ color: "#7B6B8A", fontSize: 16, fontFamily: FONTS.body }}>{t("auth:logout.title")}</Text>
      </Pressable>

      {/* Payment WebView Modal */}
      <Modal visible={showWebView} animationType="slide">
        <FlutterwaveWebView
          paymentLink={paymentLink}
          txRef={txRef}
          onSuccess={handlePaymentSuccess}
          onClose={handleWebViewClose}
        />
      </Modal>
    </SafeAreaView>
  );
}

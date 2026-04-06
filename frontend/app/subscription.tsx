import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { firebaseAuthService } from "../src/services/firebase";
import * as guestDb from "../src/services/guestDb";
import { apiService } from "../src/services/api";
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
  const { isMockMode, setSubscriptionStatus } = useGameStore();

  const handleMockActivate = async () => {
    try {
      const result = await apiService.mockActivateSubscription();
      if (result.activated) {
        setSubscriptionStatus("active", result.subscription?.currentPeriodEnd);
        router.replace("/home");
      }
    } catch {
      // ignore
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

        {/* Coming Soon Notice */}
        <View
          style={{
            backgroundColor: "rgba(108, 92, 231, 0.15)",
            borderWidth: 1,
            borderColor: "rgba(108, 92, 231, 0.4)",
            paddingVertical: 16,
            paddingHorizontal: 20,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#6C5CE7", fontSize: 16, fontFamily: "Bungee_400Regular", marginBottom: 4 }}>
            Coming Soon
          </Text>
          <Text style={{ color: "#B8A9C9", fontSize: 13, textAlign: "center", fontFamily: FONTS.body }}>
            Payments are not yet available. Check back soon!
          </Text>
        </View>

        {/* Mock Mode Button */}
        {isMockMode && (
          <Pressable
            onPress={handleMockActivate}
            style={{
              backgroundColor: "#D97706",
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "Bungee_400Regular" }}>
              {t("subscription:mockActivate")}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Logout Link */}
      <Pressable onPress={handleLogout} style={{ marginTop: 32 }}>
        <Text style={{ color: "#7B6B8A", fontSize: 16, fontFamily: FONTS.body }}>{t("auth:logout.title")}</Text>
      </Pressable>

    </SafeAreaView>
  );
}

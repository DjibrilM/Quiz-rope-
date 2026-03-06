import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FlutterwaveWebViewProps {
  paymentLink: string;
  txRef: string;
  onSuccess: (transactionId: string) => void;
  onClose: () => void;
}

export function FlutterwaveWebView({
  paymentLink,
  txRef,
  onSuccess,
  onClose,
}: FlutterwaveWebViewProps) {
  const { t } = useTranslation("subscription");
  const [loading, setLoading] = useState(true);

  const handleNavigationChange = (navState: { url: string }) => {
    const { url } = navState;

    // Check if Flutterwave redirected to our callback URL
    if (
      url.includes("quizrope.app/payment/callback") ||
      url.includes("payment/callback")
    ) {
      try {
        const urlObj = new URL(url);
        const status = urlObj.searchParams.get("status");
        const transactionId =
          urlObj.searchParams.get("transaction_id") ||
          urlObj.searchParams.get("tx_ref");

        if (status === "successful" && transactionId) {
          onSuccess(transactionId);
        } else {
          onClose();
        }
      } catch {
        onClose();
      }
    }
  };

  return (
    <View className="flex-1 bg-game-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-card-bg">
        <Text className="text-white text-lg font-bold">{t("completePayment")}</Text>
        <Pressable
          onPress={onClose}
          className="bg-slate-700 px-4 py-2 rounded-lg active:bg-slate-600"
        >
          <Text className="text-slate-300 text-sm font-medium">{t("common:buttons.close", { ns: "common" })}</Text>
        </Pressable>
      </View>

      {/* WebView */}
      <View className="flex-1">
        <WebView
          source={{ uri: paymentLink }}
          onNavigationStateChange={handleNavigationChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
        {loading && (
          <View className="absolute inset-0 items-center justify-center bg-game-bg/80">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-slate-400 mt-3">{t("loadingPayment")}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

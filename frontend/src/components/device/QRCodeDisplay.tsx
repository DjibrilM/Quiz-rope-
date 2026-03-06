import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import QRCodeStyled from "react-native-qrcode-styled";
import { useTranslation } from "react-i18next";

interface QRCodeDisplayProps {
  sessionToken: string;
  status: "generating" | "ready" | "linked" | "waiting" | "expired";
}

export function QRCodeDisplay({ sessionToken, status }: QRCodeDisplayProps) {
  const { t } = useTranslation("common");

  return (
    <View className="w-72 h-72 bg-white rounded-3xl items-center justify-center mb-8 overflow-hidden">
      {status === "generating" ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-slate-500 text-sm mt-3">{t("labels.generating")}</Text>
        </View>
      ) : status === "expired" ? (
        <View className="items-center px-6">
          <Text className="text-red-500 text-lg font-bold">{t("labels.codeExpired")}</Text>
          <Text className="text-slate-400 text-sm mt-2 text-center">
            {t("labels.generateNewBelow")}
          </Text>
        </View>
      ) : (
        <View className="items-center">
          <QRCodeStyled
            data={sessionToken}
            style={{ backgroundColor: "white" }}
            padding={16}
            size={220}
            pieceBorderRadius={3}
            color="#1E1B4B"
            isPiecesGlued
            outerEyesOptions={{
              borderRadius: 12,
              color: "#7C3AED",
            }}
            innerEyesOptions={{
              borderRadius: 6,
              color: "#8B5CF6",
            }}
          />
          {status === "linked" && (
            <Text className="text-green-600 text-sm font-bold mt-2">
              {t("labels.linked")}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

import React from "react";
import { View, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

interface QRScannerProps {
  onScan: (data: string) => void;
  enabled: boolean;
}

export function QRScanner({ onScan, enabled }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View className="w-full aspect-square bg-card-bg rounded-3xl items-center justify-center">
        <Text className="text-slate-400 text-lg">Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="w-full aspect-square bg-card-bg rounded-3xl items-center justify-center">
        <Text className="text-slate-400 text-lg text-center px-6 mb-4">
          Camera access is needed to scan QR codes
        </Text>
        <Text
          className="text-game-purple text-lg font-bold"
          onPress={requestPermission}
        >
          Grant Permission
        </Text>
      </View>
    );
  }

  return (
    <View className="w-full aspect-square rounded-3xl overflow-hidden">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={
          enabled
            ? ({ data }) => {
                onScan(data);
              }
            : undefined
        }
      />
    </View>
  );
}

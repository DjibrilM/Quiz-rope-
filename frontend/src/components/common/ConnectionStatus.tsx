import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { socketService } from "../../services/socket";

export function ConnectionStatus() {
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleDisconnect = () => setDisconnected(true);
    const handleConnect = () => setDisconnected(false);

    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleConnect);
    };
  }, []);

  const { t } = useTranslation("common");

  if (!disconnected) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      className="bg-game-warning/90 py-2 px-4 items-center"
    >
      <Text className="text-white text-sm font-bold">
        {t("labels.reconnecting")}
      </Text>
    </Animated.View>
  );
}

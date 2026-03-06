import React, { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../../stores/gameStore";

export function StreakBadge() {
  const { t } = useTranslation("game");
  const streak = useGameStore((s) => s.streak);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (streak >= 2) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 12, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 200 }),
      );
      rotation.value = withSequence(
        withTiming(-6, { duration: 80 }),
        withTiming(6, { duration: 80 }),
        withTiming(0, { duration: 100 }),
      );
    } else {
      scale.value = withTiming(0, { duration: 150 });
    }
  }, [streak]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  if (streak < 2) return null;

  return (
    <Animated.View
      style={[
        animStyle,
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: "rgba(255, 217, 61, 0.15)",
          borderColor: "#FFD93D",
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 10,
          paddingVertical: 3,
        },
      ]}
    >
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="#FFD93D">
        <Path d="M12 2C9 7 4 9 4 14a8 8 0 0016 0c0-5-5-7-8-12z" />
      </Svg>
      <Text
        style={{
          color: "#FFD93D",
          fontSize: 11,
          fontFamily: "Bungee_400Regular",
        }}
      >
        {t("streak", { count: streak })}
      </Text>
    </Animated.View>
  );
}

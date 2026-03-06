import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { FONTS, FORTNITE_COLORS } from "../../constants/theme";

interface AnimatedLoaderProps {
  color?: string;
  size?: "sm" | "md" | "lg";
  message?: string;
}

const SIZE_MAP = { sm: 6, md: 10, lg: 14 };

function Dot({
  delay,
  color,
  dotSize,
}: {
  delay: number;
  color: string;
  dotSize: number;
}) {
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          marginHorizontal: dotSize * 0.3,
        },
        style,
      ]}
    />
  );
}

export function AnimatedLoader({
  color = FORTNITE_COLORS.glowPurple,
  size = "md",
  message,
}: AnimatedLoaderProps) {
  const dotSize = SIZE_MAP[size];

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Dot delay={0} color={color} dotSize={dotSize} />
        <Dot delay={150} color={color} dotSize={dotSize} />
        <Dot delay={300} color={color} dotSize={dotSize} />
      </View>
      {message && (
        <Text
          style={{
            color: FORTNITE_COLORS.textSecondary,
            fontSize: 14,
            fontFamily: FONTS.body,
            marginTop: 12,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

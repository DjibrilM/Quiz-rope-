import { memo, useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

export const ScorePop = memo(function ScorePop({ side }: { side: "left" | "right" }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = 0;
    opacity.value = 1;
    translateY.value = withTiming(-32, { duration: 600, easing: Easing.out(Easing.cubic) });
    opacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(0, { duration: 500 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    position: "absolute" as const,
    bottom: "100%",
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none" as any,
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ color: "#10B981", fontSize: 16, fontFamily: "Bungee_400Regular" }}>
        +10
      </Text>
    </Animated.View>
  );
});

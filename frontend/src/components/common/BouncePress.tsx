import React from "react";
import { Pressable, PressableProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BouncePressProps extends PressableProps {
  children: React.ReactNode;
}

export function BouncePress({ children, onPressIn, onPressOut, style, ...rest }: BouncePressProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1.0, { damping: 20, stiffness: 300 });
        onPressOut?.(e);
      }}
      style={[animatedStyle, style as any]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

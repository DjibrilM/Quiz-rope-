import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { soundService } from "../../services/sound";
import { hapticsService } from "../../services/haptics";
import { FONTS } from "../../constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedOptionProps {
  label: string;
  optionText: string;
  index: number;
  questionId: string;
  staggerDelay: number;
  variant: "default" | "selected" | "correct" | "wrong";
  teamColor: string;
  disabled: boolean;
  onPress: () => void;
}

const OPTION_COLORS = [
  { bg: '#1E1A2E', border: '#6C5CE7', badgeBg: '#6C5CE7' },  // A - Indigo
  { bg: '#1A2428', border: '#0EA5E9', badgeBg: '#0EA5E9' },  // B - Sky
  { bg: '#1E2420', border: '#F59E0B', badgeBg: '#F59E0B' },  // C - Amber
  { bg: '#241A22', border: '#E85D75', badgeBg: '#E85D75' },  // D - Pink
];

export function AnimatedOption({
  label,
  optionText,
  index,
  questionId,
  staggerDelay,
  variant,
  disabled,
  onPress,
}: AnimatedOptionProps) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(10);
  const opacity = useSharedValue(0);
  const feedbackScale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    scale.value = 0;
    translateY.value = 10;
    opacity.value = 0;
    feedbackScale.value = 1;
    shakeX.value = 0;
    const ease = { duration: 250, easing: Easing.out(Easing.cubic) };
    scale.value = withDelay(staggerDelay, withTiming(1, ease));
    translateY.value = withDelay(staggerDelay, withTiming(0, ease));
    opacity.value = withDelay(staggerDelay, withTiming(1, { duration: 200 }));
  }, [questionId]);

  // Pulse on correct, shake on wrong
  useEffect(() => {
    if (variant === "correct") {
      feedbackScale.value = withSequence(
        withTiming(1.06, { duration: 120 }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }),
      );
    } else if (variant === "wrong") {
      shakeX.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [variant]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * feedbackScale.value },
      { translateY: translateY.value },
      { translateX: shakeX.value },
    ],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    soundService.play("buttonPress");
    hapticsService.selection();
    onPress();
  };

  let bg: string, border: string, badgeBg: string, textC: string;
  if (variant === "selected") {
    bg = "#231C2B";
    border = "#B8A9C9";
    badgeBg = "#B8A9C9";
    textC = "#ffffff";
  } else if (variant === "correct") {
    bg = "#0A2E1A";
    border = "#10B981";
    badgeBg = "#10B981";
    textC = "#10B981";
  } else if (variant === "wrong") {
    bg = "#350a0a";
    border = "#EF4444";
    badgeBg = "#EF4444";
    textC = "#EF4444";
  } else {
    const optColor = OPTION_COLORS[index % 4];
    bg = optColor.bg;
    border = optColor.border;
    badgeBg = optColor.badgeBg;
    textC = "#E0D4EC";
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        animatedStyle,
        {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 1.5,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 10,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Option ${label}: ${optionText}`}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: badgeBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 13,
            fontFamily: "Bungee_400Regular",
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          color: textC,
          fontSize: 15,
          lineHeight: 21,
          fontFamily: FONTS.bodySemiBold,
          flex: 1,
        }}
        numberOfLines={2}
      >
        {optionText}
      </Text>
    </AnimatedPressable>
  );
}

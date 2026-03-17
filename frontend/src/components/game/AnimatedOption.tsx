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
import Svg, { Path, Circle } from "react-native-svg";
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
  compact?: boolean;
}

const OPTION_COLORS = [
  { bg: '#1E1A2E', border: '#6C5CE7', badgeBg: '#6C5CE7' },  // A - Indigo
  { bg: '#1A2428', border: '#0EA5E9', badgeBg: '#0EA5E9' },  // B - Sky
  { bg: '#1E2420', border: '#F59E0B', badgeBg: '#F59E0B' },  // C - Amber
  { bg: '#241A22', border: '#E85D75', badgeBg: '#E85D75' },  // D - Pink
];

function CheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" fill="#10B981" />
      <Path
        d="M7 12l3.5 3.5 6.5-7"
        stroke="#FFFFFF"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function XIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" fill="#EF4444" />
      <Path
        d="M8 8l8 8M16 8L8 16"
        stroke="#FFFFFF"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AnimatedOption({
  label,
  optionText,
  index,
  questionId,
  staggerDelay,
  variant,
  disabled,
  onPress,
  compact = false,
}: AnimatedOptionProps) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(8);
  const opacity = useSharedValue(0);
  const dimOpacity = useSharedValue(1);
  const feedbackScale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  // Entry animation on new question — fast and snappy
  useEffect(() => {
    scale.value = 0;
    translateY.value = 8;
    opacity.value = 0;
    dimOpacity.value = 1;
    feedbackScale.value = 1;
    shakeX.value = 0;
    const ease = { duration: 80, easing: Easing.out(Easing.cubic) };
    scale.value = withDelay(staggerDelay, withTiming(1, ease));
    translateY.value = withDelay(staggerDelay, withTiming(0, ease));
    opacity.value = withDelay(staggerDelay, withTiming(1, { duration: 70 }));
  }, [questionId]);

  // Fade out unchosen options once this player has locked in
  useEffect(() => {
    if (disabled && variant === "default") {
      dimOpacity.value = withTiming(0.3, { duration: 120, easing: Easing.out(Easing.cubic) });
    }
  }, [disabled, variant]);

  // Instant feedback animations on answer
  useEffect(() => {
    if (variant === "correct") {
      // Quick celebratory pulse
      feedbackScale.value = withSequence(
        withTiming(1.07, { duration: 70, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 100, easing: Easing.out(Easing.cubic) }),
      );
    } else if (variant === "wrong") {
      // Fast shake to signal error
      shakeX.value = withSequence(
        withTiming(-6, { duration: 40 }),
        withTiming(6, { duration: 40 }),
        withTiming(-3, { duration: 35 }),
        withTiming(0, { duration: 35 }),
      );
    }
  }, [variant]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * feedbackScale.value },
      { translateY: translateY.value },
      { translateX: shakeX.value },
    ],
    opacity: opacity.value * dimOpacity.value,
  }));

  const handlePress = () => {
    onPress();
    soundService.play("buttonPress");
    hapticsService.selection();
  };

  let bg: string, border: string, badgeBg: string, textC: string;
  if (variant === "correct") {
    bg = "#0A2E1A";
    border = "#10B981";
    badgeBg = "#10B981";
    textC = "#10B981";
  } else if (variant === "wrong") {
    bg = "#350a0a";
    border = "#EF4444";
    badgeBg = "#EF4444";
    textC = "#EF4444";
  } else if (variant === "selected") {
    bg = "#231C2B";
    border = "#B8A9C9";
    badgeBg = "#B8A9C9";
    textC = "#ffffff";
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
          borderRadius: compact ? 10 : 14,
          paddingHorizontal: compact ? 8 : 14,
          paddingVertical: compact ? 7 : 12,
          gap: compact ? 6 : 10,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Option ${label}: ${optionText}`}
    >
      <View
        style={{
          width: compact ? 22 : 28,
          height: compact ? 22 : 28,
          borderRadius: compact ? 6 : 8,
          backgroundColor: badgeBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: compact ? 11 : 13,
            fontFamily: "Bungee_400Regular",
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          color: textC,
          fontSize: compact ? 12 : 15,
          lineHeight: compact ? 16 : 21,
          fontFamily: FONTS.bodySemiBold,
          flex: 1,
        }}
        numberOfLines={2}
      >
        {optionText}
      </Text>
      {/* Instant result icons */}
      {variant === "correct" && <CheckIcon />}
      {variant === "wrong" && <XIcon />}
    </AnimatedPressable>
  );
}

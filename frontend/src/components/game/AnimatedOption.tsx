import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";
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

/**
 * 🔥 SAME math brightening logic (shared with QuestionCard)
 */
const brightenMath = (text: string) => {
  if (!text) return text;

  return text
    .replace(/\$\$(.*?)\$\$/gs, (_, expr) => {
      return `$$\\color{#E5E7EB}{${expr}}$$`;
    })
    .replace(/\$(.*?)\$/g, (_, expr) => {
      return `$\\color{#E5E7EB}{${expr}}$`;
    });
};

function CheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
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
    <Svg width={18} height={18} viewBox="0 0 24 24">
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

  useEffect(() => {
    if (disabled && variant === "default") {
      dimOpacity.value = withTiming(0.3, { duration: 120 });
    }
  }, [disabled, variant]);

  useEffect(() => {
    if (variant === "correct") {
      feedbackScale.value = withSequence(
        withTiming(1.07, { duration: 70 }),
        withTiming(1, { duration: 100 }),
      );
    } else if (variant === "wrong") {
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

  const processedMarkdown = useMemo(() => {
    return brightenMath(optionText);
  }, [optionText]);

  const handlePress = () => {
    onPress();
    soundService.play("buttonPress");
    hapticsService.selection();
  };

  let bg: string,
    border: string,
    badgeBg: string,
    textC: string,
    labelC: string;

  if (variant === "correct") {
    bg = "rgba(16, 185, 129, 0.1)";
    border = "rgba(16, 185, 129, 0.3)";
    badgeBg = "rgba(16, 185, 129, 0.2)";
    textC = "#10B981";
    labelC = "#10B981";
  } else if (variant === "wrong") {
    bg = "rgba(239, 68, 68, 0.1)";
    border = "rgba(239, 68, 68, 0.3)";
    badgeBg = "rgba(239, 68, 68, 0.2)";
    textC = "#EF4444";
    labelC = "#EF4444";
  } else if (variant === "selected") {
    bg = "rgba(255,255,255,0.95)";
    border = "rgba(255,255,255,0.95)";
    badgeBg = "rgba(0,0,0,0.05)";
    textC = "#000000";
    labelC = "#000000";
  } else {
    bg = "rgba(255,255,255,0.03)";
    border = "rgba(255,255,255,0.08)";
    badgeBg = "rgba(255,255,255,0.05)";
    textC = "#E5E7EB";
    labelC = "rgba(255,255,255,0.5)";
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        animatedStyle,
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 1,
          borderRadius: compact ? 12 : 16,
          minHeight: compact ? 48 : 56,
          width: "100%",
          paddingHorizontal: compact ? 10 : 16,
          paddingVertical: compact ? 10 : 16,
          gap: compact ? 8 : 12,
        },
      ]}
    >
      {/* Label */}
      <View
        style={{
          width: compact ? 24 : 32,
          height: compact ? 24 : 32,
          borderRadius: compact ? 6 : 8,
          backgroundColor: badgeBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: labelC,
            fontSize: compact ? 12 : 14,
            fontFamily: FONTS.bodyBold,
          }}
        >
          {label}
        </Text>
      </View>

      {/* Markdown content */}
      <View style={{ flex: 1 }}>
        <EnrichedMarkdownText
          flavor="github"
          markdown={processedMarkdown}
          onLinkPress={({ url }) => Linking.openURL(url)}
          markdownStyle={{
            paragraph: {
              color: textC,
            },
            code: {
              backgroundColor: "rgba(255,255,255,0.1)",
              color: textC,
            },
          }}
        />
      </View>

      {variant === "correct" && <CheckIcon />}
      {variant === "wrong" && <XIcon />}
    </AnimatedPressable>
  );
}

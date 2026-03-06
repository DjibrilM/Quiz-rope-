import React, { useEffect } from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TimerBarProps {
  timeRemaining: number;
  maxTime: number;
}

const SIZE = 48;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerBar({ timeRemaining, maxTime }: TimerBarProps) {
  const { t } = useTranslation("common");
  const progress = useSharedValue(timeRemaining / maxTime);
  const pulse = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(timeRemaining / maxTime, { duration: 900 });
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRemaining <= 5 && timeRemaining > 0) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 300 }),
          withTiming(1, { duration: 300 }),
        ),
        -1,
        false,
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [timeRemaining <= 5]);

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
    stroke: interpolateColor(
      progress.value,
      [0, 0.3, 0.6, 1],
      ["#EF4444", "#E85D75", "#9B59B6", "#9B59B6"],
    ),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        containerStyle,
        { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
      ]}
      accessibilityRole="timer"
      accessibilityLabel={t("accessibility.secondsRemaining", { count: timeRemaining })}
    >
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#3D2E4A"
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={circleProps}
          strokeLinecap="round"
        />
      </Svg>
      <Text
        style={{
          position: "absolute",
          color: "#FFFFFF",
          fontSize: 14,
          fontFamily: "Bungee_400Regular",
        }}
      >
        {timeRemaining}
      </Text>
    </Animated.View>
  );
}

import React, { useEffect, useMemo } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Circle, Polygon } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { FONTS } from "../../constants/theme";

interface RoundResultOverlayProps {
  result: {
    isCorrect: boolean;
    correctIndex: number;
    ropeMovement: number;
    newRopePosition: number;
  };
}

function SmallCheck() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" fill="#10B981" />
      <Path
        d="M7 12l3.5 3.5 6.5-7"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SmallX() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" fill="#D97706" />
      <Path
        d="M8 8l8 8M16 8L8 16"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const SPARKLE_COLORS = ["#FFD93D", "#FFFFFF", "#10B981"];

function SparkleParticle({
  angle,
  distance,
  size,
  delay,
  color,
}: {
  angle: number;
  distance: number;
  size: number;
  delay: number;
  color: string;
}) {
  const scale = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const particleOpacity = useSharedValue(1);

  useEffect(() => {
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 }),
      ),
    );
    translateX.value = withDelay(delay, withTiming(tx, { duration: 600 }));
    translateY.value = withDelay(delay, withTiming(ty, { duration: 600 }));
    particleOpacity.value = withDelay(
      delay + 300,
      withTiming(0, { duration: 300 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: particleOpacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Polygon
          points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,17.5 6,22 8,14.5 2,9.5 9.5,9"
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}

function MiniSparkles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        angle: (Math.PI * 2 * i) / 8,
        distance: 35 + Math.random() * 25,
        size: 8 + Math.random() * 6,
        delay: Math.random() * 100,
        color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
      })),
    [],
  );

  return (
    <View
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
      pointerEvents="none"
    >
      {particles.map((p) => (
        <SparkleParticle key={p.id} {...p} />
      ))}
    </View>
  );
}

export function RoundResultOverlay({ result }: RoundResultOverlayProps) {
  const { t } = useTranslation("game");
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const encouragements = t("result.encouragement", { returnObjects: true }) as string[];
  const encourageMsg = useMemo(
    () => encouragements[Math.floor(Math.random() * encouragements.length)],
    [],
  );

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 60, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 50 });

    if (!result.isCorrect) {
      shakeX.value = withSequence(
        withTiming(-4, { duration: 40 }),
        withTiming(4, { duration: 40 }),
        withTiming(-2, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: shakeX.value }],
    opacity: opacity.value,
  }));

  const bg = result.isCorrect
    ? "rgba(16, 185, 129, 0.95)"
    : "rgba(217, 119, 6, 0.90)";

  return (
    <View
      className="absolute left-0 right-0"
      style={{ top: 110 }}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          {
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: bg,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 40,
            overflow: "visible",
          },
          animatedStyle,
        ]}
      >
        {result.isCorrect && <MiniSparkles />}
        {result.isCorrect ? <SmallCheck /> : <SmallX />}
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 16,
            fontFamily: "LuckiestGuy_400Regular",
          }}
        >
          {result.isCorrect ? t("result.correct") : encourageMsg}
        </Text>
      </Animated.View>
    </View>
  );
}

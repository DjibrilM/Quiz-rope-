import React, { useEffect } from "react";
import { View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { FORTNITE_COLORS } from "../../constants/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const CONFETTI_COLORS = [
  FORTNITE_COLORS.teamRed,
  FORTNITE_COLORS.teamBlue,
  FORTNITE_COLORS.glowYellow,
  FORTNITE_COLORS.glowPurple,
  "#FFFFFF",
];

interface ParticleData {
  id: number;
  color: string;
  startX: number;
  angle: number;
  speed: number;
  size: number;
  delay: number;
  rotation: number;
}

const PARTICLES: ParticleData[] = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  startX: SCREEN_W * 0.5 + (Math.random() - 0.5) * 60,
  angle: (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.5,
  speed: 200 + Math.random() * 300,
  size: 6 + Math.random() * 6,
  delay: Math.random() * 200,
  rotation: Math.random() * 360,
}));

function ConfettiParticle({ particle }: { particle: ParticleData }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const dx = Math.cos(particle.angle) * particle.speed * t;
    const dy =
      Math.sin(particle.angle) * particle.speed * t * -0.6 +
      400 * t * t; // gravity
    const opacity = interpolate(t, [0, 0.7, 1], [1, 0.8, 0]);
    const rotate = particle.rotation + t * 360;

    return {
      transform: [
        { translateX: dx },
        { translateY: dy },
        { rotate: `${rotate}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: particle.startX,
          top: SCREEN_H * 0.35,
          width: particle.size,
          height: particle.size * 0.6,
          borderRadius: 2,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
}

interface ConfettiOverlayProps {
  visible: boolean;
}

export function ConfettiOverlay({ visible }: ConfettiOverlayProps) {
  if (!visible) return null;

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      {PARTICLES.map((p) => (
        <ConfettiParticle key={p.id} particle={p} />
      ))}
    </View>
  );
}

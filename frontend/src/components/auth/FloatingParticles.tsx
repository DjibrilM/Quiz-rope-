import React, { useEffect } from "react";
import { View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { FORTNITE_COLORS } from "../../constants/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Particle {
  id: number;
  startX: number;
  startY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

const PARTICLE_COLORS = [
  FORTNITE_COLORS.glowPink,
  FORTNITE_COLORS.glowPurple,
  FORTNITE_COLORS.glowYellow,
  "rgba(255,255,255,0.3)",
];

const PARTICLES: Particle[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  startX: Math.random() * SCREEN_W,
  startY: Math.random() * SCREEN_H,
  size: 4 + Math.random() * 8,
  color: PARTICLE_COLORS[i % 4],
  duration: 4000 + Math.random() * 4000,
  delay: Math.random() * 2000,
}));

function SingleParticle({ particle }: { particle: Particle }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(1, {
          duration: particle.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [0, -60]);
    const opacity = interpolate(
      progress.value,
      [0, 0.3, 0.7, 1],
      [0.1, 0.4, 0.4, 0.1]
    );
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 1.2, 0.8]);
    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: particle.startX,
          top: particle.startY,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function FloatingParticles() {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      pointerEvents="none"
    >
      {PARTICLES.map((p) => (
        <SingleParticle key={p.id} particle={p} />
      ))}
    </View>
  );
}

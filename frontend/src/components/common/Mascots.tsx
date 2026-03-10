import React from "react";
import Svg, {
  Path,
  Circle,
  Defs,
  RadialGradient,
  Stop,
  G,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const AnimatedG = Animated.createAnimatedComponent(G);
const BLINK_INTERVAL = 3000;

interface MascotProps {
  size?: number;
}

export function BrainMascot({ size = 150 }: MascotProps) {
  const bounceY = useSharedValue(0);
  const blink = useSharedValue(1);

  React.useEffect(() => {
    bounceY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    blink.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withDelay(BLINK_INTERVAL, withTiming(1, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));

  const leftEyeProps = useAnimatedProps(() => ({
    transform: [
      { translateX: 35 },
      { translateY: 55 },
      { scaleY: blink.value },
    ],
  }));

  const rightEyeProps = useAnimatedProps(() => ({
    transform: [
      { translateX: 65 },
      { translateY: 55 },
      { scaleY: blink.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Defs>
          {/* Radial gradient creates a 3D spherical lighting effect */}
          <RadialGradient
            id="brainVolume"
            cx="30%"
            cy="30%"
            r="70%"
            fx="30%"
            fy="30%"
          >
            <Stop offset="0%" stopColor="#FBCFE8" />
            <Stop offset="50%" stopColor="#EC4899" />
            <Stop offset="100%" stopColor="#9D174D" />
          </RadialGradient>

          <RadialGradient id="eyeShadow" cx="50%" cy="50%" r="50%">
            <Stop offset="70%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#D1D5DB" />
          </RadialGradient>
        </Defs>

        {/* Main brain volume */}
        <Path
          d="M50 20 C 20 20, 10 40, 15 60 C 5 70, 15 90, 35 85 C 45 95, 60 95, 65 85 C 85 90, 95 70, 85 60 C 90 40, 80 20, 50 20 Z"
          fill="url(#brainVolume)"
        />

        {/* Softened folds */}
        <Path
          d="M50 20 Q 50 80 50 85 M 30 35 Q 40 50 20 55 M 70 35 Q 60 50 80 55 M 25 70 Q 35 60 45 75 M 75 70 Q 65 60 55 75"
          stroke="#831843"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* 3D Eyeballs */}
        <Circle
          cx="35"
          cy="55"
          r="10"
          fill="url(#eyeShadow)"
          stroke="#4B5563"
          strokeWidth="1"
        />
        <Circle
          cx="65"
          cy="55"
          r="10"
          fill="url(#eyeShadow)"
          stroke="#4B5563"
          strokeWidth="1"
        />
        <Path d="M45 55 L55 55" stroke="#4B5563" strokeWidth="2" />

        {/* Pupils with Catchlights (the white glint) */}
        <AnimatedG animatedProps={leftEyeProps}>
          <Circle cx="0" cy="0" r="4.5" fill="#111827" />
          <Circle cx="-1.5" cy="-1.5" r="1.5" fill="#FFFFFF" opacity="0.9" />
        </AnimatedG>
        <AnimatedG animatedProps={rightEyeProps}>
          <Circle cx="0" cy="0" r="4.5" fill="#111827" />
          <Circle cx="-1.5" cy="-1.5" r="1.5" fill="#FFFFFF" opacity="0.9" />
        </AnimatedG>

        {/* Subtler smile */}
        <Path
          d="M38 72 Q 50 80 62 72"
          stroke="#4B5563"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

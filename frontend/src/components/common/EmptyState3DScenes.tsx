import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  useAnimatedProps,
  Easing,
} from "react-native-reanimated";
import Svg, { G, Circle, Rect, Path, Ellipse } from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);

// ─────────────────────────────────────────────
// BABY FACE — noChildren
// Blinking eyes, head sway, gentle bob
// ─────────────────────────────────────────────

function BabyFaceSVG() {
  const bobY = useSharedValue(0);
  const sway = useSharedValue(0);
  const blinkScale = useSharedValue(1);

  useEffect(() => {
    bobY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    sway.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(4, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    // Double blink every ~3.5s
    blinkScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        withTiming(0.06, { duration: 70, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 80, easing: Easing.in(Easing.cubic) }),
        withTiming(0.06, { duration: 70, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 80, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, []);

  const groupProps = useAnimatedProps(() => ({
    translateX: 60,
    translateY: 58 + bobY.value,
    rotation: sway.value,
  }));

  const leftEyeProps = useAnimatedProps(() => ({
    scaleY: blinkScale.value,
    originX: -14,
    originY: -6,
  }));

  const rightEyeProps = useAnimatedProps(() => ({
    scaleY: blinkScale.value,
    originX: 14,
    originY: -6,
  }));

  return (
    <AnimatedG animatedProps={groupProps}>
      {/* Head */}
      <Circle cx={0} cy={0} r={36} fill="#f4c28f" />
      {/* Hair poof */}
      <Path d="M -34 -14 Q -18 -52 0 -55 Q 18 -52 34 -14" fill="#5D3A1A" />
      {/* Rosy cheeks */}
      <Ellipse cx={-22} cy={10} rx={9} ry={6} fill="#FFB5B5" opacity={0.45} />
      <Ellipse cx={22} cy={10} rx={9} ry={6} fill="#FFB5B5" opacity={0.45} />
      {/* Left eye group */}
      <AnimatedG animatedProps={leftEyeProps}>
        <Circle cx={-14} cy={-6} r={8} fill="white" />
        <Circle cx={-14} cy={-6} r={4.5} fill="#5D4037" />
        <Circle cx={-14} cy={-6} r={2.8} fill="#1a1a2e" />
        <Circle cx={-11} cy={-8.5} r={1.3} fill="white" />
      </AnimatedG>
      {/* Right eye group */}
      <AnimatedG animatedProps={rightEyeProps}>
        <Circle cx={14} cy={-6} r={8} fill="white" />
        <Circle cx={14} cy={-6} r={4.5} fill="#5D4037" />
        <Circle cx={14} cy={-6} r={2.8} fill="#1a1a2e" />
        <Circle cx={17} cy={-8.5} r={1.3} fill="white" />
      </AnimatedG>
      {/* Smile */}
      <Path
        d="M -11 14 Q 0 22 11 14"
        stroke="#E85D75"
        strokeWidth={2.8}
        fill="none"
        strokeLinecap="round"
      />
    </AnimatedG>
  );
}

// ─────────────────────────────────────────────
// TROPHY — noRankings
// Floating + gentle rock
// ─────────────────────────────────────────────

function TrophySVG() {
  const floatY = useSharedValue(0);
  const rock = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    rock.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  const groupProps = useAnimatedProps(() => ({
    translateX: 60,
    translateY: 72 + floatY.value,
    rotation: rock.value,
  }));

  return (
    <AnimatedG animatedProps={groupProps}>
      {/* Cup body */}
      <Path d="M -26 0 L -18 -36 L 18 -36 L 26 0 Z" fill="#FFD93D" />
      {/* Rim */}
      <Rect x={-20} y={-40} width={40} height={8} rx={4} fill="#D4A017" />
      {/* Left handle */}
      <Path
        d="M -26 -6 Q -42 -18 -26 -30"
        stroke="#D4A017"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      {/* Right handle */}
      <Path
        d="M 26 -6 Q 42 -18 26 -30"
        stroke="#D4A017"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      {/* Star on cup */}
      <Path
        d="M 0 -22 L 3 -16 L 9 -16 L 4 -12 L 6 -6 L 0 -10 L -6 -6 L -4 -12 L -9 -16 L -3 -16 Z"
        fill="white"
        opacity={0.7}
      />
      {/* Stem */}
      <Rect x={-4} y={0} width={8} height={14} fill="#D4A017" />
      {/* Base */}
      <Rect x={-20} y={13} width={40} height={8} rx={4} fill="#FFD93D" />
    </AnimatedG>
  );
}

// ─────────────────────────────────────────────
// GAME BOX — noMatches
// Gentle rock
// ─────────────────────────────────────────────

function GameBoxSVG() {
  const rock = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    rock.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(12, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    floatY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const groupProps = useAnimatedProps(() => ({
    translateX: 60,
    translateY: 62 + floatY.value,
    rotation: rock.value,
  }));

  return (
    <AnimatedG animatedProps={groupProps}>
      {/* Box body */}
      <Rect x={-28} y={-28} width={56} height={56} rx={8} fill="#9B59B6" />
      {/* Top highlight */}
      <Rect x={-28} y={-28} width={56} height={8} rx={4} fill="#B875D6" opacity={0.5} />
      {/* Plus — horizontal bar */}
      <Rect x={-18} y={-5} width={36} height={10} rx={5} fill="#E85D75" />
      {/* Plus — vertical bar */}
      <Rect x={-5} y={-18} width={10} height={36} rx={5} fill="#E85D75" />
    </AnimatedG>
  );
}

// ─────────────────────────────────────────────
// ERROR CLOUD — error
// Floating cloud + flashing lightning bolt
// ─────────────────────────────────────────────

function ErrorCloudSVG() {
  const floatY = useSharedValue(0);
  const lightningOpacity = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Lightning: off 2.5s → flash → flash → pause → repeat
    lightningOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2500, easing: Easing.linear }),
        withTiming(1, { duration: 60 }),
        withTiming(0, { duration: 80 }),
        withTiming(1, { duration: 60 }),
        withTiming(0, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, []);

  const cloudProps = useAnimatedProps(() => ({
    translateX: 60,
    translateY: 52 + floatY.value,
  }));

  const lightningProps = useAnimatedProps(() => ({
    opacity: lightningOpacity.value,
  }));

  return (
    <>
      <AnimatedG animatedProps={cloudProps}>
        <Circle cx={-18} cy={8} r={18} fill="#5A4B6B" />
        <Circle cx={6} cy={2} r={22} fill="#5A4B6B" />
        <Circle cx={28} cy={10} r={15} fill="#5A4B6B" />
        <Circle cx={10} cy={14} r={16} fill="#6B5C7B" />
        <Rect x={-36} y={10} width={72} height={18} fill="#5A4B6B" />
      </AnimatedG>
      <AnimatedG animatedProps={lightningProps}>
        <Path
          d="M 64 80 L 56 96 L 62 96 L 54 114 L 70 94 L 63 94 Z"
          fill="#FFD93D"
        />
      </AnimatedG>
    </>
  );
}

// ─────────────────────────────────────────────
// WRAPPER
// ─────────────────────────────────────────────

function SceneWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ width: 120, height: 120 }}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        {children}
      </Svg>
    </View>
  );
}

// ─── EXPORTED SCENE COMPONENTS ───

export function BabyFaceScene() {
  return (
    <SceneWrapper>
      <BabyFaceSVG />
    </SceneWrapper>
  );
}

export function TrophyScene() {
  return (
    <SceneWrapper>
      <TrophySVG />
    </SceneWrapper>
  );
}

export function GameBoxScene() {
  return (
    <SceneWrapper>
      <GameBoxSVG />
    </SceneWrapper>
  );
}

export function ErrorCloudScene() {
  return (
    <SceneWrapper>
      <ErrorCloudSVG />
    </SceneWrapper>
  );
}

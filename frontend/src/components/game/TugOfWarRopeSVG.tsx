import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { VB_W, VB_H, GROUND_Y, lerp } from "./rope";
import { PullingFigure } from "./rope/PullingFigure";
import { RopeStrands } from "./rope/RopeStrands";
import { PositionIndicator } from "./rope/PositionIndicator";

interface TugOfWarRopeProps {
  ropePosition: number;
}

const CHAR_SPACING = 48;
const CENTER_X = VB_W / 2;

const LEFT_CHARS = [
  { offset: 1, scale: 1.1, opacity: 1, skinTone: "#f4c28f", hairColor: "#2c1810" },
  { offset: 2, scale: 1, opacity: 0.82, skinTone: "#8d5524", hairColor: "#1a1a1a" },
  { offset: 3, scale: 0.88, opacity: 0.65, skinTone: "#c68642", hairColor: "#8b6914" },
];

const RIGHT_CHARS = [
  { offset: 1, scale: 1.1, opacity: 1, skinTone: "#e8b88a", hairColor: "#4a2c17" },
  { offset: 2, scale: 1, opacity: 0.82, skinTone: "#d4956b", hairColor: "#2c1810" },
  { offset: 3, scale: 0.88, opacity: 0.65, skinTone: "#f4c28f", hairColor: "#1a1a1a" },
];

export function TugOfWarRopeSVG({ ropePosition }: TugOfWarRopeProps) {
  const animatedPosition = useSharedValue(0);
  const strainPulse = useSharedValue(0);

  useEffect(() => {
    animatedPosition.value = withSpring(ropePosition, {
      damping: 8,
      stiffness: 90,
      mass: 1,
    });

    strainPulse.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(-0.5, { duration: 50 }),
      withTiming(0, { duration: 60 }),
    );
  }, [ropePosition]);

  const ropeContainerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      animatedPosition.value,
      [-5, 0, 5],
      [-130, 0, 130],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX + strainPulse.value * 2 },
      ],
    };
  });

  const tension = Math.abs(ropePosition) / 5;
  const sag = lerp(14, 3, tension);
  const leftWinning = ropePosition < -1;
  const rightWinning = ropePosition > 1;

  return (
    <View style={{ width: "100%", alignItems: "center", overflow: "hidden" }}>
      <Animated.View style={[ropeContainerStyle, { width: "100%" }]}>
        <Svg
          width="100%"
          height={VB_H}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Ground line */}
          <Line
            x1={40} y1={GROUND_Y}
            x2={VB_W - 40} y2={GROUND_Y}
            stroke="#2a2a4a" strokeWidth={1}
            strokeDasharray="6,4"
          />

          {/* Center marker */}
          <Line
            x1={CENTER_X} y1={GROUND_Y - 8}
            x2={CENTER_X} y2={GROUND_Y + 8}
            stroke="#ffcc00" strokeWidth={1.5}
            strokeDasharray="3,3"
            opacity={0.4}
          />

          {/* Left team - rear to front */}
          {[...LEFT_CHARS].reverse().map((char, i) => (
            <PullingFigure
              key={`left-${i}`}
              x={CENTER_X - char.offset * CHAR_SPACING}
              groundY={GROUND_Y}
              facingRight
              winning={leftWinning}
              teamColor="#ff6b6b"
              skinTone={char.skinTone}
              hairColor={char.hairColor}
              tension={tension}
              scale={char.scale}
              figureOpacity={char.opacity}
            />
          ))}

          {/* Right team - rear to front */}
          {[...RIGHT_CHARS].reverse().map((char, i) => (
            <PullingFigure
              key={`right-${i}`}
              x={CENTER_X + char.offset * CHAR_SPACING}
              groundY={GROUND_Y}
              facingRight={false}
              winning={rightWinning}
              teamColor="#4ecdc4"
              skinTone={char.skinTone}
              hairColor={char.hairColor}
              tension={tension}
              scale={char.scale}
              figureOpacity={char.opacity}
            />
          ))}

          {/* Rope on top */}
          <RopeStrands sag={sag} />
        </Svg>
      </Animated.View>

      <PositionIndicator ropePosition={ropePosition} />
    </View>
  );
}

import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useDerivedValue,
  withSpring,
  withRepeat,
  withTiming,
  useAnimatedProps,
  Easing,
} from "react-native-reanimated";
import Svg, { G, Circle, Rect, Path, Ellipse } from "react-native-svg";
import { PositionIndicator } from "./rope/PositionIndicator";

// ── SVG canvas dimensions ──────────────────────────────────────────────────
const W = 400;
const H = 192;
const CX = W / 2; // 200 — horizontal center
const GROUND_Y = 150; // ground line Y
const ROPE_Y = 82; // rope center Y

// ── World → SVG coordinate mapping ────────────────────────────────────────
const SCALE = 40; // 1 world unit = 40 SVG px
const MAX_WORLD = 5; // ropePosition range ±5
const ROPE_HALF_SVG = 170; // rope half-length in SVG px (≈ROPE_LENGTH/2*SCALE)
const TEAM_OFFSET = 2.5; // world units from center to team anchor
const CHAR_SPACING = 1.4; // world units between characters

// ── Team configs ────────────────────────────────────────────────────────────
const RED = "#ff6b6b";
const BLUE = "#4ecdc4";

const LEFT_CHARS = [
  { skin: "#f4c28f", hair: "#2c1810", s: 1.1 },
  { skin: "#8d5524", hair: "#1a1a1a", s: 1.0 },
  { skin: "#c68642", hair: "#8b6914", s: 0.88 },
];
const RIGHT_CHARS = [
  { skin: "#e8b88a", hair: "#4a2c17", s: 1.1 },
  { skin: "#d4956b", hair: "#2c1810", s: 1.0 },
  { skin: "#f4c28f", hair: "#1a1a1a", s: 0.88 },
];

// ── Animated SVG primitives ──────────────────────────────────────────────────
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// ── Static character shapes (drawn with feet origin at (0, 0)) ───────────────
function CharBody({
  team,
  skin,
  hair,
  scale: s,
  flip,
}: {
  team: string;
  skin: string;
  hair: string;
  scale: number;
  flip: 1 | -1;
}) {
  return (
    <G transform={`scale(${flip * s}, ${s})`}>
      {/* Shadow */}
      <Ellipse cx={0} cy={0} rx={14} ry={4} fill="#000" opacity={0.15} />
      {/* Back leg */}
      <Rect x={-7} y={-24} width={9} height={24} rx={4} fill={team} opacity={0.7} />
      {/* Back shoe */}
      <Rect x={-10} y={-6} width={14} height={7} rx={3} fill="white" opacity={0.7} />
      {/* Front leg */}
      <Rect x={0} y={-24} width={9} height={24} rx={4} fill={team} />
      {/* Front shoe */}
      <Rect x={-1} y={-6} width={14} height={7} rx={3} fill="white" />
      {/* Back arm */}
      <Rect x={-15} y={-45} width={8} height={18} rx={4} fill={skin} opacity={0.7} />
      {/* Torso */}
      <Rect x={-12} y={-50} width={24} height={26} rx={8} fill={team} />
      {/* Shirt stripe */}
      <Rect x={-12} y={-43} width={24} height={6} rx={3} fill="white" opacity={0.12} />
      {/* Front arm */}
      <Rect x={6} y={-45} width={8} height={18} rx={4} fill={skin} />
      {/* Headband */}
      <Rect x={-13} y={-65} width={26} height={5} rx={2} fill={team} />
      {/* Head */}
      <Circle cx={0} cy={-62} r={14} fill={skin} />
      {/* Hair */}
      <Path d={`M -14 -66 Q 0 -80 14 -66`} fill={hair} />
      {/* L eye white */}
      <Circle cx={-5} cy={-64} r={3.2} fill="white" />
      {/* L pupil */}
      <Circle cx={-5} cy={-64} r={1.7} fill="#1a1a2e" />
      {/* L highlight */}
      <Circle cx={-3.5} cy={-65.3} r={0.7} fill="white" />
      {/* R eye white */}
      <Circle cx={5} cy={-64} r={3.2} fill="white" />
      {/* R pupil */}
      <Circle cx={5} cy={-64} r={1.7} fill="#1a1a2e" />
      {/* R highlight */}
      <Circle cx={6.5} cy={-65.3} r={0.7} fill="white" />
      {/* Mouth */}
      <Path
        d="M -4 -57 Q 0 -55 4 -57"
        stroke="#444"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheeks */}
      <Circle cx={-9} cy={-60} r={3.5} fill="#FFB5B5" opacity={0.38} />
      <Circle cx={9} cy={-60} r={3.5} fill="#FFB5B5" opacity={0.38} />
    </G>
  );
}

// ── Animated character wrapper ───────────────────────────────────────────────
function AnimChar({
  charIdx,
  isLeft,
  team,
  skin,
  hair,
  scale,
  smooth,
  elapsed,
  tension,
}: {
  charIdx: number;
  isLeft: boolean;
  team: string;
  skin: string;
  hair: string;
  scale: number;
  smooth: Animated.SharedValue<number>;
  elapsed: Animated.SharedValue<number>;
  tension: Animated.SharedValue<number>;
}) {
  const dirSign = isLeft ? -1 : 1;
  // World X when smooth=0: teamAnchor ± char offset
  const baseWorld = dirSign * TEAM_OFFSET + dirSign * charIdx * CHAR_SPACING;

  const props = useAnimatedProps(() => {
    const svgX = CX + (smooth.value + baseWorld) * SCALE;
    const t = elapsed.value;
    const ten = tension.value;

    const speed = 1.5 + ten * 2.0;
    const phase = t * speed + charIdx * 0.7;
    const cycle = Math.sin(phase);
    const winBoost = (isLeft ? smooth.value < -1 : smooth.value > 1) ? 1.2 : 0.8;
    const intensity = (0.3 + ten * 0.7) * winBoost;

    // Body lean angle (degrees) — teams lean toward rope center
    const leanDeg =
      (isLeft ? 1 : -1) *
      (0.15 + ten * 0.2 + cycle * 0.08 * intensity) *
      (180 / Math.PI);

    return {
      transform: `translate(${svgX}, ${GROUND_Y}) rotate(${leanDeg}, 0, -24)`,
    };
  });

  return (
    <AnimatedG animatedProps={props}>
      <CharBody
        team={team}
        skin={skin}
        hair={hair}
        scale={scale}
        flip={isLeft ? 1 : -1}
      />
    </AnimatedG>
  );
}

// ── Animated rope ─────────────────────────────────────────────────────────────
function AnimRope({
  smooth,
  tension,
}: {
  smooth: Animated.SharedValue<number>;
  tension: Animated.SharedValue<number>;
}) {
  const shadowProps = useAnimatedProps(() => {
    const pos = smooth.value * SCALE;
    const sag = (0.05 + (1 - tension.value) * 0.3) * SCALE * 1.15;
    const lx = CX + pos - ROPE_HALF_SVG;
    const rx = CX + pos + ROPE_HALF_SVG;
    const mx = CX + pos;
    return {
      d: `M ${lx} ${ROPE_Y + 2} Q ${mx} ${ROPE_Y + 2 + sag} ${rx} ${ROPE_Y + 2}`,
    };
  });

  const mainProps = useAnimatedProps(() => {
    const pos = smooth.value * SCALE;
    const sag = (0.05 + (1 - tension.value) * 0.3) * SCALE;
    const lx = CX + pos - ROPE_HALF_SVG;
    const rx = CX + pos + ROPE_HALF_SVG;
    const mx = CX + pos;
    return {
      d: `M ${lx} ${ROPE_Y} Q ${mx} ${ROPE_Y + sag} ${rx} ${ROPE_Y}`,
    };
  });

  const highlightProps = useAnimatedProps(() => {
    const pos = smooth.value * SCALE;
    const sag = (0.05 + (1 - tension.value) * 0.3) * SCALE * 0.85;
    const lx = CX + pos - ROPE_HALF_SVG;
    const rx = CX + pos + ROPE_HALF_SVG;
    const mx = CX + pos;
    return {
      d: `M ${lx} ${ROPE_Y - 2} Q ${mx} ${ROPE_Y - 2 + sag} ${rx} ${ROPE_Y - 2}`,
    };
  });

  return (
    <>
      <AnimatedPath
        animatedProps={shadowProps}
        stroke="#8b7635"
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
      <AnimatedPath
        animatedProps={mainProps}
        stroke="#c4a45a"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <AnimatedPath
        animatedProps={highlightProps}
        stroke="#e0d08a"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

// ── Animated center flag ──────────────────────────────────────────────────────
function AnimFlag({ smooth }: { smooth: Animated.SharedValue<number> }) {
  const props = useAnimatedProps(() => ({
    transform: `translate(${CX + smooth.value * SCALE}, ${ROPE_Y})`,
  }));

  return (
    <AnimatedG animatedProps={props}>
      {/* Stick */}
      <Rect x={-1.5} y={-32} width={3} height={32} fill="#8b7635" />
      {/* Flag pennant */}
      <Path d="M 0 -32 L 20 -25 L 0 -18 Z" fill="#ffcc00" />
    </AnimatedG>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
interface TugOfWarRope3DProps {
  ropePosition: number;
}

export function TugOfWarRope3D({ ropePosition }: TugOfWarRope3DProps) {
  // Spring-smoothed world position
  const smooth = useSharedValue(0);

  useEffect(() => {
    smooth.value = withSpring((ropePosition / MAX_WORLD) * (ROPE_HALF_SVG / SCALE), {
      damping: 8,
      stiffness: 90,
      mass: 1,
    });
  }, [ropePosition]);

  // Tension derived from smoothed position
  const tension = useDerivedValue(() =>
    Math.min(Math.abs(smooth.value) / (ROPE_HALF_SVG / SCALE), 1),
  );

  // Elapsed time for heave animation (loops every 1000s)
  const elapsed = useSharedValue(0);
  useEffect(() => {
    elapsed.value = withRepeat(
      withTiming(1000, { duration: 1_000_000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  return (
    <View style={{ width: "100%", alignItems: "center", overflow: "hidden" }}>
      <View style={{ width: "100%", height: 192 }}>
        <Svg
          width="100%"
          height={192}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Background */}
          <Rect x={0} y={0} width={W} height={H} fill="#1a1a2e" />
          {/* Ground */}
          <Rect x={0} y={GROUND_Y} width={W} height={H - GROUND_Y} fill="#2a2a4a" />

          {/* Left team — render back to front (index 2 first) */}
          {[...LEFT_CHARS].reverse().map((c, ri) => {
            const i = LEFT_CHARS.length - 1 - ri;
            return (
              <AnimChar
                key={`l${i}`}
                charIdx={i}
                isLeft={true}
                team={RED}
                skin={c.skin}
                hair={c.hair}
                scale={c.s}
                smooth={smooth}
                elapsed={elapsed}
                tension={tension}
              />
            );
          })}

          {/* Rope */}
          <AnimRope smooth={smooth} tension={tension} />

          {/* Center flag */}
          <AnimFlag smooth={smooth} />

          {/* Right team — render back to front */}
          {[...RIGHT_CHARS].reverse().map((c, ri) => {
            const i = RIGHT_CHARS.length - 1 - ri;
            return (
              <AnimChar
                key={`r${i}`}
                charIdx={i}
                isLeft={false}
                team={BLUE}
                skin={c.skin}
                hair={c.hair}
                scale={c.s}
                smooth={smooth}
                elapsed={elapsed}
                tension={tension}
              />
            );
          })}
        </Svg>
      </View>
      <PositionIndicator ropePosition={ropePosition} />
    </View>
  );
}

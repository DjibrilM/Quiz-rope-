import React from "react";
import { G, Path, Line, Circle } from "react-native-svg";
import { VB_W, ROPE_Y, ROPE_START, ROPE_END, buildRopePath } from "./constants";

interface RopeStrandsProps {
  sag: number;
}

export function RopeStrands({ sag }: RopeStrandsProps) {
  const flagX = VB_W / 2;
  const flagBaseY = ROPE_Y + sag;

  return (
    <G>
      {/* Rope shadow */}
      <Path
        d={buildRopePath(ROPE_START, ROPE_END, ROPE_Y + 3, sag)}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
      />

      {/* Main rope */}
      <Path
        d={buildRopePath(ROPE_START, ROPE_END, ROPE_Y, sag)}
        stroke="#c4a45a"
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />

      {/* Rope highlight */}
      <Path
        d={buildRopePath(ROPE_START, ROPE_END, ROPE_Y - 1.5, sag * 0.9)}
        stroke="rgba(255,230,150,0.3)"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />

      {/* Center flag */}
      <Line
        x1={flagX} y1={flagBaseY - 16}
        x2={flagX} y2={flagBaseY}
        stroke="#fff" strokeWidth={1.5}
      />
      <Path
        d={`M ${flagX} ${flagBaseY - 16} L ${flagX + 10} ${flagBaseY - 11} L ${flagX} ${flagBaseY - 6}`}
        fill="#fff"
      />
      <Circle cx={flagX} cy={flagBaseY} r={2} fill="#fff" opacity={0.5} />
    </G>
  );
}

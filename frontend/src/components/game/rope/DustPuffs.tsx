import React from "react";
import { G, Circle } from "react-native-svg";

interface DustPuffsProps {
  x: number;
  y: number;
  side: "left" | "right";
  intensity: number;
}

export function DustPuffs({ x, y, side, intensity }: DustPuffsProps) {
  if (intensity < 0.3) return null;
  const dir = side === "left" ? -1 : 1;
  const alpha = Math.min(intensity * 0.5, 0.4);
  return (
    <G opacity={alpha}>
      <Circle cx={x + dir * 8} cy={y - 2} r={3} fill="#8B7355" />
      <Circle cx={x + dir * 14} cy={y - 4} r={2.5} fill="#8B7355" />
      <Circle cx={x + dir * 5} cy={y - 5} r={2} fill="#A0896C" />
    </G>
  );
}

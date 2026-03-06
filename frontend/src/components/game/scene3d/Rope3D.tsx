import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber/native";
import { Line } from "@react-three/drei/native";
import * as THREE from "three";
import {
  ROPE_Y,
  ROPE_LENGTH,
  ROPE_COLOR,
  ROPE_SHADOW_COLOR,
  ROPE_HIGHLIGHT_COLOR,
} from "./constants";

interface Rope3DProps {
  smoothed: React.MutableRefObject<number>;
  tension: React.MutableRefObject<number>;
}

const SEGMENTS = 20;

function buildCatenary(
  offset: number,
  sag: number,
  yOffset: number,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const halfLen = ROPE_LENGTH / 2;
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const x = -halfLen + t * ROPE_LENGTH + offset;
    const sagAtPoint = Math.sin(t * Math.PI) * sag;
    points.push(new THREE.Vector3(x, ROPE_Y - sagAtPoint + yOffset, 0));
  }
  return points;
}

export function Rope3D({ smoothed, tension }: Rope3DProps) {
  const mainRef = useRef<any>(null);
  const shadowRef = useRef<any>(null);
  const highlightRef = useRef<any>(null);

  const pointArrays = useMemo(() => {
    return {
      main: buildCatenary(0, 0.2, 0),
      shadow: buildCatenary(0, 0.25, -0.04),
      highlight: buildCatenary(0, 0.15, 0.04),
    };
  }, []);

  useFrame(() => {
    const pos = smoothed.current;
    const t = tension.current;
    const sag = 0.05 + (1 - t) * 0.3;
    const halfLen = ROPE_LENGTH / 2;

    const updatePoints = (
      ref: React.MutableRefObject<any>,
      sagMul: number,
      yOff: number,
    ) => {
      if (!ref.current?.geometry) return;
      const positions = ref.current.geometry.attributes.position;
      if (!positions) return;
      for (let i = 0; i <= SEGMENTS; i++) {
        const tParam = i / SEGMENTS;
        const x = -halfLen + tParam * ROPE_LENGTH + pos;
        const sagAtPoint = Math.sin(tParam * Math.PI) * sag * sagMul;
        positions.setXYZ(i, x, ROPE_Y - sagAtPoint + yOff, 0);
      }
      positions.needsUpdate = true;
    };

    updatePoints(mainRef, 1.0, 0);
    updatePoints(shadowRef, 1.15, -0.04);
    updatePoints(highlightRef, 0.85, 0.04);
  });

  return (
    <>
      <Line
        ref={shadowRef}
        points={pointArrays.shadow}
        color={ROPE_SHADOW_COLOR}
        lineWidth={6}
      />
      <Line
        ref={mainRef}
        points={pointArrays.main}
        color={ROPE_COLOR}
        lineWidth={4}
      />
      <Line
        ref={highlightRef}
        points={pointArrays.highlight}
        color={ROPE_HIGHLIGHT_COLOR}
        lineWidth={2}
      />
    </>
  );
}

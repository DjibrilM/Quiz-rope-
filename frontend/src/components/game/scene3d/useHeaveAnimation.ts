import { useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import {
  HEAVE_BASE_SPEED,
  HEAVE_TENSION_SPEED,
  PHASE_OFFSET,
  JERK_VELOCITY_THRESHOLD,
  JERK_DECAY,
  JERK_BOOST,
} from "./constants";

interface HeaveRefs {
  bodyRef: React.RefObject<THREE.Group>;
  frontArmRef: React.RefObject<THREE.Group>;
  frontForearmRef: React.RefObject<THREE.Group>;
  backArmRef: React.RefObject<THREE.Group>;
  backForearmRef: React.RefObject<THREE.Group>;
  frontLegRef: React.RefObject<THREE.Group>;
  frontShinRef: React.RefObject<THREE.Group>;
  backLegRef: React.RefObject<THREE.Group>;
  backShinRef: React.RefObject<THREE.Group>;
  headRef: React.RefObject<THREE.Group>;
}

interface HeaveConfig {
  index: number;
  facingRight: boolean;
  tension: React.MutableRefObject<number>;
  winning: React.MutableRefObject<boolean>;
  velocity: React.MutableRefObject<number>;
}

export function useHeaveAnimation(refs: HeaveRefs, config: HeaveConfig) {
  const { index, facingRight, tension, winning, velocity } = config;
  const elapsed = useRef(0);
  const jerkAmount = useRef(0);
  const dir = facingRight ? 1 : -1;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = tension.current;
    const speed = HEAVE_BASE_SPEED + t * HEAVE_TENSION_SPEED;
    elapsed.current += dt * speed;

    const phase = elapsed.current + index * PHASE_OFFSET;
    const cycle = Math.sin(phase);
    const cycle2 = Math.sin(phase * 2);

    // Jerk detection
    const absVel = Math.abs(velocity.current);
    if (absVel > JERK_VELOCITY_THRESHOLD) {
      jerkAmount.current = Math.min(jerkAmount.current + JERK_BOOST, 1);
    }
    jerkAmount.current *= Math.exp(-JERK_DECAY * dt);
    const jerk = jerkAmount.current;

    // Intensity: winning team is more energetic
    const winBoost = winning.current ? 1.2 : 0.8;
    const intensity = (0.3 + t * 0.7) * winBoost;

    // Body lean
    const baseLean = dir * (0.15 + t * 0.2);
    const cycleLean = dir * cycle * 0.08 * intensity;
    const jerkLean = dir * jerk * 0.3;
    if (refs.bodyRef.current) {
      refs.bodyRef.current.rotation.z = baseLean + cycleLean + jerkLean;
    }

    // Head bob
    if (refs.headRef.current) {
      refs.headRef.current.position.y = cycle2 * 0.03 * intensity;
      refs.headRef.current.rotation.z = -cycle * 0.05 * intensity;
    }

    // Front arm: reach forward → pull back
    const armPull = cycle * 0.4 * intensity;
    const jerkArm = jerk * 0.5 * dir;
    if (refs.frontArmRef.current) {
      refs.frontArmRef.current.rotation.z =
        dir * (-0.3 - t * 0.2) + armPull * dir + jerkArm;
    }
    if (refs.frontForearmRef.current) {
      refs.frontForearmRef.current.rotation.z =
        -0.4 - cycle * 0.3 * intensity - jerk * 0.3;
    }

    // Back arm (mirrors front, offset)
    const backCycle = Math.sin(phase + Math.PI * 0.3);
    if (refs.backArmRef.current) {
      refs.backArmRef.current.rotation.z =
        dir * (-0.2 - t * 0.15) + backCycle * 0.3 * intensity * dir;
    }
    if (refs.backForearmRef.current) {
      refs.backForearmRef.current.rotation.z =
        -0.3 - backCycle * 0.2 * intensity;
    }

    // Front leg: brace
    if (refs.frontLegRef.current) {
      refs.frontLegRef.current.rotation.z =
        dir * (0.1 + t * 0.1) + cycle * 0.05 * intensity * dir;
    }
    if (refs.frontShinRef.current) {
      refs.frontShinRef.current.rotation.z =
        0.1 + cycle * 0.05 * intensity;
    }

    // Back leg: weight shift
    if (refs.backLegRef.current) {
      refs.backLegRef.current.rotation.z =
        dir * (-0.05 - t * 0.05) - cycle * 0.04 * intensity * dir;
    }
    if (refs.backShinRef.current) {
      refs.backShinRef.current.rotation.z =
        -0.05 - cycle * 0.03 * intensity;
    }
  });
}

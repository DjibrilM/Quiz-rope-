import { useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import {
  SPRING_STIFFNESS,
  SPRING_DAMPING,
  ROPE_MAX_OFFSET,
} from "./constants";

export function useSmoothPosition(positionRef: React.MutableRefObject<number>) {
  const smoothed = useRef(0);
  const velocity = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = (positionRef.current / 5) * ROPE_MAX_OFFSET;
    const displacement = target - smoothed.current;
    const springForce = SPRING_STIFFNESS * displacement;
    const dampingForce = SPRING_DAMPING * velocity.current;
    const acceleration = springForce - dampingForce;

    velocity.current += acceleration * dt;
    smoothed.current += velocity.current * dt;
  });

  return { smoothed, velocity };
}

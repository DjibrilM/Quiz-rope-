import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { CartoonCharacter } from "./CartoonCharacter";
import {
  CHARACTER_SPACING,
  TEAM_OFFSET,
  LEFT_CHARS,
  RIGHT_CHARS,
  RED_TEAM_COLOR,
  BLUE_TEAM_COLOR,
} from "./constants";

interface Team3DProps {
  side: "left" | "right";
  smoothed: React.MutableRefObject<number>;
  velocity: React.MutableRefObject<number>;
  ropePosition: React.MutableRefObject<number>;
}

export function Team3D({ side, smoothed, velocity, ropePosition }: Team3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tension = useRef(0);
  const winning = useRef(false);

  const isLeft = side === "left";
  const chars = isLeft ? LEFT_CHARS : RIGHT_CHARS;
  const teamColor = isLeft ? RED_TEAM_COLOR : BLUE_TEAM_COLOR;
  const dirSign = isLeft ? -1 : 1;

  useFrame(() => {
    tension.current = Math.min(Math.abs(ropePosition.current) / 5, 1);
    winning.current = isLeft
      ? ropePosition.current < -1
      : ropePosition.current > 1;

    if (groupRef.current) {
      groupRef.current.position.x = smoothed.current + dirSign * TEAM_OFFSET * 2.5;
    }
  });

  return (
    <group ref={groupRef}>
      {chars.map((char, i) => (
        <CartoonCharacter
          key={i}
          index={i}
          xOffset={dirSign * (i * CHARACTER_SPACING)}
          facingRight={isLeft}
          teamColor={teamColor}
          skinTone={char.skinTone}
          hairColor={char.hairColor}
          charScale={char.scale}
          tension={tension}
          winning={winning}
          velocity={velocity}
        />
      ))}
    </group>
  );
}

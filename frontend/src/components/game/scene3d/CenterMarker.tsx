import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { ROPE_Y } from "./constants";

interface CenterMarkerProps {
  smoothed: React.MutableRefObject<number>;
}

export function CenterMarker({ smoothed }: CenterMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flagMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffcc00" }),
    [],
  );
  const stickMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#8b7635" }),
    [],
  );

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.x = smoothed.current;
    }
  });

  return (
    <group ref={groupRef} position={[0, ROPE_Y, 0]}>
      {/* Stick */}
      <mesh position={[0, 0.25, 0]} material={stickMat}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
      </mesh>
      {/* Flag */}
      <mesh position={[0.12, 0.45, 0]} material={flagMat}>
        <planeGeometry args={[0.22, 0.14]} />
      </mesh>
    </group>
  );
}

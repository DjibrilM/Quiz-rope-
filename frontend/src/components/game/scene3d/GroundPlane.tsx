import React, { useMemo } from "react";
import * as THREE from "three";
import { GROUND_Y, GROUND_COLOR, BG_COLOR } from "./constants";

export function GroundPlane() {
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: GROUND_COLOR }),
    [],
  );

  return (
    <>
      <color attach="background" args={[BG_COLOR]} />
      <mesh
        position={[0, GROUND_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={material}
      >
        <planeGeometry args={[20, 6]} />
      </mesh>
    </>
  );
}

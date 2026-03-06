import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { GROUND_Y } from "./constants";
import { useHeaveAnimation } from "./useHeaveAnimation";

interface CartoonCharacterProps {
  index: number;
  xOffset: number;
  facingRight: boolean;
  teamColor: string;
  skinTone: string;
  hairColor: string;
  charScale: number;
  tension: React.MutableRefObject<number>;
  winning: React.MutableRefObject<boolean>;
  velocity: React.MutableRefObject<number>;
}

// Shared geometries (created once, reused by all characters)
const capsuleGeo8 = new THREE.CapsuleGeometry(0.12, 0.35, 4, 8);
const capsuleArmUpper = new THREE.CapsuleGeometry(0.05, 0.2, 4, 8);
const capsuleArmFore = new THREE.CapsuleGeometry(0.045, 0.18, 4, 8);
const capsuleLegThigh = new THREE.CapsuleGeometry(0.06, 0.22, 4, 8);
const capsuleLegShin = new THREE.CapsuleGeometry(0.05, 0.2, 4, 8);
const sphereHead = new THREE.SphereGeometry(0.16, 12, 12);
const sphereHand = new THREE.SphereGeometry(0.04, 8, 8);
const sphereEye = new THREE.SphereGeometry(0.035, 16, 16);
const spherePupil = new THREE.SphereGeometry(0.018, 12, 12);
const sphereHighlight = new THREE.SphereGeometry(0.008, 8, 8);
const sphereCheek = new THREE.SphereGeometry(0.03, 10, 10);
const hairGeo = new THREE.SphereGeometry(0.17, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
const headbandGeo = new THREE.TorusGeometry(0.16, 0.015, 6, 12);
const shoeGeo = new THREE.BoxGeometry(0.1, 0.05, 0.08);
const shadowGeo = new THREE.CircleGeometry(0.2, 8);
const mouthGeo = new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI);
const eyebrowGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.04, 6);

// Shared materials
const whiteMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
const darkMat = new THREE.MeshBasicMaterial({ color: "#1a1a1a" });
const highlightMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
const shadowMat = new THREE.MeshBasicMaterial({
  color: "#000000",
  transparent: true,
  opacity: 0.2,
});
const cheekMat = new THREE.MeshBasicMaterial({
  color: "#ff9999",
  transparent: true,
  opacity: 0.4,
});
const shirtStripeMat = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  transparent: true,
  opacity: 0.15,
});

export function CartoonCharacter({
  index,
  xOffset,
  facingRight,
  teamColor,
  skinTone,
  hairColor,
  charScale,
  tension,
  winning,
  velocity,
}: CartoonCharacterProps) {
  const bodyRef = useRef<THREE.Group>(null!);
  const frontArmRef = useRef<THREE.Group>(null!);
  const frontForearmRef = useRef<THREE.Group>(null!);
  const backArmRef = useRef<THREE.Group>(null!);
  const backForearmRef = useRef<THREE.Group>(null!);
  const frontLegRef = useRef<THREE.Group>(null!);
  const frontShinRef = useRef<THREE.Group>(null!);
  const backLegRef = useRef<THREE.Group>(null!);
  const backShinRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);

  const teamMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: teamColor }),
    [teamColor],
  );
  const skinMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: skinTone }),
    [skinTone],
  );
  const hairMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: hairColor }),
    [hairColor],
  );

  useHeaveAnimation(
    {
      bodyRef,
      frontArmRef,
      frontForearmRef,
      backArmRef,
      backForearmRef,
      frontLegRef,
      frontShinRef,
      backLegRef,
      backShinRef,
      headRef,
    },
    { index, facingRight, tension, winning, velocity },
  );

  const scaleX = facingRight ? 1 : -1;
  const footY = GROUND_Y + 0.03;

  return (
    <group
      position={[xOffset, 0, 0]}
      scale={[charScale * scaleX, charScale, charScale]}
    >
      {/* Shadow on ground */}
      <mesh
        position={[0, GROUND_Y + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={shadowMat}
        geometry={shadowGeo}
      />

      {/* Front leg */}
      <group ref={frontLegRef} position={[0.08, footY + 0.28, 0.01]}>
        <mesh geometry={capsuleLegThigh} material={teamMat} />
        <group ref={frontShinRef} position={[0, -0.22, 0]}>
          <mesh geometry={capsuleLegShin} material={teamMat} />
          <mesh
            position={[0.02, -0.14, 0]}
            geometry={shoeGeo}
            material={whiteMat}
          />
        </group>
      </group>

      {/* Back leg */}
      <group ref={backLegRef} position={[-0.06, footY + 0.28, -0.01]}>
        <mesh geometry={capsuleLegThigh} material={teamMat} />
        <group ref={backShinRef} position={[0, -0.22, 0]}>
          <mesh geometry={capsuleLegShin} material={teamMat} />
          <mesh
            position={[0.02, -0.14, 0]}
            geometry={shoeGeo}
            material={whiteMat}
          />
        </group>
      </group>

      {/* Body (hip pivot) */}
      <group ref={bodyRef} position={[0, footY + 0.55, 0]}>
        {/* Torso */}
        <mesh geometry={capsuleGeo8} material={teamMat} />
        {/* Shirt stripe */}
        <mesh position={[0, 0, 0.01]} scale={[1.05, 0.3, 1]}>
          <planeGeometry args={[0.25, 0.08]} />
          <primitive object={shirtStripeMat} attach="material" />
        </mesh>

        {/* Neck + Head */}
        <group ref={headRef} position={[0, 0.32, 0]}>
          {/* Head sphere */}
          <mesh geometry={sphereHead} material={skinMat} />
          {/* Hair */}
          <mesh
            geometry={hairGeo}
            material={hairMat}
            position={[0, 0.02, 0]}
            rotation={[0, 0, 0]}
          />
          {/* Headband */}
          <mesh
            geometry={headbandGeo}
            material={teamMat}
            position={[0, 0.04, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          {/* Left eye */}
          <group position={[-0.055, 0.02, 0.145]}>
            <mesh geometry={sphereEye} material={whiteMat} />
            <mesh geometry={spherePupil} material={darkMat} position={[0, 0, 0.02]} />
            <mesh
              geometry={sphereHighlight}
              material={highlightMat}
              position={[0.01, 0.01, 0.03]}
            />
          </group>
          {/* Right eye */}
          <group position={[0.055, 0.02, 0.145]}>
            <mesh geometry={sphereEye} material={whiteMat} />
            <mesh geometry={spherePupil} material={darkMat} position={[0, 0, 0.02]} />
            <mesh
              geometry={sphereHighlight}
              material={highlightMat}
              position={[0.01, 0.01, 0.03]}
            />
          </group>
          {/* Mouth */}
          <mesh
            geometry={mouthGeo}
            material={darkMat}
            position={[0, -0.06, 0.14]}
            rotation={[0, 0, Math.PI]}
          />
          {/* Eyebrows */}
          <mesh
            geometry={eyebrowGeo}
            material={darkMat}
            position={[-0.055, 0.065, 0.14]}
            rotation={[0, 0, 0.2]}
          />
          <mesh
            geometry={eyebrowGeo}
            material={darkMat}
            position={[0.055, 0.065, 0.14]}
            rotation={[0, 0, -0.2]}
          />
          {/* Cheek blush */}
          <mesh
            geometry={sphereCheek}
            material={cheekMat}
            position={[-0.1, -0.02, 0.1]}
          />
          <mesh
            geometry={sphereCheek}
            material={cheekMat}
            position={[0.1, -0.02, 0.1]}
          />
        </group>

        {/* Front arm */}
        <group ref={frontArmRef} position={[0.16, 0.12, 0.02]}>
          <mesh geometry={capsuleArmUpper} material={skinMat} />
          <group ref={frontForearmRef} position={[0, -0.2, 0]}>
            <mesh geometry={capsuleArmFore} material={skinMat} />
            <mesh
              geometry={sphereHand}
              material={skinMat}
              position={[0, -0.12, 0]}
            />
          </group>
        </group>

        {/* Back arm */}
        <group ref={backArmRef} position={[-0.16, 0.12, -0.02]}>
          <mesh geometry={capsuleArmUpper} material={skinMat} />
          <group ref={backForearmRef} position={[0, -0.2, 0]}>
            <mesh geometry={capsuleArmFore} material={skinMat} />
            <mesh
              geometry={sphereHand}
              material={skinMat}
              position={[0, -0.12, 0]}
            />
          </group>
        </group>
      </group>
    </group>
  );
}

import React, { useRef } from "react";
import { View } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import * as THREE from "three";

// ─────────────────────────────────────────────
// BABY FACE — noChildren
// Blinking eyes, pupil look-around, gentle bob
// ─────────────────────────────────────────────

function BabyFace() {
  const groupRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);
  const blinkVal = useRef(1);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // ── Blink every ~3.5s with occasional double blink ──
    const cycle = t % 3.5;
    let targetBlink = 1;
    if (cycle < 0.06 || (cycle > 0.18 && cycle < 0.24)) {
      targetBlink = 0.05;
    }
    blinkVal.current = THREE.MathUtils.lerp(
      blinkVal.current,
      targetBlink,
      delta * 30,
    );
    if (leftEyeRef.current) leftEyeRef.current.scale.y = blinkVal.current;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blinkVal.current;

    // ── Pupils look around slowly ──
    const lookX = Math.sin(t * 0.5) * 0.02;
    const lookY = Math.cos(t * 0.35) * 0.012;
    if (leftPupilRef.current) {
      leftPupilRef.current.position.x = 0.02 + lookX;
      leftPupilRef.current.position.y = lookY;
    }
    if (rightPupilRef.current) {
      rightPupilRef.current.position.x = -0.02 + lookX;
      rightPupilRef.current.position.y = lookY;
    }

    // ── Gentle bob + sway ──
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.06;
      groupRef.current.rotation.z = Math.sin(t * 0.7) * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshToonMaterial color="#f4c28f" />
      </mesh>

      {/* Hair poof */}
      <mesh position={[0, 0.35, 0.05]} scale={[1.15, 0.55, 1]}>
        <sphereGeometry
          args={[0.42, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]}
        />
        <meshToonMaterial color="#5D3A1A" />
      </mesh>

      {/* Left eye group (scales for blink) */}
      <group ref={leftEyeRef} position={[-0.18, 0.06, 0.44]}>
        {/* White */}
        <mesh>
          <sphereGeometry args={[0.11, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Iris */}
        <mesh ref={leftPupilRef} position={[0.02, 0, 0.07]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#5D4037" />
        </mesh>
        {/* Pupil */}
        <mesh position={[0.02, 0, 0.1]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
        {/* Highlight */}
        <mesh position={[0.05, 0.03, 0.1]}>
          <sphereGeometry args={[0.018, 4, 4]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>

      {/* Right eye group (scales for blink) */}
      <group ref={rightEyeRef} position={[0.18, 0.06, 0.44]}>
        <mesh>
          <sphereGeometry args={[0.11, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh ref={rightPupilRef} position={[-0.02, 0, 0.07]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#5D4037" />
        </mesh>
        <mesh position={[-0.02, 0, 0.1]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[-0.0, 0.03, 0.1]}>
          <sphereGeometry args={[0.018, 4, 4]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>

      {/* Rosy cheeks */}
      <mesh position={[-0.32, -0.04, 0.34]} scale={[1, 0.55, 0.5]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="#FFB5B5" transparent opacity={0.45} />
      </mesh>
      <mesh position={[0.32, -0.04, 0.34]} scale={[1, 0.55, 0.5]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="#FFB5B5" transparent opacity={0.45} />
      </mesh>

      {/* Smile (half-torus) */}
      <mesh position={[0, -0.13, 0.48]} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[0.08, 0.016, 6, 12, Math.PI]} />
        <meshBasicMaterial color="#E85D75" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────
// TROPHY — noRankings
// Floating + gentle rotation
// ─────────────────────────────────────────────

function Trophy() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.08;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Cup body */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.35, 0.2, 0.5, 12]} />
        <meshToonMaterial color="#FFD93D" />
      </mesh>

      {/* Rim */}
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.03, 8, 16]} />
        <meshToonMaterial color="#D4A017" />
      </mesh>

      {/* Left handle */}
      <mesh position={[-0.44, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.12, 0.025, 6, 12, Math.PI]} />
        <meshToonMaterial color="#D4A017" />
      </mesh>

      {/* Right handle */}
      <mesh
        position={[0.44, 0.2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <torusGeometry args={[0.12, 0.025, 6, 12, Math.PI]} />
        <meshToonMaterial color="#D4A017" />
      </mesh>

      {/* Stem */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.2, 8]} />
        <meshToonMaterial color="#D4A017" />
      </mesh>

      {/* Base */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.25, 0.28, 0.08, 12]} />
        <meshToonMaterial color="#FFD93D" />
      </mesh>

      {/* Star decoration */}
      <mesh position={[0, 0.22, 0.22]}>
        <sphereGeometry args={[0.055, 5, 5]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────
// GAME BOX — noMatches
// Gentle tumble rotation
// ─────────────────────────────────────────────

function GameBox() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.4;
      groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.1;
      groupRef.current.position.y = Math.sin(t * 1.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Box */}
      <mesh>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshToonMaterial color="#9B59B6" />
      </mesh>

      {/* Plus — horizontal */}
      <mesh position={[0, 0, 0.36]}>
        <boxGeometry args={[0.32, 0.08, 0.02]} />
        <meshBasicMaterial color="#E85D75" />
      </mesh>

      {/* Plus — vertical */}
      <mesh position={[0, 0, 0.36]}>
        <boxGeometry args={[0.08, 0.32, 0.02]} />
        <meshBasicMaterial color="#E85D75" />
      </mesh>

      {/* Subtle top highlight */}
      <mesh position={[0, 0.36, 0]} scale={[1.01, 0.01, 1.01]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshBasicMaterial color="#B875D6" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────
// ERROR CLOUD — error
// Floating cloud with flashing lightning bolt
// ─────────────────────────────────────────────

function ErrorCloud() {
  const groupRef = useRef<THREE.Group>(null);
  const lightningRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Gentle float
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.0) * 0.06;
    }

    // Lightning flash pattern
    const cycle = t % 4;
    const visible =
      (cycle > 2.5 && cycle < 2.58) || (cycle > 2.64 && cycle < 2.7);
    if (lightningRef.current) {
      lightningRef.current.visible = visible;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Cloud body — overlapping spheres */}
      <mesh position={[-0.22, 0.15, 0]}>
        <sphereGeometry args={[0.25, 10, 10]} />
        <meshToonMaterial color="#5A4B6B" />
      </mesh>
      <mesh position={[0.12, 0.22, 0]}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshToonMaterial color="#5A4B6B" />
      </mesh>
      <mesh position={[0.38, 0.12, 0]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshToonMaterial color="#5A4B6B" />
      </mesh>
      <mesh position={[0, 0.06, 0.1]}>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshToonMaterial color="#6B5C7B" />
      </mesh>

      {/* Lightning bolt */}
      <group ref={lightningRef} position={[0.05, -0.28, 0.12]}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.06, 0.2, 0.025]} />
          <meshBasicMaterial color="#FFD93D" />
        </mesh>
        <mesh position={[0.06, -0.17, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.05, 0.18, 0.025]} />
          <meshBasicMaterial color="#FFD93D" />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────
// CANVAS WRAPPER
// ─────────────────────────────────────────────

function SceneWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ width: 120, height: 120 }}>
      <Canvas
        gl={{ antialias: true }}
        frameloop="always"
        camera={{ position: [0, 0, 2.5], fov: 40 }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={0.8} />
        {children}
      </Canvas>
    </View>
  );
}

// ─── EXPORTED SCENE COMPONENTS ───

export function BabyFaceScene() {
  return (
    <SceneWrapper>
      <BabyFace />
    </SceneWrapper>
  );
}

export function TrophyScene() {
  return (
    <SceneWrapper>
      <Trophy />
    </SceneWrapper>
  );
}

export function GameBoxScene() {
  return (
    <SceneWrapper>
      <GameBox />
    </SceneWrapper>
  );
}

export function ErrorCloudScene() {
  return (
    <SceneWrapper>
      <ErrorCloud />
    </SceneWrapper>
  );
}

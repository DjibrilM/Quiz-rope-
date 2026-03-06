import React, { useRef } from "react";
import { View } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import {
  SceneLighting,
  GroundPlane,
  Rope3D,
  CenterMarker,
  Team3D,
  useSmoothPosition,
  CAMERA_ZOOM,
  CAMERA_POSITION,
} from "./scene3d";
import { PositionIndicator } from "./rope/PositionIndicator";

interface TugOfWarRope3DProps {
  ropePosition: number;
}

function TensionUpdater({
  positionRef,
  tensionRef,
}: {
  positionRef: React.MutableRefObject<number>;
  tensionRef: React.MutableRefObject<number>;
}) {
  useFrame(() => {
    tensionRef.current = Math.min(Math.abs(positionRef.current) / 5, 1);
  });
  return null;
}

function Scene({
  positionRef,
}: {
  positionRef: React.MutableRefObject<number>;
}) {
  const { smoothed, velocity } = useSmoothPosition(positionRef);
  const tensionRef = useRef(0);

  return (
    <>
      <TensionUpdater positionRef={positionRef} tensionRef={tensionRef} />
      <SceneLighting />
      <GroundPlane />
      <Rope3D smoothed={smoothed} tension={tensionRef} />
      <CenterMarker smoothed={smoothed} />
      <Team3D
        side="left"
        smoothed={smoothed}
        velocity={velocity}
        ropePosition={positionRef}
      />
      <Team3D
        side="right"
        smoothed={smoothed}
        velocity={velocity}
        ropePosition={positionRef}
      />
    </>
  );
}

export function TugOfWarRope3D({ ropePosition }: TugOfWarRope3DProps) {
  const positionRef = useRef(ropePosition);
  positionRef.current = ropePosition;

  return (
    <View style={{ width: "100%", alignItems: "center", overflow: "hidden" }}>
      <View style={{ width: "100%", height: 192 }}>
        <Canvas
          gl={{ antialias: true }}
          frameloop="always"
          orthographic
          camera={{
            zoom: CAMERA_ZOOM,
            position: CAMERA_POSITION,
            near: 0.1,
            far: 100,
          }}
        >
          <Scene positionRef={positionRef} />
        </Canvas>
      </View>
      <PositionIndicator ropePosition={ropePosition} />
    </View>
  );
}

import React from "react";
import { View } from "react-native";

interface PositionIndicatorProps {
  ropePosition: number;
}

export function PositionIndicator({ ropePosition }: PositionIndicatorProps) {
  const absProgress = Math.abs(ropePosition) / 5;
  const isLeft = ropePosition < 0;

  return (
    <View style={{ alignItems: "center", marginTop: 8 }}>
      <View
        style={{
          width: 200,
          height: 5,
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: 3,
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          {isLeft && (
            <View
              style={{
                width: `${absProgress * 100}%`,
                height: "100%",
                backgroundColor: "#ff6b6b",
                borderRadius: 3,
              }}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          {!isLeft && ropePosition > 0 && (
            <View
              style={{
                width: `${absProgress * 100}%`,
                height: "100%",
                backgroundColor: "#4ecdc4",
                borderRadius: 3,
              }}
            />
          )}
        </View>
      </View>
    </View>
  );
}

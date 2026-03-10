import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle, Rect, Polygon } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from "react-native-reanimated";

export function BackgroundDoodles() {
  const floatAnim = useSharedValue(0);

  React.useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatAnim.value }],
    };
  });

  // A very faint, playful collection of hollow doodles
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[StyleSheet.absoluteFill, animatedStyle, { opacity: 0.08 }]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 400 800" fill="none">
          {/* Lightbulb */}
          <Path
            d="M40 100 C 20 80, 60 40, 80 60 C 100 80, 80 120, 60 120 C 50 120, 45 110, 40 100 Z"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <Rect
            x="50"
            y="125"
            width="20"
            height="10"
            stroke="#FFFFFF"
            strokeWidth="2"
          />

          {/* Star */}
          <Polygon
            points="200,50 215,85 250,85 220,110 230,145 200,125 170,145 180,110 150,85 185,85"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Brain / Cloud shape */}
          <Path
            d="M320 200 C 290 200, 280 230, 290 250 C 270 260, 280 300, 310 290 C 330 320, 370 300, 370 270 C 390 260, 380 220, 350 220 C 350 190, 320 180, 320 200 Z"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />

          {/* Lightning Bolt */}
          <Polygon
            points="80,300 120,300 100,350 130,350 70,420 90,360 60,360"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Shapes & Plus signs */}
          <Rect
            x="30px"
            y="500px"
            width="40"
            height="40"
            rx="8"
            stroke="#FFFFFF"
            strokeWidth="2"
            transform="rotate(15, 50, 520)"
          />
          <Circle
            cx="350"
            cy="550"
            r="25"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          <Path
            d="M200 350 L200 390 M180 370 L220 370"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <Path
            d="M280 650 L280 690 M260 670 L300 670"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            transform="rotate(45, 280, 670)"
          />

          <Polygon
            points="100,700 140,780 60,780"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { BrainMascot } from "./Mascots";
import { FONTS } from "../../constants/theme";

interface MascotBuddyProps {
  message: string;
  visible: boolean;
  onHide?: () => void;
  displayDurationMs?: number;
}

export function MascotBuddy({
  message,
  visible,
  onHide,
  displayDurationMs = 3000,
}: MascotBuddyProps) {
  const slideInOut = useSharedValue(200); // Start off-screen vertically down

  useEffect(() => {
    if (visible && message) {
      // Slide up into view with a spring pop
      slideInOut.value = withSpring(0, { damping: 10, stiffness: 80, mass: 1 });

      const timeout = setTimeout(() => {
        // Slide out
        slideInOut.value = withTiming(
          200,
          { duration: 400, easing: Easing.in(Easing.ease) },
          (finished) => {
            if (finished && onHide) {
              runOnJS(onHide)();
            }
          },
        );
      }, displayDurationMs);

      return () => clearTimeout(timeout);
    } else {
      slideInOut.value = withTiming(200, { duration: 300 });
    }
  }, [visible, message, onHide, displayDurationMs]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: slideInOut.value }],
    };
  });

  if (!visible && slideInOut.value === 200) return null; // Unmount if hidden completely

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents="none"
    >
      <View style={styles.bubbleContainer}>
        <View style={styles.bubble}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
        <Svg width={24} height={20} viewBox="0 0 24 20" style={styles.tail}>
          <Path d="M0 0 L24 0 L20 20 Z" fill="#FFFFFF" />
          <Path
            d="M0 0 L24 0 L20 20 Z"
            fill="none"
            stroke="#1F2937"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <View style={styles.mascotWrapper}>
        <BrainMascot size={70} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    right: 20,
    alignItems: "flex-end",
    zIndex: 9999, // Floating on top of everything
    transform: [{ scale: 0.55 }],
  },
  bubbleContainer: {
    alignItems: "flex-end",
    marginBottom: -5,
    marginRight: 40,
  },
  bubble: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#1F2937",
    maxWidth: 220,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  messageText: {
    fontFamily: "LuckiestGuy_400Regular",
    fontSize: 16,
    color: "#BE185D",
    textAlign: "center",
    letterSpacing: 1,
  },
  tail: {
    marginRight: 20,
    marginTop: -3,
    zIndex: -1,
  },
  mascotWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 8,
  },
});

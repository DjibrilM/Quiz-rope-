import React from "react";
import Animated, { FadeInUp } from "react-native-reanimated";

interface StaggeredListProps {
  children: React.ReactNode;
  staggerMs?: number;
}

export function StaggeredList({ children, staggerMs = 80 }: StaggeredListProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <Animated.View
            entering={FadeInUp.delay(index * staggerMs).springify()}
          >
            {child}
          </Animated.View>
        );
      })}
    </>
  );
}

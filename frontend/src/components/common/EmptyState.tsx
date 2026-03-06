import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { FONTS, FORTNITE_COLORS } from "../../constants/theme";
import {
  BabyFaceScene,
  TrophyScene,
  GameBoxScene,
  ErrorCloudScene,
} from "./EmptyState3DScenes";

type IllustrationKey = "noMatches" | "noChildren" | "noRankings" | "error";

const ILLUSTRATIONS: Record<IllustrationKey, React.FC> = {
  noMatches: GameBoxScene,
  noChildren: BabyFaceScene,
  noRankings: TrophyScene,
  error: ErrorCloudScene,
};

interface EmptyStateProps {
  illustration: IllustrationKey;
  title: string;
  subtitle: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ illustration, title, subtitle, action }: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[illustration];

  return (
    <Animated.View
      entering={FadeInUp.springify()}
      style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}
    >
      <View style={{ marginBottom: 20 }}>
        <Illustration />
      </View>
      <Text
        style={{
          fontFamily: FONTS.heading,
          fontSize: 22,
          color: FORTNITE_COLORS.textPrimary,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: 15,
          color: FORTNITE_COLORS.textSecondary,
          textAlign: "center",
          maxWidth: 280,
          lineHeight: 22,
        }}
      >
        {subtitle}
      </Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          style={{
            marginTop: 24,
            backgroundColor: FORTNITE_COLORS.glowPurple,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: FONTS.bodyBold,
              fontSize: 15,
            }}
          >
            {action.label}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

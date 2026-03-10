import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { router, Stack } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function ScreenHeader({
  title,
  showBack = true,
  rightElement,
}: ScreenHeaderProps) {
  const { t } = useTranslation("common");

  if (Platform.OS === "ios") {
    return (
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          ...(rightElement && { headerRight: () => rightElement }),
        }}
      />
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 48,
        paddingHorizontal: 16,
        marginTop: 8,
      }}
    >
      <View style={{ width: 48, alignItems: "flex-start" }}>
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              backgroundColor: pressed
                ? "rgba(255,255,255,0.08)"
                : "transparent",
            })}
            accessibilityRole="button"
            accessibilityLabel={t("accessibility.goBack")}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19l-7-7 7-7"
                stroke="#FFFFFF"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        )}
      </View>

      <View style={{ flex: 1, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 20,
            color: "#FFFFFF",
            fontFamily: "LuckiestGuy_400Regular",
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <View style={{ width: 48, alignItems: "flex-end" }}>
        {rightElement}
      </View>
    </View>
  );
}

import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
  const insets = useSafeAreaInsets();

  if (Platform.OS === "ios") {
    return (
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          ...(showBack && {
            headerLeft: () => (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({
                  padding: 4,
                  opacity: pressed ? 0.6 : 1,
                })}
                accessibilityRole="button"
                accessibilityLabel={t("accessibility.goBack")}
              >
                <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
              </Pressable>
            ),
          }),
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
        paddingTop: insets.top + 8,
        paddingBottom: 8,
        paddingHorizontal: 16,
        minHeight: 54 + insets.top,
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
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
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

      <View style={{ minWidth: 48, alignItems: "flex-end" }}>{rightElement}</View>
    </View>
  );
}

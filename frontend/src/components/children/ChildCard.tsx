import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import { AvatarIcon } from "../common/AvatarIcons";
import { FONTS } from "../../constants/theme";
import { hapticsService } from "../../services/haptics";

const AVATAR_COLORS: Record<string, { bg: string; ring: string; badge: string }> = {
  lion:    { bg: "#2A1F0A", ring: "#F59E0B", badge: "#78350F" },
  fox:     { bg: "#2A150A", ring: "#F97316", badge: "#7C2D12" },
  panda:   { bg: "#1A1520", ring: "#A78BFA", badge: "#3B2770" },
  unicorn: { bg: "#2A0F1F", ring: "#F472B6", badge: "#831843" },
  dragon:  { bg: "#0A2A15", ring: "#22C55E", badge: "#14532D" },
  owl:     { bg: "#2A1F0A", ring: "#D97706", badge: "#78350F" },
  dolphin: { bg: "#0A152A", ring: "#3B82F6", badge: "#1E3A5F" },
  rocket:  { bg: "#2A0A0F", ring: "#EF4444", badge: "#7F1D1D" },
  star:    { bg: "#2A2A0A", ring: "#FFD93D", badge: "#713F12" },
  dino:    { bg: "#0A2A15", ring: "#4ADE80", badge: "#14532D" },
  cat:     { bg: "#2A150A", ring: "#F97316", badge: "#7C2D12" },
  dog:     { bg: "#2A1A0A", ring: "#D4956B", badge: "#78350F" },
};

const DEFAULT_COLORS = { bg: "#1A1520", ring: "#9B59B6", badge: "#3B2770" };

function TrashIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
        stroke="#E85D75"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface ChildCardProps {
  displayName: string;
  age: number;
  grade: string;
  avatarUrl?: string;
  onRemove?: () => void;
  onPress?: () => void;
}

export function ChildCard({ displayName, age, grade, avatarUrl, onRemove, onPress }: ChildCardProps) {
  const { t } = useTranslation("children");
  const colors = AVATAR_COLORS[avatarUrl || ""] || DEFAULT_COLORS;

  const content = (
    <View
      style={{
        backgroundColor: colors.bg,
        borderRadius: 20,
        padding: 16,
      }}
      accessibilityLabel={t("ageGradeAccessibility", { name: displayName, age, grade })}
    >
      {/* Top row: avatar + info + remove button */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Avatar with colored ring */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 3,
            borderColor: colors.ring,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.ring + "15",
          }}
        >
          <AvatarIcon avatarId={avatarUrl} size={42} />
        </View>

        {/* Name + badges */}
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: FONTS.bodyExtraBold,
              color: "#FFFFFF",
              marginBottom: 6,
            }}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* Age badge */}
            <View
              style={{
                backgroundColor: colors.badge,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.ring, fontFamily: FONTS.bodySemiBold }}>
                {t("ageBadge", { age })}
              </Text>
            </View>

            {/* Grade badge */}
            <View
              style={{
                backgroundColor: colors.badge,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.ring, fontFamily: FONTS.bodySemiBold }}>
                {grade}
              </Text>
            </View>
          </View>
        </View>

        {/* Remove button */}
        {onRemove && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              hapticsService.selection();
              onRemove();
            }}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: "#E85D7515",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "flex-start",
            }}
            accessibilityRole="button"
            accessibilityLabel={t("removeAccessibility", { name: displayName })}
          >
            <TrashIcon />
          </Pressable>
        )}

        {/* Chevron for navigation */}
        {onPress && !onRemove && (
          <ChevronRight color={colors.ring} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}

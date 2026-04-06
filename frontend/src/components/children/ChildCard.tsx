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
  grade: string;
  avatarUrl?: string;
  onRemove?: () => void;
  onPress?: () => void;
}

export function ChildCard({ displayName, grade, avatarUrl, onRemove, onPress }: ChildCardProps) {
  const { t } = useTranslation("children");
  const colors = AVATAR_COLORS[avatarUrl || ""] || DEFAULT_COLORS;

  const content = (
    <View
      style={{
        backgroundColor: "#13101C",
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.ring + "40",
      }}
      accessibilityLabel={t("gradeAccessibility", { name: displayName, grade })}
    >
      {/* Top row: avatar + info + remove button */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Avatar with colored ring */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: 1.5,
            borderColor: colors.ring + "80",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.bg,
          }}
        >
          <AvatarIcon avatarId={avatarUrl} size={36} />
        </View>

        {/* Name + badges */}
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text
            style={{
              fontSize: 17,
              fontFamily: FONTS.bodyBold,
              color: "#FFFFFF",
              marginBottom: 4,
              letterSpacing: 0.3,
            }}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* Grade badge */}
            <View
              style={{
                backgroundColor: colors.badge + "80",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.ring + "30",
              }}
            >
              <Text style={{ fontSize: 11, color: colors.ring, fontFamily: FONTS.bodySemiBold, textTransform: "uppercase", letterSpacing: 0.5 }}>
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
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#E85D7540",
              backgroundColor: "#E85D7510",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={t("removeAccessibility", { name: displayName })}
          >
            <TrashIcon />
          </Pressable>
        )}

        {/* Chevron for navigation */}
        {onPress && !onRemove && (
          <View style={{ opacity: 0.5 }}>
            <ChevronRight color={colors.ring} />
          </View>
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

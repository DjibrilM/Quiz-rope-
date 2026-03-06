import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { AVATARS } from "../../config/avatars";
import { hapticsService } from "../../services/haptics";
import { AvatarIcon } from "../common/AvatarIcons";
import { FONTS } from "../../constants/theme";

interface AvatarPickerProps {
  selected: string;
  onSelect: (avatarId: string) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  const { t } = useTranslation(["children", "common"]);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 16, fontFamily: FONTS.bodyBold, color: "#FFFFFF", marginBottom: 12 }}>
        {t("children:chooseAvatar")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {AVATARS.map((avatar) => (
          <Pressable
            key={avatar.id}
            onPress={() => {
              hapticsService.selection();
              onSelect(avatar.id);
            }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected === avatar.id ? "#E85D75" : "#1A1520",
              borderWidth: 2,
              borderColor: selected === avatar.id ? "#E85D75" : "transparent",
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === avatar.id }}
            accessibilityLabel={t("common:accessibility.avatarLabel", { name: t(`common:avatars.${avatar.id}`) })}
          >
            <AvatarIcon avatarId={avatar.id} size={36} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

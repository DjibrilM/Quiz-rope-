import { Pressable, Text } from "react-native";
import { useGameStore } from "../../stores/gameStore";
import type { SupportedLanguage } from "../../i18n";

const FLAG_MAP: Record<SupportedLanguage, string> = {
  en: "\uD83C\uDDFA\uD83C\uDDF8",
  zh: "\uD83C\uDDE8\uD83C\uDDF3",
  hi: "\uD83C\uDDEE\uD83C\uDDF3",
  es: "\uD83C\uDDEA\uD83C\uDDF8",
  fr: "\uD83C\uDDEB\uD83C\uDDF7",
  ar: "\uD83C\uDDF8\uD83C\uDDE6",
  bn: "\uD83C\uDDE7\uD83C\uDDE9",
  pt: "\uD83C\uDDE7\uD83C\uDDF7",
  ru: "\uD83C\uDDF7\uD83C\uDDFA",
  ja: "\uD83C\uDDEF\uD83C\uDDF5",
};

interface FlashingGlobeButtonProps {
  onPress: () => void;
  size?: number;
}

export function FlashingGlobeButton({ onPress, size = 40 }: FlashingGlobeButtonProps) {
  const { locale } = useGameStore();
  const flag = FLAG_MAP[locale] || FLAG_MAP.en;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#1A1520",
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.45 }}>{flag}</Text>
    </Pressable>
  );
}

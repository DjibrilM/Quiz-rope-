import React from "react";
import { Pressable, Text } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { hapticsService } from "../../services/haptics";
import { AnimatedLoader } from "../common/AnimatedLoader";
import { FONTS } from "../../constants/theme";

interface LoginButtonProps {
  onPress: () => void;
  loading?: boolean;
  label?: string;
  variant?: "google" | "email" | "child" | "mock";
}

function GoogleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 48 48" style={{ marginRight: 12 }}>
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

function ChildIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
      <Circle cx="12" cy="7" r="4" fill="#FFFFFF" />
      <Path
        fill="#FFFFFF"
        d="M12 13c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z"
      />
    </Svg>
  );
}

const VARIANT_STYLES: Record<
  string,
  { bg: string; activeBg: string; textClass: string; loaderColor: string }
> = {
  google: {
    bg: "bg-white",
    activeBg: "active:bg-gray-100",
    textClass: "text-gray-800",
    loaderColor: "#1E293B",
  },
  email: {
    bg: "bg-game-indigo",
    activeBg: "active:bg-indigo-700",
    textClass: "text-white",
    loaderColor: "#FFFFFF",
  },
  child: {
    bg: "bg-game-purple",
    activeBg: "active:bg-violet-800",
    textClass: "text-white",
    loaderColor: "#FFFFFF",
  },
};

export function LoginButton({
  onPress,
  loading = false,
  label,
  variant = "google",
}: LoginButtonProps) {
  const { t } = useTranslation("common");
  const displayLabel = label ?? t("buttons.continue");
  const handlePress = () => {
    hapticsService.light();
    onPress();
  };

  if (variant === "mock") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={loading}
        className="mt-4 py-3 px-6 active:opacity-70"
      >
        <Text
          className="text-sm text-center font-medium"
          style={{ color: "#7B6B8A", fontFamily: FONTS.body }}
        >
          {displayLabel}
        </Text>
      </Pressable>
    );
  }

  const styles = VARIANT_STYLES[variant];

  const icon =
    variant === "google" ? (
      <GoogleIcon />
    ) : variant === "child" ? (
      <ChildIcon />
    ) : null;

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      className={`w-full max-w-sm py-4 min-h-12 px-6 rounded-2xl flex-row items-center justify-center mb-4 ${styles.bg} ${styles.activeBg}`}
      style={loading ? { opacity: 0.7 } : undefined}
      accessibilityRole="button"
      accessibilityLabel={displayLabel}
      accessibilityState={{ busy: loading }}
    >
      {loading ? <AnimatedLoader color={styles.loaderColor} size="sm" /> : icon}
      <Text
        className={`text-lg font-bold ${styles.textClass}`}
        style={{
          fontFamily: "Bungee_400Regular",
          letterSpacing: 0.5,
          marginLeft: loading ? 10 : 0,
        }}
      >
        {loading ? t("labels.connecting") : displayLabel}
      </Text>
    </Pressable>
  );
}

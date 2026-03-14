import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";
import { AnimatedLoader } from "./AnimatedLoader";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "outline"
  | "ghost";

export interface ButtonProps {
  onPress: () => void;
  label?: string;
  variant?: ButtonVariant;
  children?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  {
    bg: string;
    activeBg: string;
    textClass: string;
    loaderColor: string;
    borderClass?: string;
  }
> = {
  primary: {
    bg: "bg-game-indigo",
    activeBg: "active:bg-violet-800",
    textClass: "text-white",
    loaderColor: "#FFFFFF",
  },
  secondary: {
    bg: "bg-[#1A1520]",
    activeBg: "active:bg-[#251e2e]",
    textClass: "text-white",
    loaderColor: "#FFFFFF",
  },
  danger: {
    bg: "bg-red-500",
    activeBg: "active:bg-red-600",
    textClass: "text-white",
    loaderColor: "#FFFFFF",
  },
  outline: {
    bg: "bg-transparent",
    activeBg: "active:bg-[#1A1520]",
    textClass: "text-game-purple",
    loaderColor: "#9B59B6",
    borderClass: "border-2 border-game-purple",
  },
  ghost: {
    bg: "bg-transparent",
    activeBg: "active:bg-[#1A1520]",
    textClass: "text-gray-300",
    loaderColor: "#FFFFFF",
  },
};

export function Button({
  children,
  onPress,
  label,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
  className = "",
}: ButtonProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      className={`w-full max-w-sm h-16 px-6 rounded-2xl flex-row items-center justify-center ${styles.bg} ${styles.activeBg} ${styles.borderClass || ""} ${className}`}
      style={[{ opacity: loading || disabled ? 0.7 : 1 }, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled }}
    >
      {loading ? (
        <AnimatedLoader color={styles.loaderColor} size="sm" />
      ) : (
        <>
          {icon}
          {children}
          <Text
            className={`text-lg font-bold ${styles.textClass}`}
            style={{
              fontFamily: "Bungee_400Regular",
              letterSpacing: 0.5,
              marginLeft: icon ? 10 : 0,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

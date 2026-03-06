import React, { ReactNode } from "react";
import { Text } from "react-native";
import { hapticsService } from "../../services/haptics";
import { AnimatedLoader } from "./AnimatedLoader";
import { BouncePress } from "./BouncePress";
import { FONTS } from "../../constants/theme";

interface ActionCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  loading?: boolean;
  disabled?: boolean;
}

const variantStyles = {
  primary: "bg-game-pink",
  secondary: "bg-game-purple",
  outline: "bg-card-bg border border-[#3D2E4A]",
};

const descriptionStyles = {
  primary: "text-pink-200",
  secondary: "text-purple-200",
  outline: "text-[#B8A9C9]",
};

export function ActionCard({
  icon,
  title,
  description,
  onPress,
  variant = "outline",
  loading = false,
  disabled = false,
}: ActionCardProps) {
  const handlePress = () => {
    hapticsService.selection();
    onPress();
  };

  const isDisabled = disabled || loading;

  return (
    <BouncePress
      onPress={handlePress}
      disabled={isDisabled}
      className={`flex-1 min-w-[280px] p-8 rounded-3xl ${variantStyles[variant]}`}
      style={isDisabled ? { opacity: 0.5 } : undefined}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <AnimatedLoader color="#FFFFFF" size="lg" />
      ) : icon ? (
        <>{icon}</>
      ) : null}
      <Text
        className="text-xl text-white mb-2"
        style={{ fontFamily: "LuckiestGuy_400Regular" }}
      >
        {title}
      </Text>
      <Text
        className={`text-sm ${descriptionStyles[variant]}`}
        style={{ fontFamily: FONTS.body }}
      >
        {description}
      </Text>
    </BouncePress>
  );
}

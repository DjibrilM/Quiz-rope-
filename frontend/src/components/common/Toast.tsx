import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ToastItem } from "../../context/ToastContext";
import { FONTS } from "../../constants/theme";

type ToastType = ToastItem["type"];

const BORDER_COLOR: Record<ToastType, string> = {
  error: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#6C5CE7",
};

// Full static strings so NativeWind can extract them at build time
const ICON_BG_CLASS: Record<ToastType, string> = {
  error: "bg-red-500/15",
  success: "bg-game-success/15",
  warning: "bg-game-warning/15",
  info: "bg-game-indigo/15",
};

const ICON_TEXT_CLASS: Record<ToastType, string> = {
  error: "text-red-500",
  success: "text-game-success",
  warning: "text-game-warning",
  info: "text-game-indigo",
};

const ICONS: Record<ToastType, string> = {
  error: "✕",
  success: "✓",
  warning: "!",
  info: "i",
};

const DEFAULT_DURATION = 4000;

function ToastItemView({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const translateY = useRef(new Animated.Value(-90)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const duration = toast.duration ?? DEFAULT_DURATION;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        mass: 0.9,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -90,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(toast.id));
  };

  return (
    <Animated.View
      className="mb-2"
      style={{ transform: [{ translateY }], opacity }}
    >
      <View
        className="bg-card-bg rounded-2xl flex-row items-start py-3 pl-[14px] pr-3"
        style={{
          gap: 10,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        {/* Icon badge */}
        <View
          className={`w-[22px] h-[22px] rounded-full items-center justify-center shrink-0 mt-[1px] ${ICON_BG_CLASS[toast.type]}`}
        >
          <Text
            className={`text-xs ${ICON_TEXT_CLASS[toast.type]}`}
            style={{ fontFamily: FONTS.bodyBold, lineHeight: 14 }}
          >
            {ICONS[toast.type]}
          </Text>
        </View>

        {/* Text content */}
        <View className="flex-1">
          <Text
            className={`text-white text-sm ${toast.message ? "mb-[3px]" : ""}`}
            style={{ fontFamily: FONTS.bodyBold }}
            numberOfLines={2}
          >
            {toast.title}
          </Text>
          {toast.message ? (
            <Text
              className="text-[#B8A9C9] text-[13px] leading-[18px]"
              style={{ fontFamily: FONTS.body }}
              numberOfLines={3}
            >
              {toast.message}
            </Text>
          ) : null}
        </View>

        {/* Dismiss */}
        <Pressable
          onPress={dismiss}
          hitSlop={12}
          className="p-[2px] mt-[1px] shrink-0"
        >
          <Text
            className="text-lg leading-5"
            style={{ color: "#7B6B8A", fontFamily: FONTS.body }}
          >
            ×
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
    >
      {toasts.map((toast) => (
        <ToastItemView key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HomeworkBottomBarProps {
  quizCount: number;
  onOpenQuizSheet: () => void;
  onOpenChat: () => void;
  bottomInset: number;
}

export function HomeworkBottomBar({
  quizCount,
  onOpenQuizSheet,
  onOpenChat,
  bottomInset,
}: HomeworkBottomBarProps) {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 px-4 pt-4 bg-[#0D0B14] w-full border-t border-white/5"
      style={{ paddingBottom: Math.max(bottomInset, 16) + 8 }}
    >
      {/* Quizzes button */}
      <Pressable
        onPress={onOpenQuizSheet}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, flex: 1 })}
        className="flex-row flex-1 items-center justify-between h-16 px-4 rounded-2xl bg-[#15111a] border border-white/5"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-full bg-[#2D1F3D] items-center justify-center">
            <Ionicons name="school" size={18} color="#6C5CE7" />
          </View>
          <View>
            <Text className="text-white font-['Bungee_400Regular'] text-sm tracking-[0.3px]">
              Quizzes
            </Text>
            <Text className="text-[#5A4B6B] font-body text-xs mt-px">
              {quizCount === 0
                ? "No quizzes yet"
                : quizCount === 1
                  ? "1 attempt"
                  : `${quizCount} attempts`}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#5A4B6B" />
      </Pressable>

      {/* Ask AI FAB */}
      <Pressable
        onPress={onOpenChat}
        className="w-[60px] h-[60px] rounded-full bg-[#6C5CE7] items-center justify-center shrink-0"
      >
        <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

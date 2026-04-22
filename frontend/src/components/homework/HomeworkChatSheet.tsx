import {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";

import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { MathMarkdown } from "../common/MathMarkdown";
import { useHomeworkChat, type ChatMessage } from "../../hooks/useHomeworkChat";
import { FONTS } from "../../constants/theme";

interface Props {
  sessionId: string;
  guestContext?: string;
}

export interface ChatSheetRef {
  present: () => void;
  dismiss: () => void;
}

function BlinkingCursor() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.Text
      style={{
        opacity,
        color: "#6C5CE7",
        fontSize: 16,
        lineHeight: 10,
        marginTop: -4,
      }}
    >
      ▋
    </Animated.Text>
  );
}

export const HomeworkChatSheet = forwardRef<ChatSheetRef, Props>(
  ({ sessionId, guestContext }, ref) => {
    const { t } = useTranslation("homework");
    const [isInputFocused, setIsInputFocused] = useState(false);
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const { messages, send, stop, streaming, loadMore, isLoadingMore } =
      useHomeworkChat(sessionId, guestContext);
    const [input, setInput] = useState("");
    const scrollRef = useRef<FlatList>(null);

    const handleSend = useCallback(() => {
      const text = input.trim();
      if (!text || streaming) return;
      setInput("");
      send(text);
    }, [input, streaming, send]);

    const renderMessage = useCallback((item: ChatMessage) => {
      const isUser = item.role === "user";
      return (
        <View
          key={item._id}
          className={`max-w-[85%] rounded-[18px] px-3.5 py-2.5 my-[1px] ${
            isUser
              ? "self-end bg-[#6C5CE7] rounded-br-[4px]"
              : "self-start bg-[#1E1828] rounded-bl-[4px]"
          }`}
        >
          {isUser ? (
            <Text className="text-white font-body text-sm leading-[21px]">
              {item.content}
            </Text>
          ) : (
            <>
              <MathMarkdown
                content={item.content}
                style={{
                  paragraph: {
                    color: "#D1D5DB",
                    fontFamily: FONTS.bodySemiBold,
                    marginBottom: 10,
                  },
                  h1: { color: "#FFFFFF" },
                  h2: { color: "#F3F4F6" },
                  h3: { color: "#E5E7EB" },
                  code: {
                    backgroundColor: "#1F2937",
                    color: "#F9FAFB",
                    fontFamily: "Menlo",
                    fontSize: 14,
                  },
                  listItem: {
                    color: "red",
                    fontFamily: FONTS.bodySemiBold,
                    marginBottom: 10,
                  },
                  codeBlock: {
                    backgroundColor: "#020617",
                    color: "#E2E8F0",
                    padding: 12,
                    borderRadius: 8,
                    fontFamily: "Menlo",
                    fontSize: 14,
                  },
                }}
                bgColor="#1E1828"
              />
              {item.isStreaming && <BlinkingCursor />}
            </>
          )}
        </View>
      );
    }, []);

    const handleClose = () => {
      setVisible(false);
    };

    useImperativeHandle(ref, () => ({
      present: () => setVisible(true),
      dismiss: () => setVisible(false),
    }));

    return (
      <Modal
        style={{ height: "100%" }}
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={"padding"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={isInputFocused ? 0 : -insets.bottom}
          >
            {/* Backdrop (hidden but functional for tapping to close) */}
            <Pressable style={{ flex: 1 }} onPress={handleClose} />

            {/* Sheet Content */}
            <View
              className="bg-[#13101C] rounded-t-[28px]"
              style={{
                height: "100%",
              }}
            >
              <View className="flex-row items-center justify-between px-5 pb-3 border-b border-[#1E1828] pt-4">
                <View>
                  <Text className="text-white font-['Bungee_400Regular'] text-lg">
                    {t("chat.title")}
                  </Text>
                  <Text className="text-[#5A4B6B] font-body text-xs mt-0.5">
                    {t("chat.subtitle")}
                  </Text>
                </View>
                <Pressable
                  onPress={handleClose}
                  className="w-9 h-9 rounded-full bg-[#1E1828] items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#B8A9C9" />
                </Pressable>
              </View>

              <View className="flex-1 justify-between">
                <FlatList
                  ref={scrollRef}
                  data={messages}
                  extraData={messages[0]?.content}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => renderMessage(item)}
                  inverted={true}
                  className="flex-1"
                  contentContainerStyle={{
                    flexGrow: 1,
                    paddingVertical: 12,
                  }}
                  contentContainerClassName="px-4 gap-2.5"
                  keyboardShouldPersistTaps="handled"
                  onEndReached={loadMore}
                  onEndReachedThreshold={0.5}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View className="flex-1 items-center pt-12 gap-3 scale-y-[-1]">
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={32}
                        color="#3D2E4A"
                      />
                      <Text className="text-[#3D2E4A] font-body text-sm text-center">
                        {t("chat.emptyState")}
                      </Text>
                    </View>
                  }
                  ListFooterComponent={
                    isLoadingMore ? (
                      <View className="py-4 items-center justify-center">
                        <ActivityIndicator color="#6C5CE7" />
                      </View>
                    ) : null
                  }
                />

                <View
                  className="flex-row items-end px-3 pt-3 my-2.5 gap-2 border-t border-[#1E1828]"
                  // style={{ paddingBottom: Math.max(insets.bottom, 16) }}
                >
                  <TextInput
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    value={input}
                    onChangeText={setInput}
                    placeholder={t("chat.placeholder")}
                    placeholderTextColor="#4A3D5A"
                    multiline
                    onSubmitEditing={handleSend}
                    blurOnSubmit={false}
                    editable={!streaming}
                    className="flex-1 bg-[#0D0B14] text-white rounded-[20px] px-4 py-1 font-body text-sm max-h-[120px] min-h-[48px] border border-[#2D1F3D]"
                    style={streaming && { opacity: 0.5 }}
                  />

                  {streaming ? (
                    <Pressable
                      onPress={stop}
                      className="w-12 h-12 rounded-full items-center justify-center bg-[#E85D75]"
                    >
                      <Ionicons name="stop" size={20} color="#FFFFFF" />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={handleSend}
                      disabled={!input.trim()}
                      className={`w-12 h-12 rounded-full items-center justify-center ${
                        !input.trim() ? "bg-[#2D1F3D]" : "bg-[#6C5CE7]"
                      }`}
                    >
                      <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  },
);
HomeworkChatSheet.displayName = "HomeworkChatSheet";

const mdStyles = {
  body: {
    color: "#FFFFFF",
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
  },
  strong: { fontFamily: FONTS.bodyBold, color: "#FFFFFF" },
  em: { fontStyle: "italic" as const, color: "#FFFFFF" },
  h2: {
    color: "#FFFFFF",
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 2,
  },
  h3: {
    color: "#D4C5E4",
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 2,
  },
  code: {
    backgroundColor: "#0D0B14",
    color: "#A78BFA",
    fontFamily: "monospace",
    fontSize: 13,
  },
  codeBlock: {
    backgroundColor: "#0D0B14",
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    color: "#A78BFA",
    fontFamily: "monospace",
    fontSize: 13,
  },
  list: { marginTop: 4, marginBottom: 4 },
  listItem: { marginBottom: 3 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#6C5CE7",
    paddingLeft: 10,
    marginVertical: 6,
    opacity: 0.85,
  },
  hr: { backgroundColor: "#2D1F3D", height: 1, marginVertical: 8 },
  link: { color: "#A78BFA" },
};

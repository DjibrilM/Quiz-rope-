import { useRef, useState, useEffect, useCallback, forwardRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useHomeworkChat, type ChatMessage } from "../../hooks/useHomeworkChat";
import { FONTS } from "../../constants/theme";

interface Props {
  sessionId: string;
}

export const HomeworkChatSheet = forwardRef<BottomSheetModal, Props>(
  ({ sessionId }, ref) => {
    const { height: screenHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { messages, send, stop, streaming } = useHomeworkChat(sessionId);
    const [input, setInput] = useState("");
    const listRef = useRef<FlatList<ChatMessage>>(null);

    useEffect(() => {
      if (messages.length > 0) {
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
    }, [messages.length, messages[messages.length - 1]?.content]);

    const handleSend = useCallback(() => {
      const text = input.trim();
      if (!text || streaming) return;
      setInput("");
      send(text);
    }, [input, streaming, send]);

    const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
      const isUser = item.role === "user";
      return (
        <View
          style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}
        >
          {isUser ? (
            <Text style={styles.userText}>{item.content}</Text>
          ) : (
            <>
              <Markdown style={mdStyles}>{item.content}</Markdown>
              {item.isStreaming && <Text style={styles.cursor}>▋</Text>}
            </>
          )}
        </View>
      );
    }, []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.65}
        />
      ),
      [],
    );

    const handleClose = () => {
      if (ref && "current" in ref && ref.current) {
        ref.current.dismiss();
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["93%", "95%"]}
        enablePanDownToClose
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: "#13101C",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        handleIndicatorStyle={{
          backgroundColor: "#3D2E4A",
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Ask AI</Text>
                <Text style={styles.headerSub}>
                  Ask anything about your homework
                </Text>
              </View>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#B8A9C9" />
              </Pressable>
            </View>

            <View style={{ height: screenHeight * 0.72 }}>
              {/* Messages */}
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(m: ChatMessage) => m._id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                renderItem={renderMessage}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={32}
                      color="#3D2E4A"
                    />
                    <Text style={styles.emptyText}>
                      Ask anything about your homework
                    </Text>
                  </View>
                }
              />
            </View>

            {/* Input row */}
            <View style={styles.inputRow}>
              <BottomSheetTextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask a question…"
                placeholderTextColor="#4A3D5A"
                multiline
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                editable={!streaming}
                style={[styles.input, streaming && { opacity: 0.5 }]}
              />

              {streaming ? (
                /* Stop button */
                <Pressable
                  onPress={stop}
                  style={[styles.actionBtn, styles.stopBtn]}
                >
                  <Ionicons name="stop" size={20} color="#FFFFFF" />
                </Pressable>
              ) : (
                /* Send button */
                <Pressable
                  onPress={handleSend}
                  disabled={!input.trim()}
                  style={[
                    styles.actionBtn,
                    !input.trim()
                      ? styles.sendBtnDisabled
                      : styles.sendBtnActive,
                  ]}
                >
                  <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
HomeworkChatSheet.displayName = "HomeworkChatSheet";

const styles = StyleSheet.create({
  kav: { flex: 1 },
  sheet: {
    flex: 1,
    backgroundColor: "#13101C",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1828",
    paddingTop: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontFamily: "Bungee_400Regular",
    fontSize: 18,
  },
  headerSub: {
    color: "#5A4B6B",
    fontFamily: FONTS.body,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E1828",
    alignItems: "center",
    justifyContent: "center",
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 48,
    gap: 12,
  },
  emptyText: {
    color: "#3D2E4A",
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: "center",
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 1,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#6C5CE7",
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    alignSelf: "flex-start",
    backgroundColor: "#1E1828",
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: "#FFFFFF",
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
  },
  cursor: {
    color: "#6C5CE7",
    fontSize: 16,
    lineHeight: 22,
    marginTop: -4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#1E1828",
  },
  input: {
    flex: 1,
    backgroundColor: "#0D0B14",
    color: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: FONTS.body,
    fontSize: 14,
    maxHeight: 120,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#2D1F3D",
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: { backgroundColor: "#6C5CE7" },
  sendBtnDisabled: { backgroundColor: "#2D1F3D" },
  stopBtn: {
    backgroundColor: "#E85D75",
  },
});

// Markdown styles for AI bubbles
const mdStyles = {
  body: {
    color: "#C4B5D4",
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
  },
  strong: {
    fontFamily: FONTS.bodyBold,
    color: "#FFFFFF",
  },
  em: {
    fontStyle: "italic" as const,
    color: "#C4B5D4",
  },
  heading1: {
    color: "#FFFFFF",
    fontFamily: "Bungee_400Regular",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  heading2: {
    color: "#FFFFFF",
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 2,
  },
  heading3: {
    color: "#D4C5E4",
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 2,
  },
  code_inline: {
    backgroundColor: "#0D0B14",
    color: "#A78BFA",
    fontFamily: "monospace",
    fontSize: 13,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  fence: {
    backgroundColor: "#0D0B14",
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
  },
  code_block: {
    backgroundColor: "#0D0B14",
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    color: "#A78BFA",
    fontFamily: "monospace",
    fontSize: 13,
  },
  bullet_list: { marginTop: 4, marginBottom: 4 },
  ordered_list: { marginTop: 4, marginBottom: 4 },
  list_item: { marginBottom: 3 },
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

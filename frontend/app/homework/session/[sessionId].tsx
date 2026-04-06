import { useRef, useMemo } from "react";
import { View, Text, ScrollView, Image, Linking } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";

import { apiService } from "../../../src/services/api";
import * as guestDb from "../../../src/services/guestDb";
import { useGameStore } from "../../../src/stores/gameStore";
import {
  HomeworkChatSheet,
  type ChatSheetRef,
} from "../../../src/components/homework/HomeworkChatSheet";
import { HomeworkBottomBar } from "../../../src/components/homework/HomeworkBottomBar";
import { HomeworkQuizSheet } from "../../../src/components/homework/HomeworkQuizSheet";
import {
  BackButton,
  ScreenHeader,
  AnimatedLoader,
} from "../../../src/components/common";

/**
 * 🔥 SAME math fix used everywhere
 */
const brightenMath = (text: string) => {
  if (!text) return text;

  return text
    .replace(/\$\$(.*?)\$\$/gs, (_, expr) => {
      return `$$\\color{#E5E7EB}{${expr}}$$`;
    })
    .replace(/\$(.*?)\$/g, (_, expr) => {
      return `$\\color{#E5E7EB}{${expr}}$`;
    });
};

export default function HomeworkSessionScreen() {
  const { t } = useTranslation("homework");
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { userRole } = useGameStore();
  const isGuest = userRole === "guest";

  const chatSheetRef = useRef<ChatSheetRef>(null);
  const quizSheetRef = useRef<BottomSheetModal>(null);

  const { data: session, isLoading: loading } = useQuery({
    queryKey: ["homeworkSession", sessionId],
    queryFn: () =>
      isGuest
        ? guestDb.getHomeworkSession(sessionId)
        : apiService.getHomeworkSession(sessionId),
  });

  const processedMarkdown = useMemo(() => {
    return session?.answersMarkdown
      ? brightenMath(session.answersMarkdown)
      : "";
  }, [session?.answersMarkdown]);

  console.log(processedMarkdown);

  const linkedMatchIds: string[] = session?.linkedMatchIds?.length
    ? session.linkedMatchIds
    : session?.linkedMatchId
      ? [session.linkedMatchId]
      : [];

  const openQuizSheet = () => quizSheetRef.current?.present();
  const openChatSheet = () => chatSheetRef.current?.present();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0D0B14]">
        <View className="flex-1 items-center justify-center">
          <AnimatedLoader size="lg" color="#6C5CE7" />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-[#0D0B14]">
        <BackButton absolute />
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#7B6B8A] font-body text-base">
            {t("session.notFound")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const quizCount = linkedMatchIds.length;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-[#0D0B14]">
      <ScreenHeader title={t("session.assistTitle")} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        {session.title && (
          <Text
            style={{
              textAlign: "center",
              color: "#FFFFFF",
              fontFamily: "Bungee_400Regular",
              fontSize: 22,
              marginBottom: 16,
              lineHeight: 30,
            }}
          >
            {session.title}
          </Text>
        )}

        {/* Image */}
        {session.imageBase64 && (
          <Image
            source={{
              uri: `data:${
                session.imageMimeType || "image/jpeg"
              };base64,${session.imageBase64}`,
            }}
            style={{
              width: "100%",
              height: 240,
              borderRadius: 16,
              marginBottom: 20,
              backgroundColor: "#1A1520",
            }}
            resizeMode="contain"
          />
        )}

        <View className="mb-20">
          {/* Markdown Answer */}
          {session.answersMarkdown ? (
            <EnrichedMarkdownText
              flavor="github"
              markdown={processedMarkdown}
              onLinkPress={({ url }) => Linking.openURL(url)}
              markdownStyle={{
                list: {
                  color: "#ffff",
                },
                paragraph: {
                  color: "#D1D5DB",
                  marginBottom: 10,
                },
                h3: { color: "#FFFFFF" },
                h4: { color: "#FFFFFF" },
                h5: { color: "#FFFFFF" },
                h6: { color: "#FFFFFF" },

                h1: {
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#FFFFFF",
                },
                h2: {
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#F3F4F6",
                },

                link: {
                  color: "#60A5FA",
                },

                code: {
                  backgroundColor: "#1F2937",
                  color: "#F9FAFB",
                },

                codeBlock: {
                  backgroundColor: "#020617",
                  color: "#E2E8F0",
                  padding: 12,
                  borderRadius: 8,
                },

                blockquote: {
                  color: "#9CA3AF",
                },
              }}
            />
          ) : (
            <Text className="text-[#4A3D5A] font-body text-sm">
              {t("session.noExplanation")}
            </Text>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <HomeworkBottomBar
        quizCount={quizCount}
        onOpenQuizSheet={openQuizSheet}
        onOpenChat={openChatSheet}
        bottomInset={insets.bottom}
      />

      <HomeworkQuizSheet
        ref={quizSheetRef}
        sessionId={sessionId}
        session={session}
        onSessionUpdate={(updatedSession) => {
          queryClient.setQueryData(
            ["homeworkSession", sessionId],
            updatedSession,
          );
        }}
      />

      <HomeworkChatSheet
        ref={chatSheetRef}
        sessionId={sessionId}
        guestContext={isGuest ? session?.answersMarkdown || "" : undefined}
      />
    </SafeAreaView>
  );
}

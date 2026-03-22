import { useState, useRef } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiService } from "../../../src/services/api";
import * as guestDb from "../../../src/services/guestDb";
import { useGameStore } from "../../../src/stores/gameStore";
import { MarkdownAnswer } from "../../../src/components/homework/MarkdownAnswer";
import { HomeworkChatSheet, type ChatSheetRef } from "../../../src/components/homework/HomeworkChatSheet";
import { HomeworkBottomBar } from "../../../src/components/homework/HomeworkBottomBar";
import { HomeworkQuizSheet } from "../../../src/components/homework/HomeworkQuizSheet";
import {
  BackButton,
  ScreenHeader,
  AnimatedLoader,
} from "../../../src/components/common";

export default function HomeworkSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { userRole } = useGameStore();
  const isGuest = userRole === "guest";

  const chatSheetRef = useRef<ChatSheetRef>(null);
  const quizSheetRef = useRef<BottomSheetModal>(null);

  const { data: session, isLoading: loading } = useQuery({
    queryKey: ["homeworkSession", sessionId],
    queryFn: () => isGuest
      ? guestDb.getHomeworkSession(sessionId)
      : apiService.getHomeworkSession(sessionId),
  });

  const linkedMatchIds: string[] = session?.linkedMatchIds?.length
    ? session.linkedMatchIds
    : session?.linkedMatchId
      ? [session.linkedMatchId]
      : [];

  const openQuizSheet = () => {
    quizSheetRef.current?.present();
  };

  const openChatSheet = () => {
    chatSheetRef.current?.present();
  };

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
            Session not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const quizCount = linkedMatchIds.length;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-[#0D0B14]">
      <ScreenHeader title="Assist" />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {session.title && (
          <Text className="text-center text-white font-['Bungee_400Regular'] text-[22px] mb-4 leading-[30px]">
            {session.title}
          </Text>
        )}

        {session.imageBase64 && (
          <Image
            source={{
              uri: `data:${session.imageMimeType || "image/jpeg"};base64,${session.imageBase64}`,
            }}
            className="w-full h-60 rounded-2xl mb-5 bg-[#1A1520]"
            resizeMode="contain"
          />
        )}

        {session.answersMarkdown ? (
          <MarkdownAnswer content={session.answersMarkdown} />
        ) : (
          <Text className="text-[#4A3D5A] font-body text-sm">
            No explanation available.
          </Text>
        )}

        <View className="h-[120px]" />
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
          queryClient.setQueryData(["homeworkSession", sessionId], updatedSession);
        }}
      />

      <HomeworkChatSheet
        ref={chatSheetRef}
        sessionId={sessionId}
        guestContext={isGuest ? (session?.answersMarkdown || '') : undefined}
      />
    </SafeAreaView>
  );
}

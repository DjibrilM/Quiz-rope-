import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { usePortrait } from "../../src/hooks/useOrientation";
import { apiService } from "../../src/services/api";
import * as guestDb from "../../src/services/guestDb";
import { useGameStore } from "../../src/stores/gameStore";
import {
  AnimatedLoader,
  EmptyState,
  BouncePress,
  ScreenHeader,
} from "../../src/components/common";
import { FONTS } from "../../src/constants/theme";
import { useTranslation } from "react-i18next";
import { getSubjectTheme } from "../../src/config/subjectThemes";

import type { HomeworkSession } from "@shared/types/homework.types";
import type { Child } from "@shared/types/user.types";
import { useHomeworkLimit } from "../../src/hooks/useHomeworkLimit";
import Svg, { Path, Circle } from "react-native-svg";
function StatusBadge({ status }: { status: HomeworkSession["status"] }) {
  const { t } = useTranslation("homework");
  if (status === "READY") {
    return (
      <View className="flex-row items-center gap-1 bg-game-success/15 px-2 py-[3px] rounded-full">
        <Text
          className="text-game-success text-[10px]"
          style={{ fontFamily: FONTS.bodyBold }}
        >
          {t("status.ready")}
        </Text>
      </View>
    );
  }
  if (status === "PROCESSING") {
    return (
      <View className="flex-row items-center gap-1 bg-game-warning/15 px-2 py-[3px] rounded-full">
        <AnimatedLoader size="sm" color="#F59E0B" />
        <Text
          className="text-game-warning text-[10px]"
          style={{ fontFamily: FONTS.bodyBold }}
        >
          {t("status.analyzing")}
        </Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-1 bg-red-500/15 px-2 py-[3px] rounded-full">
      <Text
        className="text-red-500 text-[10px]"
        style={{ fontFamily: FONTS.bodyBold }}
      >
        {t("status.failed")}
      </Text>
    </View>
  );
}

function SessionCard({
  session,
  onPress,
}: {
  session: HomeworkSession;
  onPress: () => void;
}) {
  const { t } = useTranslation("homework");
  const theme = getSubjectTheme(session.subject || "SCIENCE");

  const date = new Date(session.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <BouncePress
      onPress={onPress}
      className="bg-card-bg rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: "#3D2E4A" }}
    >
      <Text
        className="text-white text-base mb-2"
        style={{ fontFamily: FONTS.bodyBold }}
        numberOfLines={2}
      >
        {session.title || t("session.defaultTitle")}
      </Text>

      <View className="flex-row items-center justify-between mb-2">
        <View
          className={`px-3 py-1 rounded-full ${theme.badgeClass}`}
          style={{ opacity: 0.9 }}
        >
          <Text
            className="text-white text-[11px]"
            style={{ fontFamily: FONTS.bodyBold }}
          >
            {theme.label}
          </Text>
        </View>
        <StatusBadge status={session.status} />
      </View>

      {session.topics && session.topics.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mt-1 mb-2">
          {session.topics.slice(0, 4).map((topic) => (
            <View key={topic} className="bg-[#231C2B] px-2 py-[2px] rounded">
              <Text
                className="text-[#B8A9C9] text-[11px]"
                style={{ fontFamily: FONTS.body }}
              >
                {topic}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center justify-between mt-1">
        <Text
          className="text-[#7B6B8A] text-xs"
          style={{ fontFamily: FONTS.body }}
        >
          {date}
        </Text>
        {session.quizTaken && (
          <View className="bg-game-indigo/15 px-2 py-[2px] rounded-md">
            <Text
              className="text-game-indigo text-[11px]"
              style={{ fontFamily: FONTS.bodySemiBold }}
            >
              {t("session.quizDone")}
            </Text>
          </View>
        )}
      </View>
    </BouncePress>
  );
}

function NewScanCard({ childId }: { childId: string | null }) {
  const { t } = useTranslation("homework");
  const { remaining, limit, loading } = useHomeworkLimit();

  return (
    <BouncePress
      onPress={() =>
        router.push({
          pathname: "/homework/capture" as any,
          params: childId ? { childId } : {},
        })
      }
      className="rounded-2xl p-5 mb-6 overflow-hidden"
      style={{
        backgroundColor: "#1A2E1F",
        borderWidth: 1,
        borderColor: "#10B98140",
      }}
    >
      <View className="flex-row items-center gap-4">
        <View className="w-14 h-14 rounded-2xl bg-game-success/20 items-center justify-center">
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
              stroke="#10B981"
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
            <Circle cx="12" cy="13" r="4" stroke="#10B981" strokeWidth={1.8} />
          </Svg>
        </View>
        <View className="flex-1">
          <Text
            className="text-white text-base"
            style={{ fontFamily: "Bungee_400Regular" }}
          >
            {t("actions.scanNew")}
          </Text>
          <Text
            className="text-[#10B981] text-xs mt-[3px]"
            style={{ fontFamily: FONTS.body }}
          >
            {loading ? t("actions.scanNewDesc") : __DEV__ ? "Unlimited developer scans" : `${remaining}/${limit} daily scans remaining`}
          </Text>
        </View>
        <Text className="text-game-success text-xl">›</Text>
      </View>
    </BouncePress>
  );
}

function ChildFilterChips({
  items,
  selected,
  onSelect,
}: {
  items: Child[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { t } = useTranslation("homework");
  if (items.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
    >
      <Pressable
        onPress={() => onSelect(null)}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 20,
          backgroundColor: selected === null ? "#6C5CE7" : "#231C2B",
          borderWidth: 1,
          borderColor: selected === null ? "#6C5CE7" : "#3D2E4A",
        }}
      >
        <Text
          style={{
            fontFamily: selected === null ? FONTS.bodyBold : FONTS.body,
            color: selected === null ? "#fff" : "#B8A9C9",
            fontSize: 13,
          }}
        >
          {t("filters.all")}
        </Text>
      </Pressable>
      {items.map((child) => {
        const childId = child.id || (child as any)._id?.toString();
        const isSelected = !!childId && selected === childId;
        return (
          <Pressable
            key={childId || child.displayName}
            onPress={() => onSelect(isSelected ? null : childId ?? null)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: isSelected ? "#6C5CE7" : "#231C2B",
              borderWidth: 1,
              borderColor: isSelected ? "#6C5CE7" : "#3D2E4A",
            }}
          >
            <Text
              style={{
                fontFamily: isSelected ? FONTS.bodyBold : FONTS.body,
                color: isSelected ? "#fff" : "#B8A9C9",
                fontSize: 13,
              }}
            >
              {child.displayName}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}


export default function HomeworkIndexScreen() {
  usePortrait();
  const { t } = useTranslation("homework");

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const { userRole, parentUser, guestProfile } = useGameStore();
  const isGuest = userRole === "guest";
  const uid = parentUser?._id ?? parentUser?.id ?? guestProfile?.guestId ?? null;

  const {
    data: sessions = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<HomeworkSession[]>({
    queryKey: ["homeworkSessions", uid],
    queryFn: async () => {
      const local = await guestDb.getHomeworkSessions();
      if (isGuest) return local as unknown as HomeworkSession[];

      try {
        const remote = await apiService.getHomeworkSessions();
        // Sync to local in background
        guestDb
          .syncFromBackend({ matches: [], homeworkSessions: remote })
          .catch(console.error);
        return remote;
      } catch (err) {
        if (local.length > 0) return local as unknown as HomeworkSession[];
        throw err;
      }
    },
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children", uid],
    queryFn: () => apiService.getChildren(),
    staleTime: 60_000,
    enabled: !isGuest,
  });

  const filteredSessions =
    selectedChildId === null
      ? sessions
      : sessions.filter((s) => s.childId === selectedChildId);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-game-bg">
      <ScreenHeader showBack title={t("title")} />


      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#9B59B6"
          />
        }
      >
        <NewScanCard childId={selectedChildId} />

        <ChildFilterChips
          items={children}
          selected={selectedChildId}
          onSelect={setSelectedChildId}
        />

        {/* History section header */}
        <Text
          className="text-[#7B6B8A] text-xs mb-3 tracking-widest uppercase"
          style={{ fontFamily: FONTS.bodySemiBold }}
        >
          {selectedChildId
            ? t("history.childSessions", {
                name:
                  children.find(
                    (c) => (c.id || (c as any)._id?.toString()) === selectedChildId,
                  )?.displayName ?? "",
              })
            : t("history.recent")}

        </Text>

        {isLoading && (
          <View className="items-center py-16">
            <AnimatedLoader size="lg" />
          </View>
        )}

        {isError && !isLoading && (
          <EmptyState
            illustration="error"
            title={t("errors.loadFailed")}
            subtitle={t("errors.pullToRetry")}
          />

        )}

        {!isLoading && !isError && filteredSessions.length === 0 && (
          <EmptyState
            illustration="noMatches"
            title={
              selectedChildId
                ? t("empty.noSessionsForChild")
                : t("empty.noHomeworkYet")
            }
            subtitle={
              selectedChildId ? t("empty.assignToChild") : t("empty.getStarted")
            }
          />

        )}

        {!isLoading &&
          filteredSessions.map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              onPress={() => {
                if (session.status === "READY") {
                  router.push(`/homework/session/${session._id}` as any);
                } else if (session.status === "PROCESSING") {
                  router.push({
                    pathname: "/homework/processing" as any,
                    params: { sessionId: session._id },
                  });
                }
              }}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

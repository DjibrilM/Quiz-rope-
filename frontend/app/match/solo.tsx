import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { usePortrait } from "../../src/hooks/useOrientation";
import { useGameStore } from "../../src/stores/gameStore";
import { apiService } from "../../src/services/api";
import { Button, ScreenHeader } from "../../src/components/common";
import { DifficultySelector, RoundsSelector } from "../../src/components/match";
import { MatchStatus } from "@shared/types/match.types";
import { useTranslation } from "react-i18next";
import { FONTS } from "../../src/constants/theme";
import { hapticsService } from "../../src/services/haptics";

function PlayIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 3l14 9-14 9V3z" fill="#FFFFFF" />
    </Svg>
  );
}

export default function SoloMatchScreen() {
  usePortrait();
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [context, setContext] = useState("");
  const [contextError, setContextError] = useState("");
  const { t } = useTranslation(["match", "common"]);
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const { setCurrentMatch, children, childSession, locale } = useGameStore();
  const [difficulty, setDifficulty] = useState("EASY");
  const [maxRounds, setMaxRounds] = useState(10);
  // Pre-select the child if playing from their own device
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    childSession?.childId ?? null,
  );

  const subjectLabel = t(`common:subjects.${subject}`);

  const handleStart = async () => {
    setContextError("");
    try {
      setCreatingMatch(true);
      hapticsService.medium();

      const teams = [
        { name: "Red Team", color: "#EF4444", side: "LEFT" },
        { name: "Blue Team", color: "#3B82F6", side: "RIGHT" },
      ];

      const created = await apiService.createMatch({
        subject: subject!,
        difficulty,
        maxRounds,
        gameMode: "solo",
        context: context.trim() || undefined,
        teams,
        childIds: selectedChildId ? [selectedChildId] : [],
        language: locale,
      });

      const match = {
        ...(created as any),
        id: (created as any)._id || (created as any).id,
        gameMode: "solo" as const,
        teams: ((created as any).teams || teams).map((t: any, i: number) => ({
          id: t._id || t.id || `team-${i}`,
          name: t.name,
          color: t.color,
          side: t.side,
          players: t.players || [],
        })),
        ropePosition: (created as any).ropePosition || 0,
        currentQuestionIndex: (created as any).currentQuestionIndex || 0,
        status: MatchStatus.IN_PROGRESS,
        rounds: (created as any).rounds || 0,
        maxRounds,
        createdAt: (created as any).createdAt || new Date(),
      };

      // Solo mode runs entirely offline — no socket needed.
      // Connecting the socket causes startTimer in game.tsx to bail out early.
      setCurrentMatch(match);
      router.replace({
        pathname: "/match/game",
        params: {
          matchId: match.id,
          ...(selectedChildId ? { p1Id: selectedChildId } : {}),
        },
      });
    } catch (error: any) {
      setCreatingMatch(false);
      if (error?.message === "CONTEXT_NOT_RELATED") {
        setContextError(t("match:solo.contextNotRelated"));
      } else {
        console.error("Failed to create match:", error);
      }
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-game-bg">
      <ScreenHeader title={t("match:solo.title", { subject: subjectLabel })} />

      <ScrollView
        className="flex-1 px-6"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 24 }}
      >
        <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
        <RoundsSelector selected={maxRounds} onSelect={setMaxRounds} />

        {/* Child picker */}
        {children.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: "#7B6B8A",
                fontSize: 11,
                fontFamily: FONTS.bodySemiBold,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Playing as
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {children.map((c) => {
                const cId = c.id;
                const active = selectedChildId === cId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      hapticsService.selection();
                      setSelectedChildId(active ? null : cId);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: active ? "#A78BFA20" : "#1A1520",
                      borderWidth: 1.5,
                      borderColor: active ? "#A78BFA" : "#3D2E4A",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#A78BFA" : "#B8A9C9",
                        fontSize: 13,
                        fontFamily: FONTS.bodySemiBold,
                      }}
                    >
                      {c.displayName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Context input */}
        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              color: "#B8A9C9",
              fontSize: 11,
              fontFamily: FONTS.bodySemiBold,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {t("match:solo.contextLabel")}
          </Text>
          <TextInput
            value={context}
            onChangeText={(v) => {
              setContext(v);
              if (contextError) setContextError("");
            }}
            placeholder={t("match:solo.contextPlaceholder")}
            placeholderTextColor="#4A3D5A"
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: "#1A1520",
              borderWidth: 1.5,
              borderColor: contextError ? "#EF4444" : "#3D2E4A",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: "#FFFFFF",
              fontSize: 14,
              fontFamily: FONTS.body,
              lineHeight: 20,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
          {contextError ? (
            <Text
              style={{
                color: "#EF4444",
                fontSize: 13,
                fontFamily: FONTS.body,
                marginTop: 6,
              }}
            >
              {contextError}
            </Text>
          ) : (
            <Text
              style={{
                color: "#4A3D5A",
                fontSize: 12,
                fontFamily: FONTS.body,
                marginTop: 6,
              }}
            >
              {t("match:solo.contextHint")}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Start Game button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: 36,
          paddingTop: 16,
          backgroundColor: "#0D0B14E8",
        }}
      >
        <Button
          className="min-w-full"
          onPress={handleStart}
          label={t("match:solo.startButton")}
          icon={<PlayIcon />}
          loading={creatingMatch}
        />
      </View>
    </SafeAreaView>
  );
}

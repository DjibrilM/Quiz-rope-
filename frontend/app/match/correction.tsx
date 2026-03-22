import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import Markdown from "react-native-markdown-display";
import { useQuery } from "@tanstack/react-query";
import { usePortrait } from "../../src/hooks/useOrientation";
import { useGameStore } from "../../src/stores/gameStore";
import * as guestDb from "../../src/services/guestDb";
import { FONTS, FORTNITE_COLORS } from "../../src/constants/theme";
import type { CorrectionItem } from "../../src/stores/gameStore";
import { ScreenHeader } from "@/components/common";

const OPTION_LABELS = ["A", "B", "C", "D"];

function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke="#10B981"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function XIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke="#EF4444"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function CorrectionScreen() {
  usePortrait();
  const { t } = useTranslation(["game", "common"]);
  const { sessionId, matchId } = useLocalSearchParams<{
    sessionId?: string;
    matchId?: string;
  }>();
  const storeCorrections = useGameStore((s) => s.lastMatchCorrection);

  // Fetch from SQLite when matchId is present; falls back to store if DB is empty
  const { data: dbCorrections, isLoading: loadingCorrections } = useQuery<
    CorrectionItem[]
  >({
    queryKey: ["corrections", matchId],
    queryFn: () =>
      guestDb.getCorrections(matchId as string).then((rows) =>
        rows.map((r) => ({
          questionText: r.questionText,
          options: r.options,
          correctIndex: r.correctIndex,
          explanation: r.explanation,
          userAnswerIndex: r.userAnswerIndex,
          isCorrect: r.isCorrect,
        })),
      ),
    enabled: !!matchId,
    staleTime: 5 * 60 * 1000, // Local SQLite — treat as fresh for 5 min
    placeholderData: storeCorrections.length > 0 ? storeCorrections : undefined,
  });

  // When no matchId (just came from game end), use store directly; otherwise use DB result
  const corrections: CorrectionItem[] = matchId
    ? dbCorrections?.length
      ? dbCorrections
      : storeCorrections
    : storeCorrections;

  const correctCount = corrections.filter(
    (a: CorrectionItem) => a.isCorrect,
  ).length;
  const total = corrections.length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const fromHomework = !!sessionId;

  return (
    <View className="px-4 flex-1">
      <ScreenHeader title={t("game:correction.title")} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: fromHomework ? 110 : 40,
          paddingTop: 16,
          gap: 12,
        }}
      >
        {loadingCorrections ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color="#A78BFA" />
          </View>
        ) : corrections.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text
              style={{
                color: FORTNITE_COLORS.textMuted,
                fontSize: 15,
                fontFamily: FONTS.body,
              }}
            >
              {t("game:correction.empty")}
            </Text>
          </View>
        ) : (
          <>
            {/* Summary */}
            <View
              style={{
                backgroundColor: FORTNITE_COLORS.bgCard,
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: FONTS.bodyBold,
                  color: FORTNITE_COLORS.textPrimary,
                }}
              >
                {t("game:correction.summary", {
                  correct: correctCount,
                  total,
                })}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: FONTS.bodyBold,
                  color:
                    accuracy >= 70
                      ? "#10B981"
                      : accuracy >= 40
                        ? "#F59E0B"
                        : "#EF4444",
                }}
              >
                {accuracy}%
              </Text>
            </View>

            {/* Question cards */}
            {corrections.map((item, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: FORTNITE_COLORS.bgCard,
                  borderRadius: 16,
                  padding: 16,
                  gap: 12,
                  borderWidth: 1,
                  borderColor: item.isCorrect ? "#10B98130" : "#EF444430",
                }}
              >
                {/* Question header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: FONTS.accent,
                      color: item.isCorrect ? "#10B981" : "#EF4444",
                    }}
                  >
                    {t("game:correction.question", { number: index + 1 })}
                  </Text>
                  {item.isCorrect ? <CheckIcon /> : <XIcon />}
                </View>

                {/* Question text */}
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: FONTS.bodySemiBold,
                    color: FORTNITE_COLORS.textPrimary,
                    lineHeight: 22,
                  }}
                >
                  {item.questionText}
                </Text>

                {/* Options */}
                <View style={{ gap: 6 }}>
                  {item.options.map((option, i) => {
                    const isCorrect = i === item.correctIndex;
                    const isUserWrong =
                      i === item.userAnswerIndex && !item.isCorrect;

                    let borderColor = "#3D2E4A";
                    let bgColor = "transparent";
                    if (isCorrect) {
                      borderColor = "#10B981";
                      bgColor = "#10B98110";
                    } else if (isUserWrong) {
                      borderColor = "#EF4444";
                      bgColor = "#EF444410";
                    }

                    return (
                      <View
                        key={i}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          borderWidth: 1.5,
                          borderColor,
                          backgroundColor: bgColor,
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: isCorrect
                              ? "#10B98130"
                              : isUserWrong
                                ? "#EF444430"
                                : "#3D2E4A",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: FONTS.accent,
                              color: isCorrect
                                ? "#10B981"
                                : isUserWrong
                                  ? "#EF4444"
                                  : FORTNITE_COLORS.textMuted,
                            }}
                          >
                            {OPTION_LABELS[i]}
                          </Text>
                        </View>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            fontFamily: FONTS.body,
                            color: isCorrect
                              ? "#10B981"
                              : isUserWrong
                                ? "#EF4444"
                                : FORTNITE_COLORS.textSecondary,
                          }}
                        >
                          {option}
                        </Text>
                        {isCorrect && <CheckIcon />}
                        {isUserWrong && <XIcon />}
                      </View>
                    );
                  })}
                  {item.userAnswerIndex === -1 && (
                    <Text
                      style={{
                        color: "#7B6B8A",
                        fontSize: 12,
                        fontFamily: FONTS.body,
                        marginTop: 2,
                      }}
                    >
                      {t("game:correction.skipped")}
                    </Text>
                  )}
                </View>

                {/* Explanation */}
                {item.explanation ? (
                  <View
                    style={{
                      backgroundColor: "#3D2E4A30",
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: FONTS.bodySemiBold,
                        color: FORTNITE_COLORS.textMuted,
                        marginBottom: 6,
                      }}
                    >
                      {t("game:correction.explanation")}
                    </Text>
                    <Markdown
                      style={{
                        body: {
                          fontSize: 13,
                          fontFamily: FONTS.body,
                          color: FORTNITE_COLORS.textSecondary,
                          lineHeight: 20,
                        },
                        strong: {
                          fontFamily: FONTS.bodySemiBold,
                          color: FORTNITE_COLORS.textPrimary,
                        },
                        bullet_list: { marginTop: 4, marginBottom: 0 },
                        ordered_list: { marginTop: 4, marginBottom: 0 },
                        list_item: { marginBottom: 2 },
                        paragraph: { marginTop: 0, marginBottom: 6 },
                      }}
                    >
                      {item.explanation}
                    </Markdown>
                  </View>
                ) : null}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const correctionStyles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "#0D0B14E8",
  },
});

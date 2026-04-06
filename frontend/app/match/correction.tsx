import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { usePortrait } from "../../src/hooks/useOrientation";
import { useGameStore } from "../../src/stores/gameStore";
import * as guestDb from "../../src/services/guestDb";
import { FONTS, FORTNITE_COLORS } from "../../src/constants/theme";
import type { CorrectionItem } from "../../src/stores/gameStore";
import { ScreenHeader } from "@/components/common";
import { MathMarkdown } from "../../src/components/common/MathMarkdown";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

const OPTION_LABELS = ["A", "B", "C", "D"];

const getMarkdownStyles = (textColor: string) => ({
  body: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: textColor,
    lineHeight: 22,
  },
  paragraph: {
    color: textColor,
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 22,
  },
  h1: {
    color: textColor,
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
    marginBottom: 8,
    marginTop: 12,
  },
  h2: {
    color: textColor,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    marginBottom: 8,
    marginTop: 10,
  },
  h3: {
    color: textColor,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    marginBottom: 6,
    marginTop: 8,
  },
  strong: { fontFamily: FONTS.bodyBold, color: textColor },
  em: { fontStyle: "italic" as const, color: textColor },
  list: { marginBottom: 12, color: textColor },
  listItem: { marginBottom: 6, color: textColor },
  code_inline: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#A78BFA",
    fontFamily: FONTS.body,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  code_block: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: textColor,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontFamily: FONTS.body,
  },
});

/**
 * Removed brightenMath as MathMarkdown natively handles colors
 */

function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
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
    <Svg width={14} height={14} viewBox="0 0 24 24">
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

  const handleCopy = async (item: CorrectionItem) => {
    let text = `Question:\n${item.questionText}\n\n`;
    item.options.forEach((opt, idx) => {
      text += `${OPTION_LABELS[idx]}. ${opt}${idx === item.correctIndex ? " (Correct)" : ""}\n`;
    });
    if (item.explanation) {
      text += `\nExplanation:\n${item.explanation}\n`;
    }
    await Clipboard.setStringAsync(text);
  };
  const { sessionId, matchId } = useLocalSearchParams<{
    sessionId?: string;
    matchId?: string;
  }>();

  const storeCorrections = useGameStore((s) => s.lastMatchCorrection);

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
    staleTime: 5 * 60 * 1000,
    placeholderData: storeCorrections.length > 0 ? storeCorrections : undefined,
  });

  const corrections: CorrectionItem[] = matchId
    ? dbCorrections?.length
      ? dbCorrections
      : storeCorrections
    : storeCorrections;

  const correctCount = corrections.filter((a) => a.isCorrect).length;
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
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: FONTS.bodyBold,
                  color: "#FFFFFF",
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

            {/* Cards */}
            {corrections.map((item, index) => {
              return (
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
                  {/* Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: FONTS.accent,
                        color: item.isCorrect ? "#10B981" : "#EF4444",
                      }}
                    >
                      {t("game:correction.question", {
                        number: index + 1,
                      })}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Pressable
                        onPress={() => handleCopy(item)}
                        hitSlop={8}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.6 : 1,
                        })}
                      >
                        <Ionicons
                          name="copy-outline"
                          size={16}
                          color={FORTNITE_COLORS.textMuted}
                        />
                      </Pressable>
                      {item.isCorrect ? <CheckIcon /> : <XIcon />}
                    </View>
                  </View>

                  {/* Question */}
                  <MathMarkdown
                    content={item.questionText}
                    style={getMarkdownStyles("#FFFFFF")}
                  />

                  {/* Options */}
                  <View style={{ gap: 6 }}>
                    {item.options.map((option, i) => {
                      const isCorrect = i === item.correctIndex;
                      const isUserWrong =
                        i === item.userAnswerIndex && !item.isCorrect;

                      const textColor = isCorrect
                        ? "#10B981"
                        : isUserWrong
                          ? "#EF4444"
                          : "#FFFFFF";

                      return (
                        <View
                          key={i}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            borderWidth: 1.5,
                            borderColor: isCorrect
                              ? "#10B981"
                              : isUserWrong
                                ? "#EF4444"
                                : "#3D2E4A",
                            backgroundColor: isCorrect
                              ? "#10B98110"
                              : isUserWrong
                                ? "#EF444410"
                                : "transparent",
                            borderRadius: 10,
                            padding: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: textColor,
                              fontSize: 12,
                              fontFamily: FONTS.accent,
                            }}
                          >
                            {OPTION_LABELS[i]}
                          </Text>

                          <View style={{ flex: 1 }}>
                            <MathMarkdown
                              content={option}
                              style={getMarkdownStyles(textColor)}
                            />
                          </View>

                          {isCorrect && <CheckIcon />}
                          {isUserWrong && <XIcon />}
                        </View>
                      );
                    })}
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

                      <MathMarkdown
                        content={item.explanation}
                        style={getMarkdownStyles("white")}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

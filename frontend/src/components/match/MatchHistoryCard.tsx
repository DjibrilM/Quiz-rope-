import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import type { Match } from "@shared/types/match.types";
import { SubjectIcon } from "./SubjectIcons";
import { FONTS } from "../../constants/theme";

interface MatchHistoryCardProps {
  match: Match;
  onPress: () => void;
}

export function MatchHistoryCard({ match, onPress }: MatchHistoryCardProps) {
  const { t } = useTranslation(["match", "common"]);
  const isRedWinner = match.winner === "LEFT";
  const winnerColor = isRedWinner ? "text-team-red" : "text-team-blue";
  const winnerLabel = isRedWinner ? t("common:teams.redTeam") : t("common:teams.blueTeam");
  const dateStr = new Date(match.createdAt).toLocaleDateString();

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#1A1520",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#3D2E4A",
        marginBottom: 12,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="mr-3">
            <SubjectIcon subject={match.subject} size={32} />
          </View>
          <View className="flex-1">
            <Text style={{ fontSize: 18, fontFamily: FONTS.bodyBold, color: "#FFFFFF" }}>
              {match.subject.charAt(0) + match.subject.slice(1).toLowerCase()}
            </Text>
            <Text style={{ color: "#B8A9C9", fontSize: 13, fontFamily: FONTS.body }}>
              {match.difficulty} - {match.rounds}/{match.maxRounds} rounds
            </Text>
          </View>
        </View>

        <View className="items-end">
          {match.status === "COMPLETED" && match.winner ? (
            <Text className={`text-base font-bold ${winnerColor}`} style={{ fontFamily: FONTS.bodyBold }}>
              {winnerLabel} {t("match:history.won")}
            </Text>
          ) : (
            <Text style={{ color: "#7B6B8A", fontSize: 13, fontFamily: FONTS.bodySemiBold }}>
              {match.status}
            </Text>
          )}
          <Text style={{ color: "#7B6B8A", fontSize: 12, fontFamily: FONTS.body, marginTop: 4 }}>{dateStr}</Text>
        </View>
      </View>
    </Pressable>
  );
}

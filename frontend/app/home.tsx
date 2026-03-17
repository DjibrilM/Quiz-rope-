import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { usePortrait } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { firebaseAuthService } from "../src/services/firebase";
import { AvatarIcon } from "../src/components/common/AvatarIcons";
import { apiService } from "../src/services/api";
import { hapticsService } from "../src/services/haptics";
import { MatchStatus } from "@shared/types/match.types";
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import React, { useRef, useCallback, useEffect } from "react";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import {
  BouncePress,
  StaggeredList,
  LanguageSelector,
  FlashingGlobeButton,
  Button,
} from "../src/components/common";
import { BrainMascot } from "../src/components/common/Mascots";
import { FONTS } from "../src/constants/theme";

function IconQuickPlay() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="bolt" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD93D" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#bolt)" />
    </Svg>
  );
}

function IconNewGame() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="sword1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#C4B5FD" />
          <Stop offset="1" stopColor="#9B59B6" />
        </LinearGradient>
      </Defs>
      <Rect x="2" y="10" width="20" height="4" rx="2" fill="url(#sword1)" />
      <Rect x="10" y="2" width="4" height="20" rx="2" fill="url(#sword1)" />
      <Circle cx="12" cy="12" r="3" fill="#E8D0FF" />
    </Svg>
  );
}

function IconHomework() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="hw" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#34D399" />
          <Stop offset="1" stopColor="#059669" />
        </LinearGradient>
      </Defs>
      <Rect
        x="3"
        y="2"
        width="14"
        height="18"
        rx="2"
        stroke="url(#hw)"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M7 7h6M7 11h6M7 15h4"
        stroke="#34D399"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Circle cx="19" cy="17" r="4" fill="#059669" />
      <Path
        d="M17.5 17l1 1 2-2"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconConnectDevice() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="dev" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E85D75" />
          <Stop offset="1" stopColor="#C44D66" />
        </LinearGradient>
      </Defs>
      <Rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="3"
        stroke="url(#dev)"
        strokeWidth="2"
        fill="none"
      />
      <Circle cx="12" cy="17" r="1.5" fill="#E85D75" />
      <Path
        d="M9 8h6M9 11h6"
        stroke="#E85D75"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconChildren() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="kid" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#34D399" />
          <Stop offset="1" stopColor="#10B981" />
        </LinearGradient>
      </Defs>
      <Circle cx="9" cy="7" r="3" fill="url(#kid)" />
      <Path
        d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6"
        stroke="url(#kid)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="17" cy="9" r="2.5" fill="#6EE7B7" />
      <Path
        d="M13 19c0-2.5 1.8-4.5 4-4.5s4 2 4 4.5"
        stroke="#6EE7B7"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function IconMatchHistory() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="chart" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#E85D75" />
          <Stop offset="1" stopColor="#C44D66" />
        </LinearGradient>
      </Defs>
      <Rect x="3" y="14" width="4" height="7" rx="1" fill="#F9A8D4" />
      <Rect x="10" y="8" width="4" height="13" rx="1" fill="url(#chart)" />
      <Rect x="17" y="3" width="4" height="18" rx="1" fill="#9B59B6" />
      <Path
        d="M3 3v18h18"
        stroke="#F9A8D4"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function IconLeaderboard() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="trophy" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFD93D" />
          <Stop offset="1" stopColor="#D97706" />
        </LinearGradient>
      </Defs>
      <Path d="M6 3h12v6a6 6 0 01-12 0V3z" fill="url(#trophy)" />
      <Path
        d="M6 5H3a1 1 0 00-1 1v1a4 4 0 004 4"
        stroke="#FFD93D"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M18 5h3a1 1 0 011 1v1a4 4 0 01-4 4"
        stroke="#FFD93D"
        strokeWidth="1.5"
        fill="none"
      />
      <Rect x="10" y="15" width="4" height="4" rx="1" fill="#D97706" />
      <Rect x="7" y="19" width="10" height="2" rx="1" fill="#92400E" />
    </Svg>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  highlight?: boolean;
}

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  highlight,
}: MenuItemProps) {
  return (
    <BouncePress
      onPress={() => {
        hapticsService.selection();
        onPress();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: highlight ? "#9B59B6" : "#1A1520",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            color: "#FFFFFF",
            fontFamily: "Bungee_400Regular",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            marginTop: 4,
            color: highlight ? "#E8D0FF" : "#7B6B8A",
            fontFamily: FONTS.body,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 18l6-6-6-6"
          stroke={highlight ? "#E9D5FF" : "#5A4B6B"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </BouncePress>
  );
}

export default function HomeScreen() {
  usePortrait();
  const { t } = useTranslation(["home", "auth", "common"]);
  const {
    parentUser,
    isMockMode,
    userRole,
    guestProfile,
    logout,
    setCurrentMatch,
    setChildren,
    childSession,
    children,
  } = useGameStore();

  const isGuest = userRole === "guest";
  const isChild = userRole === "child";
  const currentChild = isChild
    ? children.find((c) => c.id === childSession?.childId)
    : null;
  const logoutSheetRef = useRef<BottomSheetModal>(null);
  const languageSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (userRole !== "child" && userRole !== "guest" && apiService.hasToken()) {
      apiService
        .getChildren()
        .then((data) => {
          if (Array.isArray(data)) {
            setChildren(
              data
                .filter(Boolean)
                .map((c: any) => ({ ...c, id: c._id || c.id })),
            );
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleOpenLogout = useCallback(() => {
    logoutSheetRef.current?.present();
  }, []);

  const handleCloseLogout = useCallback(() => {
    logoutSheetRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    [],
  );

  const handleQuickPlay = () => {
    const match = {
      id: "quick-play-" + Date.now(),
      hostParentId: "mock-parent",
      subject: "MATH",
      difficulty: "EASY",
      maxRounds: 10,
      teams: [
        {
          id: "team-red",
          name: "Red Team",
          color: "#EF4444",
          side: "LEFT" as const,
          players: [],
        },
        {
          id: "team-blue",
          name: "Blue Team",
          color: "#3B82F6",
          side: "RIGHT" as const,
          players: [],
        },
      ],
      ropePosition: 0,
      currentQuestionIndex: 0,
      status: MatchStatus.WAITING,
      rounds: 0,
      createdAt: new Date(),
    };
    setCurrentMatch(match as any);
    router.push({ pathname: "/match/game", params: { matchId: match.id } });
  };

  const handleLogout = async () => {
    handleCloseLogout();
    try {
      await firebaseAuthService.signOut();
    } catch (err) {
      console.warn("Firebase sign-out error (non-critical):", err);
    }
    apiService.clearToken();
    logout();
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      {/* Header */}
      <View className="px-6 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View className="relative bottom-1">
              <BrainMascot speed={0.7} size={40} variant="headSideBounce" />
            </View>
            <View className="">
              <Text
                className="text-3xl text-white"
                style={{ fontFamily: "LuckiestGuy_400Regular" }}
              >
                {t("home:appName")}
              </Text>
              {(isGuest || isChild) && (
                <Text
                  style={{
                    fontSize: 14,
                    color: "#B8A9C9",
                    marginTop: 4,
                    fontFamily: FONTS.body,
                  }}
                >
                  {t("home:greeting", {
                    name: isGuest
                      ? guestProfile?.displayName || "Player"
                      : currentChild?.displayName || "Player",
                  })}
                </Text>
              )}
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <FlashingGlobeButton
              onPress={() => languageSheetRef.current?.present()}
            />
            <Pressable
              onPress={handleOpenLogout}
              style={{
                backgroundColor: "#1A1520",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: "#7B6B8A",
                  fontSize: 12,
                  fontFamily: "Bungee_400Regular",
                }}
              >
                {t("auth:logout.button")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Guest banner — shown only for guest users */}
      {isGuest && guestProfile && (
        <Pressable
          className="mb-2"
          onPress={() => router.push("/child/link-to-parent")}
          style={{
            marginHorizontal: 24,
            marginBottom: 4,
            backgroundColor: "#1A1520",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#9B59B6",
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#0D0B14",
              borderWidth: 2,
              borderColor: "#9B59B6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AvatarIcon avatarId={guestProfile.avatarId} size={30} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 13,
                fontFamily: FONTS.bodyBold,
              }}
            >
              {guestProfile.displayName}
            </Text>
            <Text
              style={{
                color: "#9B59B6",
                fontSize: 11,
                fontFamily: FONTS.body,
                marginTop: 1,
              }}
            >
              {t("home:guest.linkBannerCta")}
            </Text>
          </View>
          <Text style={{ color: "#9B59B6", fontSize: 18 }}>{"›"}</Text>
        </Pressable>
      )}

      <ScrollView
        className="flex-1 px-6 mt-2"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <StaggeredList staggerMs={80}>
          {/* Quick play / solo — always available */}
          {__DEV__ && isMockMode && !isGuest && (
            <View style={{ position: "relative" }}>
              <View
                style={{
                  position: "absolute",
                  top: -45,
                  right: 10,
                  zIndex: -1,
                  transform: [{ rotate: "10deg" }],
                }}
              >
                <BrainMascot size={85} />
              </View>
              <MenuItem
                icon={<IconQuickPlay />}
                title={t("home:menu.quickPlay")}
                subtitle={t("home:menu.quickPlayDesc")}
                onPress={handleQuickPlay}
                highlight
              />
            </View>
          )}

          {/* Guest: solo play as the highlighted primary action */}
          {isGuest && (
            <View style={{ position: "relative" }}>
              <View
                style={{
                  position: "absolute",
                  top: -45,
                  right: 10,
                  zIndex: -1,
                  transform: [{ rotate: "10deg" }],
                }}
              ></View>
              <MenuItem
                icon={<IconQuickPlay />}
                title={t("home:menu.soloPlay")}
                subtitle={t("home:menu.soloPlayDesc")}
                onPress={() => router.push("/match/create")}
                highlight
              />
            </View>
          )}

          {/* Parent / child: create a new game */}
          {!isGuest && (
            <View style={{ position: "relative" }}>
              <View
                style={{
                  position: "absolute",
                  top: -20,
                  left: -20,
                  zIndex: 10,
                  transform: [{ rotate: "-15deg" }],
                }}
              ></View>
              <MenuItem
                icon={<IconNewGame />}
                title={t("home:menu.startNewGame")}
                subtitle={t("home:menu.startNewGameDesc")}
                onPress={() => router.push("/match/create")}
                highlight
              />
            </View>
          )}

          <MenuItem
            icon={<IconHomework />}
            title="Homework Assist"
            subtitle="Photograph homework and get AI explanations"
            onPress={() => router.push("/homework" as any)}
          />

          {userRole !== "child" && !isGuest && (
            <MenuItem
              icon={<IconChildren />}
              title={t("home:menu.myChildren")}
              subtitle={t("home:menu.myChildrenDesc")}
              onPress={() => router.push("/child")}
            />
          )}

          <MenuItem
            icon={<IconMatchHistory />}
            title={t("home:menu.matchHistory")}
            subtitle={t("home:menu.matchHistoryDesc")}
            onPress={() => router.push("/match/history" as any)}
          />

          <MenuItem
            icon={<IconLeaderboard />}
            title={t("home:menu.leaderboard")}
            subtitle={t("home:menu.leaderboardDesc")}
            onPress={() => router.push("/leaderboard" as any)}
          />

          {/* Guest: link to parent as a menu item too */}
          {isGuest && (
            <MenuItem
              icon={<IconChildren />}
              title={t("home:guest.linkMenuItem")}
              subtitle={t("home:guest.linkMenuItemDesc")}
              onPress={() => router.push("/child/link-to-parent")}
            />
          )}
        </StaggeredList>
      </ScrollView>

      <BottomSheetModal
        ref={logoutSheetRef}
        enablePanDownToClose
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: "#1A1520",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        handleIndicatorStyle={{
          backgroundColor: "#5A4B6B",
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView
          style={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 22,
              textAlign: "center",
              marginBottom: 12,
              fontFamily: "LuckiestGuy_400Regular",
            }}
          >
            {t("auth:logout.title")}
          </Text>
          <Text
            style={{
              color: "#B8A9C9",
              fontSize: 15,
              textAlign: "center",
              marginBottom: 32,
              fontFamily: FONTS.body,
            }}
          >
            {t("auth:logout.confirmation")}
          </Text>
          <View className="flex-col gap-3">
            <Button
              label={t("auth:logout.button")}
              variant="danger"
              onPress={handleLogout}
              className="w-full max-w-none"
            />
            <Button
              label={t("common:buttons.cancel")}
              variant="secondary"
              onPress={handleCloseLogout}
              className="w-full max-w-none"
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      <LanguageSelector ref={languageSheetRef} />
    </SafeAreaView>
  );
}

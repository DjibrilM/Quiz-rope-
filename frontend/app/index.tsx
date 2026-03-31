import { View, ScrollView, Text, Pressable, Modal } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useRef, useState } from "react";
import Svg, { Path, G } from "react-native-svg";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { usePortrait } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import {
  LanguageSelector,
  FlashingGlobeButton,
  BouncePress,
  AnimatedLoader,
} from "../src/components/common";
import { FONTS } from "../src/constants/theme";
import { TERMS_AND_CONDITIONS } from "../src/constants/terms";

function ParentIcon({
  size = 26,
  color = "#9CA3AF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <G>
        <Path
          d="M58.483 31.529a26.19 26.19 0 0 1-12.692-3.31 1.542 1.542 0 0 0-1.584 0 20.97 20.97 0 0 1-3.507 1.636l5.574-11.147A1.281 1.281 0 0 1 47.42 18H56a2 2 0 0 0 2-2v-2a1.987 1.987 0 0 0-.689-1.5 7.076 7.076 0 0 0 .707-.627A6.965 6.965 0 0 0 60 6.779 7.183 7.183 0 0 0 52.748 0h-9.659a11.946 11.946 0 0 0-10.734 6.633l-15.928 31.86A2.746 2.746 0 0 1 13.992 40H7a7.01 7.01 0 0 0-7 7.221 6.906 6.906 0 0 0 2.738 5.238A1.986 1.986 0 0 0 2 54v2a2 2 0 0 0 2 2h15.12a12.079 12.079 0 0 0 10.855-6.7l1.656-3.314a22.113 22.113 0 0 0 12.6 11.871 2.1 2.1 0 0 0 1.541 0C54.547 56.426 60 48.774 60 39.889v-6.844a1.537 1.537 0 0 0-1.517-1.516ZM56 14v2h-8.58a3.291 3.291 0 0 0-2.944 1.822l-6.423 12.845c-.712.18-1.481.34-2.3.475l7.817-15.635A2.746 2.746 0 0 1 46.008 14H56ZM2 47.161A5.011 5.011 0 0 1 7 42h6.99a4.7 4.7 0 0 0 4.224-2.612l15.93-31.86A9.955 9.955 0 0 1 43.089 2h9.659A5.169 5.169 0 0 1 58 6.839 5.011 5.011 0 0 1 53 12h-6.99a4.7 4.7 0 0 0-4.224 2.612l-8.409 16.82c-.6.049-1.216.086-1.858.1A1.537 1.537 0 0 0 30 33.045v5.139l-4.144 8.288A9.955 9.955 0 0 1 16.911 52H7.252A5.169 5.169 0 0 1 2 47.161ZM28.186 50.4A10.089 10.089 0 0 1 19.12 56H4v-2h12.911a11.946 11.946 0 0 0 10.734-6.633l2.512-5.024a20.592 20.592 0 0 0 .568 2.981ZM58 39.889c0 8.044-4.965 14.98-13.042 18.1C36.965 54.869 32 47.933 32 39.889v-6.37a28.449 28.449 0 0 0 13-3.445 28.444 28.444 0 0 0 13 3.445Z"
          fill={color}
        />
        <Path
          d="M44.17 32.74a31.092 31.092 0 0 1-8.442 2.46A2.018 2.018 0 0 0 34 37.174v2.715a17.179 17.179 0 0 0 9.651 15.318 2.924 2.924 0 0 0 2.7 0A17.178 17.178 0 0 0 56 39.889v-2.715a2.018 2.018 0 0 0-1.727-1.974 31.131 31.131 0 0 1-8.443-2.454 1.981 1.981 0 0 0-1.66-.006ZM54 37.174v2.715a15.21 15.21 0 0 1-8.575 13.544.936.936 0 0 1-.85 0A15.217 15.217 0 0 1 36 39.889l.013-2.714A32.979 32.979 0 0 0 45 34.559a33.106 33.106 0 0 0 9 2.615ZM12.057 30.333a1 1 0 0 0 1.276.609l4-1.414a1 1 0 1 0-.666-1.884L15 28.231l9.84-19.679.629 1.781a1 1 0 0 0 1.886-.666l-1.414-4a1 1 0 0 0-1.276-.609l-4 1.414a1 1 0 1 0 .666 1.884L23 7.769l-9.842 19.678-.629-1.78a1 1 0 0 0-1.886.666Z"
          fill={color}
        />
      </G>
    </Svg>
  );
}

function PlayerIcon({
  size = 26,
  color = "#9CA3AF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <G>
        <Path
          d="M112.758 476.305c-10.136-6.906-20.068-15.146-29.645-24.723-47.062-47.062-72.663-88.54-64.822-130.612 6.503-34.892 36.242-45.356 62.48-54.255 33.47-11.352 30.96-45.945 67.848-56.147 36.726-10.158 78.659 9.127 122.52 52.988 84.719 84.719 45.469 175.396-10.589 217.207-33.411 24.92-75.445 29.105-116.664 12.369M187.377 101.49l42.846-74.21c10.194-17.657 32.772-23.707 50.428-13.513 17.667 10.194 23.707 32.773 13.513 50.428l-42.846 74.211c-10.194 17.657-32.772 23.707-50.428 13.512-17.735-10.235-23.663-32.849-13.513-50.428zM361.172 305.992c-10.194-17.657-4.144-40.234 13.513-50.428l74.435-42.975c17.656-10.193 40.232-4.15 50.428 13.512 10.194 17.657 4.144 40.234-13.513 50.428L411.6 319.504c-17.573 10.147-40.19 4.223-50.428-13.512zM369.327 412.161c-1.776-20.31 13.249-38.216 33.56-39.994l51.87-4.538c20.31-1.776 38.217 13.248 39.994 33.559 1.776 20.31-13.249 38.216-33.559 39.994l-51.87 4.538c-20.213 1.769-38.21-13.155-39.995-33.559zM396.837 74.402c9.335.085 18.643 3.689 25.765 10.811 14.417 14.417 14.417 37.791 0 52.208l-77.177 77.177c-14.417 14.417-37.791 14.417-52.208 0-14.417-14.417-14.417-37.791 0-52.208l71.892-71.892M7.5 171.52v-54.725c0-20.389 16.527-36.916 36.916-36.916 20.388-.002 36.918 16.527 36.916 36.916v54.725c0 20.389-16.527 36.916-36.916 36.916-20.386.002-36.918-16.527-36.916-36.916z"
          fill="none"
          stroke={color}
          strokeWidth="25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M153.885 320.717c5.376-5.376 5.376-14.091 0-19.467-5.376-5.376-14.091-5.376-19.467 0M221.424 388.257c5.376-5.376 14.091-5.375 19.467 0 5.376 5.376 5.376 14.091 0 19.467M165.954 355.539c-.37 5.391 1.5 10.907 5.621 15.028s9.637 5.991 15.028 5.621"
          fill="none"
          stroke={color}
          strokeWidth="25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

function GuestIcon({
  size = 26,
  color = "#9CA3AF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const RoleCard = ({
  icon: Icon,
  title,
  description,
  onPress,
  variant, // Kept to not break compatibility right away, but ignored for styling
}: {
  icon: any;
  title: string;
  description: string;
  onPress: () => void;
  variant?: "primary" | "indigo" | "guest" | "default";
}) => {
  return (
    <BouncePress
      onPress={onPress}
      style={{
        width: "100%",
        padding: 24,
        marginBottom: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 12,
            marginRight: 16,
            backgroundColor: "rgba(255, 255, 255, 0.04)",
          }}
        >
          <Icon size={24} color="#E5E7EB" />
        </View>

        <View style={{ flex: 1, paddingRight: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 16,
                color: "#F9FAFB",
                letterSpacing: 0,
              }}
            >
              {title}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </View>
          <Text
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              lineHeight: 20,
              fontFamily: FONTS.body,
            }}
          >
            {description}
          </Text>
        </View>
      </View>
    </BouncePress>
  );
};

export default function RoleSelectScreen() {
  const { t } = useTranslation("auth");
  const langSheetRef = useRef<BottomSheetModal>(null);
  const { guestProfile, loginAsGuest, _hasHydrated, isAuthenticated } =
    useGameStore();
  usePortrait();
  const [showTerms, setShowTerms] = useState(false);

  if (!_hasHydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0D0B14",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedLoader size="lg" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <View style={{ flex: 1, backgroundColor: "#0D0B14" }} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0B14" }}>
      <View style={{ position: "absolute", top: 52, right: 24, zIndex: 10 }}>
        <FlashingGlobeButton
          onPress={() => langSheetRef.current?.present()}
          size={36}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="mt-10"
          style={{ width: "100%", maxWidth: 380, alignItems: "center" }}
        >
          <View style={{ width: "100%" }}>
            <RoleCard
              variant="guest"
              icon={GuestIcon}
              title={
                guestProfile
                  ? t("roleSelect.continueAsGuest", {
                      name: guestProfile.displayName,
                    })
                  : t("roleSelect.guestPlay")
              }
              description={
                guestProfile
                  ? t("roleSelect.guestReturnDesc")
                  : t("roleSelect.guestDesc")
              }
              onPress={() => {
                if (guestProfile) {
                  loginAsGuest();
                  router.replace("/home");
                } else {
                  router.push("/auth/guest-setup");
                }
              }}
            />

            {/* Minimalist Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 16,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              />
              <Text
                style={{
                  color: "#4A3D5A",
                  fontSize: 10,
                  fontFamily: FONTS.bodyExtraBold,
                  letterSpacing: 2,
                  paddingHorizontal: 16,
                }}
              >
                {t("roleSelect.or")}
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              />
            </View>

            <RoleCard
              variant="primary"
              icon={ParentIcon}
              title={t("roleSelect.parent", "Parent")}
              description={t(
                "roleSelect.parentDesc",
                "Manage learning and track progress. Kids can play securely on your device, all features are available.",
              )}
              onPress={() => router.push("/auth/login")}
            />

            <RoleCard
              variant="indigo"
              icon={PlayerIcon}
              title={t("roleSelect.player", "Player")}
              description={t(
                "roleSelect.playerDesc",
                "Ready to play? Join a game and start learning.",
              )}
              onPress={() => router.push("/auth/child-join")}
            />
          </View>

          {/* Legal Footer */}
          <View style={{ marginTop: 32, alignItems: "center" }}>
            <Pressable
              onPress={() => setShowTerms(true)}
              style={{ padding: 8 }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: "#6B7280",
                  fontFamily: FONTS.bodyBold,
                  textAlign: "center",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  lineHeight: 18,
                }}
              >
                {t("roleSelect.legalText")}
                {"\n"}
                <Text
                  style={{ color: "#9CA3AF", textDecorationLine: "underline" }}
                >
                  {t("roleSelect.terms")}
                </Text>{" "}
                &{" "}
                <Text
                  style={{ color: "#9CA3AF", textDecorationLine: "underline" }}
                >
                  {t("roleSelect.privacy")}
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <LanguageSelector ref={langSheetRef} />

      <Modal
        visible={showTerms}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTerms(false)}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: "#0D0B14" }}
          edges={["top"]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#1A1520",
            }}
          >
            <Pressable
              onPress={() => setShowTerms(false)}
              style={{ padding: 8, marginRight: 16 }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontFamily: FONTS.bodyBold,
              }}
            >
              {t("roleSelect.termsTitle")}
            </Text>
          </View>
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}
          >
            <Markdown
              mergeStyle={true}
              style={{
                body: {
                  color: "#E5E7EB",
                  fontFamily: FONTS.body,
                  fontSize: 15,
                  lineHeight: 24,
                },
                heading1: {
                  color: "#FFFFFF",
                  fontFamily: FONTS.bodyExtraBold,
                  fontSize: 24,
                  marginTop: 16,
                  marginBottom: 8,
                },
                heading2: {
                  color: "#FFFFFF",
                  fontFamily: FONTS.bodyBold,
                  fontSize: 20,
                  marginTop: 16,
                  marginBottom: 8,
                },
                heading3: {
                  color: "#ffffff",
                  fontFamily: FONTS.bodyBold,
                  fontSize: 18,
                  marginTop: 12,
                  marginBottom: 6,
                },
                paragraph: { marginBottom: 16 },
                link: { color: "#A78BFA", textDecorationLine: "underline" },
                list_item: { marginBottom: 8 },
                bullet_list: { marginBottom: 16 },
                hr: {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  height: 1,
                  marginVertical: 24,
                },
                strong: { fontFamily: FONTS.bodyBold, color: "#FFFFFF" },
              }}
            >
              {TERMS_AND_CONDITIONS}
            </Markdown>
            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

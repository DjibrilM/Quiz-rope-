import { View, ScrollView, Text, Pressable, Modal } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useRef, useState } from "react";
import Svg, { Path, G, Ellipse, Circle } from "react-native-svg";
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
import { NotificationService } from "../src/services/NotificationService";

function ParentIcon({
  size = 26,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 511.899 511.899">
      <G>
        <Path fill="#f25a3c" d="M482.376 241c-6.094-73.629-59.713-117.788-120.167-117.788-50.288 0-85.723 32.036-106.26 69.038l-15 22.145v174.79l15 24.715 124.969 2.668z" />
        <Path fill="#66ccff" d="M149.689 123.212c-60.271 0-114.055 43.945-120.167 117.788l103.477 170.275 122.95 2.624V192.25c-20.537-37.002-55.986-69.038-106.26-69.038z" />
        <Path fill="#ffdf40" d="M255.949 331c-54.324 0-101.715 33.003-122.95 80.275l9.952 16.377c26.492 22.89 57.074 49.138 85.049 72.922 9.651 8.207 18.717 11.391 27.949 11.323 11.545-.086 23.353-5.372 36.943-13.608 25.909-22.427 58.4-51.482 84.115-74.953l3.911-6.769C360.933 366.517 312.245 331 255.949 331z" />
        <Path fill="#ffbe40" d="M292.893 498.289c25.909-22.427 58.4-51.482 84.115-74.953l3.911-6.769C360.933 366.517 312.245 331 255.949 331v180.897c11.545-.086 23.354-5.372 36.944-13.608z" />
        <Path fill="#ffccb3" d="M420.949 261.068c0 30.498-17.095 57.627-81.489 116.133-12.442 11.309-13.566 31.274-1.23 43.579 10.206 10.206 27.081 10.836 38.778 2.556 74.291-67.8 106.476-110.072 106.476-169.768 0-4.334-.76-8.366-1.108-12.568H435.95c-8.284 0-15 6.716-15 15v5.068z" />
        <Path fill="#ffe6cc" d="M120.949 121c-33.091 0-60-26.909-60-60s26.909-61 60-61 60 27.909 60 61-26.909 60-60 60z" />
        <Path fill="#ffccb3" d="M390.949 121c-33.091 0-60-26.909-60-60s26.909-61 60-61 60 27.909 60 61-26.909 60-60 60z" />
        <Path fill="#ffe6cc" d="M142.951 427.652c10.543 3.32 22.725 1.121 30.718-6.872 12.336-12.305 11.212-32.271-1.23-43.579-64.395-58.506-81.489-85.635-81.489-116.133V256c0-8.284-6.716-15-15-15H29.523c-.348 4.202-1.108 8.234-1.108 12.568 0 65.433 44.374 113.473 114.536 174.084z" />
        <Circle cx="255.949" cy="271" r="60" fill="#ffe6cc" />
        <Path fill="#ffccb3" d="M315.949 271c0-33.091-26.909-60-60-60v120c33.091 0 60-26.909 60-60z" />
      </G>
    </Svg>
  );
}

function PlayerIcon({
  size = 26,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <G>
        <Path fill="#00ce8e" d="M260.687 487.547c-51.851 38.674-123.859 28.872-182.792-30.062-48.482-48.482-74.856-91.212-66.778-134.554 6.7-35.945 37.336-46.725 64.366-55.893 34.48-11.695 31.895-47.331 69.896-57.842 37.835-10.465 81.033 9.402 126.218 54.587 87.275 87.277 46.84 180.69-10.91 223.764z" />
        <Path fill="#00c172" d="M260.687 487.547a158.292 158.292 0 0 0 13.853-11.645c-163.602 4.818-162.343-188.216-122.17-268.281a75.12 75.12 0 0 0-6.992 1.575c-38.001 10.511-35.416 46.147-69.896 57.842-27.03 9.168-57.666 19.948-64.365 55.893-8.079 43.342 18.296 86.072 66.778 134.554 58.934 58.934 130.941 68.736 182.792 30.062z" />
        <Path fill="#ffbbd5" d="m185.306 96.826 44.139-76.45c10.502-18.19 33.761-24.422 51.95-13.92 18.2 10.502 24.422 33.763 13.92 51.95l-44.139 76.45c-10.502 18.19-33.761 24.422-51.95 13.92-18.269-10.543-24.376-33.84-13.92-51.95z" />
        <Path fill="#827cd1" d="M364.347 307.5c-10.502-18.19-4.269-41.448 13.92-51.95l76.681-44.272c18.189-10.501 41.446-4.275 51.95 13.92 10.502 18.19 4.269 41.448-13.92 51.95l-76.681 44.272c-18.105 10.454-41.404 4.351-51.95-13.92z" />
        <Path fill="#625ac4" d="m432.036 224.506-53.769 31.044c-18.189 10.502-24.422 33.761-13.92 51.95 10.547 18.27 33.846 24.374 51.95 13.92l41.515-23.969c-32.768-11.661-30.565-53.302-25.776-72.945z" />
        <Path fill="#ffb25a" d="M372.747 416.875c-1.83-20.923 13.649-39.369 34.572-41.201l53.435-4.675c20.923-1.83 39.37 13.648 41.201 34.572 1.829 20.923-13.649 39.369-34.572 41.201l-53.436 4.675c-20.821 1.821-39.361-13.553-41.2-34.572z" />
        <Path fill="#ff6e80" d="M294.34 213.348c-14.852-14.852-14.852-38.932 0-53.784l79.507-79.507c14.852-14.852 38.932-14.852 53.783 0 14.852 14.852 14.852 38.932 0 53.784l-79.507 79.507c-14.851 14.852-38.932 14.852-53.783 0z" />
        <Path fill="#59d5ff" d="M0 168.97v-56.376c0-21.004 17.026-38.03 38.03-38.03 21.004-.002 38.032 17.026 38.03 38.03v56.376c0 21.004-17.026 38.03-38.03 38.03-21.001.002-38.032-17.025-38.03-38.03z" />
        <Ellipse cx="110.243" cy="318.621" rx="23.725" ry="29.792" transform="rotate(-45 110.192 318.665)" fill="#ffffff" />
        <Ellipse cx="224.43" cy="432.808" rx="23.725" ry="29.792" transform="rotate(-45 224.368 432.883)" fill="#ffffff" />
        <Path fill="#425460" d="M150.803 330.171a7.5 7.5 0 0 1-5.304-12.803 6.632 6.632 0 0 0 1.957-4.724 6.634 6.634 0 0 0-1.957-4.724 6.63 6.63 0 0 0-4.723-1.957 6.634 6.634 0 0 0-4.724 1.957 7.5 7.5 0 0 1-10.607-10.607c4.096-4.095 9.54-6.35 15.331-6.35s11.235 2.255 15.33 6.351c4.095 4.095 6.35 9.539 6.35 15.33s-2.255 11.235-6.35 15.331a7.481 7.481 0 0 1-5.303 2.196zM240.436 419.803a7.474 7.474 0 0 1-5.303-2.196 7.498 7.498 0 0 1-.001-10.606 6.689 6.689 0 0 0-.001-9.448c-1.262-1.263-2.939-1.957-4.723-1.957s-3.462.694-4.724 1.957a7.5 7.5 0 0 1-10.607-10.607c4.096-4.095 9.54-6.35 15.331-6.35s11.235 2.255 15.33 6.351c8.452 8.452 8.453 22.207.001 30.66a7.481 7.481 0 0 1-5.303 2.196zM183.136 387.362a27.445 27.445 0 0 1-19.413-8.034 27.449 27.449 0 0 1-7.969-21.3 7.493 7.493 0 0 1 7.997-6.968 7.5 7.5 0 0 1 6.968 7.997 12.449 12.449 0 0 0 3.611 9.663 12.472 12.472 0 0 0 9.666 3.612c4.104-.27 7.712 2.837 7.995 6.97a7.5 7.5 0 0 1-6.97 7.995c-.629.044-1.258.065-1.885.065z" />
        <Path fill="#ff96c0" d="m227.885 23.078-42.579 73.748c-10.457 18.11-4.349 41.406 13.92 51.95 18.19 10.502 41.448 4.269 51.95-13.92l19.357-33.527c-36.513-10.438-49.966-51.371-42.648-78.251z" />
        <Path fill="#00c4fc" d="M38.03 207c21.004 0 38.03-17.026 38.03-38.03v-21.099c-48.18.691-66.302-39.184-65.555-61.504C4.001 93.191 0 102.422 0 112.594v56.376c-.002 21.005 17.029 38.032 38.03 38.03z" />
        <Path fill="#f8475e" d="m356.25 97.655-61.91 61.91c-14.852 14.852-14.852 38.932 0 53.784s38.932 14.852 53.783 0l36.769-36.769c-32.108-8.887-37.423-53.568-28.642-78.925z" />
        <Path fill="#ff8b43" d="M453.657 447.973c-36.913-20.288-29.622-58.577-20.806-74.533l-25.531 2.233c-20.923 1.831-36.402 20.277-34.572 41.201 1.839 21.019 20.379 36.394 41.201 34.572z" />
      </G>
    </Svg>
  );
}

function GuestIcon({
  size = 26,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 511.999 511.999">
      <G>
        <Path fill="#fed843" d="M511.255 196.904c-1.758-5.42-6.46-9.36-12.1-10.181L340.374 163.74 269.637 20.699c-2.551-5.189-8.108-7.705-13.638-7.643-5.398.062-10.768 2.578-13.257 7.643L172.005 163.74 12.846 186.723a15.004 15.004 0 0 0-12.114 10.21 15.002 15.002 0 0 0 3.794 15.366l115.463 111.562-27.027 157.53a14.99 14.99 0 0 0 5.962 14.663c4.629 3.384 10.781 3.838 15.791 1.143l141.284-74.255 141.665 74.255a14.955 14.955 0 0 0 15.791-1.143 14.99 14.99 0 0 0 5.962-14.663l-27.012-157.529 115.1-111.592a14.984 14.984 0 0 0 3.75-15.366z" />
        <Path fill="#fabe2c" d="M397.664 497.197a14.955 14.955 0 0 0 15.791-1.143 14.99 14.99 0 0 0 5.962-14.663l-27.012-157.529 115.1-111.592a14.986 14.986 0 0 0 3.75-15.366c-1.758-5.42-6.46-9.36-12.1-10.181L340.374 163.74 269.637 20.699c-2.551-5.189-8.108-7.705-13.638-7.643v409.886z" />
        <Path fill="#392e6e" d="M345.999 222.055c-27.755 0-51.76 15.33-64.73 37.8-7.211-4.913-15.906-7.8-25.27-7.8s-18.06 2.888-25.27 7.8c-12.969-22.471-36.974-37.8-64.73-37.8-41.353 0-75 33.647-75 75s33.647 75 75 75 75-33.647 75-75c0-8.276 6.724-15 15-15s15 6.724 15 15c0 41.353 33.647 75 75 75s75-33.647 75-75-33.647-75-75-75z" />
        <Path fill="#2b2256" d="M270.999 297.055c0 41.353 33.647 75 75 75s75-33.647 75-75-33.647-75-75-75c-27.755 0-51.76 15.33-64.73 37.8-7.211-4.913-15.906-7.8-25.27-7.8v30c8.277 0 15 6.724 15 15z" />
        <Path fill="#54469d" d="m171.452 252.606-37.8 75.599c6.989 7.255 16.392 12.01 26.895 13.299l37.8-75.599c-6.989-7.254-16.392-12.01-26.895-13.299z" />
        <Path fill="#392e6e" d="m351.452 252.606-37.8 75.599c6.989 7.255 16.392 12.01 26.895 13.299l37.8-75.599c-6.989-7.254-16.392-12.01-26.895-13.299z" />
      </G>
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
          paddingHorizontal: 12,
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
                  NotificationService.sendSignInNotification(guestProfile.displayName);
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

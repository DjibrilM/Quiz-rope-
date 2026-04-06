import {
  View,
  ScrollView,
  Pressable,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useRef, useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePortrait } from "../../src/hooks/useOrientation";
import { useGameStore } from "../../src/stores/gameStore";
import { AnimatedLoader, Button, ScreenHeader } from "../../src/components/common";
import {
  AddChildForm,
  ChildCard,
  EmptyChildrenState,
} from "../../src/components/children";
import { QRCodeDisplay, SessionCodeDisplay } from "../../src/components/device";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { FONTS } from "../../src/constants/theme";
import { apiService } from "../../src/services/api";
import { hapticsService } from "../../src/services/haptics";
import * as LocalAuthentication from "expo-local-authentication";

export default function ChildrenScreen() {
  usePortrait();
  const { t } = useTranslation("children");
  const { setChildren } = useGameStore();
  const queryClient = useQueryClient();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const confirmSheetRef = useRef<BottomSheetModal>(null);
  const selectChildSheetRef = useRef<BottomSheetModal>(null);
  const codeSheetRef = useRef<BottomSheetModal>(null);
  const [removingChild, setRemovingChild] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [codeResult, setCodeResult] = useState<{
    code: string;
    expiresAt: string;
  } | null>(null);
  const [codeForChildName, setCodeForChildName] = useState("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [selectedChildForCode, setSelectedChildForCode] = useState<string | null>(
    null,
  );
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    data: children = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["children"],
    queryFn: () => apiService.getChildren(),
    select: (data) =>
      data.filter(Boolean).map((c: any) => ({ ...c, id: c._id || c.id })),
  });

  useEffect(() => {
    if (children.length > 0) {
      setChildren(children);
    }
  }, [children]);

  const addMutation = useMutation({
    mutationFn: (data: {
      displayName: string;
      grade: string;
      avatarUrl: string;
    }) => apiService.createChild(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      bottomSheetRef.current?.dismiss();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteChild(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      hapticsService.success();
      confirmSheetRef.current?.dismiss();
      setRemovingChild(null);
    },
    onError: () => {
      confirmSheetRef.current?.dismiss();
      setRemovingChild(null);
    },
  });

  const errorMessage =
    (error instanceof Error ? error.message : null) ||
    (addMutation.error instanceof Error ? addMutation.error.message : null) ||
    (deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : null);

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleCloseSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleAdd = (data: {
    displayName: string;
    grade: string;
    avatarUrl: string;
  }) => {
    addMutation.mutate(data);
  };

  const handleRemovePress = useCallback(
    (child: { id: string; displayName: string }) => {
      setRemovingChild(child);
      confirmSheetRef.current?.present();
    },
    [],
  );

  const handleConfirmRemove = async () => {
    if (!removingChild) return;

    // Check if biometric/passcode hardware is available
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("remove.biometricPrompt", "Authenticate to delete profile"),
        fallbackLabel: t("remove.usePasscode", "Use Passcode"),
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return; // User cancelled or failed auth
      }
    }

    deleteMutation.mutate(removingChild.id);
  };

  const handleCancelRemove = useCallback(() => {
    confirmSheetRef.current?.dismiss();
    setRemovingChild(null);
  }, []);

  // Start countdown whenever a new code is generated
  useEffect(() => {
    if (!codeResult) return;
    if (countdownRef.current) clearInterval(countdownRef.current);

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.round((new Date(codeResult.expiresAt).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining === 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [codeResult]);

  const handleSelectChildForCode = useCallback(
    async (child: { id: string; displayName: string }) => {
      setSelectedChildForCode(child.id);
      selectChildSheetRef.current?.dismiss();
      setIsGeneratingCode(true);
      setCodeForChildName(child.displayName);
      try {
        const result = await apiService.generateGuestLinkCode(child.id);
        setCodeResult(result);
        hapticsService.success();
        codeSheetRef.current?.present();
      } catch {
        Alert.alert(t("linkCode.errorTitle"), t("linkCode.errorBody"));
      } finally {
        setIsGeneratingCode(false);
      }
    },
    [t],
  );

  const handleRegenerateCode = useCallback(async () => {
    if (!selectedChildForCode) return;
    setIsGeneratingCode(true);
    try {
      const result =
        await apiService.generateGuestLinkCode(selectedChildForCode);
      setCodeResult(result);
      hapticsService.success();
    } catch {
      Alert.alert(t("linkCode.errorTitle"), t("linkCode.errorBody"));
    } finally {
      setIsGeneratingCode(false);
    }
  }, [selectedChildForCode, t]);

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

  const hasChildren = children.filter((c) => c?.displayName).length > 0;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-game-bg">
      <ScreenHeader
        title={t("title")}
        rightElement={
          <Pressable
            onPress={handleOpenSheet}
            style={{
              backgroundColor: "#6D4C8A",
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
                fontFamily: "Bungee_400Regular",
              }}
            >
              {t("addButton")}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1 px-6 pt-6"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: hasChildren ? 120 : 40,
        }}
      >
        {errorMessage && (
          <View className="bg-red-500/20 rounded-xl px-4 py-3 mb-4">
            <Text
              style={{ color: "#F87171", fontSize: 13, fontFamily: FONTS.body }}
            >
              {errorMessage}
            </Text>
          </View>
        )}
        {isLoading && children.length === 0 ? (
          <View className="flex-1 items-center justify-center pt-20">
            <AnimatedLoader />
          </View>
        ) : children.filter(Boolean).length === 0 ? (
          <EmptyChildrenState />
        ) : (
          <View className="gap-4">
            {children
              .filter((c) => c?.displayName)
              .map((child) => (
                <View key={child.id}>
                  <ChildCard
                    displayName={child.displayName}
                    grade={child.grade}
                    avatarUrl={child.avatarUrl}
                    onPress={() => {
                      router.push({
                        pathname: "/child/stats" as any,
                        params: {
                          childId: child.id,
                          childName: child.displayName,
                          avatarUrl: child.avatarUrl,
                        },
                      });
                    }}
                    onRemove={() =>
                      handleRemovePress({
                        id: child.id,
                        displayName: child.displayName,
                      })
                    }
                  />
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Get Code bottom bar */}
      {hasChildren && (
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
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.05)",
          }}
        >
          <Button
            className="min-w-full"
            onPress={() => selectChildSheetRef.current?.present()}
            loading={isGeneratingCode}
            variant="primary"
            label={t("linkCode.getCode")}
          />
        </View>
      )}

      {/* Add child bottom sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={["90%"]}
        enablePanDownToClose
        enableDynamicSizing={false}
        android_keyboardInputMode="adjustResize"
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <BottomSheetScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                paddingTop: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: "LuckiestGuy_400Regular",
                  fontSize: 22,
                  color: "#FFFFFF",
                }}
              >
                {t("addNewPlayer")}
              </Text>
              <Pressable
                onPress={handleCloseSheet}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#231C2B",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#B8A9C9",
                    fontSize: 16,
                    fontFamily: FONTS.bodyBold,
                  }}
                >
                  {"\u2715"}
                </Text>
              </Pressable>
            </View>

            <AddChildForm onSave={handleAdd} onCancel={handleCloseSheet} />
          </BottomSheetScrollView>
        </KeyboardAvoidingView>
      </BottomSheetModal>

      {/* Remove confirmation bottom sheet */}
      <BottomSheetModal
        ref={confirmSheetRef}
        snapPoints={["32%"]}
        enablePanDownToClose
        enableDynamicSizing={false}
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
          style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 20 }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 18,
              textAlign: "center",
              marginBottom: 8,
              fontFamily: "Bungee_400Regular",
            }}
          >
            {t("remove.title")}
          </Text>
          <Text
            style={{
              color: "#B8A9C9",
              fontSize: 14,
              textAlign: "center",
              marginBottom: 24,
              fontFamily: FONTS.body,
            }}
          >
            {t("remove.message", { name: removingChild?.displayName })}
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={handleCancelRemove}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#3D2E4A",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#B8A9C9",
                  fontSize: 14,
                  fontFamily: FONTS.bodySemiBold,
                }}
              >
                {t("remove.cancel")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirmRemove}
              disabled={deleteMutation.isPending}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: "#EF4444",
                alignItems: "center",
                opacity: deleteMutation.isPending ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontFamily: FONTS.bodySemiBold,
                }}
              >
                {deleteMutation.isPending
                  ? t("remove.removing")
                  : t("remove.confirm")}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Select child bottom sheet */}
      <BottomSheetModal
        ref={selectChildSheetRef}
        enablePanDownToClose
        enableDynamicSizing
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
            className="text-white text-center text-xl mb-5"
            style={{ fontFamily: "LuckiestGuy_400Regular" }}
          >
            {t("linkCode.selectChild")}
          </Text>
          <View className="gap-3">
            {children
              .filter((c) => c?.displayName)
              .map((child) => (
                <ChildCard
                  key={child.id}
                  displayName={child.displayName}
                  grade={child.grade}
                  avatarUrl={child.avatarUrl}
                  onPress={() =>
                    handleSelectChildForCode({
                      id: child.id,
                      displayName: child.displayName,
                    })
                  }
                />
              ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Code display bottom sheet */}
      <BottomSheetModal
        ref={codeSheetRef}
        enablePanDownToClose
        enableDynamicSizing
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
            className="text-white text-center text-xl mb-1"
            style={{ fontFamily: "LuckiestGuy_400Regular" }}
          >
            {t("linkCode.title", { name: codeForChildName })}
          </Text>
          {codeResult && (
            <View className="items-center">
              <Text
                className="text-center mb-5 font-body text-sm"
                style={{
                  color: secondsLeft < 60 ? "#EF4444" : "#7B6B8A",
                }}
              >
                {secondsLeft <= 0
                  ? t("linkCode.expired")
                  : secondsLeft < 60
                    ? t("linkCode.expiresSeconds", { seconds: secondsLeft })
                    : t("linkCode.expiresMinutes", {
                        minutes: Math.floor(secondsLeft / 60),
                        seconds: secondsLeft % 60,
                      })}
              </Text>
              {secondsLeft <= 0 ? (
                <Button
                  label={t("linkCode.generateNew")}
                  onPress={handleRegenerateCode}
                  loading={isGeneratingCode}
                  style={{ marginTop: 20, width: "100%" }}
                />
              ) : (
                <QRCodeDisplay
                  sessionToken={codeResult.code}
                  status={secondsLeft <= 0 ? "expired" : "waiting"}
                />
              )}
              {secondsLeft > 0 && <SessionCodeDisplay code={codeResult.code} />}
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

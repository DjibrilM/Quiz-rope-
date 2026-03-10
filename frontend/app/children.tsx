import {
  View,
  ScrollView,
  Pressable,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useRef, useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePortrait } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { AnimatedLoader, ScreenHeader } from "../src/components/common";
import {
  AddChildForm,
  ChildCard,
  EmptyChildrenState,
} from "../src/components/children";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { FONTS } from "../src/constants/theme";
import { apiService } from "../src/services/api";
import { hapticsService } from "../src/services/haptics";
import { Alert } from "react-native";

export default function ChildrenScreen() {
  usePortrait();
  const { t } = useTranslation("children");
  const { setChildren } = useGameStore();
  const queryClient = useQueryClient();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const confirmSheetRef = useRef<BottomSheetModal>(null);
  const [removingChild, setRemovingChild] = useState<{
    id: string;
    displayName: string;
  } | null>(null);

  const { data: children = [], isLoading, isError, error } = useQuery({
    queryKey: ["children"],
    queryFn: () => apiService.getChildren(),
    select: (data) =>
      data.filter(Boolean).map((c: any) => ({ ...c, id: c._id || c.id })),
  });

  // Keep zustand store in sync so other screens (leaderboard) can use it
  useEffect(() => {
    if (children.length > 0) setChildren(children);
  }, [children]);

  const addMutation = useMutation({
    mutationFn: (data: { displayName: string; age: number; grade: string; avatarUrl: string }) =>
      apiService.createChild(data),
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
    (deleteMutation.error instanceof Error ? deleteMutation.error.message : null);

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleCloseSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleAdd = (data: {
    displayName: string;
    age: number;
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

  const handleConfirmRemove = () => {
    if (!removingChild) return;
    deleteMutation.mutate(removingChild.id);
  };

  const handleCancelRemove = useCallback(() => {
    confirmSheetRef.current?.dismiss();
    setRemovingChild(null);
  }, []);

  const handleGenerateLinkCode = useCallback(async (childId: string, childName: string) => {
    try {
      const result = await apiService.generateGuestLinkCode(childId);
      const expiresIn = Math.round(
        (new Date(result.expiresAt).getTime() - Date.now()) / 60000,
      );
      Alert.alert(
        t("linkCode.title", { name: childName }),
        t("linkCode.body", { code: result.code, minutes: expiresIn }),
        [{ text: t("linkCode.ok"), style: "default" }],
      );
    } catch {
      Alert.alert(t("linkCode.errorTitle"), t("linkCode.errorBody"));
    }
  }, [t]);

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
        className="flex-1 px-6"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40 }}
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
                  age={child.age}
                  grade={child.grade}
                  avatarUrl={child.avatarUrl}
                  onPress={() =>
                    router.push({
                      pathname: "/child-stats" as any,
                      params: {
                        childId: child.id,
                        childName: child.displayName,
                        avatarUrl: child.avatarUrl,
                      },
                    })
                  }
                  onRemove={() =>
                    handleRemovePress({
                      id: child.id,
                      displayName: child.displayName,
                    })
                  }
                />
                <Pressable
                  onPress={() =>
                    handleGenerateLinkCode(child.id, child.displayName)
                  }
                  style={{
                    marginTop: 8,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#5B3F8A",
                    alignItems: "center",
                    backgroundColor: "#231C2B",
                  }}
                >
                  <Text
                    style={{
                      color: "#B8A9C9",
                      fontSize: 13,
                      fontFamily: FONTS.bodySemiBold,
                    }}
                  >
                    {t("linkCode.getCode")}
                  </Text>
                </Pressable>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

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
                {deleteMutation.isPending ? t("remove.removing") : t("remove.confirm")}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

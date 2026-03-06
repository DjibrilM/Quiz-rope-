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
import { usePortrait } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { ScreenHeader, AnimatedLoader } from "../src/components/common";
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

export default function ChildrenScreen() {
  usePortrait();
  const { t } = useTranslation("children");
  const { children, setChildren } = useGameStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const confirmSheetRef = useRef<BottomSheetModal>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingChild, setRemovingChild] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getChildren();
        if (!cancelled && Array.isArray(data)) {
          setChildren(
            data.filter(Boolean).map((c: any) => ({ ...c, id: c._id || c.id })),
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load children");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleCloseSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleAdd = async (data: {
    displayName: string;
    age: number;
    grade: string;
    avatarUrl: string;
  }) => {
    try {
      const created = await apiService.createChild(data);
      const newChild = { ...created, id: created._id || (created as any).id };
      setChildren([...children, newChild]);
      handleCloseSheet();
    } catch (err: any) {
      setError(err.message || "Failed to add child");
    }
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
    setRemoveLoading(true);
    try {
      await apiService.deleteChild(removingChild.id);
      setChildren(children.filter((c) => c.id !== removingChild.id));
      hapticsService.success();
      confirmSheetRef.current?.dismiss();
    } catch (err: any) {
      setError(err.message || "Failed to remove child");
      confirmSheetRef.current?.dismiss();
    } finally {
      setRemoveLoading(false);
      setRemovingChild(null);
    }
  };

  const handleCancelRemove = useCallback(() => {
    confirmSheetRef.current?.dismiss();
    setRemovingChild(null);
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

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ScreenHeader
        title={t("title")}
        rightElement={
          <Pressable
            onPress={handleOpenSheet}
            className="bg-game-indigo w-[90px] px-4 py-2 rounded-xl"
          >
            <Text
              className="text-white text-center flex-row text-xs min-w-max"
              style={{ fontFamily: "Bungee_400Regular" }}
            >
              {t("addButton")}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1 pt-5 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {error && (
          <View className="bg-red-500/20 rounded-xl px-4 py-3 mb-4">
            <Text
              style={{ color: "#F87171", fontSize: 13, fontFamily: FONTS.body }}
            >
              {error}
            </Text>
          </View>
        )}
        {loading && children.length === 0 ? (
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
                <ChildCard
                  key={child.id}
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
              disabled={removeLoading}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: "#EF4444",
                alignItems: "center",
                opacity: removeLoading ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontFamily: FONTS.bodySemiBold,
                }}
              >
                {removeLoading ? t("remove.removing") : t("remove.confirm")}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

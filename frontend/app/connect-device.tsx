import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { hapticsService } from "../src/services/haptics";
import {
  BackButton,
  AnimatedLoader,
} from "../src/components/common";
import { QRCodeDisplay, SessionCodeDisplay } from "../src/components/device";
import {
  ChildCard,
  AddChildForm,
  EmptyChildrenState,
} from "../src/components/children";

type Status =
  | "loading"
  | "select-child"
  | "adding-child"
  | "authorizing"
  | "showing-code"
  | "error";

interface ChildProfile {
  id: string;
  _id?: string;
  displayName: string;
  grade: string;
}

export default function ConnectDeviceScreen() {
  const { t } = useTranslation(["device", "common"]);
  usePortrait();
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildName, setSelectedChildName] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const initialize = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const [sessionResult, childrenResult] = await Promise.all([
        apiService.createQRSession(),
        apiService.getChildren(),
      ]);
      if (!mountedRef.current) return;
      setSessionToken(sessionResult.sessionToken);
      setChildren(childrenResult);
      setStatus("select-child");
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err.message || "Failed to set up session");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSelectChild = useCallback(
    async (child: ChildProfile) => {
      setStatus("authorizing");
      setSelectedChildName(child.displayName);
      try {
        await apiService.authorizeChildSession(
          sessionToken,
          child._id || child.id,
        );
        hapticsService.success();
        setStatus("showing-code");
      } catch (err: any) {
        setError(err.message || "Failed to authorize session");
        setStatus("error");
      }
    },
    [sessionToken],
  );

  const handleAddChild = useCallback(
    async (data: { displayName: string; grade: string }) => {
      setStatus("authorizing");
      setSelectedChildName(data.displayName);
      try {
        const newChild = await apiService.createChild(data);
        await apiService.authorizeChildSession(sessionToken, newChild._id);
        hapticsService.success();
        setStatus("showing-code");
      } catch (err: any) {
        setError(err.message || "Failed to create child or authorize session");
        setStatus("error");
      }
    },
    [sessionToken],
  );

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <BackButton />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="items-center justify-center px-8 py-20"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center w-full max-w-lg">

            {/* --- LOADING --- */}
            {status === "loading" && (
              <>
                <Text
                  className="text-3xl text-white mb-6"
                  style={{ fontFamily: "LuckiestGuy_400Regular" }}
                >
                  {t("device:connectDevice.loadingTitle")}
                </Text>
                <AnimatedLoader
                  size="lg"
                  message={t("device:connectDevice.loadingMessage")}
                />
              </>
            )}

            {/* --- SELECT CHILD --- */}
            {status === "select-child" && (
              <>
                <Text
                  className="text-3xl text-white mb-2"
                  style={{ fontFamily: "LuckiestGuy_400Regular" }}
                >
                  {t("device:connectDevice.selectChildTitle")}
                </Text>
                <Text className="text-xl text-slate-400 mb-6">
                  {t("device:connectDevice.selectChildInstruction")}
                </Text>

                {children.length === 0 ? (
                  <EmptyChildrenState />
                ) : (
                  <View className="w-full gap-3 mb-4">
                    {children
                      .filter((c) => c?.displayName)
                      .map((child) => (
                        <Pressable
                          key={child._id || child.id}
                          onPress={() => handleSelectChild(child)}
                          className="active:opacity-80"
                        >
                          <ChildCard
                            displayName={child.displayName}
                            grade={child.grade}
                          />
                        </Pressable>
                      ))}
                  </View>
                )}

                <Pressable
                  onPress={() => setStatus("adding-child")}
                  className="bg-game-purple w-full py-4 rounded-2xl items-center active:bg-violet-700"
                >
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: "Bungee_400Regular" }}
                  >
                    {t("device:connectDevice.addNewChild")}
                  </Text>
                </Pressable>
              </>
            )}

            {/* --- ADDING CHILD --- */}
            {status === "adding-child" && (
              <>
                <Text
                  className="text-3xl text-white mb-6"
                  style={{ fontFamily: "LuckiestGuy_400Regular" }}
                >
                  {t("device:connectDevice.newPlayerTitle")}
                </Text>
                <View className="w-full">
                  <AddChildForm
                    onSave={handleAddChild}
                    onCancel={() => setStatus("select-child")}
                  />
                </View>
              </>
            )}

            {/* --- AUTHORIZING --- */}
            {status === "authorizing" && (
              <>
                <Text
                  className="text-3xl text-white mb-6"
                  style={{ fontFamily: "LuckiestGuy_400Regular" }}
                >
                  {t("device:connectDevice.linkingTitle")}
                </Text>
                <AnimatedLoader size="lg" />
                <Text className="text-slate-400 text-lg mt-4">
                  {t("device:connectDevice.settingUpSession", {
                    name: selectedChildName,
                  })}
                </Text>
              </>
            )}

            {/* --- SHOWING CODE --- */}
            {status === "showing-code" && (
              <>
                <Text
                  className="text-3xl text-white mb-2"
                  style={{ fontFamily: "LuckiestGuy_400Regular" }}
                >
                  {t("device:connectDevice.showCodeTitle")}
                </Text>
                <Text className="text-base text-slate-400 mb-6 text-center">
                  {t("device:connectDevice.showCodeInstruction", {
                    name: selectedChildName,
                  })}
                </Text>

                <QRCodeDisplay sessionToken={sessionToken} status="waiting" />
                <SessionCodeDisplay code={sessionToken} />
              </>
            )}

            {/* --- ERROR --- */}
            {status === "error" && (
              <>
                <Text
                  className="text-3xl text-white mb-6"
                  style={{ fontFamily: "LuckiestGuy_400Regular" }}
                >
                  {t("device:connectDevice.errorTitle")}
                </Text>
                <Text className="text-red-400 text-base mb-6 text-center">
                  {error}
                </Text>
                <Pressable
                  onPress={initialize}
                  className="bg-game-purple px-8 py-4 rounded-2xl active:bg-violet-700"
                >
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: "Bungee_400Regular" }}
                  >
                    {t("common:buttons.tryAgain")}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

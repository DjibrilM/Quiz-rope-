import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { apiService } from "../src/services/api";
import { hapticsService } from "../src/services/haptics";
import { BackButton, Divider, AnimatedLoader } from "../src/components/common";
import { QRScanner } from "../src/components/device";
import { ChildCard, AddChildForm, EmptyChildrenState } from "../src/components/children";
import { FONTS } from "../src/constants/theme";

type Status =
  | "scanning"
  | "loading-children"
  | "select-child"
  | "adding-child"
  | "authorizing"
  | "success"
  | "error";

interface ChildProfile {
  id: string;
  _id?: string;
  displayName: string;
  age: number;
  grade: string;
}

export default function ConnectDeviceScreen() {
  const { t } = useTranslation(["device", "common"]);
  usePortrait();
  const mountedRef = useRef(true);
  const [scanEnabled, setScanEnabled] = useState(true);
  const [status, setStatus] = useState<Status>("scanning");
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildName, setSelectedChildName] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchChildren = useCallback(async (token: string) => {
    setSessionToken(token);
    setStatus("loading-children");
    setError("");

    try {
      const result = await apiService.getChildren();
      if (!mountedRef.current) return;
      setChildren(result);
      setStatus("select-child");
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err.message || "Failed to load children");
      setStatus("error");
    }
  }, []);

  const handleScan = useCallback(
    async (scannedToken: string) => {
      if (!scanEnabled || status !== "scanning") return;
      setScanEnabled(false);
      fetchChildren(scannedToken.trim());
    },
    [scanEnabled, status, fetchChildren]
  );

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      setScanEnabled(false);
      fetchChildren(manualCode.trim());
    }
  };

  const handleSelectChild = useCallback(
    async (child: ChildProfile) => {
      setStatus("authorizing");
      setSelectedChildName(child.displayName);

      try {
        await apiService.authorizeChildSession(sessionToken, child._id || child.id);
        hapticsService.success();
        setStatus("success");
      } catch (err: any) {
        setError(err.message || "Failed to authorize session");
        setStatus("error");
      }
    },
    [sessionToken]
  );

  const handleAddChild = useCallback(
    async (data: { displayName: string; age: number; grade: string }) => {
      setStatus("authorizing");
      setSelectedChildName(data.displayName);

      try {
        const newChild = await apiService.createChild(data);
        await apiService.authorizeChildSession(sessionToken, newChild._id);
        hapticsService.success();
        setStatus("success");
      } catch (err: any) {
        setError(err.message || "Failed to create child or authorize session");
        setStatus("error");
      }
    },
    [sessionToken]
  );

  const handleRescan = () => {
    setScanEnabled(true);
    setStatus("scanning");
    setError("");
    setManualCode("");
    setSessionToken("");
    setChildren([]);
    setSelectedChildName("");
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <BackButton absolute />

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
          {/* --- SUCCESS --- */}
          {status === "success" && (
            <>
              <Text className="text-3xl text-white mb-6"
                style={{ fontFamily: "LuckiestGuy_400Regular" }}>
                {t("device:connectDevice.successTitle")}
              </Text>
              <View className="bg-game-success/20 border border-game-success rounded-2xl px-8 py-6 items-center w-full">
                <Text className="text-game-success text-2xl font-bold text-center mb-2">
                  {t("device:connectDevice.successStatus")}
                </Text>
                <Text className="text-slate-400 text-base text-center">
                  {t("device:connectDevice.successMessage", { name: selectedChildName })}
                </Text>
              </View>
            </>
          )}

          {/* --- SCANNING --- */}
          {status === "scanning" && (
            <>
              <Text className="text-3xl text-white mb-2"
                style={{ fontFamily: "LuckiestGuy_400Regular" }}>
                {t("device:connectDevice.scanTitle")}
              </Text>
              <Text className="text-xl text-slate-400 mb-8">
                {t("device:connectDevice.scanInstruction")}
              </Text>

              <View className="w-72 h-72 rounded-3xl overflow-hidden mb-6">
                <QRScanner onScan={handleScan} enabled={scanEnabled} />
              </View>

              <Divider label={t("device:connectDevice.manualEntryDivider")} />

              <View className="flex-row w-full max-w-md">
                <TextInput
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder={t("device:connectDevice.manualCodePlaceholder")}
                  placeholderTextColor="#7B6B8A"
                  className="flex-1 bg-card-bg text-white text-xl px-6 py-4 rounded-l-2xl border border-[#3D2E4A]"
                  autoCapitalize="characters"
                />
                <Pressable
                  onPress={handleManualSubmit}
                  className="bg-game-purple px-8 py-4 rounded-r-2xl items-center justify-center active:bg-violet-700"
                >
                  <Text className="text-white text-base" style={{ fontFamily: "Bungee_400Regular" }}>{t("common:buttons.link")}</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* --- LOADING CHILDREN --- */}
          {status === "loading-children" && (
            <>
              <Text className="text-3xl text-white mb-6"
                style={{ fontFamily: "LuckiestGuy_400Regular" }}>
                {t("device:connectDevice.loadingTitle")}
              </Text>
              <AnimatedLoader size="lg" message={t("device:connectDevice.loadingMessage")} />
            </>
          )}

          {/* --- SELECT CHILD --- */}
          {status === "select-child" && (
            <>
              <Text className="text-3xl text-white mb-2"
                style={{ fontFamily: "LuckiestGuy_400Regular" }}>
                {t("device:connectDevice.selectChildTitle")}
              </Text>
              <Text className="text-xl text-slate-400 mb-6">
                {t("device:connectDevice.selectChildInstruction")}
              </Text>

              {children.length === 0 ? (
                <EmptyChildrenState />
              ) : (
                <View className="w-full gap-3 mb-4">
                  {children.filter((c) => c?.displayName).map((child) => (
                    <Pressable
                      key={child._id || child.id}
                      onPress={() => handleSelectChild(child)}
                      className="active:opacity-80"
                    >
                      <ChildCard
                        displayName={child.displayName}
                        age={child.age}
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
                <Text className="text-white text-base" style={{ fontFamily: "Bungee_400Regular" }}>
                  {t("device:connectDevice.addNewChild")}
                </Text>
              </Pressable>
            </>
          )}

          {/* --- ADDING CHILD --- */}
          {status === "adding-child" && (
            <>
              <Text className="text-3xl text-white mb-6"
                style={{ fontFamily: "LuckiestGuy_400Regular" }}>
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
              <Text className="text-3xl text-white mb-6"
                style={{ fontFamily: "LuckiestGuy_400Regular" }}>
                {t("device:connectDevice.linkingTitle")}
              </Text>
              <AnimatedLoader size="lg" />
              <Text className="text-slate-400 text-lg mt-4">
                {t("device:connectDevice.settingUpSession", { name: selectedChildName })}
              </Text>
            </>
          )}

          {/* --- ERROR --- */}
          {status === "error" && (
            <>
              <Text className="text-3xl text-white mb-6"
                style={{ fontFamily: "LuckiestGuy_400Regular" }}>
                {t("device:connectDevice.errorTitle")}
              </Text>
              <Text className="text-red-400 text-base mb-6 text-center">
                {error}
              </Text>
              <Pressable
                onPress={handleRescan}
                className="bg-game-purple px-8 py-4 rounded-2xl active:bg-violet-700"
              >
                <Text className="text-white text-base" style={{ fontFamily: "Bungee_400Regular" }}>
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

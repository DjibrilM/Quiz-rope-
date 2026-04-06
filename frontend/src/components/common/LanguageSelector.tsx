import React, { forwardRef, useCallback } from "react";
import { View, Text, Pressable, Alert, I18nManager } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { FONTS } from "../../constants/theme";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import type { SupportedLanguage } from "../../i18n";
import { useGameStore } from "../../stores/gameStore";

export const LanguageSelector = forwardRef<BottomSheetModal>((_props, ref) => {
  const { t } = useTranslation("common");
  const { locale, setLocale } = useGameStore();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  const handleSelect = useCallback(
    (lang: SupportedLanguage) => {
      const needsRtlChange =
        SUPPORTED_LANGUAGES[lang].rtl !== I18nManager.isRTL;

      setLocale(lang);

      if (ref && "current" in ref && ref.current) {
        ref.current.dismiss();
      }

      if (needsRtlChange) {
        Alert.alert(
          "",
          "Please restart the app for the layout direction change to take effect.",
          [{ text: t("buttons.ok") }]
        );
      }
    },
    [setLocale, ref, t]
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["60%", "90%"]}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: "#1A1520" }}
      handleIndicatorStyle={{ backgroundColor: "#7B6B8A" }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetScrollView
        style={{ flex: 1, paddingHorizontal: 24 }}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map(
          (lang) => {
            const { label, nativeLabel } = SUPPORTED_LANGUAGES[lang];
            const isSelected = locale === lang;

            return (
              <Pressable
                key={lang}
                onPress={() => handleSelect(lang)}
                className={`flex-row items-center justify-between py-4 px-3 rounded-xl mb-1 ${
                  isSelected ? "bg-purple-500/20" : "active:bg-white/5"
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <Text
                    className="text-white text-lg"
                    style={{ fontFamily: FONTS.bodyBold }}
                  >
                    {nativeLabel}
                  </Text>
                  <Text
                    className="text-gray-400 text-sm"
                    style={{ fontFamily: FONTS.body }}
                  >
                    {label}
                  </Text>
                </View>
                {isSelected && (
                  <Text className="text-purple-400 text-lg">✓</Text>
                )}
              </Pressable>
            );
          }
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

LanguageSelector.displayName = "LanguageSelector";

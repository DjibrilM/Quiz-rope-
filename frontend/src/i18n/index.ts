import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import 'intl-pluralrules';

// English
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enHome from './locales/en/home.json';
import enGame from './locales/en/game.json';
import enMatch from './locales/en/match.json';
import enChildren from './locales/en/children.json';
import enDevice from './locales/en/device.json';
import enSubscription from './locales/en/subscription.json';
import enLeaderboard from './locales/en/leaderboard.json';
import enAnalytics from './locales/en/analytics.json';

// Chinese
import zhCommon from './locales/zh/common.json';
import zhAuth from './locales/zh/auth.json';
import zhHome from './locales/zh/home.json';
import zhGame from './locales/zh/game.json';
import zhMatch from './locales/zh/match.json';
import zhChildren from './locales/zh/children.json';
import zhDevice from './locales/zh/device.json';
import zhSubscription from './locales/zh/subscription.json';
import zhLeaderboard from './locales/zh/leaderboard.json';
import zhAnalytics from './locales/zh/analytics.json';

// Hindi
import hiCommon from './locales/hi/common.json';
import hiAuth from './locales/hi/auth.json';
import hiHome from './locales/hi/home.json';
import hiGame from './locales/hi/game.json';
import hiMatch from './locales/hi/match.json';
import hiChildren from './locales/hi/children.json';
import hiDevice from './locales/hi/device.json';
import hiSubscription from './locales/hi/subscription.json';
import hiLeaderboard from './locales/hi/leaderboard.json';
import hiAnalytics from './locales/hi/analytics.json';

// Spanish
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esHome from './locales/es/home.json';
import esGame from './locales/es/game.json';
import esMatch from './locales/es/match.json';
import esChildren from './locales/es/children.json';
import esDevice from './locales/es/device.json';
import esSubscription from './locales/es/subscription.json';
import esLeaderboard from './locales/es/leaderboard.json';
import esAnalytics from './locales/es/analytics.json';

// French
import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frHome from './locales/fr/home.json';
import frGame from './locales/fr/game.json';
import frMatch from './locales/fr/match.json';
import frChildren from './locales/fr/children.json';
import frDevice from './locales/fr/device.json';
import frSubscription from './locales/fr/subscription.json';
import frLeaderboard from './locales/fr/leaderboard.json';
import frAnalytics from './locales/fr/analytics.json';

// Arabic
import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arHome from './locales/ar/home.json';
import arGame from './locales/ar/game.json';
import arMatch from './locales/ar/match.json';
import arChildren from './locales/ar/children.json';
import arDevice from './locales/ar/device.json';
import arSubscription from './locales/ar/subscription.json';
import arLeaderboard from './locales/ar/leaderboard.json';
import arAnalytics from './locales/ar/analytics.json';

// Bengali
import bnCommon from './locales/bn/common.json';
import bnAuth from './locales/bn/auth.json';
import bnHome from './locales/bn/home.json';
import bnGame from './locales/bn/game.json';
import bnMatch from './locales/bn/match.json';
import bnChildren from './locales/bn/children.json';
import bnDevice from './locales/bn/device.json';
import bnSubscription from './locales/bn/subscription.json';
import bnLeaderboard from './locales/bn/leaderboard.json';
import bnAnalytics from './locales/bn/analytics.json';

// Portuguese
import ptCommon from './locales/pt/common.json';
import ptAuth from './locales/pt/auth.json';
import ptHome from './locales/pt/home.json';
import ptGame from './locales/pt/game.json';
import ptMatch from './locales/pt/match.json';
import ptChildren from './locales/pt/children.json';
import ptDevice from './locales/pt/device.json';
import ptSubscription from './locales/pt/subscription.json';
import ptLeaderboard from './locales/pt/leaderboard.json';
import ptAnalytics from './locales/pt/analytics.json';

// Russian
import ruCommon from './locales/ru/common.json';
import ruAuth from './locales/ru/auth.json';
import ruHome from './locales/ru/home.json';
import ruGame from './locales/ru/game.json';
import ruMatch from './locales/ru/match.json';
import ruChildren from './locales/ru/children.json';
import ruDevice from './locales/ru/device.json';
import ruSubscription from './locales/ru/subscription.json';
import ruLeaderboard from './locales/ru/leaderboard.json';
import ruAnalytics from './locales/ru/analytics.json';

// Japanese
import jaCommon from './locales/ja/common.json';
import jaAuth from './locales/ja/auth.json';
import jaHome from './locales/ja/home.json';
import jaGame from './locales/ja/game.json';
import jaMatch from './locales/ja/match.json';
import jaChildren from './locales/ja/children.json';
import jaDevice from './locales/ja/device.json';
import jaSubscription from './locales/ja/subscription.json';
import jaLeaderboard from './locales/ja/leaderboard.json';
import jaAnalytics from './locales/ja/analytics.json';

export const SUPPORTED_LANGUAGES = {
  en: { label: 'English', nativeLabel: 'English', rtl: false },
  zh: { label: 'Chinese', nativeLabel: '中文', rtl: false },
  hi: { label: 'Hindi', nativeLabel: 'हिन्दी', rtl: false },
  es: { label: 'Spanish', nativeLabel: 'Español', rtl: false },
  fr: { label: 'French', nativeLabel: 'Français', rtl: false },
  ar: { label: 'Arabic', nativeLabel: 'العربية', rtl: true },
  bn: { label: 'Bengali', nativeLabel: 'বাংলা', rtl: false },
  pt: { label: 'Portuguese', nativeLabel: 'Português', rtl: false },
  ru: { label: 'Russian', nativeLabel: 'Русский', rtl: false },
  ja: { label: 'Japanese', nativeLabel: '日本語', rtl: false },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const NAMESPACES = ['common', 'auth', 'home', 'game', 'match', 'children', 'device', 'subscription', 'leaderboard', 'analytics'] as const;

function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    const deviceLang = locales[0]?.languageCode;
    if (deviceLang && deviceLang in SUPPORTED_LANGUAGES) {
      return deviceLang as SupportedLanguage;
    }
  } catch {}
  return 'en';
}

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  ns: NAMESPACES,
  defaultNS: 'common',
  resources: {
    en: { common: enCommon, auth: enAuth, home: enHome, game: enGame, match: enMatch, children: enChildren, device: enDevice, subscription: enSubscription, leaderboard: enLeaderboard, analytics: enAnalytics },
    zh: { common: zhCommon, auth: zhAuth, home: zhHome, game: zhGame, match: zhMatch, children: zhChildren, device: zhDevice, subscription: zhSubscription, leaderboard: zhLeaderboard, analytics: zhAnalytics },
    hi: { common: hiCommon, auth: hiAuth, home: hiHome, game: hiGame, match: hiMatch, children: hiChildren, device: hiDevice, subscription: hiSubscription, leaderboard: hiLeaderboard, analytics: hiAnalytics },
    es: { common: esCommon, auth: esAuth, home: esHome, game: esGame, match: esMatch, children: esChildren, device: esDevice, subscription: esSubscription, leaderboard: esLeaderboard, analytics: esAnalytics },
    fr: { common: frCommon, auth: frAuth, home: frHome, game: frGame, match: frMatch, children: frChildren, device: frDevice, subscription: frSubscription, leaderboard: frLeaderboard, analytics: frAnalytics },
    ar: { common: arCommon, auth: arAuth, home: arHome, game: arGame, match: arMatch, children: arChildren, device: arDevice, subscription: arSubscription, leaderboard: arLeaderboard, analytics: arAnalytics },
    bn: { common: bnCommon, auth: bnAuth, home: bnHome, game: bnGame, match: bnMatch, children: bnChildren, device: bnDevice, subscription: bnSubscription, leaderboard: bnLeaderboard, analytics: bnAnalytics },
    pt: { common: ptCommon, auth: ptAuth, home: ptHome, game: ptGame, match: ptMatch, children: ptChildren, device: ptDevice, subscription: ptSubscription, leaderboard: ptLeaderboard, analytics: ptAnalytics },
    ru: { common: ruCommon, auth: ruAuth, home: ruHome, game: ruGame, match: ruMatch, children: ruChildren, device: ruDevice, subscription: ruSubscription, leaderboard: ruLeaderboard, analytics: ruAnalytics },
    ja: { common: jaCommon, auth: jaAuth, home: jaHome, game: jaGame, match: jaMatch, children: jaChildren, device: jaDevice, subscription: jaSubscription, leaderboard: jaLeaderboard, analytics: jaAnalytics },
  },
  react: {
    useSuspense: false,
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

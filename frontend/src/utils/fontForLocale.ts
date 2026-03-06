import { FONTS } from '../constants/theme';
import i18n from '../i18n';

const LATIN_LOCALES = new Set(['en', 'es', 'fr', 'pt']);
const CYRILLIC_LOCALES = new Set(['ru']);

export function getHeadingFont(): string {
  const lang = i18n.language;
  if (LATIN_LOCALES.has(lang)) {
    return FONTS.heading;
  }
  return 'System';
}

export function getAccentFont(): string {
  const lang = i18n.language;
  if (LATIN_LOCALES.has(lang)) {
    return FONTS.accent;
  }
  return 'System';
}

export function getBodyFont(): string {
  const lang = i18n.language;
  if (LATIN_LOCALES.has(lang) || CYRILLIC_LOCALES.has(lang)) {
    return FONTS.body;
  }
  return 'System';
}

export function getBodySemiBoldFont(): string {
  const lang = i18n.language;
  if (LATIN_LOCALES.has(lang) || CYRILLIC_LOCALES.has(lang)) {
    return FONTS.bodySemiBold;
  }
  return 'System';
}

export function getBodyBoldFont(): string {
  const lang = i18n.language;
  if (LATIN_LOCALES.has(lang) || CYRILLIC_LOCALES.has(lang)) {
    return FONTS.bodyBold;
  }
  return 'System';
}

export function getBodyExtraBoldFont(): string {
  const lang = i18n.language;
  if (LATIN_LOCALES.has(lang) || CYRILLIC_LOCALES.has(lang)) {
    return FONTS.bodyExtraBold;
  }
  return 'System';
}

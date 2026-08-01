import type { LanguageCode } from '../types';

const LOCALES: Record<LanguageCode, string> = {
  en: 'en-GB', fr: 'fr-FR', de: 'de-DE', ar: 'ar', hi: 'hi-IN', zh: 'zh-CN', pt: 'pt-PT',
};

export function activeReaderLocale(): string {
  if (typeof document !== 'undefined' && document.documentElement.lang) {
    return document.documentElement.lang;
  }
  if (typeof localStorage !== 'undefined') {
    return LOCALES[(localStorage.getItem('boa_lang') as LanguageCode) || 'en'] || 'en-GB';
  }
  return 'en-GB';
}

export function formatReaderDate(value: string | number | Date, options: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(activeReaderLocale(), options);
}

export function formatReaderDateTime(value: string | number | Date, options: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(activeReaderLocale(), options);
}

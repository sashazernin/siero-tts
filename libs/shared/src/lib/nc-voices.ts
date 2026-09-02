import type { Voice } from './types';

export const V5_RU_VOICES: Voice[] = [
  {
    id: 'aidar',
    label: 'Aidar',
    language: 'ru',
    languageLabel: 'Русский (классический)',
    gender: 'male',
    modelId: 'v5_ru',
    commercialAllowed: false,
  },
  {
    id: 'baya',
    label: 'Baya',
    language: 'ru',
    languageLabel: 'Русский (классический)',
    gender: 'female',
    modelId: 'v5_ru',
    commercialAllowed: false,
  },
  {
    id: 'eugene',
    label: 'Eugene',
    language: 'ru',
    languageLabel: 'Русский (классический)',
    gender: 'male',
    modelId: 'v5_ru',
    commercialAllowed: false,
  },
  {
    id: 'kseniya',
    label: 'Kseniya',
    language: 'ru',
    languageLabel: 'Русский (классический)',
    gender: 'female',
    modelId: 'v5_ru',
    commercialAllowed: false,
  },
  {
    id: 'xenia',
    label: 'Xenia',
    language: 'ru',
    languageLabel: 'Русский (классический)',
    gender: 'female',
    modelId: 'v5_ru',
    commercialAllowed: false,
  },
];

export const V3_EN_VOICES: Voice[] = [
  ...Array.from({ length: 118 }, (_, index) => ({
    id: `en_${index}`,
    label: `Voice ${index}`,
    language: 'en',
    languageLabel: 'Английский',
    modelId: 'v3_en' as const,
    commercialAllowed: false,
  })),
  {
    id: 'random',
    label: 'Random',
    language: 'en',
    languageLabel: 'Английский',
    modelId: 'v3_en',
    commercialAllowed: false,
  },
];

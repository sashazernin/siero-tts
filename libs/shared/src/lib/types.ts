export type Gender = 'male' | 'female';

export type GenderFilter = 'any' | Gender;

export type LanguageFilter = 'any' | string;

export interface Voice {
  id: string;
  label: string;
  language: string;
  languageLabel: string;
  gender: Gender;
}

export interface LanguageOption {
  code: string;
  label: string;
}

export interface GenerationItem {
  id: string;
  text: string;
  speaker: string;
  speakerLabel: string;
  audioUrl: string;
  createdAt: Date;
}

export interface TtsRequest {
  text: string;
  speaker: string;
  sample_rate?: 8000 | 24000 | 48000;
}

export const MODEL_ID = 'v5_cis_base_nostress';

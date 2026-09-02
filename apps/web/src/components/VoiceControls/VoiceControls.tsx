import React, { useMemo } from 'react';
import { Autocomplete, AutocompleteOption, ToggleGroup } from '@siero-tts/ui';
import type { GenderFilter, LanguageFilter, LanguageOption, Voice } from '@siero-tts/shared';
import { ConvertButton } from '../ConvertButton';
import styles from './VoiceControls.module.css';

const genderOptions = [
  { value: 'any' as GenderFilter, label: 'Любой' },
  { value: 'male' as GenderFilter, label: 'Муж' },
  { value: 'female' as GenderFilter, label: 'Жен' },
];

export interface VoiceControlsProps {
  voices: Voice[];
  languages: LanguageOption[];
  selectedVoice: Voice | null;
  onVoiceChange: (voice: Voice | null) => void;
  languageFilter: LanguageFilter;
  onLanguageFilterChange: (value: LanguageFilter) => void;
  genderFilter: GenderFilter;
  onGenderFilterChange: (value: GenderFilter) => void;
  onConvert: () => void;
  isLoading: boolean;
  isVoicesLoading: boolean;
  canConvert: boolean;
}

export function VoiceControls({
  voices,
  languages,
  selectedVoice,
  onVoiceChange,
  languageFilter,
  onLanguageFilterChange,
  genderFilter,
  onGenderFilterChange,
  onConvert,
  isLoading,
  isVoicesLoading,
  canConvert,
}: VoiceControlsProps) {
  const languageOptions = useMemo<AutocompleteOption[]>(
    () => [
      { value: 'any', label: 'Любой' },
      ...languages.map((language) => ({
        value: language.code,
        label: language.label,
      })),
    ],
    [languages],
  );

  const selectedLanguageOption = useMemo<AutocompleteOption | null>(() => {
    if (languageFilter === 'any') {
      return { value: 'any', label: 'Любой' };
    }

    const language = languages.find((item) => item.code === languageFilter);
    if (!language) {
      return null;
    }

    return { value: language.code, label: language.label };
  }, [languageFilter, languages]);

  const voiceOptions = useMemo<AutocompleteOption[]>(
    () =>
      [...voices]
        .sort((a, b) => {
          const byLanguage = a.languageLabel.localeCompare(b.languageLabel, 'ru');
          if (byLanguage !== 0) {
            return byLanguage;
          }

          return a.label.localeCompare(b.label, 'ru');
        })
        .map((voice) => ({
          value: voice.id,
          label: `${voice.label} (${voice.id})`,
          group: voice.languageLabel,
        })),
    [voices],
  );

  const selectedVoiceOption = useMemo<AutocompleteOption | null>(() => {
    if (!selectedVoice) {
      return null;
    }

    return {
      value: selectedVoice.id,
      label: `${selectedVoice.label} (${selectedVoice.id})`,
      group: selectedVoice.languageLabel,
    };
  }, [selectedVoice]);

  return (
    <div className={styles.controls}>
      <Autocomplete
        label="Язык"
        placeholder="Поиск языка"
        options={languageOptions}
        value={selectedLanguageOption}
        onChange={(option) => {
          onLanguageFilterChange((option?.value ?? 'any') as LanguageFilter);
        }}
      />
      <ToggleGroup options={genderOptions} value={genderFilter} onChange={onGenderFilterChange} />
      <Autocomplete
        label="Голос"
        placeholder={isVoicesLoading ? 'Загрузка голосов...' : voices.length ? 'Поиск голоса' : 'Нет голосов'}
        options={voiceOptions}
        value={selectedVoiceOption}
        groupBy={(option) => option.group ?? ''}
        onChange={(option) => {
          if (!option) {
            onVoiceChange(null);
            return;
          }

          const voice = voices.find((item) => item.id === option.value) ?? null;
          onVoiceChange(voice);
        }}
      />
      <ConvertButton onClick={onConvert} loading={isLoading} disabled={!canConvert || isVoicesLoading} />
    </div>
  );
}

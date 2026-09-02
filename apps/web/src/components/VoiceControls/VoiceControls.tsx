import React, { useCallback, useMemo } from 'react';
import { Autocomplete, AutocompleteOption, ToggleGroup } from '@siero-tts/ui';
import type { GenderFilter, LanguageFilter, LanguageOption, Voice } from '@siero-tts/shared';
import { getGenderLabel, getVoiceKey } from '@siero-tts/shared';
import { ConvertButton } from '../ConvertButton';
import { VoicePreviewButton } from '../VoicePreviewButton';
import { useVoicePreview } from '../../hooks/useVoicePreview';
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
  commercialUseAllowed: boolean;
  onCommercialUseAllowedChange: (value: boolean) => void;
  onConvert: () => void;
  isLoading: boolean;
  isVoicesLoading: boolean;
  canConvert: boolean;
}

function formatVoiceLabel(voice: Voice) {
  const genderLabel = getGenderLabel(voice);
  return genderLabel ? `${voice.label} · ${genderLabel}` : voice.label;
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
  commercialUseAllowed,
  onCommercialUseAllowedChange,
  onConvert,
  isLoading,
  isVoicesLoading,
  canConvert,
}: VoiceControlsProps) {
  const { playPreview, isPlaying, isPreviewLoading } = useVoicePreview();

  const voiceByKey = useMemo(
    () => new Map(voices.map((voice) => [getVoiceKey(voice), voice])),
    [voices],
  );

  const renderVoicePreview = useCallback(
    (option: AutocompleteOption) => {
      const voice = voiceByKey.get(option.value);
      if (!voice) {
        return null;
      }

      return (
        <VoicePreviewButton
          voice={voice}
          isPlaying={isPlaying(voice)}
          isLoading={isPreviewLoading(voice)}
          onPlay={playPreview}
        />
      );
    },
    [isPreviewLoading, isPlaying, playPreview, voiceByKey],
  );

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
          value: getVoiceKey(voice),
          label: voice.label,
          group: voice.languageLabel,
          suffix: getGenderLabel(voice) ?? undefined,
          warning: !voice.commercialAllowed,
        })),
    [voices],
  );

  const selectedVoiceOption = useMemo<AutocompleteOption | null>(() => {
    if (!selectedVoice) {
      return null;
    }

    return {
      value: getVoiceKey(selectedVoice),
      label: formatVoiceLabel(selectedVoice),
      group: selectedVoice.languageLabel,
      suffix: getGenderLabel(selectedVoice) ?? undefined,
      warning: !selectedVoice.commercialAllowed,
    };
  }, [selectedVoice]);

  return (
    <div className={styles.wrapper}>
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={commercialUseAllowed}
          onChange={(event) => onCommercialUseAllowedChange(event.target.checked)}
        />
        <span>Разрешено коммерческое использование</span>
      </label>

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
          renderOptionPrefix={renderVoicePreview}
          onChange={(option) => {
            if (!option) {
              onVoiceChange(null);
              return;
            }

            const voice = voices.find((item) => getVoiceKey(item) === option.value) ?? null;
            onVoiceChange(voice);
          }}
        />
        <ConvertButton onClick={onConvert} loading={isLoading} disabled={!canConvert || isVoicesLoading} />
      </div>
    </div>
  );
}

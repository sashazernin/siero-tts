import React, { useCallback, useMemo } from 'react';
import { Autocomplete, AutocompleteOption, ToggleGroup, Tooltip } from '@siero-tts/ui';
import type { GenderFilter, LanguageFilter, LanguageOption, Voice } from '@siero-tts/shared';
import { SILERO_CIS_LICENSE_URL, SILERO_NC_LICENSE_URL, getGenderLabel, getVoiceKey } from '@siero-tts/shared';
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
      <div className={styles.licenseRow}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={commercialUseAllowed}
            onChange={(event) => onCommercialUseAllowedChange(event.target.checked)}
          />
          <span>Разрешено коммерческое использование</span>
        </label>
        <Tooltip
          content={
            commercialUseAllowed ? (
              <>
                Включено: показываются только модели Silero с лицензией MIT (v5_cis_base_nostress).
                Результат можно использовать в любых целях, в том числе коммерческих.{' '}
                <a href={SILERO_CIS_LICENSE_URL} target="_blank" rel="noreferrer">
                  Лицензия Silero CIS (MIT)
                </a>
              </>
            ) : (
              <>
                Выключено: доступны также модели с лицензией CC BY-NC-SA 4.0 (v3_en, v5_ru).
                Их можно использовать для личных, учебных и некоммерческих целей, но не в коммерции.{' '}
                <a href={SILERO_NC_LICENSE_URL} target="_blank" rel="noreferrer">
                  Лицензия Silero (CC BY-NC-SA 4.0)
                </a>
              </>
            )
          }
        >
          <button type="button" className={styles.infoButton} aria-label="Пояснение по лицензии Silero">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </Tooltip>
      </div>

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

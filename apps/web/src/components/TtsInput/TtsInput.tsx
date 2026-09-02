import React, { useMemo } from 'react';
import { TextField } from '@siero-tts/ui';
import type { Voice } from '@siero-tts/shared';
import styles from './TtsInput.module.css';

export interface TtsInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedVoice?: Voice | null;
}

export function TtsInput({ value, onChange, selectedVoice }: TtsInputProps) {
  const helperText = useMemo(() => {
    if (!selectedVoice) {
      return 'Выберите голос, чтобы увидеть требования к тексту.';
    }

    if (selectedVoice.modelId === 'v3_en') {
      return 'Для английских голосов нужен текст латиницей.';
    }

    if (selectedVoice.modelId === 'v5_ru') {
      return 'Для классических русских голосов нужен текст на кириллице. Ударения расставляются автоматически.';
    }

    const prefix = selectedVoice.id.split('_', 1)[0];
    if (prefix === 'ru' || prefix === 'bel' || prefix === 'ukr') {
      return 'Для голосов ru_, bel_, ukr_ нужен текст на кириллице. Ударения расставляются автоматически, либо вручную знаком +: к+ошка';
    }

    return 'Введите текст на языке выбранного голоса.';
  }, [selectedVoice]);

  return (
    <div className={styles.wrapper}>
      <TextField
        label="Текст для озвучивания"
        multiline
        minRows={6}
        maxRows={16}
        placeholder="Введите текст..."
        value={value}
        onChange={onChange}
        helperText={helperText}
      />
    </div>
  );
}

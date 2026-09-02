import React from 'react';
import { TextField } from '@siero-tts/ui';
import styles from './TtsInput.module.css';

export interface TtsInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TtsInput({ value, onChange }: TtsInputProps) {
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
        helperText="Для голосов ru_, bel_, ukr_ нужен текст на кириллице. Ударения для них расставляются автоматически, либо вручную знаком +: к+ошка"
      />
    </div>
  );
}

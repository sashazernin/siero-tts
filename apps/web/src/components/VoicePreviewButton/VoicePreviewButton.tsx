import React from 'react';
import { IconButton, Spinner } from '@siero-tts/ui';
import type { Voice } from '@siero-tts/shared';
import { getVoiceSamplePhrase } from '@siero-tts/shared';
import styles from './VoicePreviewButton.module.css';

export interface VoicePreviewButtonProps {
  voice: Voice;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: (voice: Voice) => void;
}

export function VoicePreviewButton({ voice, isPlaying, isLoading, onPlay }: VoicePreviewButtonProps) {
  const samplePhrase = getVoiceSamplePhrase(voice);

  return (
    <IconButton
      className={[styles.button, isPlaying ? styles.buttonActive : ''].filter(Boolean).join(' ')}
      aria-label={`Прослушать: ${samplePhrase}`}
      title={samplePhrase}
      disabled={isLoading}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onPlay(voice);
      }}
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : isPlaying ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.02-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
        </svg>
      )}
    </IconButton>
  );
}

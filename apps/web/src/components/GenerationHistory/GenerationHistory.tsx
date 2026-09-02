import React from 'react';
import { Paper } from '@siero-tts/ui';
import type { GenerationItem } from '@siero-tts/shared';
import styles from './GenerationHistory.module.css';

export interface GenerationHistoryProps {
  items: GenerationItem[];
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function GenerationHistory({ items }: GenerationHistoryProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>История генераций</h2>
      {items.length === 0 ? (
        <Paper className={styles.empty}>Сгенерированные аудиофайлы появятся здесь</Paper>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <Paper key={item.id} className={styles.item} elevation={2}>
              <div className={styles.meta}>
                <span>{item.speaker}</span>
                <span>·</span>
                <span>{item.speakerLabel}</span>
                <span>·</span>
                <span>{formatTime(item.createdAt)}</span>
              </div>
              <p className={styles.textPreview}>{item.text}</p>
              <div className={styles.footer}>
                <audio className={styles.audio} controls src={item.audioUrl} preload="metadata" />
              </div>
            </Paper>
          ))}
        </div>
      )}
    </section>
  );
}

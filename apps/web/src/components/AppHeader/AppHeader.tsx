import React from 'react';
import { AppLogo } from '../AppLogo';
import styles from './AppHeader.module.css';

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <AppLogo size={52} />
        <div className={styles.titles}>
          <h1 className={styles.title}>siero-tts</h1>
          <p className={styles.subtitle}>Silero TTS — CIS, English v3, Russian classic</p>
        </div>
      </div>
    </header>
  );
}

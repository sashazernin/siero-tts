import React from 'react';
import styles from './AppHeader.module.css';

export function AppHeader() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>siero-tts</h1>
      <p className={styles.subtitle}>Silero v5_cis_base_nostress — синтез речи</p>
    </header>
  );
}

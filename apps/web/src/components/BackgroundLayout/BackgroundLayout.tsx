import React from 'react';
import styles from './BackgroundLayout.module.css';

export interface BackgroundLayoutProps {
  children: React.ReactNode;
}

export function BackgroundLayout({ children }: BackgroundLayoutProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.background} aria-hidden="true" />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

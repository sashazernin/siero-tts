import React from 'react';
import { SILERO_NC_LICENSE_URL } from '@siero-tts/shared';
import styles from './LicenseWarningBanner.module.css';

export function LicenseWarningBanner() {
  return (
    <div className={styles.banner} role="status">
      <span className={styles.icon} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className={styles.text}>
        Выбран голос из модели с лицензией CC BY-NC-SA 4.0. Результат генерации можно использовать
        только в некоммерческих целях (личное, учебное, некоммерческий open source). Коммерческое
        использование запрещено без отдельного разрешения Silero.{' '}
        <a className={styles.link} href={SILERO_NC_LICENSE_URL} target="_blank" rel="noreferrer">
          Лицензия Silero
        </a>
      </p>
    </div>
  );
}

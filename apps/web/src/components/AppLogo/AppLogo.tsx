import React from 'react';
import styles from './AppLogo.module.css';

export interface AppLogoProps {
  size?: number;
  className?: string;
}

export function AppLogo({ size = 48, className = '' }: AppLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt=""
      width={size}
      height={size}
      className={[styles.logo, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  );
}

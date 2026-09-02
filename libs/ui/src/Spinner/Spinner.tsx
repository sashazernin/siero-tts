import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return <span className={[styles.spinner, styles[size], className].filter(Boolean).join(' ')} aria-hidden="true" />;
}

import React from 'react';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  return (
    <span className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {children}
      <span className={styles.tooltip} role="tooltip">
        {content}
      </span>
    </span>
  );
}

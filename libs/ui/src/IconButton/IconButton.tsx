import React from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function IconButton({ className = '', children, ...props }: IconButtonProps) {
  return (
    <button type="button" className={[styles.button, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </button>
  );
}

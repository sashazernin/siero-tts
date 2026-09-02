import React, { useEffect, useRef } from 'react';
import styles from './TextField.module.css';

export interface TextFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  multiline?: boolean;
  minRows?: number;
  maxRows?: number;
  onChange?: (value: string) => void;
}

export function TextField({
  label,
  error,
  helperText,
  multiline = false,
  minRows = 3,
  maxRows = 12,
  className = '',
  value = '',
  onChange,
  ...props
}: TextFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!multiline || !textareaRef.current) {
      return;
    }

    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    const lineHeight = 24;
    const minHeight = minRows * lineHeight;
    const maxHeight = maxRows * lineHeight;
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${nextHeight}px`;
  }, [value, multiline, minRows, maxRows]);

  const fieldClassName = [styles.field, error ? styles.error : '', className].filter(Boolean).join(' ');

  return (
    <label className={styles.wrapper}>
      {label ? <span className={styles.label}>{label}</span> : null}
      {multiline ? (
        <textarea
          ref={textareaRef}
          className={fieldClassName}
          rows={minRows}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          {...props}
        />
      ) : (
        <input
          className={fieldClassName}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error || helperText ? (
        <span className={[styles.helper, error ? styles.helperError : ''].filter(Boolean).join(' ')}>
          {error || helperText}
        </span>
      ) : null}
    </label>
  );
}

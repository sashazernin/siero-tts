import React from 'react';
import styles from './ToggleGroup.module.css';

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

export interface ToggleGroupProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: ToggleGroupProps<T>) {
  return (
    <div className={[styles.group, className].filter(Boolean).join(' ')} role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={[styles.option, value === option.value ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

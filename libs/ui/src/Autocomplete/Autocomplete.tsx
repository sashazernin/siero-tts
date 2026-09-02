import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './Autocomplete.module.css';

export interface AutocompleteOption {
  value: string;
  label: string;
  group?: string;
}

export interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  options: AutocompleteOption[];
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
  groupBy?: (option: AutocompleteOption) => string;
  filterOptions?: (options: AutocompleteOption[], query: string) => AutocompleteOption[];
  className?: string;
}

function defaultFilter(options: AutocompleteOption[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options;
  }

  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(normalized) ||
      option.value.toLowerCase().includes(normalized) ||
      option.group?.toLowerCase().includes(normalized),
  );
}

export function Autocomplete({
  label,
  placeholder,
  options,
  value,
  onChange,
  groupBy,
  filterOptions = defaultFilter,
  className = '',
}: AutocompleteProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value?.label ?? '');

  useEffect(() => {
    if (!open) {
      setQuery(value?.label ?? '');
    }
  }, [value, open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(value?.label ?? '');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filteredOptions = useMemo(() => filterOptions(options, query), [filterOptions, options, query]);

  const groupedOptions = useMemo(() => {
    if (!groupBy) {
      return [{ group: '', items: filteredOptions }];
    }

    const groups = new Map<string, AutocompleteOption[]>();

    filteredOptions.forEach((option) => {
      const group = groupBy(option);
      const current = groups.get(group) ?? [];
      current.push(option);
      groups.set(group, current);
    });

    return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
  }, [filteredOptions, groupBy]);

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} ref={wrapperRef}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <div className={styles.control}>
        <input
          className={styles.input}
          placeholder={placeholder}
          value={query}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (!event.target.value) {
              onChange(null);
            }
          }}
        />
        <span className={styles.icon} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        {open ? (
          <div className={styles.dropdown}>
            {groupedOptions.every((group) => group.items.length === 0) ? (
              <div className={styles.empty}>Ничего не найдено</div>
            ) : (
              groupedOptions.map((group) => (
                <div key={group.group || 'default'}>
                  {group.group ? <div className={styles.groupLabel}>{group.group}</div> : null}
                  {group.items.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={[
                        styles.option,
                        value?.value === option.value ? styles.optionActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => {
                        onChange(option);
                        setQuery(option.label);
                        setOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

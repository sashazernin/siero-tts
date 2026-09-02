import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './Autocomplete.module.css';

export interface AutocompleteOption {
  value: string;
  label: string;
  group?: string;
  suffix?: string;
  warning?: boolean;
}

export interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  options: AutocompleteOption[];
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
  groupBy?: (option: AutocompleteOption) => string;
  filterOptions?: (options: AutocompleteOption[], query: string) => AutocompleteOption[];
  renderOptionPrefix?: (option: AutocompleteOption) => React.ReactNode;
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
  renderOptionPrefix,
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
                    <div
                      key={option.value}
                      className={[
                        styles.optionRow,
                        value?.value === option.value ? styles.optionRowActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {renderOptionPrefix ? (
                        <div
                          className={styles.optionPrefix}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                        >
                          {renderOptionPrefix(option)}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        className={styles.option}
                        onClick={() => {
                          onChange(option);
                          setQuery(option.label);
                          setOpen(false);
                        }}
                      >
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.suffix || option.warning ? (
                        <span className={styles.optionMeta}>
                          {option.warning ? (
                            <span className={styles.optionWarning} title="Только некоммерческое использование">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                  d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          ) : null}
                          {option.suffix ? (
                            <span className={styles.optionSuffix}>{option.suffix}</span>
                          ) : null}
                        </span>
                      ) : null}
                      </button>
                    </div>
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

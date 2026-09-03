import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchVoices, synthesizeSpeech } from '../api/tts';
import { filterVoices, getLanguageOptions } from '@siero-tts/shared';
import type { GenderFilter, GenerationItem, LanguageFilter, Voice } from '@siero-tts/shared';

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useTtsApp() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('any');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('any');
  const [commercialUseAllowed, setCommercialUseAllowed] = useState(true);
  const [text, setText] = useState('');
  const [history, setHistory] = useState<GenerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoicesLoading, setIsVoicesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVoices() {
      setIsVoicesLoading(true);

      for (let attempt = 1; attempt <= 120; attempt += 1) {
        try {
          const loadedVoices = await fetchVoices();
          if (cancelled) {
            return;
          }

          setVoices(loadedVoices);
          setError(null);
          setIsVoicesLoading(false);
          return;
        } catch (loadError) {
          if (cancelled) {
            return;
          }

          if (attempt === 120) {
            setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить голоса');
            setIsVoicesLoading(false);
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    loadVoices();

    return () => {
      cancelled = true;
    };
  }, []);

  const historyRef = useRef(history);
  historyRef.current = history;

  useEffect(() => {
    return () => {
      historyRef.current.forEach((item) => URL.revokeObjectURL(item.audioUrl));
    };
  }, []);

  const catalogVoices = useMemo(
    () => filterVoices(voices, 'any', 'any', commercialUseAllowed),
    [voices, commercialUseAllowed],
  );

  const filteredVoices = useMemo(
    () => filterVoices(voices, languageFilter, genderFilter, commercialUseAllowed),
    [voices, languageFilter, genderFilter, commercialUseAllowed],
  );

  const languages = useMemo(() => getLanguageOptions(catalogVoices), [catalogVoices]);

  useEffect(() => {
    if (filteredVoices.length === 0) {
      setSelectedVoice(null);
      return;
    }

    const stillVisible = selectedVoice
      ? filteredVoices.some(
          (voice) =>
            voice.id === selectedVoice.id && voice.modelId === selectedVoice.modelId,
        )
      : false;

    if (!stillVisible) {
      setSelectedVoice(filteredVoices[0]);
    }
  }, [filteredVoices, selectedVoice]);

  const generate = useCallback(async () => {
    const trimmedText = text.trim();
    if (!trimmedText || !selectedVoice) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const blob = await synthesizeSpeech({
        text: trimmedText,
        speaker: selectedVoice.id,
        model: selectedVoice.modelId,
        sample_rate: 48000,
      });

      const audioUrl = URL.createObjectURL(blob);
      const item: GenerationItem = {
        id: createId(),
        text: trimmedText,
        speaker: selectedVoice.id,
        speakerLabel: selectedVoice.label,
        audioUrl,
        createdAt: new Date(),
      };

      setHistory((current) => [item, ...current]);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Ошибка генерации');
    } finally {
      setIsLoading(false);
    }
  }, [selectedVoice, text]);

  const clearError = useCallback(() => setError(null), []);

  const showLicenseWarning = Boolean(selectedVoice && !selectedVoice.commercialAllowed);

  return {
    voices,
    filteredVoices,
    languages,
    selectedVoice,
    setSelectedVoice,
    languageFilter,
    setLanguageFilter,
    genderFilter,
    setGenderFilter,
    commercialUseAllowed,
    setCommercialUseAllowed,
    showLicenseWarning,
    text,
    setText,
    history,
    isLoading,
    isVoicesLoading,
    error,
    clearError,
    generate,
  };
}

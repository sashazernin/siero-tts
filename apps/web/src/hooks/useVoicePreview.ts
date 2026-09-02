import { useCallback, useEffect, useRef, useState } from 'react';
import { synthesizeSpeech } from '../api/tts';
import { getVoiceKey, getVoiceSamplePhrase } from '@siero-tts/shared';
import type { Voice } from '@siero-tts/shared';

export function useVoicePreview() {
  const cacheRef = useRef(new Map<string, string>());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setPlayingKey(null);
  }, []);

  const playPreview = useCallback(
    async (voice: Voice) => {
      const key = getVoiceKey(voice);

      if (playingKey === key) {
        stopPreview();
        return;
      }

      stopPreview();
      setLoadingKey(key);

      try {
        let audioUrl = cacheRef.current.get(key);

        if (!audioUrl) {
          const blob = await synthesizeSpeech({
            text: getVoiceSamplePhrase(voice),
            speaker: voice.id,
            model: voice.modelId,
            sample_rate: 48000,
          });

          audioUrl = URL.createObjectURL(blob);
          cacheRef.current.set(key, audioUrl);
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setPlayingKey(null);
          audioRef.current = null;
        };

        await audio.play();
        setPlayingKey(key);
      } catch {
        setPlayingKey(null);
      } finally {
        setLoadingKey(null);
      }
    },
    [playingKey, stopPreview],
  );

  useEffect(() => {
    const cache = cacheRef.current;

    return () => {
      stopPreview();
      cache.forEach((url) => URL.revokeObjectURL(url));
      cache.clear();
    };
  }, [stopPreview]);

  return {
    playPreview,
    playingKey,
    loadingKey,
    isPlaying: (voice: Voice) => playingKey === getVoiceKey(voice),
    isPreviewLoading: (voice: Voice) => loadingKey === getVoiceKey(voice),
  };
}

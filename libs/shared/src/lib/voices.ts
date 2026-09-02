import type { LanguageOption, Voice } from './types';

export const VOICES: Voice[] = [
  // Азербайджанский
  { id: 'aze_gamat', label: 'Gamat', language: 'aze', languageLabel: 'Азербайджанский', gender: 'male' },

  // Армянский
  { id: 'hye_zara', label: 'Zara', language: 'hye', languageLabel: 'Армянский', gender: 'female' },

  // Башкирский
  { id: 'bak_aigul', label: 'Aigul', language: 'bak', languageLabel: 'Башкирский', gender: 'female' },
  { id: 'bak_alfia', label: 'Alfia', language: 'bak', languageLabel: 'Башкирский', gender: 'female' },
  { id: 'bak_alfia2', label: 'Alfia 2', language: 'bak', languageLabel: 'Башкирский', gender: 'female' },
  { id: 'bak_miyau', label: 'Miyau', language: 'bak', languageLabel: 'Башкирский', gender: 'female' },
  { id: 'bak_ramilia', label: 'Ramilia', language: 'bak', languageLabel: 'Башкирский', gender: 'female' },

  // Белорусский
  { id: 'bel_anatoliy', label: 'Anatoliy', language: 'bel', languageLabel: 'Белорусский', gender: 'male' },
  { id: 'bel_dmitriy', label: 'Dmitriy', language: 'bel', languageLabel: 'Белорусский', gender: 'male' },
  { id: 'bel_larisa', label: 'Larisa', language: 'bel', languageLabel: 'Белорусский', gender: 'female' },

  // Грузинский
  { id: 'kat_vika', label: 'Vika', language: 'kat', languageLabel: 'Грузинский', gender: 'female' },

  // Кабардино-черкесский
  { id: 'kbd_eduard', label: 'Eduard', language: 'kbd', languageLabel: 'Кабардино-черкесский', gender: 'male' },

  // Казахский
  { id: 'kaz_zhadyra', label: 'Zhadyra', language: 'kaz', languageLabel: 'Казахский', gender: 'female' },
  { id: 'kaz_zhazira', label: 'Zhazira', language: 'kaz', languageLabel: 'Казахский', gender: 'female' },

  // Калмыцкий
  { id: 'xal_kejilgan', label: 'Kejilgan', language: 'xal', languageLabel: 'Калмыцкий', gender: 'male' },
  { id: 'xal_kermen', label: 'Kermen', language: 'xal', languageLabel: 'Калмыцкий', gender: 'male' },

  // Киргизский
  { id: 'kir_nurgul', label: 'Nurgul', language: 'kir', languageLabel: 'Киргизский', gender: 'female' },

  // Мокшанский
  { id: 'mdf_oksana', label: 'Oksana', language: 'mdf', languageLabel: 'Мокшанский', gender: 'female' },

  // Русский (CIS-голоса для русского текста)
  { id: 'ru_aigul', label: 'Aigul', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_albina', label: 'Albina', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_alexandr', label: 'Alexandr', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_alfia', label: 'Alfia', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_alfia2', label: 'Alfia 2', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_bogdan', label: 'Bogdan', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_dmitriy', label: 'Dmitriy', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_eduard', label: 'Eduard', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_ekaterina', label: 'Ekaterina', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_gamat', label: 'Gamat', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_igor', label: 'Igor', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_karina', label: 'Karina', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_kejilgan', label: 'Kejilgan', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_kermen', label: 'Kermen', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_marat', label: 'Marat', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_miyau', label: 'Miyau', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_nurgul', label: 'Nurgul', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_oksana', label: 'Oksana', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_onaoy', label: 'Onaoy', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_ramilia', label: 'Ramilia', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_roman', label: 'Roman', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_safarhuja', label: 'Safarhuja', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_saida', label: 'Saida', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_sibday', label: 'Sibday', language: 'ru', languageLabel: 'Русский', gender: 'male' },
  { id: 'ru_vika', label: 'Vika', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_zara', label: 'Zara', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_zhadyra', label: 'Zhadyra', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_zhazira', label: 'Zhazira', language: 'ru', languageLabel: 'Русский', gender: 'female' },
  { id: 'ru_zinaida', label: 'Zinaida', language: 'ru', languageLabel: 'Русский', gender: 'female' },

  // Таджикский
  { id: 'tgk_onaoy', label: 'Onaoy', language: 'tgk', languageLabel: 'Таджикский', gender: 'female' },
  { id: 'tgk_safarhuja', label: 'Safarhuja', language: 'tgk', languageLabel: 'Таджикский', gender: 'male' },

  // Татарский
  { id: 'tat_albina', label: 'Albina', language: 'tat', languageLabel: 'Татарский', gender: 'female' },
  { id: 'tat_marat', label: 'Marat', language: 'tat', languageLabel: 'Татарский', gender: 'male' },

  // Удмуртский
  { id: 'udm_bogdan', label: 'Bogdan', language: 'udm', languageLabel: 'Удмуртский', gender: 'male' },

  // Узбекский
  { id: 'uzb_saida', label: 'Saida', language: 'uzb', languageLabel: 'Узбекский', gender: 'female' },

  // Украинский
  { id: 'ukr_igor', label: 'Igor', language: 'ukr', languageLabel: 'Украинский', gender: 'male' },
  { id: 'ukr_roman', label: 'Roman', language: 'ukr', languageLabel: 'Украинский', gender: 'male' },

  // Хакасский
  { id: 'kjh_karina', label: 'Karina', language: 'kjh', languageLabel: 'Хакасский', gender: 'female' },
  { id: 'kjh_sibday', label: 'Sibday', language: 'kjh', languageLabel: 'Хакасский', gender: 'male' },

  // Чувашский
  { id: 'chv_ekaterina', label: 'Ekaterina', language: 'chv', languageLabel: 'Чувашский', gender: 'female' },

  // Эрзянский
  { id: 'erz_alexandr', label: 'Alexandr', language: 'erz', languageLabel: 'Эрзянский', gender: 'male' },

  // Якутский
  { id: 'sah_zinaida', label: 'Zinaida', language: 'sah', languageLabel: 'Якутский', gender: 'female' },
];

export const VOICE_IDS = new Set(VOICES.map((voice) => voice.id));

export function getLanguageOptions(): LanguageOption[] {
  const languages = new Map<string, string>();

  VOICES.forEach((voice) => {
    languages.set(voice.language, voice.languageLabel);
  });

  return Array.from(languages.entries())
    .map(([code, label]) => ({ code, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
}

export function filterVoices(
  voices: Voice[],
  languageFilter: string,
  genderFilter: string,
): Voice[] {
  return voices.filter((voice) => {
    const languageMatch = languageFilter === 'any' || voice.language === languageFilter;
    const genderMatch = genderFilter === 'any' || voice.gender === genderFilter;
    return languageMatch && genderMatch;
  });
}

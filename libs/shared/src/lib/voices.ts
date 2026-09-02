import type { LanguageOption, Voice } from './types';
import { V3_EN_VOICES, V5_RU_VOICES } from './nc-voices';

const CIS_VOICES: Voice[] = [
  // Азербайджанский
  { id: 'aze_gamat', label: 'Gamat', language: 'aze', languageLabel: 'Азербайджанский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Армянский
  { id: 'hye_zara', label: 'Zara', language: 'hye', languageLabel: 'Армянский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Башкирский
  { id: 'bak_aigul', label: 'Aigul', language: 'bak', languageLabel: 'Башкирский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'bak_alfia', label: 'Alfia', language: 'bak', languageLabel: 'Башкирский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'bak_alfia2', label: 'Alfia 2', language: 'bak', languageLabel: 'Башкирский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'bak_miyau', label: 'Miyau', language: 'bak', languageLabel: 'Башкирский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'bak_ramilia', label: 'Ramilia', language: 'bak', languageLabel: 'Башкирский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Белорусский
  { id: 'bel_anatoliy', label: 'Anatoliy', language: 'bel', languageLabel: 'Белорусский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'bel_dmitriy', label: 'Dmitriy', language: 'bel', languageLabel: 'Белорусский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'bel_larisa', label: 'Larisa', language: 'bel', languageLabel: 'Белорусский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Грузинский
  { id: 'kat_vika', label: 'Vika', language: 'kat', languageLabel: 'Грузинский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Кабардино-черкесский
  { id: 'kbd_eduard', label: 'Eduard', language: 'kbd', languageLabel: 'Кабардино-черкесский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Казахский
  { id: 'kaz_zhadyra', label: 'Zhadyra', language: 'kaz', languageLabel: 'Казахский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'kaz_zhazira', label: 'Zhazira', language: 'kaz', languageLabel: 'Казахский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Калмыцкий
  { id: 'xal_kejilgan', label: 'Kejilgan', language: 'xal', languageLabel: 'Калмыцкий', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'xal_kermen', label: 'Kermen', language: 'xal', languageLabel: 'Калмыцкий', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Киргизский
  { id: 'kir_nurgul', label: 'Nurgul', language: 'kir', languageLabel: 'Киргизский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Мокшанский
  { id: 'mdf_oksana', label: 'Oksana', language: 'mdf', languageLabel: 'Мокшанский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Русский (CIS-голоса для русского текста)
  { id: 'ru_aigul', label: 'Aigul', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_albina', label: 'Albina', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_alexandr', label: 'Alexandr', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_alfia', label: 'Alfia', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_alfia2', label: 'Alfia 2', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_bogdan', label: 'Bogdan', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_dmitriy', label: 'Dmitriy', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_eduard', label: 'Eduard', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_ekaterina', label: 'Ekaterina', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_gamat', label: 'Gamat', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_igor', label: 'Igor', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_karina', label: 'Karina', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_kejilgan', label: 'Kejilgan', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_kermen', label: 'Kermen', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_marat', label: 'Marat', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_miyau', label: 'Miyau', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_nurgul', label: 'Nurgul', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_oksana', label: 'Oksana', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_onaoy', label: 'Onaoy', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_ramilia', label: 'Ramilia', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_roman', label: 'Roman', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_safarhuja', label: 'Safarhuja', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_saida', label: 'Saida', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_sibday', label: 'Sibday', language: 'ru', languageLabel: 'Русский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_vika', label: 'Vika', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_zara', label: 'Zara', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_zhadyra', label: 'Zhadyra', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_zhazira', label: 'Zhazira', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ru_zinaida', label: 'Zinaida', language: 'ru', languageLabel: 'Русский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Таджикский
  { id: 'tgk_onaoy', label: 'Onaoy', language: 'tgk', languageLabel: 'Таджикский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'tgk_safarhuja', label: 'Safarhuja', language: 'tgk', languageLabel: 'Таджикский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Татарский
  { id: 'tat_albina', label: 'Albina', language: 'tat', languageLabel: 'Татарский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'tat_marat', label: 'Marat', language: 'tat', languageLabel: 'Татарский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Удмуртский
  { id: 'udm_bogdan', label: 'Bogdan', language: 'udm', languageLabel: 'Удмуртский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Узбекский
  { id: 'uzb_saida', label: 'Saida', language: 'uzb', languageLabel: 'Узбекский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Украинский
  { id: 'ukr_igor', label: 'Igor', language: 'ukr', languageLabel: 'Украинский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'ukr_roman', label: 'Roman', language: 'ukr', languageLabel: 'Украинский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Хакасский
  { id: 'kjh_karina', label: 'Karina', language: 'kjh', languageLabel: 'Хакасский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
  { id: 'kjh_sibday', label: 'Sibday', language: 'kjh', languageLabel: 'Хакасский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Чувашский
  { id: 'chv_ekaterina', label: 'Ekaterina', language: 'chv', languageLabel: 'Чувашский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Эрзянский
  { id: 'erz_alexandr', label: 'Alexandr', language: 'erz', languageLabel: 'Эрзянский', gender: 'male', modelId: 'v5_cis_base_nostress', commercialAllowed: true },

  // Якутский
  { id: 'sah_zinaida', label: 'Zinaida', language: 'sah', languageLabel: 'Якутский', gender: 'female', modelId: 'v5_cis_base_nostress', commercialAllowed: true },
];

export const VOICES: Voice[] = [...CIS_VOICES, ...V5_RU_VOICES, ...V3_EN_VOICES];

export const VOICE_IDS = new Set(VOICES.map((voice) => voice.id));

export function getLanguageOptions(voices: Voice[] = VOICES): LanguageOption[] {
  const languages = new Map<string, string>();

  voices.forEach((voice) => {
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
  commercialUseAllowed = false,
): Voice[] {
  return voices.filter((voice) => {
    if (commercialUseAllowed && !voice.commercialAllowed) {
      return false;
    }

    const languageMatch = languageFilter === 'any' || voice.language === languageFilter;
    const genderMatch =
      genderFilter === 'any' || (voice.gender !== undefined && voice.gender === genderFilter);
    return languageMatch && genderMatch;
  });
}

export function getGenderLabel(voice: Voice): string | null {
  if (!voice.gender) {
    return null;
  }

  return voice.gender === 'male' ? 'Муж' : 'Жен';
}

export function getVoiceKey(voice: Voice): string {
  return `${voice.modelId}:${voice.id}`;
}

export function findVoice(voices: Voice[], modelId: string, speakerId: string): Voice | undefined {
  return voices.find((voice) => voice.modelId === modelId && voice.id === speakerId);
}

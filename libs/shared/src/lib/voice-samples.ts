import type { Voice } from './types';

const SAMPLE_PHRASES_BY_LANGUAGE: Record<string, string> = {
  ru: 'Привет, это образец голоса.',
  bel: 'Прывітанне, гэта ўзор галасу.',
  ukr: 'Привіт, це зразок голосу.',
  kaz: 'Сәлем, бұл дауыс үлгісі.',
  tat: 'Сәлам, бу тавыш үлгесе.',
  uzb: 'Salom, bu ovoz namunasi.',
  aze: 'Salam, bu səs nümunəsidir.',
  hye: 'Բարև, սա ձայնի օրինակ է:',
  kat: 'გამარჯობა, ეს ხმის ნიმუშია.',
  kir: 'Салам, бул үнүн үлгүсү.',
  tgk: 'Салом, ин намунаи овоз аст.',
  kbd: 'Сэлам, ар йычъынӏэ.',
  bak: 'Сәләм, бәлһүҙ дауыш өлгөһө.',
  xal: 'Сайн, эн янзы авдар.',
  mdf: 'Шумбрать, те ваймонь юхтома.',
  udm: 'Вувыл, тые вуон нимало.',
  kjh: 'Азың, бо мор образец.',
  chv: 'Ават, куҫӑм ҫӗнӗ.',
  erz: 'Шумбратить, те ваймонь улома.',
  sah: 'Эҕэрдэ, бу өксөкөл.',
  en: 'Hello, this is a voice sample.',
};

const V5_RU_SAMPLE_PHRASES: Record<string, string> = {
  aidar: 'Привет, меня зовут Айдар.',
  baya: 'Привет, меня зовут Бая.',
  eugene: 'Привет, меня зовут Евгений.',
  kseniya: 'Привет, меня зовут Ксения.',
  xenia: 'Привет, меня зовут Ксения.',
};

const DEFAULT_CIS_PHRASE = 'Привет, это образец голоса.';

export function getVoiceSamplePhrase(voice: Voice): string {
  if (voice.modelId === 'v3_en') {
    return SAMPLE_PHRASES_BY_LANGUAGE.en;
  }

  if (voice.modelId === 'v5_ru') {
    return V5_RU_SAMPLE_PHRASES[voice.id] ?? DEFAULT_CIS_PHRASE;
  }

  return SAMPLE_PHRASES_BY_LANGUAGE[voice.language] ?? DEFAULT_CIS_PHRASE;
}

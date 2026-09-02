export const MODEL_IDS = ['v5_cis_base_nostress', 'v3_en', 'v5_ru'] as const;

export type ModelId = (typeof MODEL_IDS)[number];

export const DEFAULT_MODEL_ID: ModelId = 'v5_cis_base_nostress';

export const SILERO_NC_LICENSE_URL =
  'https://github.com/snakers4/silero-models/blob/master/LICENSE';

export const SILERO_CIS_LICENSE_URL =
  'https://github.com/snakers4/silero-models/blob/master/LICENSE_CIS';

export interface ModelInfo {
  id: ModelId;
  label: string;
  commercialAllowed: boolean;
}

export const MODELS: Record<ModelId, ModelInfo> = {
  v5_cis_base_nostress: {
    id: 'v5_cis_base_nostress',
    label: 'CIS (nostress)',
    commercialAllowed: true,
  },
  v3_en: {
    id: 'v3_en',
    label: 'English v3',
    commercialAllowed: false,
  },
  v5_ru: {
    id: 'v5_ru',
    label: 'Russian classic',
    commercialAllowed: false,
  },
};

export function isModelId(value: string): value is ModelId {
  return MODEL_IDS.includes(value as ModelId);
}

export const LANG = (import.meta.env.VITE_LANG ?? 'ja') as 'ja' | 'en';
export const IS_EN = LANG === 'en';
export const LOCALE = LANG === 'en' ? 'en-US' : 'ja-JP';
export const INSTANCE_LABEL = LANG === 'en' ? 'EN' : 'JA';
export const CROSS_LANG_API_URL = import.meta.env.VITE_CROSS_LANG_API ?? '';

import { useState } from 'react';
import {
  getPromptSettings,
  savePromptSettings,
  resetPromptSettings,
  DEFAULT_PROMPTS,
  type PromptSettings,
} from '../services/promptSettings';
import { t, type MessageKey } from '../i18n';

interface PromptSection {
  key: keyof PromptSettings;
  labelKey: MessageKey;
  descKey: MessageKey;
}

const PROMPT_SECTIONS: PromptSection[] = [
  {
    key: 'extractionSystem',
    labelKey: 'promptExtractionSystemLabel',
    descKey: 'promptExtractionSystemDesc',
  },
  {
    key: 'specializedSystemTemplate',
    labelKey: 'promptSpecializedSystemLabel',
    descKey: 'promptSpecializedSystemDesc',
  },
  {
    key: 'refineSystem',
    labelKey: 'promptRefineSystemLabel',
    descKey: 'promptRefineSystemDesc',
  },
  {
    key: 'mergeSystem',
    labelKey: 'promptMergeSystemLabel',
    descKey: 'promptMergeSystemDesc',
  },
];

export function SettingsPage() {
  const [values, setValues] = useState<PromptSettings>(() => getPromptSettings());
  const [saved, setSaved] = useState(false);

  function handleChange(key: keyof PromptSettings, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleReset(key: keyof PromptSettings) {
    setValues((prev) => ({ ...prev, [key]: DEFAULT_PROMPTS[key] }));
    setSaved(false);
  }

  function handleSave() {
    savePromptSettings(values);
    setSaved(true);
  }

  function handleResetAll() {
    if (!window.confirm(t('resetAllConfirm'))) return;
    resetPromptSettings();
    setValues({ ...DEFAULT_PROMPTS });
    setSaved(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('settingsTitle')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('settingsSubtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAll}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 border border-gray-300 rounded-md transition-colors"
          >
            {t('resetAllBtn')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {saved ? t('savedMark2') : t('saveSettingsBtn')}
          </button>
        </div>
      </div>

      {PROMPT_SECTIONS.map(({ key, labelKey, descKey }) => (
        <section key={key} className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800">{t(labelKey)}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t(descKey)}</p>
            </div>
            <button
              onClick={() => handleReset(key)}
              className="shrink-0 text-xs text-gray-400 hover:text-indigo-600 underline underline-offset-2 transition-colors"
            >
              {t('resetToDefault')}
            </button>
          </div>
          <textarea
            value={values[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full font-mono text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed"
            rows={14}
            spellCheck={false}
          />
          {values[key] !== DEFAULT_PROMPTS[key] && (
            <p className="text-xs text-amber-600">{t('modifiedFromDefault')}</p>
          )}
        </section>
      ))}

      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          {saved ? t('savedMark2') : t('saveSettingsBtnFull')}
        </button>
      </div>
    </div>
  );
}

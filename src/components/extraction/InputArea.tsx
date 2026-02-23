import { useState } from 'react';
import { t } from '../../i18n';

interface Props {
  onExtract: (text: string) => Promise<void>;
  loading: boolean;
}

export function InputArea({ onExtract, loading }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onExtract(text.trim());
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {t('inputLabel')}
        <span className="ml-2 text-gray-400 font-normal">{t('inputSubLabel')}</span>
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder={t('inputPlaceholder')}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        disabled={loading}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              {t('extractingBtn')}
            </>
          ) : (
            t('extractBtn')
          )}
        </button>
        {text.trim() && !loading && (
          <button
            onClick={() => setText('')}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            {t('clearBtn')}
          </button>
        )}
      </div>
      <div className="mt-2 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-400">
        {t('fileSupport')}
      </div>
    </div>
  );
}

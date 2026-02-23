import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Header } from '../components/layout/Header';
import { InputArea } from '../components/extraction/InputArea';
import { DraftCard } from '../components/extraction/DraftCard';
import { extractContexts, extractSpecialized } from '../services/claude';
import type { CardType, ExtractionDraft } from '../types';
import { CARD_TYPE_LABELS, CARD_TYPE_COLORS } from '../types';
import { t } from '../i18n';

type ExtractionMode = 'general' | 'specialized';

export function ExtractionPage() {
  const navigate = useNavigate();
  const { createCard } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ExtractionDraft[] | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<Set<number>>(new Set());
  const [skippedDrafts, setSkippedDrafts] = useState<Set<number>>(new Set());
  const [sourceText, setSourceText] = useState('');

  const [mode, setMode] = useState<ExtractionMode>('general');
  const [specType, setSpecType] = useState<CardType>('operations');
  const [focusHint, setFocusHint] = useState('');

  const handleModeChange = (m: ExtractionMode) => {
    setMode(m);
    setDrafts(null);
    setError(null);
  };

  const handleExtract = async (text: string) => {
    setLoading(true);
    setError(null);
    setDrafts(null);
    setSavedDrafts(new Set());
    setSkippedDrafts(new Set());
    setSourceText(text);
    try {
      const result =
        mode === 'specialized'
          ? await extractSpecialized(specType, focusHint, text)
          : await extractContexts(text, focusHint);
      setDrafts(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('extractError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (
    index: number,
    draft: ExtractionDraft & { tags: string[] }
  ) => {
    await createCard({
      type: draft.type,
      title: draft.title,
      content: draft.content,
      tags: draft.tags,
      sourceText,
    });
    setSavedDrafts((prev) => new Set([...prev, index]));
  };

  const handleSkipDraft = (index: number) => {
    setSkippedDrafts((prev) => new Set([...prev, index]));
  };

  const allDone =
    drafts !== null &&
    drafts.every((_, i) => savedDrafts.has(i) || skippedDrafts.has(i));

  const subtitle =
    mode === 'general'
      ? t('extractionSubtitleGeneral')
      : t('extractionSubtitleSpecialized');

  return (
    <div>
      <Header title={t('extractionTitle')} subtitle={subtitle} />

      {!drafts && (
        <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm w-fit mb-5">
          <button
            onClick={() => handleModeChange('general')}
            className={`px-4 py-2 transition-colors ${
              mode === 'general'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('generalMode')}
          </button>
          <button
            onClick={() => handleModeChange('specialized')}
            className={`px-4 py-2 border-l border-gray-300 transition-colors ${
              mode === 'specialized'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('specializedMode')}
          </button>
        </div>
      )}

      {!drafts && (
        <div className="max-w-3xl">
          <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg space-y-3">
            {mode === 'specialized' && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">{t('targetCategory')}</p>
                <div className="flex gap-2">
                  {(['customer', 'sales', 'operations'] as CardType[]).map((cardType) => {
                    const colors = CARD_TYPE_COLORS[cardType];
                    const isActive = specType === cardType;
                    return (
                      <button
                        key={cardType}
                        onClick={() => setSpecType(cardType)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                          isActive
                            ? `${colors.bg} ${colors.border} ${colors.text}`
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {CARD_TYPE_LABELS[cardType]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('focusKeyword')}
                <span className="ml-2 text-gray-400 font-normal">{t('optional')}</span>
              </label>
              <textarea
                value={focusHint}
                onChange={(e) => setFocusHint(e.target.value)}
                rows={5}
                placeholder={
                  mode === 'specialized'
                    ? t('focusPlaceholderSpecialized')
                    : t('focusPlaceholderGeneral')
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>

          <InputArea onExtract={handleExtract} loading={loading} />
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {drafts && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {t('extractDoneMsg')}（{drafts.length} {t('draftCount')}）。{t('draftReviewMsg')}
            </p>
            <button
              onClick={() => { setDrafts(null); setError(null); }}
              className="text-sm text-indigo-600 hover:underline"
            >
              {t('backToInput')}
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <div className={`grid grid-cols-1 gap-4 ${mode === 'general' ? 'md:grid-cols-3' : 'max-w-2xl'}`}>
            {drafts.map((draft, i) => (
              !skippedDrafts.has(i) && (
                <DraftCard
                  key={i}
                  draft={draft}
                  onSave={(d) => handleSaveDraft(i, d)}
                  onSkip={() => handleSkipDraft(i)}
                  saved={savedDrafts.has(i)}
                />
              )
            ))}
          </div>

          {allDone && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-700 font-medium">{t('allSaved')}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 text-sm text-green-600 hover:underline"
              >
                {t('viewCardList')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

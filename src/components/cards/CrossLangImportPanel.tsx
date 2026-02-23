import { useState } from 'react';
import type { ContextCard } from '../../types';
import { CARD_TYPE_LABELS } from '../../types';
import { CardTypeTag } from './CardTypeTag';
import {
  fetchCrossLangCards,
  findSimilarCards,
  getImportDelta,
  buildAppendContent,
  buildNewCardTitle,
  isValidCardType,
} from '../../services/crossLang';
import type { SimilarCandidate, ImportDelta } from '../../services/crossLang';
import { cardsApi, importLogsApi } from '../../services/api';
import { t } from '../../i18n';
import { LANG, CROSS_LANG_API_URL } from '../../config';

interface Props {
  card: ContextCard;
  onCardUpdated: () => Promise<void>;
}

type Step =
  | 'idle'
  | 'searching'
  | 'candidates'
  | 'analyzing'
  | 'delta'
  | 'importing'
  | 'done';

export function CrossLangImportPanel({ card, onCardUpdated }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [candidates, setCandidates] = useState<SimilarCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<SimilarCandidate | null>(null);
  const [delta, setDelta] = useState<ImportDelta | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const otherLang = LANG === 'ja' ? 'EN' : 'JA';

  // CROSS_LANG_API_URL が未設定の場合は何も表示しない
  if (!CROSS_LANG_API_URL) return null;

  const handleSearch = async () => {
    setStep('searching');
    setError(null);
    setCandidates([]);
    try {
      const crossCards = await fetchCrossLangCards();
      const results = await findSimilarCards(card, crossCards);
      setCandidates(results);
      setStep('candidates');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setStep('idle');
    }
  };

  const handleSelectCandidate = async (candidate: SimilarCandidate) => {
    setSelectedCandidate(candidate);
    setStep('analyzing');
    setError(null);
    try {
      const result = await getImportDelta(candidate.card, card);
      setDelta(result);
      setEditedContent(result.deltaContent);
      setStep('delta');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
      setStep('candidates');
    }
  };

  const handleAppend = async () => {
    if (!selectedCandidate || !editedContent.trim()) return;
    setStep('importing');
    setError(null);
    try {
      const appendText = buildAppendContent(editedContent, selectedCandidate.card._sourceLang);
      await cardsApi.update(String(card.id), {
        content: card.content + appendText,
      });
      await importLogsApi.create({
        targetCardId: card.id,
        sourceCardId: selectedCandidate.card.id,
        sourceLang: selectedCandidate.card._sourceLang,
        importType: 'append',
        importedAt: new Date().toISOString(),
      });
      await onCardUpdated();
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
      setStep('delta');
    }
  };

  const handleNewCard = async () => {
    if (!selectedCandidate || !editedContent.trim()) return;
    setStep('importing');
    setError(null);
    try {
      const newTitle = buildNewCardTitle(
        selectedCandidate.card.title,
        selectedCandidate.card._sourceLang,
      );
      const cardType = isValidCardType(selectedCandidate.card.type)
        ? selectedCandidate.card.type
        : card.type;
      await cardsApi.create({
        type: cardType,
        title: newTitle,
        content: editedContent,
        tags: selectedCandidate.card.tags,
        sourceText: undefined,
      });
      await importLogsApi.create({
        targetCardId: card.id,
        sourceCardId: selectedCandidate.card.id,
        sourceLang: selectedCandidate.card._sourceLang,
        importType: 'new_card',
        importedAt: new Date().toISOString(),
      });
      await onCardUpdated();
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
      setStep('delta');
    }
  };

  const handleReset = () => {
    setStep('idle');
    setCandidates([]);
    setSelectedCandidate(null);
    setDelta(null);
    setEditedContent('');
    setError(null);
  };

  return (
    <div className="border border-purple-200 rounded-lg p-4 mt-6">
      {/* ヘッダー */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">
          {otherLang}
        </span>
        {t('crossLangTitle')}
      </h3>

      {/* idle: 検索ボタン */}
      {step === 'idle' && (
        <button
          onClick={handleSearch}
          className="w-full bg-purple-600 text-white py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          {t('crossLangSearchBtn')}
        </button>
      )}

      {/* searching: スピナー */}
      {step === 'searching' && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full" />
          {t('crossLangSearching')}
        </div>
      )}

      {/* candidates: 類似カード一覧 */}
      {step === 'candidates' && (
        <div className="space-y-3">
          {candidates.length === 0 ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">{t('crossLangNoCandidates')}</p>
              <button onClick={handleReset} className="text-sm text-purple-600 hover:underline">
                {t('crossLangRetryBtn')}
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                {candidates.length} {t('crossLangCandidatesFound')}
              </p>
              <div className="space-y-2">
                {candidates.map((c, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-md p-3 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CardTypeTag type={c.card.type} size="sm" />
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {c.card.title}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-purple-700 shrink-0">
                        {t('crossLangSimilarity')} {c.score}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 leading-relaxed">{c.reason}</p>
                    <button
                      onClick={() => handleSelectCandidate(c)}
                      className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition-colors font-medium"
                    >
                      {t('crossLangAnalyzeBtn')}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">
                {t('crossLangRetryBtn')}
              </button>
            </>
          )}
        </div>
      )}

      {/* analyzing: 差分分析中 */}
      {step === 'analyzing' && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full" />
          {t('crossLangAnalyzing')}
        </div>
      )}

      {/* delta: 差分表示 */}
      {step === 'delta' && selectedCandidate && delta && (
        <div className="space-y-3">
          <button
            onClick={() => setStep('candidates')}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {t('crossLangBackToCandidates')}
          </button>

          {/* ソースカード情報 */}
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-purple-50 rounded-md px-3 py-2">
            <span className="font-medium shrink-0">{t('crossLangSourceFrom')}:</span>
            <span className="bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-bold text-xs">
              {otherLang}
            </span>
            <CardTypeTag type={selectedCandidate.card.type} size="sm" />
            <span className="truncate font-medium">{selectedCandidate.card.title}</span>
            <span className="ml-auto shrink-0 text-purple-600 font-bold">
              {selectedCandidate.score}%
            </span>
          </div>

          {/* 差分サマリー */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">{t('crossLangDeltaSummary')}</p>
            <p className="text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded p-2 leading-relaxed">
              {delta.summary}
            </p>
          </div>

          {/* 差分コンテンツ（編集可） */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">
              {t('crossLangDeltaContent')}
            </p>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={10}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-400 resize-y"
            />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <button
              onClick={handleAppend}
              disabled={!editedContent.trim()}
              className="flex-1 bg-purple-600 text-white py-2 rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {t('crossLangAppendBtn')}
            </button>
            <button
              onClick={handleNewCard}
              disabled={!editedContent.trim()}
              className="flex-1 bg-indigo-600 text-white py-2 rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {t('crossLangNewCardBtn')}
            </button>
          </div>

          {/* 推奨アクション表示 */}
          {delta.suggestedAction && (
            <p className="text-xs text-gray-400">
              {LANG === 'ja' ? '推奨: ' : 'Suggested: '}
              <span className="font-medium text-purple-600">
                {delta.suggestedAction === 'append'
                  ? t('crossLangAppendBtn')
                  : t('crossLangNewCardBtn')}
              </span>
            </p>
          )}
        </div>
      )}

      {/* importing: インポート中 */}
      {step === 'importing' && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full" />
          {t('crossLangImporting')}
        </div>
      )}

      {/* done: 完了 */}
      {step === 'done' && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-green-600 font-medium">{t('crossLangDoneMsg')}</p>
          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {t('crossLangRetryBtn')}
          </button>
        </div>
      )}

      {/* エラー表示 */}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

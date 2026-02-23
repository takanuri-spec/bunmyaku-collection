import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Header } from '../components/layout/Header';
import { ContextCard } from '../components/cards/ContextCard';
import { ExportPanel } from '../components/export/ExportPanel';
import { exportsApi } from '../services/api';
import type { ExportLog } from '../types';
import { CARD_TYPE_LABELS } from '../types';
import { t } from '../i18n';
import { LOCALE } from '../config';

export function CasesPage() {
  const { cases, cards, fetchCases, fetchCards, createCase, deleteCase, updateCase } = useStore();
  const [showNewForm, setShowNewForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCase, setSelectedCase] = useState<string | number | null>(null);
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);

  useEffect(() => {
    fetchCases();
    fetchCards();
  }, [fetchCases, fetchCards]);

  const fetchExportLogs = useCallback(async (caseId: string | number) => {
    try {
      const all = await exportsApi.list();
      setExportLogs(all.filter((e) => String(e.caseId) === String(caseId)));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (selectedCase != null) {
      fetchExportLogs(selectedCase);
    } else {
      setExportLogs([]);
    }
  }, [selectedCase, fetchExportLogs]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createCase({ name: name.trim(), description: description.trim(), cardIds: [] });
    setName('');
    setDescription('');
    setShowNewForm(false);
  };

  const handleAddCard = async (caseId: string | number, cardId: string | number) => {
    const c = cases.find((cs) => String(cs.id) === String(caseId));
    if (!c) return;
    const cardIdStr = String(cardId);
    if (c.cardIds.includes(cardIdStr)) return;
    await updateCase(String(caseId), { cardIds: [...c.cardIds, cardIdStr] });
    await fetchCases();
  };

  const handleRemoveCard = async (caseId: string | number, cardId: string | number) => {
    const c = cases.find((cs) => String(cs.id) === String(caseId));
    if (!c) return;
    await updateCase(String(caseId), { cardIds: c.cardIds.filter((id) => id !== String(cardId)) });
    await fetchCases();
  };

  const currentCase = cases.find((c) => String(c.id) === String(selectedCase));
  const caseCards = currentCase
    ? currentCase.cardIds.map((id) => cards.find((c) => String(c.id) === id)).filter(Boolean)
    : [];
  const unusedCards = currentCase
    ? cards.filter((c) => !currentCase.cardIds.includes(String(c.id)))
    : [];

  return (
    <div>
      <Header title={t('casesTitle')} subtitle={t('casesSubtitle')} />

      <div className="flex gap-4">
        {/* Case list */}
        <div className="w-64 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">{t('caseList')}</p>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="text-sm text-indigo-600 hover:underline"
            >
              {t('newCaseBtn')}
            </button>
          </div>

          {showNewForm && (
            <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('caseNamePlaceholder')}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('caseMemoPlaceholder')}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="w-full bg-indigo-600 text-white py-1 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('createBtn')}
              </button>
            </div>
          )}

          <div className="space-y-1">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCase(String(c.id) === String(selectedCase) ? null : c.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  String(selectedCase) === String(c.id)
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-gray-400">{c.cardIds.length} {t('cardsUnit')}</div>
              </button>
            ))}
            {cases.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">{t('noCases')}</p>
            )}
          </div>
        </div>

        {/* Case detail */}
        {currentCase && (
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{currentCase.name}</h3>
              <button
                onClick={() => { if (confirm(t('deleteCaseConfirm'))) { deleteCase(String(currentCase.id)); setSelectedCase(null); } }}
                className="text-sm text-red-500 hover:underline"
              >
                {t('deleteCaseBtn')}
              </button>
            </div>
            {currentCase.description && (
              <p className="text-sm text-gray-500 mb-4">{currentCase.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {caseCards.map((card) => card && (
                <div key={card.id} className="relative">
                  <ContextCard card={card} />
                  <button
                    onClick={() => handleRemoveCard(currentCase.id, card.id)}
                    className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-600 bg-white rounded px-1"
                    title={t('removeCardBtn')}
                  >
                    {t('removeCardBtn')}
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('addCards')}</p>
              <select
                onChange={(e) => { if (e.target.value) handleAddCard(currentCase.id, e.target.value); e.target.value = ''; }}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-md focus:outline-none focus:ring-1 focus:ring-indigo-400"
                defaultValue=""
              >
                <option value="">{t('addCardSelect')}</option>
                {unusedCards.map((c) => (
                  <option key={c.id} value={c.id}>[{CARD_TYPE_LABELS[c.type]}] {c.title}</option>
                ))}
              </select>
            </div>

            <ExportPanel
              contextCase={currentCase}
              cards={caseCards.filter((c): c is NonNullable<typeof c> => c !== undefined)}
              onExported={() => fetchExportLogs(currentCase.id)}
            />

            {exportLogs.length > 0 && (
              <div className="mt-6 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('exportHistory')}
                  <span className="ml-2 text-xs text-gray-400 font-normal">{exportLogs.length}</span>
                </h4>
                <div className="space-y-2">
                  {[...exportLogs].reverse().map((log) => (
                    <div key={log.id} className="flex items-start justify-between gap-3 py-2 border-t border-gray-100 first:border-t-0">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString(LOCALE)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {log.sourceCardIds.length} {t('cardsMergedLabel')}
                        </p>
                      </div>
                      <details className="flex-1 min-w-0">
                        <summary className="text-xs text-indigo-500 hover:text-indigo-700 cursor-pointer select-none whitespace-nowrap">
                          {t('viewContent')}
                        </summary>
                        <pre className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap font-mono leading-relaxed">
                          {log.mergedContent}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!currentCase && cases.length > 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">{t('selectCaseHint')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

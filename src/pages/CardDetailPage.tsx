import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CardEditor } from '../components/cards/CardEditor';
import { CardTypeTag } from '../components/cards/CardTypeTag';
import { CrossLangImportPanel } from '../components/cards/CrossLangImportPanel';
import { refineCard } from '../services/claude';
import type { ContextCard } from '../types';
import { t } from '../i18n';
import { LOCALE } from '../config';

export function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cards, fetchCards, createCard, updateCard, deleteCard } = useStore();
  const isNew = id === 'new';

  const card = isNew ? null : cards.find((c) => String(c.id) === id);

  const [editing, setEditing] = useState(isNew);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [refining, setRefining] = useState(false);
  const [refineResult, setRefineResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cards.length === 0) fetchCards();
  }, [cards.length, fetchCards]);

  const handleSave = async (data: Omit<ContextCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isNew) {
      const newCard = await createCard(data);
      navigate(`/cards/${newCard.id}`, { replace: true });
    } else if (id) {
      await updateCard(id, data);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm(t('deleteCardConfirm'))) return;
    await deleteCard(id);
    navigate('/');
  };

  const handleRefine = async () => {
    if (!card || !refineInstruction.trim()) return;
    setRefining(true);
    setRefineResult(null);
    setError(null);
    try {
      const result = await refineCard(card.type, card.content, refineInstruction);
      setRefineResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('refineFailedMsg'));
    } finally {
      setRefining(false);
    }
  };

  const applyRefine = async () => {
    if (!id || !refineResult) return;
    await updateCard(id, { content: refineResult });
    setRefineResult(null);
    setRefineInstruction('');
    await fetchCards();
  };

  if (!isNew && !card && cards.length > 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">{t('cardNotFound')}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 hover:underline text-sm">
          {t('backToListLink')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-sm">
          {t('backToList')}
        </button>
        {card && <CardTypeTag type={card.type} />}
        <span className="text-gray-300">|</span>
        {card && !editing && (
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-indigo-600 hover:underline"
            >
              {t('editBtn')}
            </button>
            <button
              onClick={handleDelete}
              className="text-sm text-red-500 hover:underline ml-auto"
            >
              {t('deleteBtn')}
            </button>
          </>
        )}
      </div>

      {editing ? (
        <CardEditor
          initial={card ?? {}}
          onSave={handleSave}
          onCancel={isNew ? () => navigate('/') : () => setEditing(false)}
        />
      ) : card ? (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{card.title}</h2>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <pre className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-sans">
              {card.content}
            </pre>
          </div>

          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {card.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mb-8">
            {t('updatedAtLabel')}: {new Date(card.updatedAt).toLocaleString(LOCALE)} ／
            {t('createdAtLabel')}: {new Date(card.createdAt).toLocaleString(LOCALE)}
          </p>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('aiRefineTitle')}</h3>
            <textarea
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
              rows={3}
              placeholder={t('refinePlaceholder')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleRefine}
              disabled={refining || !refineInstruction.trim()}
              className="mt-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-indigo-200 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {refining ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full" />
                  {t('processingBtn')}
                </>
              ) : (
                t('runRefineBtn')
              )}
            </button>

            {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}

            {refineResult && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">{t('refineResultLabel')}</p>
                <div className="bg-indigo-50 border border-indigo-200 rounded p-3 max-h-64 overflow-y-auto">
                  <pre className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap font-sans">
                    {refineResult}
                  </pre>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={applyRefine}
                    className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    {t('applyRefineBtn')}
                  </button>
                  <button
                    onClick={() => setRefineResult(null)}
                    className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    {t('discardBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* クロスラングインポートパネル（VITE_CROSS_LANG_API 設定時のみ表示） */}
          <CrossLangImportPanel
            card={card}
            onCardUpdated={fetchCards}
          />
        </div>
      ) : null}
    </div>
  );
}

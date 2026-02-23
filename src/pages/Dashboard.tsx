import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Header } from '../components/layout/Header';
import { ContextCard } from '../components/cards/ContextCard';
import { t } from '../i18n';

export function Dashboard() {
  const navigate = useNavigate();
  const { cards, fetchCards, deleteCard, filterType, searchQuery, loading, error } = useStore();

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const filteredCards = useMemo(() => {
    return cards
      .filter((c) => filterType === 'all' || c.type === filterType)
      .filter((c) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          c.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [cards, filterType, searchQuery]);

  const handleDelete = async (id: string | number) => {
    if (!confirm(t('deleteCardConfirm'))) return;
    await deleteCard(String(id));
  };

  return (
    <div>
      <Header
        title={t('dashboardTitle')}
        subtitle={`${filteredCards.length} context cards`}
      />

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => navigate('/extract')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {t('extractNewBtn')}
        </button>
        <button
          onClick={() => navigate('/cards/new')}
          className="border border-gray-300 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {t('createManualBtn')}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <span className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {!loading && filteredCards.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">{t('noCardsMsg')}</p>
          <button
            onClick={() => navigate('/extract')}
            className="mt-4 text-indigo-600 text-sm hover:underline"
          >
            {t('noCardsHint')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => (
          <ContextCard key={card.id} card={card} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}

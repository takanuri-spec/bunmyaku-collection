import { create } from 'zustand';
import type { ContextCard, ContextCase, CardType } from '../types';
import { cardsApi, casesApi } from '../services/api';

interface StoreState {
  cards: ContextCard[];
  cases: ContextCase[];
  loading: boolean;
  error: string | null;

  // フィルター
  filterType: CardType | 'all';
  searchQuery: string;

  // Actions
  fetchCards: () => Promise<void>;
  fetchCases: () => Promise<void>;
  createCard: (data: Omit<ContextCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContextCard>;
  updateCard: (id: string, data: Partial<ContextCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  createCase: (data: Omit<ContextCase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContextCase>;
  updateCase: (id: string, data: Partial<ContextCase>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  setFilterType: (type: CardType | 'all') => void;
  setSearchQuery: (q: string) => void;
  setError: (msg: string | null) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  cards: [],
  cases: [],
  loading: false,
  error: null,
  filterType: 'all',
  searchQuery: '',

  fetchCards: async () => {
    set({ loading: true, error: null });
    try {
      const cards = await cardsApi.list();
      set({ cards, loading: false });
    } catch {
      set({ error: 'カードの読み込みに失敗しました', loading: false });
    }
  },

  fetchCases: async () => {
    try {
      const cases = await casesApi.list();
      set({ cases });
    } catch {
      set({ error: '案件の読み込みに失敗しました' });
    }
  },

  createCard: async (data) => {
    const card = await cardsApi.create(data);
    set((s) => ({ cards: [card, ...s.cards] }));
    return card;
  },

  updateCard: async (id, data) => {
    const updated = await cardsApi.update(id, data);
    set((s) => ({ cards: s.cards.map((c) => (String(c.id) === String(id) ? updated : c)) }));
  },

  deleteCard: async (id) => {
    await cardsApi.delete(id);
    set((s) => ({ cards: s.cards.filter((c) => String(c.id) !== String(id)) }));
  },

  createCase: async (data) => {
    const c = await casesApi.create(data);
    set((s) => ({ cases: [c, ...s.cases] }));
    return c;
  },

  updateCase: async (id, data) => {
    const updated = await casesApi.update(id, data);
    set((s) => ({ cases: s.cases.map((c) => (String(c.id) === String(id) ? updated : c)) }));
  },

  deleteCase: async (id) => {
    await casesApi.delete(id);
    set((s) => ({ cases: s.cases.filter((c) => String(c.id) !== String(id)) }));
  },

  setFilterType: (type) => set({ filterType: type }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setError: (msg) => set({ error: msg }),

  // 派生: フィルタリング済みカード（コンポーネント側でuseMemoと組み合わせて使う）
  get filteredCards() {
    const { cards, filterType, searchQuery } = get();
    return cards
      .filter((c) => filterType === 'all' || c.type === filterType)
      .filter((c) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
  },
}));

import { LANG } from '../config';

export type CardType = 'customer' | 'sales' | 'operations';

const CARD_TYPE_LABELS_MAP = {
  ja: { customer: '顧客', sales: '営業', operations: '業務' },
  en: { customer: 'Customer', sales: 'Sales', operations: 'Operations' },
} as const;

export const CARD_TYPE_LABELS: Record<CardType, string> = CARD_TYPE_LABELS_MAP[LANG];

export const CARD_TYPE_COLORS: Record<CardType, { bg: string; border: string; text: string; badge: string }> = {
  customer: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    badge: 'bg-blue-100 text-blue-700',
  },
  sales: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    badge: 'bg-green-100 text-green-700',
  },
  operations: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-700',
  },
};

export interface ContextCard {
  id: string | number;
  type: CardType;
  title: string;
  content: string;
  tags: string[];
  sourceText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextCase {
  id: string | number;
  name: string;
  description: string;
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionDraft {
  type: CardType;
  title: string;
  content: string;
}

export interface ExportLog {
  id: string | number;
  caseId: string | number;
  caseName: string;
  mergedContent: string;
  sourceCardIds: (string | number)[];
  createdAt: string;
}

export interface ImportLog {
  id: string | number;
  targetCardId: string | number;
  sourceCardId: string | number;
  sourceLang: 'ja' | 'en';
  importType: 'append' | 'new_card';
  importedAt: string;
}

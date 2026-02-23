import { useState } from 'react';
import type { ContextCard, CardType } from '../../types';
import { CARD_TYPE_LABELS } from '../../types';
import { CardTypeTag } from './CardTypeTag';
import { t } from '../../i18n';
import { LANG } from '../../config';

interface Props {
  initial: Partial<ContextCard>;
  onSave: (data: Omit<ContextCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel?: () => void;
}

export function CardEditor({ initial, onSave, onCancel }: Props) {
  const [type, setType] = useState<CardType>(initial.type ?? 'customer');
  const [title, setTitle] = useState(initial.title ?? '');
  const [content, setContent] = useState(initial.content ?? '');
  const [tagsInput, setTagsInput] = useState((initial.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titlePlaceholder = LANG === 'en'
    ? `${CARD_TYPE_LABELS[type]} Context: Company / Deal`
    : `${CARD_TYPE_LABELS[type]}コンテクスト：〇〇社 / 〇〇案件`;

  const handleSave = async () => {
    if (!title.trim()) { setError(t('titleRequired')); return; }
    if (!content.trim()) { setError(t('contentRequired')); return; }
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean);
      await onSave({ type, title: title.trim(), content: content.trim(), tags, sourceText: initial.sourceText });
    } catch {
      setError(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('cardTypeLabel')}</label>
        <div className="flex gap-2">
          {(['customer', 'sales', 'operations'] as CardType[]).map((cardType) => (
            <button
              key={cardType}
              onClick={() => setType(cardType)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border-2 transition-colors ${
                type === cardType ? 'border-gray-800' : 'border-transparent opacity-60 hover:opacity-80'
              }`}
            >
              <CardTypeTag type={cardType} size="sm" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('titleLabel')}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={titlePlaceholder}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('contentLabel')}</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          placeholder={t('contentPlaceholder')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('tagsLabel')}</label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder={t('tagsExamplePlaceholder')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? t('savingBtn') : t('saveBtn')}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="border border-gray-300 text-gray-600 px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {t('cancelBtn')}
          </button>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { ExtractionDraft, CardType } from '../../types';
import { CARD_TYPE_COLORS } from '../../types';
import { CardTypeTag } from '../cards/CardTypeTag';
import { t } from '../../i18n';

interface Props {
  draft: ExtractionDraft;
  onSave: (draft: ExtractionDraft & { tags: string[] }) => Promise<void>;
  onSkip: () => void;
  saved: boolean;
}

export function DraftCard({ draft, onSave, onSkip, saved }: Props) {
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const colors = CARD_TYPE_COLORS[draft.type as CardType];

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean);
      await onSave({ ...draft, title, content, tags });
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className={`rounded-lg border-2 p-4 ${colors.bg} ${colors.border} opacity-60`}>
        <CardTypeTag type={draft.type as CardType} size="sm" />
        <p className="mt-2 text-sm text-gray-500">{t('savedMark')}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 p-4 ${colors.bg} ${colors.border} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <CardTypeTag type={draft.type as CardType} />
        <button onClick={onSkip} className="text-xs text-gray-400 hover:text-gray-600">
          {t('skipBtn')}
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-medium bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
        placeholder={t('titlePlaceholder')}
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={14}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono leading-relaxed bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
      />

      <input
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder={t('tagsPlaceholder')}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-indigo-600 text-white py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {saving ? t('savingBtn') : t('saveCardBtn')}
      </button>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import type { ContextCard as IContextCard } from '../../types';
import { CARD_TYPE_COLORS } from '../../types';
import { CardTypeTag } from './CardTypeTag';
import { t } from '../../i18n';
import { LOCALE } from '../../config';

interface Props {
  card: IContextCard;
  onDelete?: (id: string | number) => void;
}

export function ContextCard({ card, onDelete }: Props) {
  const navigate = useNavigate();
  const colors = CARD_TYPE_COLORS[card.type];
  const preview = card.content.split('\n').slice(0, 5).join('\n');

  return (
    <div
      className={`rounded-lg border-2 p-4 cursor-pointer transition-shadow hover:shadow-md ${colors.bg} ${colors.border}`}
      onClick={() => navigate(`/cards/${card.id}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <CardTypeTag type={card.type} size="sm" />
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
            className="text-gray-400 hover:text-red-500 text-xs leading-none"
            title={t('deleteBtn')}
          >
            ✕
          </button>
        )}
      </div>
      <h3 className={`font-semibold text-sm mb-2 leading-snug ${colors.text}`}>{card.title}</h3>
      <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line line-clamp-4">
        {preview}
      </p>
      {card.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <span key={tag} className="text-xs bg-white/70 text-gray-500 px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-gray-400">
        {new Date(card.updatedAt).toLocaleDateString(LOCALE)}
      </p>
    </div>
  );
}

import type { CardType } from '../../types';
import { CARD_TYPE_LABELS, CARD_TYPE_COLORS } from '../../types';

interface Props {
  type: CardType;
  size?: 'sm' | 'md';
}

export function CardTypeTag({ type, size = 'md' }: Props) {
  const colors = CARD_TYPE_COLORS[type];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';
  return (
    <span className={`inline-block rounded font-medium ${sizeClass} ${colors.badge}`}>
      {CARD_TYPE_LABELS[type]}
    </span>
  );
}

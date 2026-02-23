import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { CardType } from '../../types';
import { CARD_TYPE_LABELS, CARD_TYPE_COLORS } from '../../types';
import { t } from '../../i18n';
import { INSTANCE_LABEL, LANG } from '../../config';

const TYPE_FILTER_VALUES: (CardType | 'all')[] = ['all', 'customer', 'sales', 'operations'];

export function Sidebar() {
  const { cards, filterType, setFilterType } = useStore();
  const navigate = useNavigate();

  const counts: Record<string, number> = {
    all: cards.length,
    customer: cards.filter((c) => c.type === 'customer').length,
    sales: cards.filter((c) => c.type === 'sales').length,
    operations: cards.filter((c) => c.type === 'operations').length,
  };

  return (
    <aside className="w-56 shrink-0 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-700">
        {LANG === 'en' ? (
          <h1 className="text-base font-bold leading-tight">
            Context<br />
            <span className="text-indigo-400">Collection</span>
          </h1>
        ) : (
          <h1 className="text-base font-bold leading-tight">
            文脈<br />
            <span className="text-indigo-400">コレクション</span>
          </h1>
        )}
        <p className="text-xs text-gray-500 mt-1">{t('appSubtitle')}</p>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        <NavLink
          to="/extract"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`
          }
        >
          <span>＋</span> {t('newExtract')}
        </NavLink>

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`
          }
        >
          {t('cardList')}
        </NavLink>

        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('filter')}</p>
        </div>

        {TYPE_FILTER_VALUES.map((value) => {
          const colors = value !== 'all' ? CARD_TYPE_COLORS[value as CardType] : null;
          const label = value === 'all' ? t('all') : CARD_TYPE_LABELS[value as CardType];
          return (
            <button
              key={value}
              onClick={() => { setFilterType(value); navigate('/'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterType === value
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                {colors && (
                  <span className={`w-2 h-2 rounded-full ${colors.badge.split(' ')[0]}`} />
                )}
                {label}
              </span>
              <span className="text-xs text-gray-500">{counts[value]}</span>
            </button>
          );
        })}

        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('cases')}</p>
        </div>
        <NavLink
          to="/cases"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`
          }
        >
          {t('cases')}
        </NavLink>
      </nav>

      <div className="p-3 border-t border-gray-700 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`
          }
        >
          <span>⚙</span> {t('promptSettings')}
        </NavLink>
        <p className="text-xs text-gray-600 px-3 pt-1">v0.1.0 · {INSTANCE_LABEL}</p>
      </div>
    </aside>
  );
}

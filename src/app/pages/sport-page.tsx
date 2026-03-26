import { useParams } from 'react-router';
import { markets, categories } from '../data/sports-data';
import { MarketCard } from '../components/market-card';
import { LiveStandings } from '../components/live-standings';
import { UpcomingMeets } from '../components/upcoming-meets';
import { useState } from 'react';

export function SportPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [tab, setTab] = useState<'markets' | 'standings' | 'schedule'>('markets');
  const category = categories.find(c => c.id === categoryId);
  const filtered = markets.filter(m => m.categoryId === categoryId);

  if (!category) {
    return <p className="text-center text-gray-400 py-12">Category not found</p>;
  }

  // Only show standings/schedule tabs for NCAA/GymACT categories
  const showDataTabs = ['womens-ncaa', 'mens-ncaa', 'gymact'].includes(categoryId || '');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{category.icon} {category.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
      </div>

      {showDataTabs && (
        <div className="flex gap-1 border-b border-gray-200 -mx-4 px-4">
          {(['markets', 'standings', 'schedule'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {t === 'standings' ? 'Rankings' : t}
            </button>
          ))}
        </div>
      )}

      {tab === 'markets' && (
        <>
          <p className="text-xs text-gray-400">{filtered.length} markets</p>
          <div className="space-y-2">
            {filtered.map(market => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-12">No markets in this category yet</p>
          )}
        </>
      )}

      {tab === 'standings' && <LiveStandings />}
      {tab === 'schedule' && <UpcomingMeets />}
    </div>
  );
}

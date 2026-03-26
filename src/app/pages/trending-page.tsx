import { markets } from '../data/sports-data';
import { MarketCard } from '../components/market-card';

export function TrendingPage() {
  const trending = markets.filter(m => m.isTrending);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Trending Markets</h1>
      <div className="space-y-2">
        {trending.map(m => <MarketCard key={m.id} market={m} />)}
      </div>
    </div>
  );
}

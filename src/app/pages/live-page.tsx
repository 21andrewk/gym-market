import { markets } from '../data/sports-data';
import { MarketCard } from '../components/market-card';

export function LivePage() {
  const live = markets.filter(m => m.isLive);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Live Markets</h1>
      <div className="space-y-2">
        {live.map(m => <MarketCard key={m.id} market={m} />)}
      </div>
      {live.length === 0 && <p className="text-center text-gray-400 py-12 text-sm">No live markets right now</p>}
    </div>
  );
}

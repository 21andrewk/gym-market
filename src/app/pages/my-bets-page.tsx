import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { useWallet } from '../context/wallet-context';
import { fetchTrades, Trade } from '../data/trade-service';
import { markets } from '../data/sports-data';
import { Link } from 'react-router';

export function MyBetsPage() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchTrades(user.id)
      .then(setTrades)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-gray-500">Sign in to view your portfolio</p>
        <Link to="/signin" className="text-blue-600 text-sm hover:underline">Sign In</Link>
      </div>
    );
  }

  const totalSpent = trades.reduce((s, t) => s + t.total_cost, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <span className="text-sm font-semibold text-amber-600">🪙 {balance.toLocaleString()} gold</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400">Total Invested</p>
          <p className="text-lg font-bold text-gray-900">🪙 {totalSpent.toLocaleString()}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400">Open Positions</p>
          <p className="text-lg font-bold text-gray-900">{trades.filter(t => t.status === 'open').length}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">Loading trades...</p>
      ) : trades.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No trades yet</p>
          <p className="text-xs text-gray-300 mt-1">Click Yes or No on any market to place your first trade</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trades.map(trade => {
            const market = markets.find(m => m.id === trade.market_id);
            return (
              <Link
                key={trade.id}
                to={`/market/${trade.market_id}`}
                className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {market?.question || trade.market_id}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span className={`font-semibold px-1.5 py-0.5 rounded ${
                      trade.side === 'YES' ? 'bg-emerald-100 text-emerald-700'
                      : trade.side === 'NO' ? 'bg-rose-100 text-rose-700'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                      {trade.side}
                    </span>
                    <span>{trade.shares} shares @ {trade.price_per_share}¢</span>
                    <span className="text-gray-300">·</span>
                    <span>{new Date(trade.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-600 shrink-0">
                  🪙 {trade.total_cost.toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

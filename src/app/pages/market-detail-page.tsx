import { useParams, Link } from 'react-router';
import { markets, categories } from '../data/sports-data';
import { useBetSlip } from '../context/bet-slip-context';
import { useWallet } from '../context/wallet-context';
import { useAuth } from '../context/auth-context';
import { placeTrade } from '../data/trade-service';
import { AuthPromptModal, useAuthPrompt } from '../components/auth-prompt-modal';
import { useState } from 'react';
import { toast } from 'sonner';

export function MarketDetailPage() {
  const { marketId } = useParams<{ marketId: string }>();
  const { addToBetSlip } = useBetSlip();
  const { balance, refreshBalance } = useWallet();
  const { user } = useAuth();
  const authPrompt = useAuthPrompt();
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('25');
  const [placing, setPlacing] = useState(false);

  const market = markets.find(m => m.id === marketId);
  const category = market ? categories.find(c => c.id === market.categoryId) : null;

  if (!market || !category) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Market not found</p>
        <Link to="/" className="text-blue-600 text-sm mt-2 inline-block">Back to markets</Link>
      </div>
    );
  }

  const noPrice = 100 - market.yesPrice;
  const shares = parseFloat(amount) || 0;
  const price = side === 'YES' ? market.yesPrice : noPrice;
  const costGold = Math.round(shares * price / 10);
  const payoutGold = Math.round(shares * 10);
  const profitGold = payoutGold - costGold;
  const canAfford = costGold <= balance;

  const vol = market.volume >= 1000000
    ? `$${(market.volume / 1000000).toFixed(1)}M`
    : `$${(market.volume / 1000).toFixed(0)}K`;

  const handleTrade = async () => {
    if (!user) { authPrompt.show(); return; }
    if (shares <= 0) return;
    setPlacing(true);
    try {
      await placeTrade(market.id, side, shares, price, user.id);
      toast.success(`Bought ${shares} ${side} shares for 🪙 ${costGold.toLocaleString()} gold`);
      await refreshBalance();
    } catch (err: any) {
      toast.error(err.message || 'Trade failed');
    } finally {
      setPlacing(false);
    }
  };

  const handleOutcomeTrade = async (name: string, outcomePrice: number) => {
    if (!user) { authPrompt.show(); return; }
    const oCostGold = Math.round(shares * outcomePrice / 10);
    setPlacing(true);
    try {
      await placeTrade(market.id, name, shares, outcomePrice, user.id);
      toast.success(`Bought ${name} for 🪙 ${oCostGold.toLocaleString()} gold`);
      await refreshBalance();
    } catch (err: any) {
      toast.error(err.message || 'Trade failed');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
    <AuthPromptModal open={authPrompt.open} onClose={authPrompt.close} />
    <div className="space-y-6">
      <Link to={`/category/${category.id}`} className="text-sm text-blue-600 hover:underline">
        &larr; {category.name}
      </Link>

      <div>
        <div className="flex items-start gap-3">
          {market.imageEmoji && <span className="text-3xl">{market.imageEmoji}</span>}
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{market.question}</h1>
            {market.description && <p className="text-sm text-gray-500 mt-2">{market.description}</p>}
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              {market.isLive && <span className="text-red-500 font-medium">LIVE</span>}
              <span>{vol} volume</span>
              <span>Ends {market.endDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-outcome */}
      {market.outcomes && market.outcomes.length > 0 ? (
        <div className="space-y-2">
          {market.outcomes.map((o, i) => (
            <button
              key={i}
              onClick={() => handleOutcomeTrade(o.name, o.price)}
              disabled={placing}
              className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <span className="text-sm font-medium text-gray-900">{o.name}</span>
              <div className="flex items-center gap-3">
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${o.price}%` }} />
                </div>
                <span className="text-sm font-bold text-blue-600 w-10 text-right">{o.price}%</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-emerald-600">{market.yesPrice}¢</p>
              <p className="text-xs text-gray-400">Yes</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-rose-600">{noPrice}¢</p>
              <p className="text-xs text-gray-400">No</p>
            </div>
          </div>

          {!user ? (
            <div className="text-center space-y-3 py-2">
              <p className="text-sm text-gray-500">Sign up to trade this market</p>
              <Link
                to="/signup"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors"
              >
                Sign Up — Get 🪙 10,000 Gold Free
              </Link>
              <p className="text-xs text-gray-400">
                Already have an account? <Link to="/signin" className="text-blue-600 hover:underline">Sign In</Link>
              </p>
            </div>
          ) : (
          <>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSide('YES')}
              className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                side === 'YES' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Buy Yes
            </button>
            <button
              onClick={() => setSide('NO')}
              className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                side === 'NO' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Buy No
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Shares</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              min="1"
            />
            <div className="flex gap-1.5 mt-2">
              {[10, 25, 50, 100].map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(a.toString())}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Cost</span>
              <span className="font-medium text-amber-700">🪙 {costGold.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payout if correct</span>
              <span className="font-semibold text-emerald-600">🪙 {payoutGold.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Profit</span>
              <span className="font-semibold text-emerald-600">+🪙 {profitGold.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-amber-200">
              <span className="text-gray-400">Your balance</span>
              <span className="text-amber-600">🪙 {balance.toLocaleString()}</span>
            </div>
          </div>

          {!canAfford && <p className="text-xs text-rose-500 text-center">Not enough gold</p>}

          <button
            onClick={handleTrade}
            disabled={shares <= 0 || !canAfford || placing}
            className={`w-full py-3 rounded-lg text-sm font-semibold text-white transition-colors ${
              side === 'YES' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            } disabled:opacity-40`}
          >
            {placing ? 'Placing...' : `Buy ${side} · 🪙 ${costGold.toLocaleString()} gold`}
          </button>
          <p className="text-[11px] text-gray-400 text-center">Each share pays 🪙 10 gold if correct</p>
          </>
          )}
        </div>
      )}
    </div>
    </>
  );
}

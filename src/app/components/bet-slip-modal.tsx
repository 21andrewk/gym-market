import { useState } from 'react';
import { useBetSlip } from '../context/bet-slip-context';
import { useWallet } from '../context/wallet-context';
import { useAuth } from '../context/auth-context';
import { placeTrade } from '../data/trade-service';
import { X, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router';

export function BetSlipModal() {
  const { betSlipItems, removeFromBetSlip, clearBetSlip, shares, setShares } = useBetSlip();
  const { balance, refreshBalance } = useWallet();
  const { user } = useAuth();
  const [customShares, setCustomShares] = useState(shares.toString());
  const [isOpen, setIsOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  const handleSharesChange = (value: string) => {
    setCustomShares(value);
    const n = parseFloat(value);
    if (!isNaN(n) && n > 0) setShares(n);
  };

  const totalCost = betSlipItems.reduce((s, item) => s + shares * (item.odds / 100), 0);
  const totalPayout = betSlipItems.length * shares;
  const totalCostGold = Math.round(totalCost * 10);
  const totalPayoutGold = Math.round(totalPayout * 10);
  const canAfford = totalCostGold <= balance;

  const handlePlace = async () => {
    if (!user || betSlipItems.length === 0) return;
    setPlacing(true);
    try {
      for (const item of betSlipItems) {
        await placeTrade(item.eventId, item.description.split(' @')[0], shares, item.odds, user.id);
      }
      toast.success(`Spent ${totalCostGold.toLocaleString()} gold on ${betSlipItems.length} position(s)`);
      clearBetSlip();
      await refreshBalance();
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Trade failed');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-3 shadow-lg transition-colors z-40 flex items-center gap-2 text-sm font-medium"
      >
        <ShoppingCart className="size-4" />
        {betSlipItems.length > 0 && (
          <span className="bg-white text-blue-600 font-bold text-xs px-1.5 py-0.5 rounded-full">
            {betSlipItems.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Trade Slip</h2>
              <div className="flex gap-2">
                {betSlipItems.length > 0 && (
                  <button onClick={clearBetSlip} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {!user ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-gray-500">Sign up to start trading</p>
                  <p className="text-xs text-gray-400">Get 🪙 10,000 gold free</p>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                  >
                    Sign Up Free
                  </Link>
                </div>
              ) : betSlipItems.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  Click Yes or No on any market to start
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {betSlipItems.map(item => {
                      const isYes = item.description.includes('YES');
                      return (
                        <div key={item.id} className="flex items-start justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex-1 mr-2">
                            <p className="text-xs text-gray-700 leading-snug">{item.team}</p>
                            <span className={`text-[10px] font-semibold mt-1 inline-block px-1.5 py-0.5 rounded ${
                              isYes ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {item.description}
                            </span>
                          </div>
                          <button onClick={() => removeFromBetSlip(item.id)} className="text-gray-300 hover:text-gray-500">
                            <X className="size-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Shares per position</label>
                    <input
                      type="number"
                      value={customShares}
                      onChange={e => handleSharesChange(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      min="1"
                    />
                    <div className="flex gap-1.5 mt-1.5">
                      {[10, 25, 50, 100].map(a => (
                        <button
                          key={a}
                          onClick={() => handleSharesChange(a.toString())}
                          className="flex-1 text-xs py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cost</span>
                      <span className="font-medium text-amber-700">🪙 {totalCostGold.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payout if correct</span>
                      <span className="font-semibold text-emerald-600">🪙 {totalPayoutGold.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-amber-200">
                      <span className="text-gray-400">Your balance</span>
                      <span className="text-amber-600">🪙 {balance.toLocaleString()}</span>
                    </div>
                  </div>

                  {!canAfford && <p className="text-xs text-rose-500 text-center">Not enough gold</p>}

                  <button
                    onClick={handlePlace}
                    disabled={!canAfford || shares <= 0 || placing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-sm font-semibold transition-colors disabled:opacity-40"
                  >
                    {placing ? 'Placing...' : `Buy · 🪙 ${totalCostGold.toLocaleString()} gold`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

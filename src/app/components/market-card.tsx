import { Market } from '../data/sports-data';
import { useBetSlip } from '../context/bet-slip-context';
import { useAuth } from '../context/auth-context';
import { AuthPromptModal, useAuthPrompt } from './auth-prompt-modal';
import { Link } from 'react-router';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const { addToBetSlip } = useBetSlip();
  const { user } = useAuth();
  const authPrompt = useAuthPrompt();

  const vol = market.volume >= 1000000
    ? `$${(market.volume / 1000000).toFixed(1)}M`
    : `$${(market.volume / 1000).toFixed(0)}K`;

  const handleBet = (side: 'YES' | 'NO', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { authPrompt.show(); return; }
    const price = side === 'YES' ? market.yesPrice : 100 - market.yesPrice;
    addToBetSlip({
      id: `${market.id}-${side}-${Date.now()}`,
      eventId: market.id,
      sportId: market.categoryId,
      description: `${side} @ ${price}¢`,
      team: market.question,
      odds: price,
      eventDetails: market.question,
    });
  };

  const handleOutcome = (name: string, price: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { authPrompt.show(); return; }
    addToBetSlip({
      id: `${market.id}-${name}-${Date.now()}`,
      eventId: market.id,
      sportId: market.categoryId,
      description: `${name} @ ${price}¢`,
      team: name,
      odds: price,
      eventDetails: market.question,
    });
  };

  // Multi-outcome market
  if (market.outcomes && market.outcomes.length > 0) {
    return (
      <>
        <AuthPromptModal open={authPrompt.open} onClose={authPrompt.close} />
        <Link to={`/market/${market.id}`} className="block border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
          <div className="flex items-start gap-3 mb-3">
            {market.imageEmoji && <span className="text-xl">{market.imageEmoji}</span>}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 leading-snug">{market.question}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                {market.isLive && <span className="text-red-500 font-medium">LIVE</span>}
                <span>{vol} Vol</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {market.outcomes.slice(0, 5).map((o, i) => (
              <button
                key={i}
                onClick={(e) => handleOutcome(o.name, o.price, e)}
                className="w-full flex items-center justify-between rounded-lg px-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm text-gray-700">{o.name}</span>
                <span className="text-sm font-semibold text-blue-600">{o.price}%</span>
              </button>
            ))}
          </div>
        </Link>
      </>
    );
  }

  // Yes/No market
  const noPrice = 100 - market.yesPrice;

  return (
    <>
      <AuthPromptModal open={authPrompt.open} onClose={authPrompt.close} />
      <Link to={`/market/${market.id}`} className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors">
        {market.imageEmoji && <span className="text-xl shrink-0">{market.imageEmoji}</span>}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 leading-snug truncate">{market.question}</h3>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
            {market.isLive && <span className="text-red-500 font-medium">LIVE</span>}
            <span>{vol}</span>
            <span>{market.endDate}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={(e) => handleBet('YES', e)}
            className="flex flex-col items-center bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 transition-colors min-w-[58px]"
          >
            <span className="text-[10px] text-emerald-600 font-medium">Yes</span>
            <span className="text-sm font-bold text-emerald-700">{market.yesPrice}¢</span>
          </button>
          <button
            onClick={(e) => handleBet('NO', e)}
            className="flex flex-col items-center bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg px-3 py-1.5 transition-colors min-w-[58px]"
          >
            <span className="text-[10px] text-rose-600 font-medium">No</span>
            <span className="text-sm font-bold text-rose-700">{noPrice}¢</span>
          </button>
        </div>
      </Link>
    </>
  );
}

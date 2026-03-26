import { supabase, isSupabaseConfigured } from './supabase';

export interface Trade {
  id: string;
  user_id: string;
  market_id: string;
  side: string;
  shares: number;
  price_per_share: number;
  total_cost: number;
  status: string;
  created_at: string;
}

// Place a trade — returns trade ID or throws
export async function placeTrade(
  marketId: string,
  side: string,
  shares: number,
  pricePerShare: number,
  userId: string
): Promise<string> {
  const totalCost = Math.round(shares * pricePerShare / 10);

  if (!isSupabaseConfigured) {
    // Fallback: localStorage
    const balKey = `gymmarket-balance-${userId}`;
    const saved = localStorage.getItem(balKey);
    const balance = saved ? parseInt(saved) : 10000;
    if (balance < totalCost) throw new Error('Insufficient balance');

    localStorage.setItem(balKey, (balance - totalCost).toString());

    const trade: Trade = {
      id: crypto.randomUUID(),
      user_id: userId,
      market_id: marketId,
      side,
      shares,
      price_per_share: pricePerShare,
      total_cost: totalCost,
      status: 'open',
      created_at: new Date().toISOString(),
    };

    const tradesKey = `gymmarket-trades-${userId}`;
    const existing = JSON.parse(localStorage.getItem(tradesKey) || '[]');
    existing.unshift(trade);
    localStorage.setItem(tradesKey, JSON.stringify(existing));

    return trade.id;
  }

  // Supabase: atomic RPC
  const { data, error } = await supabase.rpc('place_trade', {
    p_market_id: marketId,
    p_side: side,
    p_shares: shares,
    p_price_per_share: pricePerShare,
  });

  if (error) throw new Error(error.message);
  return data as string;
}

// Fetch user's trades
export async function fetchTrades(userId: string): Promise<Trade[]> {
  if (!isSupabaseConfigured) {
    const tradesKey = `gymmarket-trades-${userId}`;
    return JSON.parse(localStorage.getItem(tradesKey) || '[]');
  }

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// Fetch user balance
export async function fetchBalance(userId: string): Promise<number> {
  if (!isSupabaseConfigured) {
    const saved = localStorage.getItem(`gymmarket-balance-${userId}`);
    return saved ? parseInt(saved) : 10000;
  }

  const { data } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  return data?.balance || 0;
}

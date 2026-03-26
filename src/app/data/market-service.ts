import { supabase, isSupabaseConfigured } from './supabase';
import { markets as hardcodedMarkets, categories as hardcodedCategories, Market, MarketCategory } from './sports-data';

// Fetch all markets (Supabase or fallback to hardcoded)
export async function fetchMarkets(): Promise<Market[]> {
  if (!isSupabaseConfigured) return hardcodedMarkets;

  const { data: marketsData, error } = await supabase
    .from('markets')
    .select('*')
    .order('volume', { ascending: false });

  if (error || !marketsData) return hardcodedMarkets;

  // Fetch outcomes for multi-outcome markets
  const { data: outcomesData } = await supabase
    .from('market_outcomes')
    .select('*');

  const outcomesMap = new Map<string, { name: string; price: number }[]>();
  (outcomesData || []).forEach((o: any) => {
    if (!outcomesMap.has(o.market_id)) outcomesMap.set(o.market_id, []);
    outcomesMap.get(o.market_id)!.push({ name: o.name, price: o.price });
  });

  return marketsData.map((m: any) => ({
    id: m.id,
    categoryId: m.category_id,
    question: m.question,
    description: m.description,
    yesPrice: m.yes_price,
    volume: m.volume,
    endDate: m.end_date,
    isLive: m.is_live,
    isFeatured: m.is_featured,
    isTrending: m.is_trending,
    tags: m.tags || [],
    imageEmoji: m.image_emoji,
    outcomes: outcomesMap.get(m.id),
  }));
}

// Fetch single market
export async function fetchMarket(marketId: string): Promise<Market | undefined> {
  if (!isSupabaseConfigured) {
    return hardcodedMarkets.find(m => m.id === marketId);
  }

  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('id', marketId)
    .single();

  if (error || !data) return hardcodedMarkets.find(m => m.id === marketId);

  const { data: outcomes } = await supabase
    .from('market_outcomes')
    .select('name, price')
    .eq('market_id', marketId);

  return {
    id: data.id,
    categoryId: data.category_id,
    question: data.question,
    description: data.description,
    yesPrice: data.yes_price,
    volume: data.volume,
    endDate: data.end_date,
    isLive: data.is_live,
    isFeatured: data.is_featured,
    isTrending: data.is_trending,
    tags: data.tags || [],
    imageEmoji: data.image_emoji,
    outcomes: outcomes && outcomes.length > 0 ? outcomes : undefined,
  };
}

// Categories stay client-side (no need for DB)
export function getCategories(): MarketCategory[] {
  return hardcodedCategories;
}

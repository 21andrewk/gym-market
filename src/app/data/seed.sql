-- ============================================
-- GymMarkets Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  balance integer not null default 10000,
  created_at timestamptz default now()
);

-- 2. Markets table
create table if not exists public.markets (
  id text primary key,
  category_id text not null,
  question text not null,
  description text,
  yes_price integer not null default 50,
  volume integer not null default 0,
  end_date text,
  is_live boolean default false,
  is_featured boolean default false,
  is_trending boolean default false,
  tags text[] default '{}',
  image_emoji text,
  created_at timestamptz default now()
);

-- 3. Market outcomes (for multi-outcome markets)
create table if not exists public.market_outcomes (
  id uuid default gen_random_uuid() primary key,
  market_id text references public.markets(id) on delete cascade not null,
  name text not null,
  price integer not null default 0
);

-- 4. Trades table
create table if not exists public.trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  market_id text references public.markets(id) on delete cascade not null,
  side text not null,
  shares integer not null,
  price_per_share integer not null,
  total_cost integer not null,
  status text not null default 'open',
  created_at timestamptz default now()
);

-- 5. Transactions ledger
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  type text not null,
  trade_id uuid references public.trades(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================
-- Row Level Security
-- ============================================

alter table public.profiles enable row level security;
alter table public.markets enable row level security;
alter table public.market_outcomes enable row level security;
alter table public.trades enable row level security;
alter table public.transactions enable row level security;

-- Profiles: users can read all, update own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Markets: everyone can read
create policy "Markets are viewable by everyone" on public.markets for select using (true);

-- Market outcomes: everyone can read
create policy "Market outcomes are viewable by everyone" on public.market_outcomes for select using (true);

-- Trades: users can read own, insert own
create policy "Users can view own trades" on public.trades for select using (auth.uid() = user_id);
create policy "Users can insert own trades" on public.trades for insert with check (auth.uid() = user_id);

-- Transactions: users can read own
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);

-- ============================================
-- Function: Create profile on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, balance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    10000
  );
  -- Record the signup bonus
  insert into public.transactions (user_id, amount, type)
  values (new.id, 10000, 'signup_bonus');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: auto-create profile on auth signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Function: Place a trade (atomic)
-- ============================================

create or replace function public.place_trade(
  p_market_id text,
  p_side text,
  p_shares integer,
  p_price_per_share integer
)
returns uuid as $$
declare
  v_total_cost integer;
  v_balance integer;
  v_trade_id uuid;
begin
  v_total_cost := p_shares * p_price_per_share / 10; -- convert to gold

  -- Get current balance
  select balance into v_balance from public.profiles where id = auth.uid();
  if v_balance is null then
    raise exception 'User not found';
  end if;

  if v_balance < v_total_cost then
    raise exception 'Insufficient balance';
  end if;

  -- Deduct balance
  update public.profiles set balance = balance - v_total_cost where id = auth.uid();

  -- Create trade
  insert into public.trades (user_id, market_id, side, shares, price_per_share, total_cost, status)
  values (auth.uid(), p_market_id, p_side, p_shares, p_price_per_share, v_total_cost, 'open')
  returning id into v_trade_id;

  -- Record transaction
  insert into public.transactions (user_id, amount, type, trade_id)
  values (auth.uid(), -v_total_cost, 'trade', v_trade_id);

  -- Update market volume
  update public.markets set volume = volume + v_total_cost where id = p_market_id;

  return v_trade_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- Seed: Categories are client-side only
-- Seed: Markets data
-- ============================================

-- Women's NCAA
insert into public.markets (id, category_id, question, description, yes_price, volume, end_date, is_live, is_featured, is_trending, tags, image_emoji) values
('wncaa-champ', 'womens-ncaa', 'Which team wins the 2026 NCAA Women''s Gymnastics Championship?', 'Oklahoma leads NQS at 197.980, followed by LSU (197.920) and Florida (197.753). Nationals in Fort Worth, Apr 16-18.', 0, 1845000, 'Apr 18, 2026', false, true, true, '{"Championship","Nationals"}', '🏆'),
('wncaa-ou', 'womens-ncaa', 'Will Oklahoma win the 2026 NCAA title?', 'OU leads the nation with a 197.980 NQS. They''re the #1 overall seed heading into regionals in Baton Rouge.', 30, 923000, 'Apr 18, 2026', false, true, true, '{"Oklahoma","NQS #1"}', '🟥'),
('wncaa-lsu', 'womens-ncaa', 'Will LSU win the 2026 NCAA title?', 'LSU is #2 in NQS at 197.920, led by Kailin Chio who has the top AA NQS (39.725).', 26, 867000, 'Apr 18, 2026', false, true, true, '{"LSU","NQS #2","Kailin Chio"}', '🐯'),
('wncaa-uf', 'womens-ncaa', 'Will Florida make the NCAA Final Four?', 'Florida is #3 in NQS at 197.753. Selena Harris-Miranda earned her 10th career perfect 10 at SEC Championships.', 72, 412000, 'Apr 5, 2026', false, false, true, '{"Florida","NQS #3"}', '🐊'),
('wncaa-ucla', 'womens-ncaa', 'Will UCLA make the NCAA Final Four?', 'UCLA is #4 in NQS at 197.540. Jordan Chiles has scored perfect 10s on vault and floor five consecutive weeks.', 64, 356000, 'Apr 5, 2026', false, false, true, '{"UCLA","NQS #4","Jordan Chiles"}', '🐻'),
('wncaa-bama', 'womens-ncaa', 'Will Alabama finish top 4 at Nationals?', 'Alabama is #5 NQS (197.498). Chloe LaCoursiere leads the nation on bars with a 9.955 NQS.', 35, 278000, 'Apr 18, 2026', false, false, false, '{"Alabama","NQS #5"}', '🐘'),
('wncaa-upset', 'womens-ncaa', 'Will a team ranked 7th or lower in NQS make the Final Four?', 'Stanford (#7, 197.248), Missouri (#8, 197.178), or Arkansas (#9, 197.170) could be dark horses.', 28, 345000, 'Apr 5, 2026', false, false, false, '{"Upset","Dark Horse"}', '🐎'),
('wncaa-ark', 'womens-ncaa', 'Will Arkansas advance past Regionals?', 'Arkansas (#9 NQS, 197.170) had Morgan Price earn their first-ever perfect 10 on vault this season.', 58, 189000, 'Apr 5, 2026', false, false, false, '{"Arkansas","Morgan Price"}', '🐗');

-- Men's NCAA
insert into public.markets (id, category_id, question, description, yes_price, volume, end_date, is_live, is_featured, is_trending, tags, image_emoji) values
('mncaa-champ', 'mens-ncaa', 'Which team wins the 2026 NCAA Men''s Gymnastics Championship?', 'Oklahoma posted 331.600 (season-high). Michigan won 2025 title (332.224).', 0, 678000, 'Apr 18, 2026', false, true, false, '{"Championship","Mens"}', '🏆'),
('mncaa-fred', 'mens-ncaa', 'Will Fred Richard (Michigan) win the NCAA all-around title?', 'Richard leads the nation with an 83.650 AA score. Also leads on floor (14.050).', 38, 412000, 'Apr 18, 2026', false, true, true, '{"Fred Richard","Michigan","All-Around"}', '〽️'),
('mncaa-hong', 'mens-ncaa', 'Will Asher Hong (Stanford) win an individual NCAA event title?', 'Hong leads on still rings (14.450) and is tied for #1 on vault (14.400).', 62, 334000, 'Apr 18, 2026', false, false, true, '{"Asher Hong","Stanford","Rings","Vault"}', '🌲'),
('mncaa-ou-men', 'mens-ncaa', 'Will Oklahoma''s men repeat as #1 seed at NCAAs?', 'OU posted the nation''s highest score (331.600 vs Cal on Mar 7).', 55, 267000, 'Apr 17, 2026', false, false, false, '{"Oklahoma","Mens","Colby Aranda"}', '🟥'),
('mncaa-mich-repeat', 'mens-ncaa', 'Will Michigan repeat as NCAA Men''s champions?', 'Michigan won the 2025 title with 332.224. Fred Richard anchors the team.', 20, 298000, 'Apr 18, 2026', false, false, false, '{"Michigan","Repeat","Fred Richard"}', '〽️');

-- Athletes
insert into public.markets (id, category_id, question, description, yes_price, volume, end_date, is_live, is_featured, is_trending, tags, image_emoji) values
('ath-chio', 'athletes', 'Will Kailin Chio (LSU) win the NCAA all-around title?', 'Chio has the #1 AA NQS (39.725), #1 on vault (9.960), #1 on beam (9.990).', 42, 756000, 'Apr 18, 2026', false, true, true, '{"Kailin Chio","LSU","All-Around"}', '👑'),
('ath-chiles', 'athletes', 'Will Jordan Chiles (UCLA) complete the "Gym Slam" (10s on all 4 events)?', 'Chiles has 10s on vault, bars, and floor. She needs one on beam to make history.', 22, 892000, 'Apr 18, 2026', false, true, true, '{"Jordan Chiles","UCLA","Gym Slam","Perfect 10"}', '🌟'),
('ath-roberts', 'athletes', 'Will Anna Roberts (Stanford) win an individual NCAA event title?', 'Roberts leads the ACC on vault (9.910), beam (9.930), and AA (39.639).', 35, 312000, 'Apr 18, 2026', false, false, true, '{"Anna Roberts","Stanford"}', '🌲'),
('ath-lacoursiere', 'athletes', 'Will Chloe LaCoursiere (Alabama) win the NCAA bars title?', 'LaCoursiere leads the nation on bars with a 9.955 NQS.', 33, 245000, 'Apr 18, 2026', false, false, false, '{"Chloe LaCoursiere","Alabama","Bars"}', '🐘'),
('ath-harris', 'athletes', 'Will Selena Harris-Miranda (Florida) score another perfect 10 at Nationals?', 'Harris-Miranda earned her 10th career 10 at SEC Champs on bars.', 30, 289000, 'Apr 18, 2026', false, false, false, '{"Selena Harris-Miranda","Florida"}', '🐊'),
('ath-fatta', 'athletes', 'Will Addison Fatta (Oklahoma) finish top 3 in the all-around at Nationals?', 'Fatta has been one of OU''s most consistent all-arounders.', 28, 234000, 'Apr 18, 2026', false, false, false, '{"Addison Fatta","Oklahoma","All-Around"}', '🟥');

-- Scores
insert into public.markets (id, category_id, question, description, yes_price, volume, end_date, is_live, is_featured, is_trending, tags, image_emoji) values
('score-champ', 'scores', 'Will the women''s NCAA champion score 198.0+ in the final?', 'Oklahoma''s NQS is 197.980. In big moments, top teams can peak above 198.', 45, 534000, 'Apr 18, 2026', false, true, true, '{"Team Score","Championship"}', '📈'),
('score-ou-198', 'scores', 'Will Oklahoma score 198.0+ at any point during the postseason?', 'OU has been flirting with 198 all season (197.980 NQS).', 58, 345000, 'Apr 18, 2026', false, false, false, '{"Oklahoma","198+"}', '🟥'),
('score-mens-aa', 'scores', 'Will Fred Richard score 84.0+ in the all-around at NCAAs?', 'Richard''s current AA high is 83.650. An 84+ would be massive.', 32, 267000, 'Apr 18, 2026', false, false, false, '{"Fred Richard","All-Around","84+"}', '📊'),
('score-10s-total', 'scores', 'Will more than 25 perfect 10.0s be scored across the 2026 NCAA season?', 'Already 20+ this season. Postseason still to come.', 72, 445000, 'Apr 18, 2026', false, true, false, '{"Perfect 10","Season Total"}', '💯'),
('score-chio-aa', 'scores', 'Will Kailin Chio score 39.800+ in the all-around at Nationals?', 'Chio''s NQS is 39.725, won SEC AA with 39.775.', 35, 389000, 'Apr 18, 2026', false, false, true, '{"Kailin Chio","AA Score"}', '🐯');

-- Apparatus
insert into public.markets (id, category_id, question, description, yes_price, volume, end_date, is_live, is_featured, is_trending, tags, image_emoji) values
('app-beam-fall', 'apparatus', 'Will there be a fall on beam during the NCAA Championship final?', 'A fall is a 0.5 deduction. In high-pressure finals, beam falls happen most years.', 88, 567000, 'Apr 18, 2026', false, true, true, '{"Beam","Falls","Drama"}', '😱'),
('app-10-bars', 'apparatus', 'Will a 10.0 be scored on bars at NCAA Nationals?', 'Bars tends to have the cleanest routines. LaCoursiere and Chio are contenders.', 55, 312000, 'Apr 18, 2026', false, false, true, '{"Bars","Perfect 10","Nationals"}', '🎯'),
('app-vault-10', 'apparatus', 'Will a perfect 10.0 be scored on vault at Nationals?', 'NCAA vault SVs: Yurchenko full = 9.95, Y 1.5 twist = 10.0.', 48, 378000, 'Apr 18, 2026', false, false, false, '{"Vault","Perfect 10"}', '🚀'),
('app-floor-viral', 'apparatus', 'Will floor exercise produce the highest individual score at Nationals?', 'Floor routines get the biggest crowd reactions.', 40, 256000, 'Apr 18, 2026', false, false, false, '{"Floor","Score"}', '💃'),
('app-ph-high', 'apparatus', 'Will Colby Aranda (Oklahoma) score 14.300+ on pommel horse at men''s NCAAs?', 'Aranda leads the nation on pommel horse at 14.250.', 30, 178000, 'Apr 18, 2026', false, false, false, '{"Pommel Horse","Colby Aranda","Oklahoma"}', '🐴');

-- Head to Head
insert into public.markets (id, category_id, question, description, yes_price, volume, end_date, is_live, is_featured, is_trending, tags, image_emoji) values
('h2h-ou-lsu', 'head-to-head', 'Oklahoma vs LSU: Who finishes higher at Nationals?', 'OU leads NQS by 0.060 (197.980 vs 197.920).', 0, 845000, 'Apr 18, 2026', false, true, true, '{"Oklahoma","LSU","Rivalry"}', '⚔️'),
('h2h-chio-chiles', 'head-to-head', 'Kailin Chio vs Jordan Chiles: Who scores higher in the all-around at Nationals?', 'Chio (39.725 NQS, LSU) vs Chiles (UCLA, multiple 10s).', 0, 923000, 'Apr 18, 2026', false, true, true, '{"Kailin Chio","Jordan Chiles","All-Around"}', '👑'),
('h2h-stanford-ou-men', 'head-to-head', 'Stanford vs Oklahoma: Who wins the men''s NCAA title?', 'Stanford scored 332.061 at 2025 NCAAs. Oklahoma posted 331.600 this season.', 0, 412000, 'Apr 18, 2026', false, false, true, '{"Stanford","Oklahoma","Mens"}', '⚔️'),
('h2h-uf-bama', 'head-to-head', 'Florida vs Alabama: Who advances further in the NCAA postseason?', 'Florida (#3, 197.753) vs Alabama (#5, 197.498).', 0, 298000, 'Apr 18, 2026', false, false, false, '{"Florida","Alabama"}', '🤝');

-- Entertainment
insert into public.markets (id, category_id, question, description, yes_price, volume, end_date, is_live, is_featured, is_trending, tags, image_emoji) values
('ent-viral', 'entertainment', 'Will a floor routine go viral (10M+ views) during the NCAA postseason?', 'NCAA floor routines regularly break the internet.', 82, 734000, 'Apr 18, 2026', false, true, true, '{"Viral","Floor","Social Media"}', '📱'),
('ent-cry', 'entertainment', 'Will a coach be shown crying on the broadcast during Nationals?', 'The emotions at nationals are unmatched.', 90, 312000, 'Apr 18, 2026', false, false, true, '{"Emotions","Broadcast"}', '😭'),
('ent-attendance', 'entertainment', 'Will Dickies Arena in Fort Worth sell out for the NCAA Championship?', 'Gymnastics viewership and attendance have exploded. Dickies Arena holds 14,000.', 75, 234000, 'Apr 16, 2026', false, false, false, '{"Attendance","Fort Worth"}', '🏟️'),
('ent-gymslam', 'entertainment', 'Will anyone complete a "Gym Slam" (10s on all 4 events) this season?', 'Jordan Chiles needs a 10 on beam. Kailin Chio needs a 10 on bars.', 18, 678000, 'Apr 18, 2026', false, true, true, '{"Gym Slam","History"}', '🏅'),
('ent-dance', 'entertainment', 'Will a gymnast''s post-10 celebration go viral during Nationals?', 'When the 10 flashes, the crowd erupts.', 70, 267000, 'Apr 18, 2026', false, false, false, '{"Celebration","Perfect 10"}', '🕺');

-- Elite
insert into public.markets (id, category_id, question, description, yes_price, volume, end_date, is_live, is_featured, is_trending, tags, image_emoji) values
('elite-biles', 'elite', 'Will Simone Biles announce a return to competition in 2026?', 'Biles is currently retired but has kept the door open for the 2028 LA Olympics.', 12, 1234000, 'Dec 31, 2026', false, true, true, '{"Simone Biles","Comeback","GOAT"}', '🐐'),
('elite-usa-worlds', 'elite', 'Will a US man win an individual medal at the next World Championships?', 'At 2025 Worlds, the US had 3 men medal: Malone, Whittenburg, Hoopes.', 72, 345000, 'Nov 30, 2026', false, false, false, '{"USA","Worlds","Mens"}', '🇺🇸'),
('elite-nemour', 'elite', 'Will Kaylia Nemour defend her bars World title?', 'Nemour won bars at 2025 Worlds with a 15.566.', 55, 278000, 'Nov 30, 2026', false, false, false, '{"Kaylia Nemour","Bars","Worlds"}', '🇩🇿'),
('elite-japan', 'elite', 'Will Japan defend the men''s team World title?', 'Daiki Hashimoto won the 2025 Worlds AA (85.131).', 42, 312000, 'Nov 30, 2026', false, false, false, '{"Japan","Hashimoto","Team"}', '🇯🇵');

-- Live markets
insert into public.markets (id, category_id, question, description, yes_price, volume, end_date, is_live, is_featured, is_trending, tags, image_emoji) values
('live-1', 'womens-ncaa', 'Will LSU score 49.5+ on floor at Baton Rouge Regionals?', 'LSU is competing at home. Kailin Chio anchors the floor lineup.', 68, 134000, 'LIVE', true, true, true, '{"LIVE","LSU","Floor","Regionals"}', '🔴'),
('live-2', 'womens-ncaa', 'Will Oklahoma score 197.5+ at Regionals tonight?', 'OU is the #1 seed. Their NQS is 197.980.', 74, 98000, 'LIVE', true, false, false, '{"LIVE","Oklahoma","Regionals"}', '🔴'),
('live-3', 'mens-ncaa', 'Will Fred Richard score 14.0+ on floor at tonight''s meet?', 'Richard''s floor average is 14.050.', 60, 67000, 'LIVE', true, false, true, '{"LIVE","Fred Richard","Floor"}', '🔴');

-- GymACT
insert into public.markets (id, category_id, question, description, yes_price, volume, end_date, is_live, is_featured, is_trending, tags, image_emoji) values
('gymact-champ', 'gymact', 'Which team wins the 2026 GymACT Championship?', 'Arizona State leads at 304.315, followed by Minnesota (301.992).', 0, 234000, 'Apr 12, 2026', false, true, true, '{"GymACT","Championship"}', '🏆'),
('gymact-asu', 'gymact', 'Will Arizona State win the GymACT title?', 'ASU leads GymACT with 304.315 and a season-high 315.150.', 38, 156000, 'Apr 12, 2026', false, false, true, '{"Arizona State","GymACT"}', '😈'),
('gymact-minn', 'gymact', 'Will Minnesota challenge Arizona State for the GymACT title?', 'Minnesota is #2 in GymACT at 301.992 (season-high 307.850).', 28, 134000, 'Apr 12, 2026', false, false, false, '{"Minnesota","GymACT"}', '🟡'),
('gymact-310', 'gymact', 'Will any GymACT team score 310+ at the championship?', 'Arizona State hit 315.150 this season.', 45, 112000, 'Apr 12, 2026', false, false, false, '{"GymACT","Score"}', '📊'),
('gymact-east-west', 'gymact', 'GymACT East vs GymACT West: Which conference produces the champion?', 'West has ASU, Bay Area Bandits, Washington. East has Minnesota, Indy-hio, Temple.', 0, 98000, 'Apr 12, 2026', false, false, false, '{"GymACT","East vs West"}', '⚔️');

-- Multi-outcome entries
insert into public.market_outcomes (market_id, name, price) values
('wncaa-champ', 'Oklahoma (197.980 NQS)', 30),
('wncaa-champ', 'LSU (197.920 NQS)', 26),
('wncaa-champ', 'Florida (197.753 NQS)', 16),
('wncaa-champ', 'UCLA (197.540 NQS)', 10),
('wncaa-champ', 'Alabama (197.498 NQS)', 8),
('wncaa-champ', 'Georgia (197.391 NQS)', 5),
('wncaa-champ', 'Other', 5),
('mncaa-champ', 'Oklahoma (#1, 326.833 NQA)', 34),
('mncaa-champ', 'Michigan (#2, 324.500 NQA)', 24),
('mncaa-champ', 'Stanford (#3, 321.583 NQA)', 20),
('mncaa-champ', 'Nebraska (#4, 321.050 NQA)', 10),
('mncaa-champ', 'Ohio State (#5, 318.883 NQA)', 6),
('mncaa-champ', 'Other', 6),
('h2h-ou-lsu', 'Oklahoma (197.980 NQS)', 54),
('h2h-ou-lsu', 'LSU (197.920 NQS)', 46),
('h2h-chio-chiles', 'Kailin Chio (LSU)', 55),
('h2h-chio-chiles', 'Jordan Chiles (UCLA)', 45),
('h2h-stanford-ou-men', 'Stanford', 45),
('h2h-stanford-ou-men', 'Oklahoma', 55),
('h2h-uf-bama', 'Florida (197.753 NQS)', 62),
('h2h-uf-bama', 'Alabama (197.498 NQS)', 38),
('gymact-champ', 'Arizona State (304.315)', 38),
('gymact-champ', 'Minnesota (301.992)', 28),
('gymact-champ', 'Bay Area Bandits (295.063)', 14),
('gymact-champ', 'Washington (291.640)', 8),
('gymact-champ', 'Indy-hio (288.313)', 5),
('gymact-champ', 'Other', 7),
('gymact-east-west', 'GymACT West', 62),
('gymact-east-west', 'GymACT East', 38);

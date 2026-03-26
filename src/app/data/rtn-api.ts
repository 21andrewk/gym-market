// Road to Nationals API integration
// Endpoints discovered from roadtonationals.com internal API

const BASE = 'https://www.roadtonationals.com/api';

export interface RTNTeamStanding {
  rank: string;
  name: string;
  tid: number;
  rqs: string;
  reg: string;
  con: string;
  div?: string;
  ave: string;
  high: string;
  gymactaa?: string;
}

export interface RTNMeet {
  d: string;
  date: string;
  away_teams: string | null;
  away_scores: string | null;
  home_teams: string;
  meet_desc: string;
  time: string;
  stats_link: string;
  video_link: string;
  meet_id: string;
}

export interface RTNScheduleDay {
  date: string;
  meets: RTNMeet[];
}

export interface RTNWeek {
  wk: string;
  date: string;
  fdate: string;
}

// Women's team standings (NQS)
export async function fetchWomensStandings(
  year = 2026, week = 12, conf = 0, sortBy = 5
): Promise<RTNTeamStanding[]> {
  const res = await fetch(`${BASE}/women/results/${year}/${week}/${conf}/${sortBy}`);
  if (!res.ok) throw new Error(`RTN fetch failed: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// Men's NCAA team standings
export async function fetchMensStandings(
  year = 2026, week = 11, conf = 0, sortBy = 7
): Promise<RTNTeamStanding[]> {
  const res = await fetch(`${BASE}/men/results/${year}/${week}/${conf}/${sortBy}`);
  if (!res.ok) throw new Error(`RTN fetch failed: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// GymACT team standings
export async function fetchGymACTStandings(
  year = 2026, week = 11, conf = 0, sortBy = 7
): Promise<RTNTeamStanding[]> {
  const res = await fetch(`${BASE}/men/resultsga/${year}/${week}/${conf}/${sortBy}`);
  if (!res.ok) throw new Error(`RTN fetch failed: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// Women's schedule
export async function fetchSchedule(
  weekDate = '2026-03-23', page = 1
): Promise<Record<string, RTNScheduleDay>> {
  const res = await fetch(`${BASE}/women/schedule/${weekDate}/${page}`);
  if (!res.ok) throw new Error(`RTN fetch failed: ${res.status}`);
  return res.json();
}

// Available weeks
export async function fetchWeeks(year = 2026): Promise<RTNWeek[]> {
  const res = await fetch(`${BASE}/women/yearweeks/${year}`);
  if (!res.ok) throw new Error(`RTN fetch failed: ${res.status}`);
  return res.json();
}

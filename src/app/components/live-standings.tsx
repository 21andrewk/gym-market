import { useEffect, useState } from 'react';
import { fetchWomensStandings, fetchMensStandings, fetchGymACTStandings, RTNTeamStanding } from '../data/rtn-api';

type Division = 'women' | 'men' | 'gymact';

export function LiveStandings() {
  const [div, setDiv] = useState<Division>('women');
  const [teams, setTeams] = useState<RTNTeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const fetcher =
      div === 'women' ? fetchWomensStandings() :
      div === 'men' ? fetchMensStandings() :
      fetchGymACTStandings();

    fetcher
      .then(data => { if (!cancelled) { setTeams(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError('Could not load standings'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [div]);

  const divTabs: { key: Division; label: string }[] = [
    { key: 'women', label: "Women's NCAA" },
    { key: 'men', label: "Men's NCAA" },
    { key: 'gymact', label: 'GymACT' },
  ];

  const scoreLabel = div === 'women' ? 'NQS' : 'NQA';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Division tabs */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex gap-1">
          {divTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setDiv(t.key)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                div === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-400">via Road to Nationals</span>
      </div>

      {loading && <div className="text-sm text-gray-400 py-8 text-center">Loading...</div>}
      {error && <div className="text-sm text-gray-400 py-8 text-center">{error}</div>}

      {!loading && !error && (
        <>
          {/* Column headers */}
          <div className="flex items-center px-4 py-1.5 bg-gray-50/80 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <span className="w-8">#</span>
            <span className="flex-1">Team</span>
            <span className="w-14 text-right">Conf</span>
            <span className="w-16 text-right">{scoreLabel}</span>
            <span className="w-16 text-right">High</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {teams.map((t) => (
              <div key={t.tid} className="flex items-center px-4 py-2 text-sm hover:bg-gray-50">
                <span className="w-8 text-gray-400 font-medium text-xs">{t.rank}</span>
                <span className="flex-1 font-medium text-gray-900 truncate">{t.name}</span>
                <span className="w-14 text-right text-xs text-gray-400">{t.con}</span>
                <span className="w-16 text-right font-semibold text-blue-600 text-xs">
                  {parseFloat(t.rqs) > 0 ? parseFloat(t.rqs).toFixed(3) : '—'}
                </span>
                <span className="w-16 text-right text-xs text-gray-400">{t.high}</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 px-4 py-1.5 border-t border-gray-200 text-[10px] text-gray-400">
            {div === 'women' && 'NQS = National Qualifying Score'}
            {div === 'men' && 'NQA = National Qualifying Average (top 4 scores)'}
            {div === 'gymact' && 'GymACT = club-level men\'s collegiate gymnastics'}
            {' · '}High = Season Best
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { fetchSchedule, RTNScheduleDay } from '../data/rtn-api';

export function UpcomingMeets() {
  const [schedule, setSchedule] = useState<Record<string, RTNScheduleDay>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchedule('2026-03-23', 1)
      .then(data => { setSchedule(data); setLoading(false); })
      .catch(() => { setError('Could not load schedule'); setLoading(false); });
  }, []);

  if (loading) return <div className="text-sm text-gray-400 py-4 text-center">Loading schedule...</div>;
  if (error) return <div className="text-sm text-gray-400 py-4 text-center">{error}</div>;

  const days = Object.entries(schedule);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Upcoming Meets</h3>
        <span className="text-[10px] text-gray-400">via Road to Nationals</span>
      </div>
      <div className="divide-y divide-gray-100">
        {days.map(([dateKey, day]) => (
          <div key={dateKey}>
            <div className="px-4 py-1.5 bg-gray-50/50">
              <span className="text-xs font-medium text-gray-500">{day.date}</span>
            </div>
            {day.meets.map((meet) => (
              <div key={meet.meet_id} className="px-4 py-2.5 hover:bg-gray-50">
                <p className="text-sm font-medium text-gray-900">{meet.meet_desc || meet.home_teams}</p>
                {meet.away_teams && (
                  <p className="text-xs text-gray-500 mt-0.5">{meet.away_teams}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {meet.time !== '00:00:00' && (
                    <span>{formatTime(meet.time)}</span>
                  )}
                  {meet.video_link && (
                    <a href={meet.video_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      Watch
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {days.length === 0 && (
        <p className="text-sm text-gray-400 py-6 text-center">No upcoming meets this week</p>
      )}
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm} ET`;
}

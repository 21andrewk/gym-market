import { useParams, Link } from 'react-router';
import { markets } from '../data/sports-data';

export function StreamPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const market = markets.find(m => m.id === eventId);

  if (!market) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Market not found</p>
        <Link to="/" className="text-blue-600 text-sm mt-2 inline-block">Back to markets</Link>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <span className="text-5xl block mb-4">{market.imageEmoji || '🤸'}</span>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{market.question}</h1>
      <Link to={`/market/${market.id}`} className="text-blue-600 text-sm">View market</Link>
    </div>
  );
}

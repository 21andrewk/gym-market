import { Link, useLocation } from 'react-router';
import { useWallet } from '../context/wallet-context';
import { useAuth } from '../context/auth-context';
import { LogOut } from 'lucide-react';

const NAV = [
  { to: '/category/womens-ncaa', label: "Women's NCAA" },
  { to: '/category/mens-ncaa', label: "Men's NCAA" },
  { to: '/category/gymact', label: 'GymACT' },
  { to: '/category/athletes', label: 'Athletes' },
  { to: '/category/scores', label: 'Scores' },
  { to: '/category/apparatus', label: 'Apparatus' },
  { to: '/category/head-to-head', label: 'H2H' },
  { to: '/category/entertainment', label: 'Fun' },
  { to: '/category/elite', label: 'Elite' },
];

export function Header() {
  const location = useLocation();
  const { balance } = useWallet();
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🤸</span>
            <span className="text-lg font-bold text-gray-900">Gym Market</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/my-positions" className="text-sm text-gray-500 hover:text-gray-900">
                  Portfolio
                </Link>
                <span className="text-sm font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  🪙 {balance.toLocaleString()}
                </span>
                <button
                  onClick={signOut}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
        <nav className="flex gap-1 -mb-px overflow-x-auto pb-px">
          {NAV.map((n) => {
            const active = location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

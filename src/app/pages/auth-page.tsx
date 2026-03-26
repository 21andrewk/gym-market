import { useState } from 'react';
import { useAuth } from '../context/auth-context';
import { useNavigate, useLocation } from 'react-router';
import { isSupabaseConfigured } from '../data/supabase';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUpPage = location.pathname === '/signup';
  const [mode, setMode] = useState<'signin' | 'signup'>(isSignUpPage ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const needsEmail = isSupabaseConfigured;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const identifier = needsEmail ? email : username;
    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (mode === 'signup' && needsEmail && !username.trim()) {
      setError('Please enter a username');
      return;
    }

    setSubmitting(true);
    let err: string | null;

    if (mode === 'signup') {
      const emailVal = needsEmail ? email : `${username}@gymmarket.local`;
      err = await signUp(emailVal, password, username || email.split('@')[0]);
    } else {
      const emailVal = needsEmail ? email : `${identifier}@gymmarket.local`;
      err = await signIn(emailVal, password);
    }

    setSubmitting(false);
    if (err) { setError(err); return; }
    navigate('/category/womens-ncaa');
  };

  return (
    <div className="max-w-sm mx-auto py-12 space-y-8">
      <div className="text-center">
        <span className="text-4xl block mb-2">🤸</span>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {mode === 'signin' ? 'Welcome back' : 'Start trading gymnastics predictions'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="text-sm text-gray-600 block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Choose a username"
              autoFocus
            />
          </div>
        )}
        <div>
          <label className="text-sm text-gray-600 block mb-1">
            {needsEmail ? 'Email' : 'Username'}
          </label>
          <input
            type={needsEmail ? 'email' : 'text'}
            value={needsEmail ? email : (mode === 'signin' ? username : email)}
            onChange={e => needsEmail ? setEmail(e.target.value) : setUsername(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder={needsEmail ? 'Enter email' : 'Enter username'}
            autoFocus={mode === 'signin'}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Enter password"
          />
        </div>

        {error && <p className="text-sm text-rose-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {submitting ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        {mode === 'signup' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <p className="text-sm text-amber-700">
              🪙 You'll receive <strong>10,000 gold</strong> to start trading!
            </p>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-gray-500">
        {mode === 'signin' ? (
          <>
            Don't have an account?{' '}
            <button onClick={() => { setMode('signup'); setError(''); }} className="text-blue-600 font-medium hover:underline">
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button onClick={() => { setMode('signin'); setError(''); }} className="text-blue-600 font-medium hover:underline">
              Sign In
            </button>
          </>
        )}
      </p>
    </div>
  );
}

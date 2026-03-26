import { useState } from 'react';
import { Link } from 'react-router';
import { X } from 'lucide-react';

interface AuthPromptModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthPromptModal({ open, onClose }: AuthPromptModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"
        >
          <X className="size-5" />
        </button>

        <div className="text-center space-y-4">
          <span className="text-4xl block">🤸</span>
          <h2 className="text-xl font-bold text-gray-900">Join GymMarkets</h2>
          <p className="text-sm text-gray-500">
            Create a free account to start trading predictions on gymnastics outcomes.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-amber-700">
              🪙 Get 10,000 gold free to start
            </p>
          </div>

          <Link
            to="/signup"
            onClick={onClose}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-sm font-semibold transition-colors"
          >
            Sign Up Free
          </Link>

          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/signin" onClick={onClose} className="text-blue-600 font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook to use the modal easily
export function useAuthPrompt() {
  const [open, setOpen] = useState(false);
  const show = () => setOpen(true);
  const close = () => setOpen(false);
  return { open, show, close };
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { supabase, isSupabaseConfigured } from '../data/supabase';
import { fetchBalance } from '../data/trade-service';

interface WalletContextType {
  balance: number;
  loading: boolean;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!user) { setBalance(0); return; }
    const b = await fetchBalance(user.id);
    setBalance(b);
  }, [user]);

  useEffect(() => {
    if (!user) { setBalance(0); return; }
    setLoading(true);
    refreshBalance().finally(() => setLoading(false));

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('balance-changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          if (payload.new && typeof payload.new.balance === 'number') {
            setBalance(payload.new.balance);
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, refreshBalance]);

  return (
    <WalletContext.Provider value={{ balance, loading, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}

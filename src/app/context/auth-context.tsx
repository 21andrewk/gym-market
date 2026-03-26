import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../data/supabase';

interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, username: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Fallback: localStorage-based auth
      const saved = localStorage.getItem('gymmarket-user');
      if (saved) {
        try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
      }
      setLoading(false);
      return;
    }

    // Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('id, username').eq('id', userId).single();
    if (data) {
      setUser({ id: data.id, username: data.username });
    }
    setLoading(false);
  }

  const signUp = async (email: string, password: string, username: string): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      // Fallback
      const u = { id: crypto.randomUUID(), username };
      setUser(u);
      localStorage.setItem('gymmarket-user', JSON.stringify(u));
      return null;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return error?.message || null;
  };

  const signIn = async (email: string, password: string): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      // Fallback
      const u = { id: crypto.randomUUID(), username: email.split('@')[0] || email };
      setUser(u);
      localStorage.setItem('gymmarket-user', JSON.stringify(u));
      return null;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message || null;
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('gymmarket-user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

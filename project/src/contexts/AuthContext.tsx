import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOAD_TIMEOUT = 4000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    const fallbackName =
      currentUser.email?.split('@')[0] ||
      currentUser.user_metadata?.full_name ||
      'Kullanıcı';

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.log('Profil yüklenemedi:', error.message);
        setProfile({
          id: currentUser.id,
          full_name: fallbackName,
        });
        return;
      }

      if (!data) {
        const { data: inserted } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            full_name: fallbackName,
          })
          .select()
          .maybeSingle();

        setProfile(
          inserted || {
            id: currentUser.id,
            full_name: fallbackName,
          }
        );
        return;
      }

      setProfile(data);
    } catch (err) {
      console.log('Profil yükleme hatası:', err);
      setProfile({
        id: currentUser.id,
        full_name: fallbackName,
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const timeout = setTimeout(() => {
        if (mounted) setLoading(false);
      }, LOAD_TIMEOUT);

      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const currentSession = data.session;
        const currentUser = currentSession?.user ?? null;

        setSession(currentSession);
        setUser(currentUser);
        await loadProfile(currentUser);
      } finally {
        clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        const currentUser = currentSession?.user ?? null;

        setSession(currentSession);
        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });

    if (!result.error) {
      setSession(result.data.session);
      setUser(result.data.user);
      await loadProfile(result.data.user);
    }

    return { error: result.error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });

    if (!result.error && result.data.user) {
      await supabase.from('profiles').upsert({
        id: result.data.user.id,
        full_name: fullName || email.split('@')[0],
      });
    }

    return { error: result.error };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

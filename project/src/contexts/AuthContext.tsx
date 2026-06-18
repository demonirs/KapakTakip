import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_LOADING_TIME = 4000; // 4 seconds max

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.log('Profil yuklenemedi:', profileError.message);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.log('Profil yukleme hatasi:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: ReturnType<typeof setTimeout>;

    const initAuth = async () => {
      try {
        console.log('Supabase baslatiliyor...');

        // Start timeout
        loadingTimeout = setTimeout(() => {
          if (mounted && loading) {
            console.log('Yukleme timeout oldu, devam ediliyor');
            setLoading(false);
          }
        }, MAX_LOADING_TIME);

        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.log('Session hatasi:', sessionError.message);
          if (mounted) {
            setError('Oturum bilgileri alinamadi');
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError('Baglanti hatasi olustu');
          setLoading(false);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state degisti:', event);

      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    initAuth();

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        console.log('Giris hatasi:', signInError.message);
        setLoading(false);
        return { error: new Error(signInError.message) };
      }

      return { error: null };
    } catch (err) {
      setLoading(false);
      return { error: new Error('Giris sirasinda hata olustu') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) {
        console.log('Kayit hatasi:', signUpError.message);
        setLoading(false);
        return { error: new Error(signUpError.message) };
      }

      if (data.user) {
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
          });
        } catch (profileErr) {
          console.log('Profil kaydedilemedi:', profileErr);
        }
      }

      return { error: null };
    } catch (err) {
      setLoading(false);
      return { error: new Error('Kayit sirasinda hata olustu') };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.log('Cikis hatasi:', err);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

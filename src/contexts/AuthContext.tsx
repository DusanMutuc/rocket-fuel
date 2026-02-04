import React, { createContext, useEffect, useRef, useState, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextType {
  user: any;
  loading: boolean;
  profile: any;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const didResolveInitialSessionRef = useRef(false);
  const latestProfileUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error) {
      setProfile(data);
    } else {
      console.error('Error loading profile:', error.message);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  useEffect(() => {
    let alive = true;

    const resolveInitial = () => {
      if (!didResolveInitialSessionRef.current) {
        didResolveInitialSessionRef.current = true;
        setLoading(false);
      }
    };

    // Safety: never hang forever on splash/loading
    const fallback = setTimeout(() => {
      console.warn('Auth init fallback timeout triggered');
      resolveInitial();
    }, 8000);

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;

      // This event will include INITIAL_SESSION on startup. :contentReference[oaicite:3]{index=3}
      console.log('[auth]', event, !!session?.user);

      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
      }

      // Mark app ready as soon as auth state is known (don’t wait on profile fetch)
      resolveInitial();

      // Fetch profile in the background
      if (nextUser?.id) {
        const uid = nextUser.id;

        // avoid refetching same user repeatedly
        if (latestProfileUserIdRef.current !== uid) {
          latestProfileUserIdRef.current = uid;
          fetchProfile(uid).catch(console.error);
        }
      }
    });

    // Kick session restoration (don’t try to “refresh” here)
    supabase.auth.getSession().catch(console.error);

    return () => {
      alive = false;
      clearTimeout(fallback);
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

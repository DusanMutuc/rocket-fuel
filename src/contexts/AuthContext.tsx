import React, { createContext, useEffect, useState, useContext, ReactNode } from 'react';
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
    refreshProfile: async () => { },
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error) {
            console.log('Fetched profile:', userProfile);
            setProfile(userProfile);
        } else {
            console.error('Error loading profile:', error.message);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            console.log('Refreshing profile for', user.id);
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        let resolved = false;

        const finish = () => {
            if (!resolved) {
                setLoading(false);
                resolved = true;
            }
        };

        const init = async () => {
            // Call getSession to trigger internal restoration
            const { data: sessionData } = await supabase.auth.getSession();
            const session = sessionData?.session;

            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
                finish();
            } else {
                // Attempt manual refresh after slight delay
                setTimeout(async () => {
                    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
                    if (refreshed?.session?.user) {
                        setUser(refreshed.session.user);
                        await fetchProfile(refreshed.session.user.id);
                    } else {
                        console.warn("Session refresh failed or returned null user:", refreshError?.message);
                    }
                    finish();
                }, 1000); // short delay to let onAuthStateChange happen if it's going to
            }
        };

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) await fetchProfile(currentUser.id);
            else setProfile(null);
            finish();
        });

        init();

        const fallbackTimeout = setTimeout(() => {
            console.warn("Auth fallback timeout triggered.");
            finish();
        }, 8000); // max total wait

        return () => {
            authListener.subscription.unsubscribe();
            clearTimeout(fallbackTimeout);
        };
    }, []);


    return (
        <AuthContext.Provider value={{ user, loading, profile, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

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
        // Wait for Supabase to restore session internally
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                if (currentUser) {
                    await fetchProfile(currentUser.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        // Hack: call getSession once just to trigger internal restoration,
        // but don’t use its result directly
        supabase.auth.getSession().then(() => {
            // We just wait until the above onAuthStateChange fires
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, profile, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

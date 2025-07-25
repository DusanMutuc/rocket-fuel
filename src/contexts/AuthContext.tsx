import React, { createContext, useEffect, useState, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProviderProps {
    children: ReactNode;
}

interface AuthContextType {
    user: any;
    loading: boolean;
    initializing: boolean; // Add this line
    profile: any;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    initializing: true, // Add this line
    profile: null,
    refreshProfile: async () => { },
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(true); // Add this line

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
        // Simplified initialization
        const initializeAuth = async () => {
            try {
                // Get the current session from storage
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                setUser(null);
                setProfile(null);
            } finally {
                setInitializing(false); // Session restoration complete
                setLoading(false);
            }
        };

        // Run initialization
        initializeAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    await fetchProfile(currentUser.id);
                } else {
                    setProfile(null);
                }

                setLoading(false);
                // Don't set initializing to false here - only during initial load
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, initializing, profile, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
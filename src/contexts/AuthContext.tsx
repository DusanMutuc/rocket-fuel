import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

const AUTH_INIT_TIMEOUT_MS = 8000;
const PROFILE_TIMEOUT_MS = 8000;

interface AuthProviderProps {
    children: ReactNode;
}

interface AuthContextType {
    user: any;
    loading: boolean;
    profile: any;
    profileLoading: boolean;
    profileError: string | null;
    refreshProfile: () => Promise<void>;
    retryProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    profile: null,
    profileLoading: false,
    profileError: null,
    refreshProfile: async () => { },
    retryProfile: async () => { },
    signOut: async () => { },
});

const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeout]);
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const didResolveInitialSessionRef = useRef(false);
    const activeProfileRequestRef = useRef(0);
    const currentUserIdRef = useRef<string | null>(null);
    const latestProfileUserIdRef = useRef<string | null>(null);
    const mountedRef = useRef(true);

    const fetchProfileData = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        if (!data) {
            throw new Error('Profile not found.');
        }

        return data;
    };

    const loadProfile = useCallback(async (userId: string) => {
        const requestId = activeProfileRequestRef.current + 1;
        activeProfileRequestRef.current = requestId;

        setProfileLoading(true);
        setProfileError(null);

        try {
            const userProfile = await withTimeout(
                fetchProfileData(userId),
                PROFILE_TIMEOUT_MS,
                'Profile loading timed out. Please try again.'
            );

            if (
                !mountedRef.current ||
                activeProfileRequestRef.current !== requestId ||
                currentUserIdRef.current !== userId
            ) {
                return;
            }

            setProfile(userProfile);
            setProfileError(null);
        } catch (error: any) {
            if (
                !mountedRef.current ||
                activeProfileRequestRef.current !== requestId ||
                currentUserIdRef.current !== userId
            ) {
                return;
            }

            const message = error?.message || 'Unable to load profile.';
            console.error('Error loading profile:', message);
            setProfile(null);
            setProfileError(message);
        } finally {
            if (
                mountedRef.current &&
                activeProfileRequestRef.current === requestId &&
                currentUserIdRef.current === userId
            ) {
                setProfileLoading(false);
            }
        }
    }, []);

    const resetProfileState = useCallback(() => {
        activeProfileRequestRef.current += 1;
        latestProfileUserIdRef.current = null;
        setProfile(null);
        setProfileError(null);
        setProfileLoading(false);
    }, []);

    const applySession = useCallback((session: any) => {
        const currentUser = session?.user ?? null;
        const currentUserId = currentUser?.id ?? null;

        currentUserIdRef.current = currentUserId;
        setUser(currentUser);

        if (!currentUserId) {
            resetProfileState();
            return;
        }

        if (latestProfileUserIdRef.current !== currentUserId) {
            latestProfileUserIdRef.current = currentUserId;
            setProfile(null);
            void loadProfile(currentUserId);
        }
    }, [loadProfile, resetProfileState]);

    const resolveInitialSession = useCallback(() => {
        if (!didResolveInitialSessionRef.current) {
            didResolveInitialSessionRef.current = true;
            setLoading(false);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        const userId = currentUserIdRef.current ?? user?.id;
        if (userId) await loadProfile(userId);
    }, [loadProfile, user?.id]);

    const retryProfile = useCallback(async () => {
        await refreshProfile();
    }, [refreshProfile]);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Error signing out:', error.message);
            setProfileError(error.message);
            return;
        }

        currentUserIdRef.current = null;
        setUser(null);
        resetProfileState();
    }, [resetProfileState]);

    useEffect(() => {
        mountedRef.current = true;

        const fallbackTimeout = setTimeout(() => {
            console.warn('Auth init fallback timeout triggered.');
            resolveInitialSession();
        }, AUTH_INIT_TIMEOUT_MS);

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log('[auth]', event, !!session?.user);
                applySession(session);
                resolveInitialSession();
            }
        );

        supabase.auth
            .getSession()
            .then(({ data: { session } }) => {
                applySession(session);
                resolveInitialSession();
            })
            .catch((error) => {
                console.error('Error restoring auth session:', error?.message || error);
                currentUserIdRef.current = null;
                setUser(null);
                resetProfileState();
                resolveInitialSession();
            });

        return () => {
            mountedRef.current = false;
            activeProfileRequestRef.current += 1;
            clearTimeout(fallbackTimeout);
            authListener.subscription.unsubscribe();
        };
    }, [applySession, resetProfileState, resolveInitialSession]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                profile,
                profileLoading,
                profileError,
                refreshProfile,
                retryProfile,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

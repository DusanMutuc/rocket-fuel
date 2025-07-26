// App.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, AppState, AppStateStatus, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import AppNavigator from '../src/navigation/AppNavigator';
import AuthNavigator from '../src/navigation/AuthNavigator';
import { Provider as PaperProvider } from 'react-native-paper';
import theme from './theme';
import { navigationRef } from './navigation/RootNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

const RESTART_KEY = 'app_restart_flag';

const RootNavigation = () => {
    const { user, loading: authLoading, profile } = useAuth();

    if (authLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!user) return <AuthNavigator />;

    if (profile?.needs_password_change) {
        return (
            <AuthNavigator
                initialRouteName="ChangePassword"
                overrideScreen="ChangePassword"
            />
        );
    }

    return <AppNavigator />;
};

const LoadingScreen = ({ isRestarting }: { isRestarting: boolean }) => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{
                marginTop: 16,
                fontSize: 16,
                color: theme.colors.onSurface,
                opacity: 0.7
            }}>
                {isRestarting ? 'Optimizing app...' : 'Loading...'}
            </Text>
        </View>
    );
};

const AppWithRestart = () => {
    const [isReady, setIsReady] = useState(false);
    const [shouldRestart, setShouldRestart] = useState(false);

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // Check if we've already restarted this launch
            const hasRestarted = await AsyncStorage.getItem(RESTART_KEY);

            if (hasRestarted === 'true') {
                // We've already restarted, clear the flag and proceed normally
                await AsyncStorage.removeItem(RESTART_KEY);
                console.log('App already restarted, proceeding normally');
                setIsReady(true);
                return;
            }

            // First launch - always restart to ensure proper hydration
            console.log('First launch detected, restarting app for proper hydration');
            await performRestart();

        } catch (error) {
            console.error('Error during app initialization:', error);
            setIsReady(true); // Proceed anyway to avoid infinite loading
        }
    };

    const performRestart = async () => {
        try {
            // Set restart flag first
            await AsyncStorage.setItem(RESTART_KEY, 'true');
            console.log('Restart flag set, reloading app...');

            // Show restart state briefly
            setShouldRestart(true);

            // Small delay to ensure AsyncStorage write completes
            await new Promise(resolve => setTimeout(resolve, 100));

            // Restart the app
            await Updates.reloadAsync();
        } catch (error) {
            console.error('Failed to restart app:', error);
            // Fallback: proceed without restart
            setIsReady(true);
        }
    };

    // Handle app state changes to clear restart flag when going to background
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background') {
                // Clear restart flag when going to background
                // This ensures fresh launches get the restart treatment
                AsyncStorage.removeItem(RESTART_KEY).catch(console.error);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, []);

    // Show loading or restart screen before the main app
    if (!isReady || shouldRestart) {
        return (
            <SafeAreaProvider>
                <PaperProvider theme={theme}>
                    <LoadingScreen isRestarting={shouldRestart} />
                </PaperProvider>
            </SafeAreaProvider>
        );
    }

    // Render your existing app structure once ready
    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <AuthProvider>
                    <NavigationContainer ref={navigationRef}>
                        <RootNavigation />
                    </NavigationContainer>
                </AuthProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
};

const App = () => {
    return <AppWithRestart />;
};

export default App;
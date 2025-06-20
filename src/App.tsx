// App.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import AppNavigator from '../src/navigation/AppNavigator';
import AuthNavigator from '../src/navigation/AuthNavigator';
import { Provider as PaperProvider } from 'react-native-paper';
import theme from './theme';
import { navigationRef } from './navigation/RootNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

const App = () => {
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

export default App;

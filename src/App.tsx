// App.tsx

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import AppNavigator from '../src/navigation/AppNavigator';
import AuthNavigator from '../src/navigation/AuthNavigator';
import Toast from 'react-native-toast-message';
import { Provider as PaperProvider } from 'react-native-paper';
import theme from './theme';
import { navigationRef } from './navigation/RootNavigation';

const RootNavigation = () => {
    const { user, loading: authLoading, profile } = useAuth();

    if (authLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // If not logged in, go to AuthNavigator
    if (!user) return <AuthNavigator />;

    // User is logged in but needs to change password
    if (profile?.needs_password_change) {
        return (
            <AuthNavigator
                initialRouteName="ChangePassword"
                overrideScreen="ChangePassword"
            />
        );
    }

    // Logged in and ready to go
    return <AppNavigator />;
};


const App = () => {
    return (
        <PaperProvider theme={theme}>
            <AuthProvider>
                <NavigationContainer ref={navigationRef}>
                    <RootNavigation />
                    {/* @ts-ignore */}
                    <Toast ref={(ref: any) => Toast.setRef(ref)} />
                </NavigationContainer>
            </AuthProvider>
        </PaperProvider>
    );
};

export default App;

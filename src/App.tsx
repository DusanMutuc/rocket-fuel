// App.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import AppNavigator from '../src/navigation/AppNavigator';
import AuthNavigator from '../src/navigation/AuthNavigator';
import Toast from 'react-native-toast-message';

const RootNavigation = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // Conditional rendering based on auth state.
    return user ? <AppNavigator /> : <AuthNavigator />;
};

const App = () => {
    return (
        <AuthProvider>
            <NavigationContainer>
                <RootNavigation />
                {/* @ts-ignore */}
                <Toast ref={(ref: any) => Toast.setRef(ref)} />
            </NavigationContainer>
        </AuthProvider>

    );
};

export default App;

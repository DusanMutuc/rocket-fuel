// App.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import AppNavigator from '../src/navigation/AppNavigator';
import AuthNavigator from '../src/navigation/AuthNavigator';
import Toast from 'react-native-toast-message';
import { useFonts } from 'expo-font';


const RootNavigation = () => {
    const { user, loading: authLoading } = useAuth();

    // Here you could return a loading screen if user-related data isn't ready.
    if (authLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return user ? <AppNavigator /> : <AuthNavigator />;
};

const App = () => {
    

    // 3) Once fonts are loaded, render normal app content
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

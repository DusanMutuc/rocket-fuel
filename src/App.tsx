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

const FullScreenLoader = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
);

const RootNavigation = () => {
  const { user, loading: authLoading, profile } = useAuth();

  // Wait for initial session resolution
  if (authLoading) return <FullScreenLoader />;

  // Not logged in
  if (!user) return <AuthNavigator />;

  // Logged in but profile not loaded yet — avoid incorrect routing / flashes
  if (!profile) return <FullScreenLoader />;

  // Force password change
  if (profile.needs_password_change) {
    return (
      <AuthNavigator
        initialRouteName="ChangePassword"
        overrideScreen="ChangePassword"
      />
    );
  }

  return <AppNavigator />;
};

export default function App() {
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
}

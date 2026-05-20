// App.tsx
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import AppNavigator from '../src/navigation/AppNavigator';
import AuthNavigator from '../src/navigation/AuthNavigator';
import { Button, Provider as PaperProvider, Text } from 'react-native-paper';
import theme from './theme';
import { navigationRef } from './navigation/RootNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const FullScreenLoader = () => (
    <View style={styles.centered}>
        <ActivityIndicator size="large" />
    </View>
);

type ProfileRecoveryScreenProps = {
    error: string | null;
    onRetry: () => Promise<void>;
    onSignOut: () => Promise<void>;
};

const ProfileRecoveryScreen: React.FC<ProfileRecoveryScreenProps> = ({
    error,
    onRetry,
    onSignOut,
}) => {
    const [retrying, setRetrying] = React.useState(false);
    const [signingOut, setSigningOut] = React.useState(false);

    const handleRetry = async () => {
        setRetrying(true);
        try {
            await onRetry();
        } finally {
            setRetrying(false);
        }
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await onSignOut();
        } finally {
            setSigningOut(false);
        }
    };

    return (
        <View style={styles.recoveryContainer}>
            <View style={styles.recoveryContent}>
                <Text variant="titleLarge" style={styles.recoveryTitle}>
                    We couldn't load your profile
                </Text>
                <Text variant="bodyMedium" style={styles.recoveryText}>
                    Check your connection and try again. You can also sign out and log back in.
                </Text>
                {error ? (
                    <Text variant="bodySmall" style={styles.recoveryError}>
                        {error}
                    </Text>
                ) : null}
                <View style={styles.recoveryActions}>
                    <Button
                        mode="contained"
                        onPress={handleRetry}
                        loading={retrying}
                        disabled={retrying || signingOut}
                        style={styles.recoveryButton}
                    >
                        Try Again
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={handleSignOut}
                        loading={signingOut}
                        disabled={retrying || signingOut}
                        style={styles.recoveryButton}
                    >
                        Sign Out
                    </Button>
                </View>
            </View>
        </View>
    );
};

const RootNavigation = () => {
    const {
        user,
        loading: authLoading,
        profile,
        profileLoading,
        profileError,
        retryProfile,
        signOut,
    } = useAuth();

    if (authLoading) {
        return <FullScreenLoader />;
    }

    // If not logged in, go to AuthNavigator
    if (!user) return <AuthNavigator />;

    if (profileLoading && !profile) {
        return <FullScreenLoader />;
    }

    if (!profile) {
        return (
            <ProfileRecoveryScreen
                error={profileError}
                onRetry={retryProfile}
                onSignOut={signOut}
            />
        );
    }

    // User is logged in but needs to change password
    if (profile.needs_password_change) {
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
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <AuthProvider>
                    <NavigationContainer ref={navigationRef}>
                        <RootNavigation />
                        {/* @ts-ignore */}
                    </NavigationContainer>
                </AuthProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
};

export default App;

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recoveryContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: theme.colors.background,
    },
    recoveryContent: {
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
    },
    recoveryTitle: {
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: '700',
    },
    recoveryText: {
        textAlign: 'center',
        color: theme.colors.onSurfaceVariant,
    },
    recoveryError: {
        marginTop: 12,
        textAlign: 'center',
        color: theme.colors.error,
    },
    recoveryActions: {
        width: '100%',
        marginTop: 24,
        gap: 12,
    },
    recoveryButton: {
        width: '100%',
    },
});

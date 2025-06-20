import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, Linking } from 'react-native';
import { TextInput, Button, Surface, Text, Snackbar } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
    navigation: LoginScreenNavigationProp;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

export const LoginScreen: React.FC<LoginScreenProps> = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const { refreshProfile } = useAuth();

    const handleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                setSnackbarMessage(error.message);
                setSnackbarVisible(true);
                return;
            }

            const { data: { session: newSession } } = await supabase.auth.getSession();
            if (newSession?.user) {
                console.log('Login successful, refreshing profile...');
                await refreshProfile();
            } else {
                console.warn('Session missing after login');
            }
        } catch (err: any) {
            setSnackbarMessage(err.message || 'Unexpected error');
            setSnackbarVisible(true);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setSnackbarMessage('Please enter your email.');
            setSnackbarVisible(true);
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://www.rocketfuelmembers/reset-password'
        });

        setSnackbarMessage(error ? error.message : 'Reset link sent. Check your inbox!');
        setSnackbarVisible(true);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.wrapper}>
                <Surface style={styles.card}>
                    <Text style={styles.header}>Welcome Back</Text>

                    <TextInput
                        mode="outlined"
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        style={styles.input}
                    />

                    <TextInput
                        label="Password"
                        mode="outlined"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSignIn}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                    >
                        Sign In
                    </Button>
                    <Button
                        mode="text"
                        onPress={handleForgotPassword}
                        style={styles.forgotButton}
                    >
                        Forgot Password?
                    </Button>
                </Surface>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                    action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
                >
                    {snackbarMessage}
                </Snackbar>

                <Text
                    onPress={() => Linking.openURL('https://www.rocketfuelmembers.com/privacy-policy')}
                    style={styles.privacyLink}
                >
                    Privacy Policy
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: scale(16),
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: scale(24),
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: scale(20),
    },
    input: {
        marginBottom: scale(16),
        backgroundColor: '#fff',
    },
    button: {
        marginTop: scale(8),
        borderRadius: scale(8),
    },
    buttonContent: {
        paddingVertical: scale(8),
    },
    forgotButton: {
        marginTop: scale(8),
        alignSelf: 'center',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: scale(16),
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        padding: scale(20),
        borderRadius: scale(8),
        elevation: 4,
    },
    privacyLink: {
        textAlign: 'center',
        color: 'gray',
        fontSize: scale(12),
        marginTop: scale(20),
        textDecorationLine: 'underline',
    },
});

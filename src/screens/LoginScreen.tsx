import React, { useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { TextInput, Button, Surface, Text, Snackbar } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../contexts/AuthContext';

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
            redirectTo: 'https://boisterous-bombolone-5f86bc.netlify.app/',
        });

        setSnackbarMessage(error ? error.message : 'Reset link sent. Check your inbox!');
        setSnackbarVisible(true);
    };

    return (
        <Surface style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.header}>Welcome Back</Text>

                <TextInput
                    mode="outlined"
                    label= "Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    style={styles.input}
                />


                <TextInput
                    label= "Password"
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
            </View>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
            >
                {snackbarMessage}
            </Snackbar>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: scale(16),
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: '#fff',
        padding: scale(20),
        borderRadius: scale(8),
        elevation: 4,
    },
    header: {
        fontSize: scale(24),
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: scale(20),
    },
    input: {
        marginBottom: scale(16),
        backgroundColor: '#fff', // Ensure icons don't overlap
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
});

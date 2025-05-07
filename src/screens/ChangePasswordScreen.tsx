import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Surface, Snackbar } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import * as Updates from 'expo-updates';

export const ChangePasswordScreen: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [step, setStep] = useState<'form' | 'done'>('form');
    const [submitting, setSubmitting] = useState(false);

    const handleChangePassword = async () => {
        console.log("Password change initiated");

        if (password !== confirmPassword) {
            setSnackbarMessage("Passwords don't match");
            setSnackbarVisible(true);
            return;
        }

        setSubmitting(true);

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            const email = session?.user?.email;

            console.log("Session:", session);
            if (!userId || !email || sessionError) {
                console.error("Session missing or invalid");
                setSnackbarMessage("Session error — try logging in again");
                setSnackbarVisible(true);
                setSubmitting(false);
                return;
            }

            // Step 1: update profile flag
            console.log("Updating profile flag...");
            const { data: flagData, error: flagError } = await supabase
                .from('profiles')
                .update({ needs_password_change: false })
                .eq('id', userId)
                .select();

            if (flagError) {
                console.error("Flag update error:", flagError.message);
                setSnackbarMessage("Failed to update profile flag");
                setSnackbarVisible(true);
                setSubmitting(false);
                return;
            }

            console.log("Flag update success:", flagData);

            // Step 2: show success screen
            setStep('done');

            // Step 3: change password and sign out in background
            console.log("Updating password...");
            try {
                await supabase.auth.updateUser({ password });
                await supabase.auth.signOut();
                console.log("Password updated and signed out");
            } catch (err: any) {
                console.warn("Password update completed with error:", err?.message);
            }

        } catch (err: any) {
            console.error("Unexpected error:", err);
            setSnackbarMessage(err.message || "Unexpected error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    if (step === 'done') {
        console.log("Showing success screen");
        return (
            <Surface style={styles.container}>
                <Text variant="headlineMedium" style={{ marginBottom: 24 }}>
                    Password updated!
                </Text>
                <Text style={{ marginBottom: 24 }}>
                    Please log in again with your new password.
                </Text>
                <Button
                    mode="contained"
                    onPress={async () => {
                        console.log("Restarting app...");
                        await Updates.reloadAsync(); //hard app restart
                    }}
                >
                    Continue to Login
                </Button>
            </Surface>
        );
    }

    console.log("Rendering password form");

    return (
        <Surface style={styles.container}>
            <Text variant="headlineMedium">Create New Password</Text>
            <TextInput
                label="New Password"
                mode='outlined'
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                editable={!submitting}
            />
            <TextInput
                label="Confirm Password"
                mode='outlined'
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                editable={!submitting}
            />
            <Button
                mode="contained"
                onPress={handleChangePassword}
                loading={submitting}
                disabled={submitting}
            >
                Set Password
            </Button>
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
            >
                {snackbarMessage}
            </Snackbar>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    input: { marginBottom: 16 },
});

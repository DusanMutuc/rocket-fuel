import React from 'react';
import { View, Button, Alert } from 'react-native';
import { supabase } from '../lib/supabase'; // Adjust path to your Supabase service
import { PostgrestError } from '@supabase/supabase-js'; // Import error type
import Toast from 'react-native-toast-message';

const HomeScreen = () => {
    const handleButtonClick = async () => {
        Toast.show({
            type: 'success', // You can customize the type ('success', 'error', etc.)
            text1: 'Skibidi!',
            text2: 'Whats yung blud cooking',
            position: 'bottom', // You can control the position
            onPress: () => {
                Toast.hide();
            },
        });
        
    };

    return (
        <View>
            <Button title="Click me!" onPress={handleButtonClick} />
        </View>
    );
};

export default HomeScreen;

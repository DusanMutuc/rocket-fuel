// ProgressBar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
    progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <View style={styles.container}>
            <View style={[styles.filler, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 10,
        width: '100%',
        backgroundColor: '#e0e0df',
        borderRadius: 5,
    },
    filler: {
        height: '100%',
        backgroundColor: 'tomato',
        borderRadius: 5,
    },
});

export default ProgressBar;

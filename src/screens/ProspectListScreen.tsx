import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProspectListScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Your Prospect List Goes Here</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default ProspectListScreen;

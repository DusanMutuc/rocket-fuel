// screens/TaskLogScreen1.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TaskLogScreen1 = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Choose type of task!</Text>
            {/* You can add more content or buttons here as needed */}
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
        marginBottom: 20,
    },
});

export default TaskLogScreen1;

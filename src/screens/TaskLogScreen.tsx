// src/screens/TaskLogScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import Toast from 'react-native-toast-message';

interface TaskType {
    task_type_id: number;
    name: string;
}

const TaskLogScreen = () => {
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [taskTypeId, setTaskTypeId] = useState<number | null>(null);
    const [amount, setAmount] = useState<number>(1);

    // Fetch task types from the database when the component mounts.
    useEffect(() => {
        const fetchTaskTypes = async () => {
            const { data, error } = await supabase.from('task_types').select('*');
            if (error) {
                console.error('Error fetching task types:', error);
            } else if (data) {
                setTaskTypes(data);
                if (data.length > 0) {
                    setTaskTypeId(data[0].task_type_id);
                }
            }
        };
        fetchTaskTypes();
    }, []);

    // Handle task logging by inserting one row per task.
    const handleLogTask = async () => {
        // Get the current session to determine the user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
            Toast.show({ type: 'error', text1: 'Not logged in' });
            return;
        }
        if (taskTypeId === null) {
            Toast.show({ type: 'error', text1: 'Select a task type' });
            return;
        }

        let errorOccurred = false;
        const { error } = await supabase.from('task_logs').insert([
            {
                user_id: session.user.id,
                task_type_id: taskTypeId,
                amount: amount,
                created_at: new Date().toISOString(),
            },
        ]);
        if (error) {
            errorOccurred = true;
            console.error('Error logging task:', error);
        }

        if (errorOccurred) {
            Toast.show({ type: 'error', text1: 'Error logging tasks' });
        } else {
            Toast.show({ type: 'success', text1: 'Tasks logged successfully' });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Select Task Type:</Text>
            {taskTypes.map((tt) => (
                <Button
                    key={tt.task_type_id}
                    title={tt.name}
                    onPress={() => setTaskTypeId(tt.task_type_id)}
                    color={tt.task_type_id === taskTypeId ? 'tomato' : undefined}
                />
            ))}

            <Text style={styles.label}>Amount:</Text>
            <TextInput
                style={styles.input}
                value={amount.toString()}
                onChangeText={(text) => setAmount(Number(text))}
                keyboardType="numeric"
            />

            <Button title="Log Task(s)" onPress={handleLogTask} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    label: {
        fontSize: 16,
        marginVertical: 8
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        width: 100,
        padding: 8,
        textAlign: 'center',
        marginBottom: 16,
    },
});

export default TaskLogScreen;

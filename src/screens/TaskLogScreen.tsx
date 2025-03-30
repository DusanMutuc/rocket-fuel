import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

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

    // Helper function to format task names: replace underscores with spaces and capitalize each word.
    const formatTaskName = (name: string) => {
        return name
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const onChange = (event: any, date?: Date) => {
        setShowPicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    };

    const showDatePicker = () => {
        setShowPicker(true);
    };

    const handleLogTask = async () => {
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
                created_at: selectedDate.toISOString(),
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
            <View style={styles.buttonContainer}>
                {taskTypes.map((tt) => (
                    <TouchableOpacity
                        key={tt.task_type_id}
                        style={[
                            styles.taskButton,
                            taskTypeId === tt.task_type_id && styles.selectedButton,
                        ]}
                        onPress={() => setTaskTypeId(tt.task_type_id)}
                    >
                        <Text
                            style={[
                                styles.buttonText,
                                taskTypeId === tt.task_type_id && styles.selectedButtonText,
                            ]}
                        >
                            {formatTaskName(tt.name)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Amount:</Text>
            <TextInput
                style={styles.input}
                value={amount.toString()}
                onChangeText={(text) => setAmount(Number(text))}
                keyboardType="numeric"
            />

            <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
                <Text style={styles.dateButtonText}>Select Date</Text>
            </TouchableOpacity>
            <Text style={styles.dateText}>Selected Date: {selectedDate.toDateString()}</Text>
            {showPicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onChange}
                />
            )}

            <TouchableOpacity style={styles.logButton} onPress={handleLogTask}>
                <Text style={styles.logButtonText}>Log Task(s)</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        marginVertical: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    taskButton: {
        width: '48%',
        backgroundColor: '#ddd',
        paddingVertical: 20, // Taller button
        paddingHorizontal: 12,
        marginVertical: 6,
        borderRadius: 12,
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: 'tomato',
    },
    buttonText: {
        fontSize: 18,
    },
    selectedButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        width: 100,
        padding: 8,
        textAlign: 'center',
        marginBottom: 16,
    },
    dateButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginVertical: 8,
    },
    dateButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    dateText: {
        marginVertical: 8,
        fontSize: 16,
    },
    logButton: {
        backgroundColor: 'green',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 16,
    },
    logButtonText: {
        color: '#fff',
        fontSize: 18,
    },
});

export default TaskLogScreen;

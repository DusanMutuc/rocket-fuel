// TaskLogScreen.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import {
    Text,
    TextInput,
    Surface,
    TouchableRipple,
    Button,
    useTheme,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import Toast from 'react-native-toast-message';

interface TaskType {
    task_type_id: number;
    name: string;
}

interface WrapButtonProps {
    onPress: () => void;
    label: string;
    selected: boolean;
}

// Custom button component that supports wrapped text and uses Paper theme colors
const WrapButton: React.FC<WrapButtonProps> = ({ onPress, label, selected }) => {
    const theme = useTheme();
    return (
        <TouchableRipple
            onPress={onPress}
            rippleColor={theme.colors.backdrop}
            style={[
                styles.wrapButton,
                { backgroundColor: selected ? theme.colors.primary : theme.colors.surface },
            ]}
        >
            <View style={styles.wrapButtonContent}>
                <Text
                    style={[
                        styles.wrapButtonText,
                        { color: selected ? theme.colors.onPrimary : theme.colors.onSurface },
                    ]}
                >
                    {label}
                </Text>
            </View>
        </TouchableRipple>
    );
};

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

    // Helper to format task names by replacing underscores with spaces and capitalizing each word.
    const formatTaskName = (name: string) => {
        return name
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const onChange = (event: any, date?: Date) => {
        // Keep the picker open on iOS.
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
        // Surface provides a Paper-styled container.
        <Surface style={styles.container}>
            <Text style={styles.label}>Select Task Type:</Text>
            <View style={styles.buttonContainer}>
                {taskTypes.map((tt) => (
                    <WrapButton
                        key={tt.task_type_id}
                        onPress={() => setTaskTypeId(tt.task_type_id)}
                        label={formatTaskName(tt.name)}
                        selected={taskTypeId === tt.task_type_id}
                    />
                ))}
            </View>

            <Text style={styles.label}>Amount:</Text>
            <TextInput
                mode="outlined"
                style={styles.input}
                value={amount.toString()}
                onChangeText={(text) => setAmount(Number(text))}
                keyboardType="numeric"
            />

            <Button mode="contained" onPress={showDatePicker} style={styles.dateButton}>
                Select Date
            </Button>
            <Text style={styles.dateText}>Selected Date: {selectedDate.toDateString()}</Text>
            {showPicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onChange}
                />
            )}

            <Button mode="contained" onPress={handleLogTask} style={styles.logButton}>
                Log Task(s)
            </Button>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 40, // Moves content higher on the screen
        justifyContent: 'flex-start',
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
        width: '100%',
    },
    // Custom WrapButton styles
    wrapButton: {
        width: '48%',
        marginVertical: 6,
        borderRadius: 12,
        overflow: 'hidden',
        borderColor: 'black',
        borderWidth: 1
    },
    wrapButtonContent: {
        minHeight: 70, // Taller button
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    wrapButtonText: {
        fontSize: 18,
        textAlign: 'center',
        flexWrap: 'wrap', // Allow text to wrap onto multiple lines
        flexShrink: 1,
        maxWidth: '100%',
    },
    input: {
        width: 100,
        marginBottom: 16,
    },
    dateButton: {
        marginVertical: 8,
    },
    dateText: {
        marginVertical: 8,
        fontSize: 16,
    },
    logButton: {
        marginTop: 16,
    },
});

export default TaskLogScreen;

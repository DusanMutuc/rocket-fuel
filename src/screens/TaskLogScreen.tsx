import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Platform, Dimensions, TouchableOpacity } from 'react-native';
import {
    Text,
    TextInput,
    Surface,
    TouchableRipple,
    Button,
    IconButton,
    useTheme,
    Snackbar,
    Portal,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import PopoverTooltip from '../components/PopoverTooltip'; // <-- Import your standardized tooltip
import { AuthInvalidTokenResponseError } from '@supabase/supabase-js';
// Define a scaling function based on the device's screen width.
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const guidelineBaseWidth = 375; // Base width to scale from (e.g., iPhone 8)
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

interface TaskType {
    task_type_id: number;
    name: string;
}

interface WrapButtonProps {
    onPress: () => void;
    label: string;
    selected: boolean;
    // Optionally allow style override if needed
    styleOverride?: any;
}

// --- WrapButton ---
// This button is used to render each task type and later the Gross Revenue button.
const WrapButton: React.FC<WrapButtonProps> = ({ onPress, label, selected, styleOverride }) => {
    const theme = useTheme();
    return (
        <View
            style={[
                {
                    borderRadius: scale(50),
                    overflow: 'hidden',
                    width: '48%',
                    marginVertical: scale(5),
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 3,
                },
                styleOverride,
            ]}
        >
            <TouchableRipple
                onPress={onPress}
                rippleColor={theme.colors.backdrop}
                style={[
                    styles.wrapButton,
                    {
                        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    },
                ]}
            >
                <View style={styles.wrapButtonContent}>
                    <Text
                        style={[
                            styles.wrapButtonText,
                            {
                                color: selected ? theme.colors.onPrimary : theme.colors.onSurface,
                            },
                        ]}
                    >
                        {label}
                    </Text>
                </View>
            </TouchableRipple>
        </View>
    );
};

const TaskLogScreen = () => {
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [taskTypeId, setTaskTypeId] = useState<number | null>(null);
    const [amount, setAmount] = useState<number>(1);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    // New state variable for Gross Revenue mode
    const [grossRevenue, setGrossRevenue] = useState(false);
    // Snackbar state
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

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
            showSnack('Not logged in');
            return;
        }
        if (!grossRevenue && taskTypeId === null) {
            showSnack('Select a task type');
            return;
        }
        if (!grossRevenue && amount > 99) {
            showSnack('Amount cannot exceed 99');
            return;
        }
        const { error } = await supabase.from('task_logs').insert([
            {
                user_id: session.user.id,
                task_type_id: taskTypeId,
                amount: amount,
                created_at: selectedDate.toISOString(),
            },
        ]);
        if (error) {
            console.error('Error logging task:', error);
            showSnack('Error logging tasks');
        } else {
            showSnack('Tasks logged successfully');
        }
    };

    const showSnack = (message: string) => {
        if (snackbarVisible) {
            setSnackbarVisible(false);
            setTimeout(() => {
                setSnackbarMessage(message);
                setSnackbarVisible(true);
            }, 250);
        } else {
            setSnackbarMessage(message);
            setSnackbarVisible(true);
        }
    };

    const handleAmountChange = (text: string) => {
        const cleanText = text.replace(/\D/g, '');
        if (!cleanText) {
            setAmount(0);
            return;
        }
        const numericValue = Number(cleanText);
        if (!grossRevenue && numericValue > 99) {
            showSnack('Maximum of 99 allowed');
            setAmount(99);
        } else {
            setAmount(numericValue);
        }
    };

    const handleIncrease = () => {
        if (!grossRevenue && amount < 99) {
            setAmount(amount + 1);
        } else if (grossRevenue && amount <= 99) {
            setAmount(100);
        } else if (grossRevenue && amount >= 100) {
            setAmount(amount + 100);

        } else {
            showSnack('Maximum of 99 allowed');
        }
    };

    const handleDecrease = () => {
        if (!grossRevenue && amount > 1) {
            setAmount(amount - 1);
        }
        else if (grossRevenue && amount <= 100) {
            setAmount(1);
        }
        else if (grossRevenue && amount > 100) {
            setAmount(amount - 100)
        } else {
            showSnack('Minimum amount is 1');
        }
    };

    return (
        <Surface style={styles.container}>
            {/* Header row with three sections: left placeholder, centered title, and right tooltip */}
            <PopoverTooltip
                tooltipText={
                    "Welcome to your Task Log Screen! Here you can log tasks by selecting a task type, adjusting the amount, and picking a date."
                }
            />
            <View style={styles.headerRow}>
                <View style={styles.headerLeftPlaceholder} />
                <Text style={styles.headerTitle}>Select Task Type:</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>


            {/* Main content */}
            <View style={styles.content}>
                <View style={styles.buttonContainer}>
                    {taskTypes
                        .filter(
                            (tt) =>
                                tt.name.toLowerCase() !== 'gross_revenue' &&
                                tt.name.toLowerCase() !== 'gross revenue'
                        )
                        .map((tt) => (
                            <WrapButton
                                key={tt.task_type_id}
                                onPress={() => {
                                    setTaskTypeId(tt.task_type_id);
                                    setGrossRevenue(false);
                                    setAmount(1);
                                }}
                                label={formatTaskName(tt.name)}
                                selected={!grossRevenue && taskTypeId === tt.task_type_id}
                            />
                        ))}
                </View>

                <View style={styles.grossRevenueRow}>
                    <WrapButton
                        onPress={() => {
                            setGrossRevenue(true);
                            setTaskTypeId(7);
                        }}
                        label="Gross Revenue"
                        selected={grossRevenue}
                    />
                </View>

                <Text style={styles.label}>Amount:</Text>
                <View style={styles.amountContainer}>
                    <IconButton icon="minus" onPress={handleDecrease} style={styles.amountIncrementor} />
                    <TextInput
                        mode="flat"
                        style={styles.amountInput}
                        theme={{ roundness: scale(3) }}
                        value={amount.toString()}
                        onChangeText={handleAmountChange}
                        keyboardType="numeric"
                        left={grossRevenue ? <TextInput.Affix text="CA$" /> : null}
                    />
                    <IconButton icon="plus" onPress={handleIncrease} style={styles.amountIncrementor} />
                </View>

                <TouchableRipple onPress={showDatePicker} style={styles.dateContainer}>
                    <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
                </TouchableRipple>
                {showPicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={onChange}
                    />
                )}
            </View>

            <View style={styles.logButtonContainer}>
                <Button mode="contained" onPress={handleLogTask} style={styles.logButton}>
                    Log
                </Button>
            </View>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                action={{
                    label: 'OK',
                    onPress: () => setSnackbarVisible(false),
                }}
            >
                {snackbarMessage}
            </Snackbar>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between', // Keeps content at top and button at bottom
    },
    headerRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '7%'
    },
    headerLeftPlaceholder: {
        width: 44, // Reserve the same space as your tooltip icon container.
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'bottom',
        fontSize: scale(20),
        height: '100%'
    },
    headerRightPlaceholder: {
        width: 44, // Same width as the left placeholder to balance the header.
    },
    headerIconContainer: {
        width: 44,
        padding: scale(10),
        alignItems: 'center',
    },
    content: {
        padding: scale(16),
        alignItems: 'center',
    },
    label: {
        fontSize: scale(16),
        marginVertical: scale(8),
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    grossRevenueRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: scale(5),
    },
    wrapButton: {
        width: '100%',
        borderRadius: scale(50),
        overflow: 'hidden',
    },
    wrapButtonContent: {
        minHeight: scale(60),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: scale(8),
        paddingVertical: scale(15),
    },
    wrapButtonText: {
        fontSize: scale(18),
        textAlign: 'center',
        flexWrap: 'wrap',
        flexShrink: 1,
        maxWidth: '100%',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: scale(16),
    },
    amountInput: {
        width: scale(100),
        backgroundColor: '#f6f6f6',
        textAlign: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        borderRadius: scale(4),
    },
    amountIncrementor: {
        backgroundColor: '#f6f6f6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        borderWidth: 1,
        borderColor: '#b0b0b0',
    },
    dateContainer: {
        padding: scale(10),
        borderRadius: scale(5),
        backgroundColor: '#f6f6f6',
        marginVertical: scale(8),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    dateText: {
        marginVertical: scale(8),
        fontSize: scale(16),
    },
    logButtonContainer: {
        paddingHorizontal: scale(16),
        paddingVertical: scale(16),
    },
    logButton: {
        borderRadius: scale(30),
        width: '70%',
        alignSelf: 'center',
    },
});

export default TaskLogScreen;

import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import {
    Text,
    Button,
    Card,
    ProgressBar,
    Surface,
    Portal,
    Dialog,
    IconButton,
    Snackbar,
    DefaultTheme,
} from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import PopoverTooltip from '../components/PopoverTooltip';

interface WeeklyData {
    week_start: string; // ISO date string
    asks: number;
    follow_ups: number;
    open_houses: number;
    handwritten_cards: number;
    action_promises: number;
    exercises: number;
}

interface TaskType {
    task_type_id: number;
    name: string;
    minimal_amount: number;
    optimal_amount: number;
}

type TaskKey = Exclude<keyof WeeklyData, 'week_start'>;

const formatTaskName = (name: string): string => {
    return name
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

const TaskProgressBar = ({
    loggedAmount,
    minimalAmount,
    optimalAmount,
}: {
    loggedAmount: number;
    minimalAmount: number;
    optimalAmount: number;
}) => {
    const [barWidth, setBarWidth] = useState(0);
    const progress = optimalAmount ? loggedAmount / optimalAmount : 0;
    const thresholdPosition = optimalAmount ? (minimalAmount / optimalAmount) * barWidth : 0;

    return (
        <View
            style={styles.progressBarContainer}
            onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        >
            <ProgressBar progress={progress} style={styles.progressBar} />
            {optimalAmount !== minimalAmount && (
                <View
                    style={[
                        styles.thresholdLine,
                        { left: thresholdPosition - styles.thresholdLine.width / 2 },
                    ]}
                />
            )}
        </View>
    );
};

const HomeScreen = () => {
    const { user } = useAuth();
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    // Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);
    const [newWeeklyTotal, setNewWeeklyTotal] = useState<number>(0);

    // Snackbar
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Remove custom tooltip state (now using PopoverTooltip component)

    const fetchWeeklyData = async () => {
        if (!user) return;
        const courseStart = '2025-03-12';
        const { data, error } = await supabase.rpc('get_weekly_task_counts', {
            course_start: courseStart,
            uid: user.id,
        });
        if (error) {
            console.error('Error fetching weekly task counts:', error);
        } else {
            setWeeklyData(data);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            fetchWeeklyData();
            const fetchTaskTypes = async () => {
                const { data, error } = await supabase.from('task_types').select('*');
                if (error) {
                    console.error('Error fetching task types:', error);
                } else {
                    setTaskTypes(data);
                }
            };
            fetchTaskTypes();
        }, [user])
    );

    const currentWeek = weeklyData[currentWeekIndex];

    const getLoggedAmountForTask = (taskName: string): number => {
        if (!currentWeek) return 0;
        const singularKey = taskName.toLowerCase().replace(/[\s-]+/g, '_');
        const key = singularKey.endsWith('s') ? singularKey : singularKey + 's';
        const value = currentWeek[key as TaskKey];
        return typeof value === 'number' ? value : 0;
    };

    const handleProgressPress = (taskType: TaskType) => {
        if (!currentWeek) return;
        setSelectedTaskType(taskType);
        const currentTotal = getLoggedAmountForTask(taskType.name);
        setNewWeeklyTotal(currentTotal);
        setModalVisible(true);
    };

    const handleSaveAll = async () => {
        if (!user || !selectedTaskType || !currentWeek) return;
        const { error } = await supabase.rpc('update_weekly_task_logs', {
            _user_id: user.id,
            _task_type_id: selectedTaskType.task_type_id,
            _week_start: currentWeek.week_start,
            _new_total: newWeeklyTotal,
        });
        if (error) {
            setSnackbarMessage('Error updating logs');
        } else {
            setSnackbarMessage('Weekly total updated successfully');
        }
        setSnackbarVisible(true);
        await fetchWeeklyData();
        setModalVisible(false);
    };

    const customComponentTheme = { ...DefaultTheme, roundness: 4 };

    return (
        <Surface style={styles.container}>
            <PopoverTooltip
                tooltipText={
                    "Welcome to your Home Screen! Here you can:\n\u2022 track weekly tasks\n\u2022 adjust the quantities if needed\n\u2022 navigate between weeks.\n\nThe red lines on some progression bars represent the minimal weekly amounts you should aim for!"
                }
            />
            <View style={styles.headerRow}>
                <Text variant="headlineSmall" style={styles.weekLabel}>
                    Week {currentWeekIndex + 1}
                </Text>
                {/* Use standardized PopoverTooltip for the tooltip icon */}
                
            </View>

            {/* Render each task */}
            {currentWeek &&
                taskTypes
                    .filter(
                        (taskType) =>
                            taskType.name.toLowerCase() !== 'gross revenue' &&
                            taskType.name.toLowerCase() !== 'gross_revenue'
                    )
                    .map((taskType) => {
                        const loggedAmount = getLoggedAmountForTask(taskType.name);
                        return (
                            <TouchableOpacity
                                key={taskType.task_type_id}
                                onPress={() => handleProgressPress(taskType)}
                            >
                                <Card style={styles.progressContainer}>
                                    <Card.Content>
                                        <Text style={styles.label}>
                                            {formatTaskName(taskType.name)}: {loggedAmount} / {taskType.optimal_amount}
                                        </Text>
                                        <TaskProgressBar
                                            loggedAmount={loggedAmount}
                                            minimalAmount={taskType.minimal_amount}
                                            optimalAmount={taskType.optimal_amount}
                                        />
                                    </Card.Content>
                                </Card>
                            </TouchableOpacity>
                        );
                    })}

            <View style={styles.navigation}>
                <Button
                    mode="contained"
                    onPress={() => setCurrentWeekIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={currentWeekIndex === 0}
                    style={styles.navButton}
                >
                    Previous Week
                </Button>
                <Button
                    mode="contained"
                    onPress={() =>
                        setCurrentWeekIndex((prev) => Math.min(prev + 1, weeklyData.length - 1))
                    }
                    disabled={weeklyData.length === 0 || currentWeekIndex === weeklyData.length - 1}
                    style={styles.navButton}
                >
                    Next Week
                </Button>
            </View>

            <Portal>
                <Dialog
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    style={styles.dialog}
                    theme={customComponentTheme}
                >
                    <Dialog.Title>
                        {currentWeek && selectedTaskType
                            ? `Week ${currentWeekIndex + 1} ${formatTaskName(selectedTaskType.name)}s Logs`
                            : 'Logs'}
                    </Dialog.Title>
                    <Dialog.Content>
                        <View style={styles.aggregateContainer}>
                            <IconButton
                                icon="minus"
                                onPress={() => setNewWeeklyTotal((prev) => (prev > 0 ? prev - 1 : 0))}
                                style={styles.iconButton}
                            />
                            <Text style={styles.aggregateDisplay}>{newWeeklyTotal}</Text>
                            <IconButton
                                icon="plus"
                                onPress={() => setNewWeeklyTotal((prev) => prev + 1)}
                                style={styles.iconButton}
                            />
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button onPress={handleSaveAll}>Save</Button>
                        <Button onPress={() => setModalVisible(false)}>Cancel</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
            >
                {snackbarMessage}
            </Snackbar>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: scale(16),
        paddingBottom: scale(16),
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '7%',
        paddingTop: scale(0),
        marginTop: scale(16)
    },
    weekLabel: {
        fontSize: scale(22),
        fontWeight: 'bold',
        height: 'auto',
        minHeight: scale(0),
    },
    progressContainer: {
        marginVertical: scale(8),
        backgroundColor: '#f6f6f6',
    },
    label: {
        fontSize: scale(16),
        marginBottom: scale(4),
    },
    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: scale(20),
    },
    navButton: {
        flex: 1,
        marginHorizontal: scale(4),
    },
    progressBarContainer: {
        position: 'relative',
        width: '100%',
        backgroundColor: '#fff',
    },
    progressBar: {
        height: scale(10),
        borderRadius: scale(2),
    },
    thresholdLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: scale(2),
        backgroundColor: 'red',
    },
    dialog: { borderRadius: 30 },
    aggregateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: scale(16),
    },
    aggregateDisplay: {
        fontSize: scale(18),
        paddingHorizontal: scale(16),
    },
    iconButton: {
        backgroundColor: '#f6f6f6',
    },
    dialogActions: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
});

export default HomeScreen;

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

const formatTaskName = (name: string): string =>
    name
        .split('_')
        .map(w => w[0].toUpperCase() + w.slice(1))
        .join(' ');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
            onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
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

    // NEW: pipeline summary state
    const [pipelineSummary, setPipelineSummary] = useState<{
        count: number;
        totalRevenue: number;
    }>({ count: 0, totalRevenue: 0 });

    // Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);
    const [newWeeklyTotal, setNewWeeklyTotal] = useState<number>(0);

    // Snackbar
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const fetchWeeklyData = async () => {
        if (!user) return;

        // Step 1: Get the most recent course start date
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('start_date')
            .order('start_date', { ascending: false })
            .limit(1)
            .single();

        if (courseError || !course) {
            console.error('Error fetching course start date:', courseError?.message);
            return;
        }

        const courseStart = course.start_date;

        // Step 2: Use that start date in your RPC call
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

            // 1) fetch tasks & weeks
            fetchWeeklyData();
            const fetchTaskTypes = async () => {
                const { data, error } = await supabase
                    .from('task_types')
                    .select('*');
                if (!error && data) setTaskTypes(data);
            };
            fetchTaskTypes();

            // 2) NEW: fetch pipeline summary
            const fetchPipelineSummary = async () => {
                const { data, error } = await supabase.rpc(
                    'get_clients_by_client_type',
                    { uid: user.id, client_type_name: 'Pipeline' }
                );
                if (!error && data) {
                    const count = data.length;
                    const totalRevenue = data.reduce(
                        (sum: number, c: any) => sum + (c.pipeline_revenue || 0),
                        0
                    );
                    setPipelineSummary({ count, totalRevenue });
                }
            };
            fetchPipelineSummary();
        }, [user])
    );

    const currentWeek = weeklyData[currentWeekIndex];

    const getLoggedAmountForTask = (taskName: string): number => {
        if (!currentWeek) return 0;
        const keyBase = taskName.toLowerCase().replace(/[\s-]+/g, '_');
        const key = keyBase.endsWith('s') ? keyBase : keyBase + 's';
        const val = (currentWeek as any)[key as TaskKey];
        return typeof val === 'number' ? val : 0;
    };

    const handleProgressPress = (taskType: TaskType) => {
        if (!currentWeek) return;
        setSelectedTaskType(taskType);
        setNewWeeklyTotal(getLoggedAmountForTask(taskType.name));
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
        setSnackbarMessage(error ? 'Error updating logs' : 'Weekly total updated successfully');
        setSnackbarVisible(true);
        await fetchWeeklyData();
        setModalVisible(false);
    };

    const customComponentTheme = { ...DefaultTheme, roundness: 4 };

    return (
        <Surface style={styles.container}>
            <PopoverTooltip
                tooltipText={
                    "Welcome to your Home Screen! Here you can:\n" +
                    "\u2022 track weekly tasks\n" +
                    "\u2022 adjust the quantities if needed\n" +
                    "\u2022 navigate between weeks.\n\n" +
                    "The red lines on some progression bars represent the minimal weekly amounts you should aim for!"
                }
            />

            <View style={styles.headerRow}>
                <Text variant="headlineSmall" style={styles.weekLabel}>
                    Week {currentWeekIndex + 1}
                </Text>
            </View>

            {/* Tasks */}
            {currentWeek &&
                taskTypes
                    .filter(tt => !['gross revenue', 'gross_revenue'].includes(tt.name.toLowerCase()))
                    .map(tt => {
                        const logged = getLoggedAmountForTask(tt.name);
                        return (
                            <TouchableOpacity
                                key={tt.task_type_id}
                                onPress={() => handleProgressPress(tt)}
                            >
                                <Card style={styles.progressContainer}>
                                    <Card.Content>
                                        <Text style={styles.label}>
                                            {formatTaskName(tt.name)}: {logged} / {tt.optimal_amount}
                                        </Text>
                                        <TaskProgressBar
                                            loggedAmount={logged}
                                            minimalAmount={tt.minimal_amount}
                                            optimalAmount={tt.optimal_amount}
                                        />
                                    </Card.Content>
                                </Card>
                            </TouchableOpacity>
                        );
                    })}

            {/* NEW: elevated Surface */}
            {/* Two separate summary boxes side-by-side */}
            <View style={styles.summaryRow}>
                <Surface style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>15/30 Pipeline</Text>
                    <Text style={styles.summaryValue}>
                        {pipelineSummary.count}
                    </Text>
                </Surface>

                <Surface style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>15/30 Revenue</Text>
                    <Text style={styles.summaryValue}>
                        {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2,
                        }).format(pipelineSummary.totalRevenue)}
                    </Text>
                </Surface>

            </View>



            {/* Prev/Next */}
            <View style={styles.navigation}>
                <Button
                    mode="contained"
                    onPress={() => setCurrentWeekIndex(i => Math.max(i - 1, 0))}
                    disabled={currentWeekIndex === 0}
                    style={styles.navButton}
                >
                    Previous Week
                </Button>
                <Button
                    mode="contained"
                    onPress={() =>
                        setCurrentWeekIndex(i =>
                            Math.min(i + 1, weeklyData.length - 1)
                        )
                    }
                    disabled={
                        weeklyData.length === 0 ||
                        currentWeekIndex === weeklyData.length - 1
                    }
                    style={styles.navButton}
                >
                    Next Week
                </Button>
            </View>

            {/* Edit Dialog */}
            <Portal>
                <Dialog
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    style={styles.dialog}
                    theme={customComponentTheme}
                >
                    <Dialog.Title>
                        {currentWeek && selectedTaskType
                            ? `Week ${currentWeekIndex + 1} ${formatTaskName(
                                selectedTaskType.name
                            )}s Logs`
                            : 'Logs'}
                    </Dialog.Title>
                    <Dialog.Content>
                        <View style={styles.aggregateContainer}>
                            <IconButton
                                icon="minus"
                                onPress={() =>
                                    setNewWeeklyTotal(n => (n > 0 ? n - 1 : 0))
                                }
                                style={styles.iconButton}
                            />
                            <Text style={styles.aggregateDisplay}>
                                {newWeeklyTotal}
                            </Text>
                            <IconButton
                                icon="plus"
                                onPress={() => setNewWeeklyTotal(n => n + 1)}
                                style={styles.iconButton}
                            />
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button onPress={handleSaveAll}>Save</Button>
                        <Button onPress={() => setModalVisible(false)}>
                            Cancel
                        </Button>
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
        justifyContent: 'center',
        marginTop: scale(16),
    },
    weekLabel: {
        fontSize: scale(22),
        fontWeight: 'bold',
    },
    progressContainer: {
        marginVertical: scale(3),
        backgroundColor: '#f6f6f6',
    },
    label: {
        fontSize: scale(16),
        marginBottom: scale(4),
    },
    // NEW styles for summary
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        
    },
    // gives white background + shadow like your cards
    summarySurface: {
        backgroundColor: '#f6f6f6',
        elevation: 2,              // Android shadow
        shadowColor: '#000',       // iOS shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        borderRadius: scale(60),
        borderWidth: scale(1),
        borderColor: '#888',
        marginVertical: scale(12),
        padding: scale(10),
    },
    summaryText: {
        fontSize: scale(16),
        fontWeight: '600',
    },
    summaryLabel: {
        fontSize: scale(14),    // a bit smaller than your value
        color: '#666',          // muted gray
    },
    summaryValue: {
        fontSize: scale(18),    // larger, to pop
        fontWeight: '700',      // bold
        marginTop: scale(4),    // small gap under the label
    },

    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: scale(12),
    },
    summaryBox: {
        flex: 1,
        backgroundColor: '#fff',
        elevation: 2,               // Android
        shadowColor: '#000',        // iOS
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        borderRadius: scale(60),
        padding: scale(10),
        marginHorizontal: scale(4),
        alignItems: 'center',
    },

    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        height: scale(6),     // reduced from 10 to 6
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

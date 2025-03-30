// HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Provider as PaperProvider, Text, Button, Card, ProgressBar, Surface } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
}

// Exclude 'week_start' so that only numeric keys remain.
type TaskKey = Exclude<keyof WeeklyData, 'week_start'>;

const HomeScreen = () => {
    const { user } = useAuth();
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    useEffect(() => {
        if (!user) return;

        const fetchWeeklyData = async () => {
            // Use your desired course start date.
            const courseStart = '2025-02-27';
            const { data, error } = await supabase.rpc('get_weekly_task_counts', {
                course_start: courseStart,
                uid: user.id
            });
            if (error) {
                console.error('Error fetching weekly task counts:', error);
            } else {
                setWeeklyData(data);
            }
        };

        const fetchTaskTypes = async () => {
            const { data, error } = await supabase.from('task_types').select('*');
            if (error) {
                console.error('Error fetching task types:', error);
            } else {
                setTaskTypes(data);
            }
        };

        fetchWeeklyData();
        fetchTaskTypes();
    }, [user]);

    const currentWeek = weeklyData[currentWeekIndex];

    // Helper to get logged amount for a given task type.
    // Converts the singular task name to the plural key used in weeklyData.
    const getLoggedAmountForTask = (taskName: string): number => {
        if (!currentWeek) return 0;
        // Convert to lower-case and replace spaces/hyphens with underscores.
        const singularKey = taskName.toLowerCase().replace(/[\s-]+/g, '_');
        // Append 's' if it doesn't already end in 's'
        const key = singularKey.endsWith('s') ? singularKey : singularKey + 's';
        const value = currentWeek[key as TaskKey];
        return typeof value === 'number' ? value : 0;
    };

    return (
        // Using Paper's Surface as the main container for consistent theming.
        // (Ideally, wrap your root component in a PaperProvider for global theming.)
        <Surface style={styles.container}>
            {/* Using Paper's Text with a variant prop for typography */}
            <Text variant="headlineSmall" style={styles.weekLabel}>
                Week {currentWeekIndex + 1}
            </Text>
            {currentWeek &&
                taskTypes.map((taskType) => {
                    const loggedAmount = getLoggedAmountForTask(taskType.name);
                    const progressPercent = taskType.minimal_amount
                        ? (loggedAmount / taskType.minimal_amount) * 100
                        : 0;
                    return (
                        // Using Paper's Card component for a styled progress block for each task.
                        <Card key={taskType.task_type_id} style={styles.progressContainer}>
                            <Card.Content>
                                <Text style={styles.label}>
                                    {taskType.name}: {loggedAmount} / {taskType.minimal_amount}
                                </Text>
                                {/* React Native Paper's ProgressBar expects a value between 0 and 1 */}
                                <ProgressBar progress={progressPercent / 100} />
                            </Card.Content>
                        </Card>
                    );
                })}
            <View style={styles.navigation}>
                {/* Converted React Native Buttons to Paper Buttons with mode="contained" */}
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
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    progressContainer: { marginVertical: 8 },
    label: { fontSize: 16, marginBottom: 4 },
    weekLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    navigation: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    navButton: { flex: 1, marginHorizontal: 4 }
});

// Note: In your app's entry point, wrap your root component with PaperProvider for consistent theming.
// Example:
// const App = () => (
//   <PaperProvider>
//     <HomeScreen />
//   </PaperProvider>
// );
// export default App;

export default HomeScreen;

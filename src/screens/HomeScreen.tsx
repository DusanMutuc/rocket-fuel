// HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProgressBar from '../components/ProgressBar';

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
        <View style={styles.container}>
            <Text style={styles.weekLabel}>
                Week {currentWeekIndex + 1}
            </Text>
            {currentWeek &&
                taskTypes.map((taskType) => {
                    const loggedAmount = getLoggedAmountForTask(taskType.name);
                    const progressPercent = taskType.minimal_amount
                        ? (loggedAmount / taskType.minimal_amount) * 100
                        : 0;
                    return (
                        <View key={taskType.task_type_id} style={styles.progressContainer}>
                            <Text style={styles.label}>
                                {taskType.name}: {loggedAmount} / {taskType.minimal_amount}
                            </Text>
                            <ProgressBar progress={progressPercent} />
                        </View>
                    );
                })}
            <View style={styles.navigation}>
                <Button
                    title="Previous Week"
                    onPress={() => setCurrentWeekIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={currentWeekIndex === 0}
                />
                <Button
                    title="Next Week"
                    onPress={() => setCurrentWeekIndex((prev) => Math.min(prev + 1, weeklyData.length - 1))}
                    disabled={weeklyData.length === 0 || currentWeekIndex === weeklyData.length - 1}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    progressContainer: { marginVertical: 8 },
    label: { fontSize: 16, marginBottom: 4 },
    weekLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    navigation: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
});

export default HomeScreen;

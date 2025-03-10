import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFont } from '@shopify/react-native-skia';
import { ActivityIndicator } from 'react-native';
import { format } from 'date-fns';

type TaskRow = {
    day: string;
    total: number;
};

const ProgressScreen = () => {
    const { user } = useAuth();
    const [chartData, setChartData] = useState<{ [key: number]: { x: number; y: number }[] }>({});
    const [error, setError] = useState<string | undefined>();
    const font = useFont(require('../../assets/Fonts/SpaceMono-Regular.ttf'), 12);

    useEffect(() => {
        async function fetchData(task_type: number) {
            const { data, error } = await supabase.rpc('get_daily_task_counts_by_type_in_range', {
                uid: user?.id,
                task_type: task_type,
                start_date: '2025-03-01',    // or new Date() to string
                end_date: '2025-03-10'
            });

            if (error) {
                setError(error.message);
                return;
            }

            // Transform rows to { x: Date, y: number }
            let runningTotal = 0;
            const transformed = data.map((row: TaskRow) => {
                runningTotal += row.total;
                return {
                    x: new Date(row.day), // Keep x as Date
                    y: runningTotal,
                };
            });

            setChartData((prevData) => ({
                ...prevData, // Copy all existing data
                [task_type]: transformed, // Update or add data for the current task_type
            }));
        }

        if (user?.id) {
            // Fetch data for all task types (assuming there are 6 task types)
            for (let taskType = 1; taskType <= 6; taskType++) {
                fetchData(taskType);
            }
        }
    }, [user]);

    if (!font) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // Ensure chartData[1] is defined before using it
    const taskType1Data = chartData[1] || [];

    return (
        <View style={styles.container}>
             {/*Debugging: Display the data for task type 1 */}
            {/*<Text>{JSON.stringify(taskType1Data, null, 2)}</Text>*/}
            {/*{error && <Text>{error}</Text>}*/}

            <View style={styles.chartWrapper}>
                {taskType1Data.length > 0 && (
                    <CartesianChart
                        axisOptions={{
                            font,
                            tickCount: { x: 3, y: 10 },
                            labelOffset: { x: -2, y: 0 },
                            formatXLabel: (x) => format(x, 'MM/dd'), // Format Date as string
                        }}
                        data={taskType1Data} // Pass the array for task type 1
                        xKey="x"
                        yKeys={['y']}
                    >
                        {({ points }) => (
                            <Line
                                points={points.y}
                                color="red"
                                strokeWidth={3}
                                animate={{ type: 'timing', duration: 300 }}
                            />
                        )}
                    </CartesianChart>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartWrapper: {
        width: 350,
        height: 350,
    },
});

export default ProgressScreen;
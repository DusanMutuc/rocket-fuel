// ProgressScreen.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Surface } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFont } from '@shopify/react-native-skia';
import { format, subDays } from 'date-fns';
import { CartesianChart, Line } from 'victory-native';
import Legend from '../components/Legend';

// Define allowed chart metrics.
type ChartMetric =
    | 'asks'
    | 'follow_ups'
    | 'action_promises'
    | 'open_houses'
    | 'handwritten_cards'
    | 'exercises';

// Shape of rows returned from the RPC.
type RowWithAllTypes = {
    day: string;
    asks: number;
    follow_ups: number;
    open_houses: number;
    handwritten_cards: number;
    action_promises: number;
    exercises: number;
};

// Legend item shape.
interface LegendItem {
    key: ChartMetric;
    label: string;
    color: string;
}

const ProgressScreen = () => {
    const { user } = useAuth();
    const [chartData, setChartData] = useState<any[]>([]);
    const [error, setError] = useState<string | undefined>();
    const font = useFont(require('../../assets/Fonts/SpaceMono-Regular.ttf'), 12);

    // Legend data.
    const legendData: LegendItem[] = [
        { key: 'asks', label: 'Asks', color: 'red' },
        { key: 'follow_ups', label: 'Follow-ups', color: 'orange' },
        { key: 'action_promises', label: 'Action Promises', color: 'blue' },
        { key: 'open_houses', label: 'Open Houses', color: 'purple' },
        { key: 'handwritten_cards', label: 'Handwritten Cards', color: 'magenta' },
        { key: 'exercises', label: 'Exercises', color: 'navy' },
    ];

    // State to track which line is highlighted.
    const [selectedLine, setSelectedLine] = useState<ChartMetric | null>(null);
    // Track whether the view mode is 'weekly' or 'alltime'.
    const [viewMode, setViewMode] = useState<'weekly' | 'alltime'>('weekly');

    // Toggle highlight for a legend item.
    const handleLegendPress = (key: ChartMetric) => {
        setSelectedLine(selectedLine === key ? null : key);
    };

    // Toggle between weekly and all-time view modes.
    const toggleViewMode = () => {
        setViewMode((prev) => (prev === 'weekly' ? 'alltime' : 'weekly'));
    };

    useEffect(() => {
        async function fetchData() {
            if (!user?.id) return;

            // Set date range based on viewMode.
            let startDate: string;
            let endDate: string;

            if (viewMode === 'weekly') {
                // Last 7 days to current day.
                const oneWeekAgo = subDays(new Date(), 7);
                startDate = format(oneWeekAgo, 'yyyy-MM-dd');
                endDate = format(new Date(), 'yyyy-MM-dd');
            } else {
                // "All time" from a fixed start date up to today.
                startDate = '2025-03-01';
                endDate = format(new Date(), 'yyyy-MM-dd');
            }

            const { data, error: rpcError } = await supabase.rpc(
                'get_daily_task_counts_all_types_in_range',
                {
                    uid: user.id,
                    start_date: startDate,
                    end_date: endDate,
                }
            );

            if (rpcError) {
                setError(rpcError.message);
                return;
            }

            let runningAsks = 0;
            let runningFollowUps = 0;
            let runningOpenHouses = 0;
            let runningHandwrittenCards = 0;
            let runningActionPromises = 0;
            let runningExercises = 0;

            const transformed = (data as RowWithAllTypes[]).map((row) => {
                runningAsks += row.asks;
                runningFollowUps += row.follow_ups;
                runningOpenHouses += row.open_houses;
                runningHandwrittenCards += row.handwritten_cards;
                runningActionPromises += row.action_promises;
                runningExercises += row.exercises;

                return {
                    x: new Date(row.day),
                    asks: runningAsks,
                    follow_ups: runningFollowUps,
                    open_houses: runningOpenHouses,
                    handwritten_cards: runningHandwrittenCards,
                    action_promises: runningActionPromises,
                    exercises: runningExercises,
                };
            });

            setChartData(transformed);
        }

        // Refetch data when user or viewMode changes.
        fetchData();
    }, [user, viewMode]);

    // Show a loader until the font is loaded.
    if (!font) {
        return (
            <Surface style={styles.loaderContainer}>
                <ActivityIndicator animating={true} size="large" />
            </Surface>
        );
    }

    return (
        // Using Paper's Surface for a consistent themed container.
        <Surface style={styles.container}>
            {/* Toggle button using Paper's Button */}
            <Button mode="contained" onPress={toggleViewMode} style={styles.toggleButton}>
                {viewMode === 'weekly' ? 'Switch to All Time' : 'Switch to Weekly'}
            </Button>

            <View style={styles.chartWrapper}>
                {chartData.length > 0 && (
                    <View style={{ height: 350, width: '100%' }}>
                        <CartesianChart
                            axisOptions={{
                                font,
                                tickCount: { x: 3, y: 10 },
                                labelOffset: { x: -2, y: 0 },
                                formatXLabel: (x) => format(x, 'MM/dd'),
                            }}
                            data={chartData}
                            xKey="x"
                            yKeys={[
                                'asks',
                                'follow_ups',
                                'open_houses',
                                'handwritten_cards',
                                'exercises',
                                'action_promises',
                            ]}
                        >
                            {({ points }) => (
                                <>
                                    {legendData.map((item) => (
                                        <Line
                                            key={item.key}
                                            // Casting to ensure TypeScript compatibility.
                                            points={points[item.key as keyof typeof points]}
                                            color={
                                                selectedLine === null || selectedLine === item.key
                                                    ? item.color
                                                    : 'lightgray'
                                            }
                                            strokeWidth={
                                                selectedLine === null
                                                    ? 3
                                                    : selectedLine === item.key
                                                        ? 5
                                                        : 2
                                            }
                                            animate={{ type: 'timing', duration: 300 }}
                                        />
                                    ))}
                                </>
                            )}
                        </CartesianChart>
                    </View>
                )}
                {/* Wrapping the Legend in a Surface for a paper-style look */}
                <Surface style={styles.legend}>
                    <Legend items={legendData} onPress={handleLegendPress} selected={selectedLine} />
                </Surface>
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 20,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartWrapper: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        width: '90%',
        marginTop: 10,
    },
    legend: {
        margin: 10,
        borderColor: 'black',
        borderWidth: 3,
        borderRadius: 10,
        backgroundColor: '#fff',
        padding: 10,
    },
    toggleButton: {
        marginVertical: 10,
    },
});

export default ProgressScreen;

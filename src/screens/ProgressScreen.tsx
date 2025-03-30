import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFont } from '@shopify/react-native-skia';
import { format, subDays } from 'date-fns'; // NEW: import subDays
import { CartesianChart, Line } from 'victory-native';
import Legend from '../components/Legend';

// Define the allowed keys for your chart metrics.
type ChartMetric =
    | 'asks'
    | 'follow_ups'
    | 'action_promises'
    | 'open_houses'
    | 'handwritten_cards'
    | 'exercises';

// Shape of rows returned from the RPC:
type RowWithAllTypes = {
    day: string;
    asks: number;
    follow_ups: number;
    open_houses: number;
    handwritten_cards: number;
    action_promises: number;
    exercises: number;
};

// Define the shape for legend items.
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

    // Legend data with keys restricted to ChartMetric.
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

    // NEW: Track whether the user wants to see weekly or all-time data
    const [viewMode, setViewMode] = useState<'weekly' | 'alltime'>('weekly');

    // Toggle highlight for a line when its legend item is pressed.
    const handleLegendPress = (key: ChartMetric) => {
        setSelectedLine(selectedLine === key ? null : key);
    };

    // NEW: A button tap toggles between weekly and alltime
    const toggleViewMode = () => {
        setViewMode((prev) => (prev === 'weekly' ? 'alltime' : 'weekly'));
    };

    useEffect(() => {
        async function fetchData() {
            if (!user?.id) return;

            // NEW: Decide how to set your date range based on viewMode
            let startDate: string;
            let endDate: string;

            if (viewMode === 'weekly') {
                // Last 7 days to current day
                const oneWeekAgo = subDays(new Date(), 7);
                startDate = format(oneWeekAgo, 'yyyy-MM-dd');
                endDate = format(new Date(), 'yyyy-MM-dd');
            } else {
                // “All time” from a fixed date in code, up through today
                startDate = '2025-03-01'; // Or whatever earliest date you like
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

        // Include viewMode in dependencies so we fetch fresh data each time it changes
        fetchData();
    }, [user, viewMode]); // UPDATED: added viewMode

    if (!font) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* NEW: A button to toggle weekly/all-time */}
            <Button
                title={viewMode === 'weekly' ? 'Switch to All Time' : 'Switch to Weekly'}
                onPress={toggleViewMode}
            />

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
                                            // Cast item.key so TypeScript knows it's a valid key of points.
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
                <View style={styles.legend}>
                    <Legend
                        items={legendData}
                        onPress={handleLegendPress}
                        selected={selectedLine}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Center content for demonstration
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 20,
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
        borderCurve: 'circular',
        borderRadius: 10,
        backgroundColor: '#fff',
        fontSize: 24,
        padding: 10,
    },
});

export default ProgressScreen;

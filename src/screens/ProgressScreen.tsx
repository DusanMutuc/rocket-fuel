import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFont } from '@shopify/react-native-skia';
import { ActivityIndicator } from 'react-native';
import { format } from 'date-fns';
import { CartesianChart, Line } from 'victory-native'; // We'll handle this later

// Shape of rows returned from the RPC:
type RowWithAllTypes = {
    day: string;
    asks: number;
    follow_ups: number;
    open_houses: number;
    handwritten_cards: number;
    listing_presentations: number;
    exercises: number;
};

const ProgressScreen = () => {
    const { user } = useAuth();
    const [chartData, setChartData] = useState<
        Array<{
            x: number;
            asks: number;
            follow_ups: number;
            open_houses: number;
            handwritten_cards: number;
            listing_presentations: number;
            exercises: number;
        }>
    >([]);
    const [error, setError] = useState<string | undefined>();
    const font = useFont(require('../../assets/Fonts/SpaceMono-Regular.ttf'), 12);

    useEffect(() => {
        async function fetchData() {
            if (!user?.id) return;

            // Call the RPC that returns columns: day, asks, follow_ups, open_houses, etc.
            const { data, error } = await supabase.rpc('get_daily_task_counts_all_types_in_range', {
                uid: user.id,
                start_date: '2025-03-01',
                end_date: '2025-03-10',
            });

            if (error) {
                setError(error.message);
                return;
            }

            // data is an array with daily totals like:
            // [
            //   { day: '2025-03-01', asks: 16, follow_ups: 0, ... },
            //   { day: '2025-03-02', asks: 9, follow_ups: 5, ... },
            //   ...
            // ]

            // We'll accumulate a running total for each task type:
            let runningAsks = 0;
            let runningFollowUps = 0;
            let runningOpenHouses = 0;
            let runningHandwrittenCards = 0;
            let runningListingPresentations = 0;
            let runningExercises = 0;

            const transformed = data.map((row: RowWithAllTypes) => {
                runningAsks += row.asks;
                runningFollowUps += row.follow_ups;
                runningOpenHouses += row.open_houses;
                runningHandwrittenCards += row.handwritten_cards;
                runningListingPresentations += row.listing_presentations;
                runningExercises += row.exercises;

                return {
                    x: new Date(row.day), // or keep as string if you prefer
                    asks: runningAsks,
                    follow_ups: runningFollowUps,
                    open_houses: runningOpenHouses,
                    handwritten_cards: runningHandwrittenCards,
                    listing_presentations: runningListingPresentations,
                    exercises: runningExercises,
                };
            });

            setChartData(transformed);
        }

        fetchData();
    }, [user]);

    if (!font) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Debugging: display the newly shaped data */}
            {/*<Text>{JSON.stringify(chartData, null, 2)}</Text>*/}
            {/*{error && <Text>{error}</Text>}*/}
            <View style={styles.chartWrapper}>
                <View style={styles.chartWrapper}>
                    {chartData.length > 0 && (
                        <CartesianChart
                            axisOptions={{
                                font,
                                tickCount: { x: 3, y: 10 },
                                labelOffset: { x: -2, y: 0 },
                                formatXLabel: (x) => format(x, 'MM/dd'), 
                            }}
                            data={chartData}
                            xKey="x"
                            yKeys={['asks', 'follow_ups', 'open_houses', 'handwritten_cards', 'exercises', 'listing_presentations']}
                        >
                            {({ points }) => (
                                <>
                                    <Line
                                        points={points.asks}
                                        color="red"
                                        strokeWidth={3}
                                        animate={{ type: 'timing', duration: 300 }}
                                    />
                                    <Line
                                        points={points.follow_ups}
                                        color="orange"
                                        strokeWidth={3}
                                        animate={{type: "timing", duration: 300}}
                                    />
                                    <Line
                                        points={points.listing_presentations}
                                        color="blue"
                                        strokeWidth={3}
                                        animate={{ type: "timing", duration: 300 }}
                                    />
                                    <Line
                                        points={points.open_houses}
                                        color="purple"
                                        strokeWidth={3}
                                        animate={{ type: "timing", duration: 300 }}
                                    />
                                    <Line
                                        points={points.handwritten_cards}
                                        color="magenta"
                                        strokeWidth={3}
                                        animate={{ type: "timing", duration: 300 }}
                                    />
                                    <Line
                                        points={points.exercises}
                                        color="navy"
                                        strokeWidth={3}
                                        animate={{ type: "timing", duration: 300 }}
                                    />
                                </>

                            )}
                        </CartesianChart>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    chartWrapper: {
        width: 350,
        height: 350
    }
});

export default ProgressScreen;

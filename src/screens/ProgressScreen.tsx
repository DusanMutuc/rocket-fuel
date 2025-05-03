import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Text, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Button, Surface, IconButton, Portal, Snackbar } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFont } from '@shopify/react-native-skia';
import { format, subDays } from 'date-fns';
import { CartesianChart, Line, Area } from 'victory-native';
import Legend from '../components/Legend';
import PopoverTooltip from '../components/PopoverTooltip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;
const guidelineBaseWidth = 375;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

type RowWithAllTypes = {
    day: string;
    asks: number;
    follow_ups: number;
    open_houses: number;
    handwritten_cards: number;
    action_promises: number;
    exercises: number;
    gross_revenue: number;
};

type ChartMetric =
    | 'asks'
    | 'follow_ups'
    | 'action_promises'
    | 'open_houses'
    | 'handwritten_cards'
    | 'exercises'
    | 'gross_revenue'
    | 'baseline';

interface LegendItem {
    key: Exclude<ChartMetric, 'baseline'>;
    label: string;
    color: string;
}

const ProgressScreen = () => {
    const { user } = useAuth();
    const [chartData, setChartData] = useState<any[]>([]);
    const [error, setError] = useState<string | undefined>();
    const font = useFont(require('../../assets/Fonts/SpaceMono-Regular.ttf'), 12);

    // Legend data (gross revenue is included)
    const legendData: LegendItem[] = [
        { key: 'asks', label: 'Asks', color: '#c71aad' },
        { key: 'follow_ups', label: 'Follow-ups', color: '#149240' },
        { key: 'action_promises', label: 'Action Promises', color: '#0782b2' },
        { key: 'open_houses', label: 'Open Houses', color: '#fd2121' },
        { key: 'handwritten_cards', label: 'Handwritten Cards', color: '#ef8c00' },
        { key: 'exercises', label: 'Exercises', color: '#7631af' },
        { key: 'gross_revenue', label: 'Gross Revenue', color: 'black' },

    ];

    // State for currently selected legend key.
    const [selectedLine, setSelectedLine] = useState<ChartMetric | null>(null);
    const [viewMode, setViewMode] = useState<'weekly' | 'alltime'>('weekly');

    const handleLegendPress = (key: ChartMetric) => {
        setSelectedLine(selectedLine === key ? null : key);
    };

    const toggleViewMode = () => {
        setViewMode((prev) => (prev === 'weekly' ? 'alltime' : 'weekly'));
    };

    useEffect(() => {
        async function fetchData() {
            if (!user?.id) return;

            let startDate: string;
            let endDate: string;

            if (viewMode === 'weekly') {
                const oneWeekAgo = subDays(new Date(), 7);
                startDate = format(oneWeekAgo, 'yyyy-MM-dd');
                endDate = format(new Date(), 'yyyy-MM-dd');
            } else {
                startDate = '2025-03-15';
                endDate = format(new Date(), 'yyyy-MM-dd');
            }

            const { data: taskTypesData, error: taskTypesError } = await supabase
                .from('task_types')
                .select('name, minimal_amount');

            if (taskTypesError) {
                setError(taskTypesError.message);
                return;
            }

            const minimalAmounts: Record<string, number> = {};
            taskTypesData.forEach((task: any) => {
                minimalAmounts[task.name] = task.minimal_amount;
            });

            // Mapping from chart metrics to task type names, excluding 'baseline' and 'gross_revenue'
            const keyMapping: Record<Exclude<ChartMetric, 'baseline' | 'gross_revenue'>, string> = {
                asks: 'ask',
                follow_ups: 'follow_up',
                action_promises: 'action_promise',
                open_houses: 'open_house',
                handwritten_cards: 'handwritten_card',
                exercises: 'exercise',
            };

            if (!minimalAmounts[keyMapping.asks]) {
                setError('Minimal amount for asks not found in task_types.');
                return;
            }

            const scalingFactors = {
                asks: 1,
                follow_ups: minimalAmounts[keyMapping.asks] / minimalAmounts[keyMapping.follow_ups],
                open_houses: minimalAmounts[keyMapping.asks] / minimalAmounts[keyMapping.open_houses],
                handwritten_cards: minimalAmounts[keyMapping.asks] / minimalAmounts[keyMapping.handwritten_cards],
                action_promises: minimalAmounts[keyMapping.asks] / minimalAmounts[keyMapping.action_promises],
                exercises: minimalAmounts[keyMapping.asks] / minimalAmounts[keyMapping.exercises],
            };

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
            let runningGrossRevenue = 0;
            const baselineDaily = minimalAmounts[keyMapping.asks] / 7;

            const transformed = (data as RowWithAllTypes[]).map((row, index) => {
                runningAsks += row.asks;
                runningFollowUps += row.follow_ups;
                runningOpenHouses += row.open_houses;
                runningHandwrittenCards += row.handwritten_cards;
                runningActionPromises += row.action_promises;
                runningExercises += row.exercises;
                runningGrossRevenue += row.gross_revenue;

                return {
                    x: new Date(row.day),
                    asks: runningAsks * scalingFactors.asks,
                    follow_ups: runningFollowUps * scalingFactors.follow_ups,
                    open_houses: runningOpenHouses * scalingFactors.open_houses,
                    handwritten_cards: runningHandwrittenCards * scalingFactors.handwritten_cards,
                    action_promises: runningActionPromises * scalingFactors.action_promises,
                    exercises: runningExercises * scalingFactors.exercises,
                    gross_revenue: runningGrossRevenue,
                    baseline: baselineDaily * (index + 1),
                };
            });

            setChartData(transformed);
        }

        fetchData();
    }, [user, viewMode]);

    if (!font) {
        return (
            <Surface style={styles.loaderContainer}>
                <ActivityIndicator animating size="large" />
            </Surface>
        );
    }

    if (error) {
        return (
            <Surface style={styles.loaderContainer}>
                <Text style={{ color: 'red', padding: 20 }}>{error}</Text>
            </Surface>
        );
    }

    return (
        <Surface style={styles.container}>
            {/* Standardized PopoverTooltip renders absolutely at the top-right */}
            <PopoverTooltip
                tooltipText={
                    "Welcome to your Progress Screen! Here you can view your daily progress trends, toggle between weekly and all-time views, and analyze your performance.\n\nThe red area is below the minimal threshold, so try to keep all your tasks above it!"
                }
            />

            <View style={styles.content}>
                <View style={styles.chartContainer}>
                    {chartData.length > 0 && (
                        <>
                            {selectedLine === 'gross_revenue' ? (
                                // Gross revenue chart: display only gross_revenue as y-axis.
                                <CartesianChart
                                    axisOptions={{
                                        font,
                                        tickCount: { x: 3, y: 10 },
                                        labelOffset: { x: -2, y: 0 },
                                        formatXLabel: (x) => format(x, 'MM/dd'),
                                    }}
                                    data={chartData}
                                    xKey="x"
                                    yKeys={['gross_revenue']}
                                >
                                    {({ points }) => (
                                        <>
                                            <Line
                                                key="gross_revenue-line"
                                                points={(points as any)['gross_revenue']}
                                                color='1d1d1d'
                                                strokeWidth={5}
                                                animate={{ type: 'timing', duration: 300 }}
                                                curveType="catmullRom100"
                                            />
                                        </>
                                    )}
                                </CartesianChart>
                            ) : (
                                // Normal chart: display all metrics except gross_revenue.
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
                                        'action_promises',
                                        'open_houses',
                                        'handwritten_cards',
                                        'exercises',
                                        'baseline',
                                    ]}
                                >
                                    {({ points, chartBounds }) => (
                                        <>
                                            <Area
                                                key="baseline-area"
                                                points={(points as any)['baseline']}
                                                    color='#A30000'
                                                opacity={0.15}
                                                y0={chartBounds.bottom}
                                            />
                                            {legendData
                                                .filter((item) => item.key !== 'gross_revenue')
                                                .map((item) => (
                                                    <Line
                                                        key={item.key}
                                                        points={(points as any)[item.key]}
                                                        color={
                                                            selectedLine === null || selectedLine === item.key
                                                                ? item.color
                                                                : 'lightgray'
                                                        }
                                                        strokeWidth={
                                                            selectedLine === null ? 3 : selectedLine === item.key ? 5 : 2
                                                        }
                                                        animate={{ type: 'timing', duration: 300 }}
                                                        curveType="cardinal50"
                                                    />
                                                ))}
                                        </>
                                    )}
                                </CartesianChart>
                            )}
                        </>
                    )}
                </View>
                <View style={styles.legendContainer}>
                    <Legend items={legendData} onPress={handleLegendPress} selected={selectedLine} />
                </View>
            </View>
            <Button mode="contained" onPress={toggleViewMode} style={styles.toggleButton}>
                {viewMode === 'weekly' ? 'Switch to All Time' : 'Switch to Weekly'}
            </Button>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: scale(60), // Reserve space for the absolute PopoverTooltip
        alignItems: 'center',
        width: '100%',
    },
    content: {
        flex: 1,
        width: '90%',
        flexDirection: 'column',
    },
    chartContainer: {
        flex: 1,
        backgroundColor: '#fff',
        padding: scale(5),
        borderWidth: scale(1),
        borderRadius: scale(20),
    },
    legendContainer: {
        marginTop: scale(10),
        backgroundColor: '#fff',
        borderColor: 'black',
        borderWidth: scale(1),
        borderRadius: scale(10),
        padding: scale(10),
        alignSelf: 'stretch',
        marginBottom: scale(10),
    },
    toggleButton: {
        marginBottom: scale(16),
        width: '64%',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ProgressScreen;

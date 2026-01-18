import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import {
  Text,
  Button,
  Surface,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartesianChart, Line, Area } from 'victory-native';
import { format, subDays } from 'date-fns';
import { useFont } from '@shopify/react-native-skia';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PopoverTooltip from '../components/PopoverTooltip';
import Legend from '../components/Legend';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  const [selectedLine, setSelectedLine] = useState<ChartMetric | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'alltime'>('weekly');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const headerHeight = useHeaderHeight();
  const font = useFont(require('../../assets/Fonts/SpaceMono-Regular.ttf'), 12);

  const legendData: LegendItem[] = [
    { key: 'asks', label: 'Asks', color: '#c71aad' },
    { key: 'follow_ups', label: 'Follow-ups', color: '#149240' },
    { key: 'action_promises', label: 'Action Promises', color: '#0782b2' },
    { key: 'open_houses', label: 'Open Houses', color: '#fd2121' },
    { key: 'handwritten_cards', label: 'Handwritten Cards', color: '#ef8c00' },
    { key: 'exercises', label: 'Exercises', color: '#7631af' },
    { key: 'gross_revenue', label: 'Gross Revenue', color: 'black' },
  ];

  const handleLegendPress = (key: ChartMetric) => {
    setSelectedLine(selectedLine === key ? null : key);
  };

  const toggleViewMode = () => {
    setViewMode(prev => (prev === 'weekly' ? 'alltime' : 'weekly'));
  };

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        if (!user?.id) return;

        setError(undefined);

        // Step 1: Active course
        const { data: userCourse, error: userCourseError } = await supabase
          .from('user_courses')
          .select('course_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (userCourseError || !userCourse?.course_id) {
          setError("Could not fetch user's active course.");
          return;
        }

        const courseId = userCourse.course_id;

        // Step 2: Course start + duration
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('start_date, duration_weeks')
          .eq('course_id', courseId)
          .single();

        if (courseError || !courseData?.start_date) {
          setError('Could not fetch course start date.');
          return;
        }

        const courseStart = new Date(courseData.start_date);
        courseStart.setHours(0, 0, 0, 0);

        const durationWeeks = courseData.duration_weeks ?? 12;

        const courseEndExcl = new Date(courseStart);
        courseEndExcl.setDate(courseEndExcl.getDate() + durationWeeks * 7);

        // end_date is exclusive in your SQL convention
        const now = new Date();
        const effectiveEndObj = now < courseEndExcl ? now : courseEndExcl;

        let startObj: Date;
        if (viewMode === 'weekly') {
          const sevenDaysBack = subDays(effectiveEndObj, 7);
          startObj = sevenDaysBack > courseStart ? sevenDaysBack : courseStart;
        } else {
          startObj = courseStart;
        }

        const startDate = format(startObj, 'yyyy-MM-dd');
        const endDate = format(effectiveEndObj, 'yyyy-MM-dd');

        // Step 3: task_types scaling
        const { data: taskTypesData, error: taskTypesError } = await supabase
          .from('task_types')
          .select('name, minimal_amount');

        if (taskTypesError) {
          setError(taskTypesError.message);
          return;
        }

        const minimalAmounts: Record<string, number> = {};
        (taskTypesData ?? []).forEach((task: any) => {
          minimalAmounts[task.name] = task.minimal_amount;
        });

        const keyMapping = {
          asks: 'ask',
          follow_ups: 'follow_up',
          action_promises: 'action_promise',
          open_houses: 'open_house',
          handwritten_cards: 'handwritten_card',
          exercises: 'exercise',
        };

        const baseAsk = minimalAmounts[keyMapping.asks] || 1;

        const scalingFactors = {
          asks: 1,
          follow_ups: baseAsk / (minimalAmounts[keyMapping.follow_ups] || 1),
          open_houses: baseAsk / (minimalAmounts[keyMapping.open_houses] || 1),
          handwritten_cards: baseAsk / (minimalAmounts[keyMapping.handwritten_cards] || 1),
          action_promises: baseAsk / (minimalAmounts[keyMapping.action_promises] || 1),
          exercises: baseAsk / (minimalAmounts[keyMapping.exercises] || 1),
        };

        // Step 4: RPC
        const { data, error: rpcError } = await supabase.rpc(
          'get_daily_task_counts_all_types_in_range',
          {
            uid: user.id,
            _course_id: courseId,
            start_date: startDate,
            end_date: endDate,
          }
        );

        if (rpcError) {
          setError(rpcError.message);
          return;
        }

        // Step 5: running totals
        let running = {
          asks: 0,
          follow_ups: 0,
          open_houses: 0,
          handwritten_cards: 0,
          action_promises: 0,
          exercises: 0,
          gross_revenue: 0,
        };

        const baselineDaily = baseAsk / 7;

        const transformed = ((data ?? []) as RowWithAllTypes[]).map((row, index) => {
          running.asks += row.asks;
          running.follow_ups += row.follow_ups;
          running.open_houses += row.open_houses;
          running.handwritten_cards += row.handwritten_cards;
          running.action_promises += row.action_promises;
          running.exercises += row.exercises;
          running.gross_revenue += row.gross_revenue;

          return {
            x: new Date(row.day),
            asks: running.asks * scalingFactors.asks,
            follow_ups: running.follow_ups * scalingFactors.follow_ups,
            open_houses: running.open_houses * scalingFactors.open_houses,
            handwritten_cards: running.handwritten_cards * scalingFactors.handwritten_cards,
            action_promises: running.action_promises * scalingFactors.action_promises,
            exercises: running.exercises * scalingFactors.exercises,
            gross_revenue: running.gross_revenue,
            baseline: baselineDaily * (index + 1),
          };
        });

        setChartData(transformed);
      }

      fetchData();
      return () => {};
    }, [user, viewMode])
  );

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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={[styles.screen, { paddingTop: headerHeight }]}>
        <PopoverTooltip
          tooltipText={
            "Welcome to your Progress Screen! Here you can view your daily progress trends, toggle between weekly and all-time views, and analyze your performance.\n\nThe red area is below the minimal threshold, so try to keep all your tasks above it!"
          }
        />

        <View style={styles.chartAndLegendContainer}>
          <View style={styles.flexChartWrapper}>
            {chartData.length > 0 && (
              <>
                {selectedLine === 'gross_revenue' ? (
                  <CartesianChart
                    axisOptions={{
                      font,
                      tickCount: { x: 3, y: 10 },
                      formatXLabel: x => format(x, 'MM/dd'),
                    }}
                    data={chartData}
                    xKey="x"
                    yKeys={['gross_revenue']}
                  >
                    {({ points }) => (
                      <Line
                        points={(points as any)['gross_revenue']}
                        color="#1d1d1d"
                        strokeWidth={5}
                        animate={{ type: 'timing', duration: 300 }}
                        curveType="catmullRom100"
                      />
                    )}
                  </CartesianChart>
                ) : (
                  <CartesianChart
                    axisOptions={{
                      font,
                      tickCount: { x: 3, y: 10 },
                      formatXLabel: x => format(x, 'MM/dd'),
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
                          points={points.baseline}
                          color="#A30000"
                          opacity={0.15}
                          y0={chartBounds.bottom}
                        />
                        {legendData
                          .filter(item => item.key !== 'gross_revenue')
                          .map(item => (
                            <Line
                              key={item.key}
                              points={(points as any)[item.key]}
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
                              curveType="linear"
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
            <Legend
              items={legendData}
              onPress={handleLegendPress}
              selected={selectedLine}
            />
          </View>
        </View>

        <Button mode="contained" onPress={toggleViewMode} style={styles.toggleButton}>
          {viewMode === 'weekly' ? 'Switch to All Time' : 'Switch to Weekly'}
        </Button>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
        >
          {error}
        </Snackbar>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screen: {
    flex: 1,
  },
  chartAndLegendContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingBottom: scale(20),
  },
  flexChartWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    padding: scale(5),
    borderWidth: scale(1),
    borderRadius: scale(20),
    minHeight: scale(200),
    marginTop: -20,
  },
  legendContainer: {
    marginTop: scale(20),
    backgroundColor: '#fff',
    borderColor: 'black',
    borderWidth: scale(1),
    borderRadius: scale(10),
    padding: scale(10),
  },
  toggleButton: {
    alignSelf: 'center',
    width: '64%',
    marginBottom: scale(16),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProgressScreen;

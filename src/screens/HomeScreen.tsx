import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  ScrollView,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeShareCard from '../components/HomeShareCard';
import { isNativeImageSharingAvailable, shareViewAsImage } from '../lib/shareViewAsImage';

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
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

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
  const { user, profile } = useAuth();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [pipelineSummary, setPipelineSummary] = useState<{ count: number; totalRevenue: number }>({
    count: 0,
    totalRevenue: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);
  const [newWeeklyTotal, setNewWeeklyTotal] = useState<number>(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isShareAvailable, setIsShareAvailable] = useState(false);
  const [hasCheckedShareAvailability, setHasCheckedShareAvailability] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareCardRef = useRef<View | null>(null);

  const [courseId, setCourseId] = useState<string | null>(null);

  const fetchWeeklyData = async () => {
    if (!user) return;

    // 1) Active course_id
    const { data: userCourse, error: userCourseError } = await supabase
      .from('user_courses')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (userCourseError || !userCourse?.course_id) {
      console.error('Error fetching user active course:', userCourseError?.message);
      return;
    }

    const activeCourseId = userCourse.course_id;
    setCourseId(activeCourseId);

    // 2) Course start_date (and duration if you want it later)
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('start_date, duration_weeks')
      .eq('course_id', activeCourseId)
      .single();

    if (courseError || !course?.start_date) {
      console.error('Error fetching course start date:', courseError?.message);
      return;
    }

    // 3) Weekly counts (new RPC signature)
    const { data, error } = await supabase.rpc('get_weekly_task_counts', {
      _course_id: activeCourseId,
      uid: user.id,
    });

    if (error) {
      console.error('Error fetching weekly task counts:', error);
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    setWeeklyData(rows);

    // 4) Current week index (clamped to returned weeks)
    if (course.start_date && rows.length > 0) {
      const start = new Date(course.start_date);
      const today = new Date();
      const diffMs = today.getTime() - start.getTime();
      const weeksSinceStart = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      const clamped = Math.min(Math.max(0, weeksSinceStart), rows.length - 1);
      setCurrentWeekIndex(clamped);
    } else {
      setCurrentWeekIndex(0);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      fetchWeeklyData();

      const fetchTaskTypes = async () => {
        const { data, error } = await supabase.from('task_types').select('*');
        if (!error && data) setTaskTypes(data);
      };
      fetchTaskTypes();

      const fetchPipelineSummary = async () => {
        const { data, error } = await supabase.rpc('get_clients_by_client_type', {
          uid: user.id,
          client_type_name: 'Pipeline',
        });
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

  useEffect(() => {
    let isMounted = true;

    const checkShareAvailability = async () => {
      try {
        const available = await isNativeImageSharingAvailable();
        if (isMounted) setIsShareAvailable(available);
      } catch (error) {
        console.error('Error checking share availability:', error);
        if (isMounted) setIsShareAvailable(false);
      } finally {
        if (isMounted) setHasCheckedShareAvailability(true);
      }
    };

    checkShareAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentWeek = weeklyData[currentWeekIndex];
  const shareableTaskTypes = taskTypes.filter(
    tt => !['gross revenue', 'gross_revenue'].includes(tt.name.toLowerCase())
  );
  const firstName = profile?.first_name ?? user?.user_metadata?.first_name ?? null;

  const getLoggedAmountForTask = (taskName: string): number => {
    if (!currentWeek) return 0;
    const keyBase = taskName.toLowerCase().replace(/[\s-]+/g, '_');
    const key = keyBase.endsWith('s') ? keyBase : keyBase + 's';
    const val = (currentWeek as any)[key as TaskKey];
    return typeof val === 'number' ? val : 0;
  };
  const shareMetrics = currentWeek
    ? shareableTaskTypes.map(tt => ({
        id: tt.task_type_id,
        label: formatTaskName(tt.name),
        loggedAmount: getLoggedAmountForTask(tt.name),
        minimalAmount: tt.minimal_amount,
        optimalAmount: tt.optimal_amount,
      }))
    : [];
  const canShareHomeImage = isShareAvailable && !!currentWeek && shareMetrics.length > 0;
  const shareButtonLabel = isShareAvailable ? 'Share' : 'Unavailable';

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleProgressPress = (taskType: TaskType) => {
    if (!currentWeek) return;
    setSelectedTaskType(taskType);
    setNewWeeklyTotal(getLoggedAmountForTask(taskType.name));
    setModalVisible(true);
  };

  const handleSaveAll = async () => {
    if (!user || !selectedTaskType || !currentWeek || !courseId) return;

    const { error } = await supabase.rpc('update_weekly_task_logs', {
      _course_id: courseId,
      _user_id: user.id,
      _task_type_id: selectedTaskType.task_type_id,
      _week_start: currentWeek.week_start,
      _new_total: newWeeklyTotal,
    });

    showSnackbar(error ? 'Error updating logs' : 'Weekly total updated successfully');

    await fetchWeeklyData();
    setModalVisible(false);
  };

  const handleShareHome = async () => {
    if (!canShareHomeImage) {
      showSnackbar('Your home snapshot will be ready once this week loads.');
      return;
    }

    try {
      setIsSharing(true);
      await shareViewAsImage(shareCardRef);
    } catch (error) {
      console.error('Error sharing home snapshot:', error);
      showSnackbar('Unable to share your home snapshot right now.');
    } finally {
      setIsSharing(false);
    }
  };

  const customComponentTheme = { ...DefaultTheme, roundness: 4 };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
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
          {hasCheckedShareAvailability && (
            <Button
              mode="contained-tonal"
              icon="share-variant"
              loading={isSharing}
              disabled={!canShareHomeImage || isSharing}
              onPress={handleShareHome}
              compact
              style={styles.shareButton}
              contentStyle={styles.shareButtonContent}
              labelStyle={styles.shareButtonLabel}
            >
              {shareButtonLabel}
            </Button>
          )}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContainer, styles.contentContainer]}
          contentInsetAdjustmentBehavior="never"
        >
          <View style={styles.taskList}>
            {currentWeek &&
              shareableTaskTypes.map(tt => {
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
          </View>

          <View style={styles.summaryRow}>
            <Surface style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>15/30 Pipeline</Text>
              <Text style={styles.summaryValue}>{pipelineSummary.count}</Text>
            </Surface>
            <Surface style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>15/30 Revenue</Text>
              <Text style={styles.summaryValue}>
                {currencyFormatter.format(pipelineSummary.totalRevenue)}
              </Text>
            </Surface>
          </View>
        </ScrollView>

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
            onPress={() => setCurrentWeekIndex(i => Math.min(i + 1, weeklyData.length - 1))}
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
                  onPress={() => setNewWeeklyTotal(n => (n > 0 ? n - 1 : 0))}
                  style={styles.iconButton}
                />
                <Text style={styles.aggregateDisplay}>{newWeeklyTotal}</Text>
                <IconButton
                  icon="plus"
                  onPress={() => setNewWeeklyTotal(n => n + 1)}
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

        <View pointerEvents="none" style={styles.hiddenShareCardContainer}>
          {currentWeek && shareMetrics.length > 0 && (
            <View ref={shareCardRef} collapsable={false}>
              <HomeShareCard
                firstName={firstName}
                weekNumber={currentWeekIndex + 1}
                metrics={shareMetrics}
                pipelineCount={pipelineSummary.count}
                pipelineTotalRevenue={pipelineSummary.totalRevenue}
              />
            </View>
          )}
        </View>
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
    marginTop: 50,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: scale(16),
  },
  contentContainer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: scale(16),
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: scale(16),
    backgroundColor: '#f5f5f5',
    marginHorizontal: scale(12),
  },
  taskList: {
    flex: 1,
    justifyContent: 'space-between',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: scale(20),
    marginTop: scale(20),
  },
  footerContent: {
    marginBottom: scale(60),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: scale(16),
    marginVertical: scale(16),
  },
  shareButton: {
    position: 'absolute',
    right: scale(16),
    borderRadius: scale(16),
  },
  shareButtonContent: {
    minHeight: scale(36),
  },
  shareButtonLabel: {
    fontSize: scale(12),
    fontWeight: '600',
  },
  progressContainer: {
    marginVertical: scale(4),
    backgroundColor: '#f6f6f6',
  },
  weekLabel: {
    fontSize: scale(22),
    fontWeight: 'bold',
  },
  label: {
    fontSize: scale(16),
    marginBottom: scale(4),
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    borderRadius: scale(60),
    padding: scale(10),
    marginHorizontal: scale(4),
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: scale(14),
    color: '#666',
  },
  summaryValue: {
    fontSize: scale(18),
    fontWeight: '700',
    marginTop: scale(4),
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
    height: scale(6),
    borderRadius: scale(2),
  },
  thresholdLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: scale(2),
    backgroundColor: 'red',
  },
  dialog: {
    borderRadius: 30,
  },
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
  hiddenShareCardContainer: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
});

export default HomeScreen;

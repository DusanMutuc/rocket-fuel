import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import {
  Text,
  TextInput,
  TouchableRipple,
  Button,
  IconButton,
  useTheme,
  Snackbar,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import PopoverTooltip from '../components/PopoverTooltip';
import { TouchableWithoutFeedback } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

interface TaskType {
  task_type_id: number;
  name: string;
}

interface WrapButtonProps {
  onPress: () => void;
  label: string;
  selected: boolean;
  styleOverride?: any;
}

const WrapButton: React.FC<WrapButtonProps> = ({ onPress, label, selected, styleOverride }) => {
  const theme = useTheme();
  return (
    <View style={[styles.shadowWrapper, styleOverride]}>
      <TouchableRipple
        onPress={onPress}
        rippleColor={theme.colors.backdrop}
        style={[
          styles.wrapButton,
          {
            backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          },
        ]}
      >
        <View style={styles.wrapButtonContent}>
          <Text
            style={[
              styles.wrapButtonText,
              {
                color: selected ? theme.colors.onPrimary : theme.colors.onSurface,
              },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
        </View>
      </TouchableRipple>
    </View>
  );
};

const TaskLogScreen = () => {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [taskTypeId, setTaskTypeId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [grossRevenue, setGrossRevenue] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseStartDate, setCourseStartDate] = useState<string | null>(null);
  const [courseDurationWeeks, setCourseDurationWeeks] = useState<number>(12);

  useEffect(() => {
    const fetchTaskTypes = async () => {
      const { data, error } = await supabase.from('task_types').select('*');
      if (error) {
        console.error('Error fetching task types:', error);
      } else if (data) {
        setTaskTypes(data);
        if (data.length > 0) {
          setTaskTypeId(data[0].task_type_id);
        }
      }
    };

    const fetchActiveCourseInfo = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      const { data: userCourse, error: userCourseError } = await supabase
        .from('user_courses')
        .select('course_id')
        .eq('user_id', uid)
        .eq('is_active', true)
        .single();

      if (userCourseError || !userCourse?.course_id) {
        console.error('Could not fetch active course_id', userCourseError?.message);
        return;
      }

      const activeCourseId = userCourse.course_id;
      setCourseId(activeCourseId);

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('start_date, duration_weeks')
        .eq('course_id', activeCourseId)
        .single();

      if (courseError || !course) {
        console.error('Could not fetch course info', courseError?.message);
        return;
      }

      setCourseStartDate(course.start_date ?? null);
      setCourseDurationWeeks(course.duration_weeks ?? 12);
    };

    fetchTaskTypes();
    fetchActiveCourseInfo();

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const formatTaskName = (name: string) =>
    name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  const onChange = (event: any, date?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const showDatePicker = () => setShowPicker(true);

  const showSnack = (message: string) => {
    if (snackbarVisible) {
      setSnackbarVisible(false);
      setTimeout(() => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
      }, 250);
    } else {
      setSnackbarMessage(message);
      setSnackbarVisible(true);
    }
  };

  const handleAmountChange = (text: string) => {
    const cleanText = text.replace(/\D/g, '');
    const numericValue = Number(cleanText || 0);
    if (!grossRevenue && numericValue > 99) {
      showSnack('Maximum of 99 allowed');
      setAmount(99);
    } else {
      setAmount(numericValue);
    }
  };

  const handleIncrease = () => {
    if (!grossRevenue && amount < 99) setAmount(amount + 1);
    else if (grossRevenue && amount < 1000) setAmount(1000);
    else if (grossRevenue) setAmount(amount + 1000);
    else showSnack('Maximum of 99 allowed');
  };

  const handleDecrease = () => {
    if (!grossRevenue && amount > 1) setAmount(amount - 1);
    else if (grossRevenue && amount > 1000) setAmount(amount - 1000);
    else if (grossRevenue) setAmount(1);
    else showSnack('Minimum amount is 1');
  };

  const isDateWithinActiveCourse = (date: Date): boolean => {
    // If we can't determine the window, don't block logging.
    if (!courseStartDate) return true;

    const start = new Date(courseStartDate);
    start.setHours(0, 0, 0, 0);

    const endExcl = new Date(start);
    endExcl.setDate(endExcl.getDate() + (courseDurationWeeks || 12) * 7);

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    return d >= start && d < endExcl;
  };

  const handleLogTask = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return showSnack('Not logged in');
    if (!grossRevenue && taskTypeId === null) return showSnack('Select a task type');
    if (!grossRevenue && amount > 99) return showSnack('Amount cannot exceed 99');
    if (!courseId) return showSnack('No active course found');

    // Prevent logging outside the active course dates
    if (!isDateWithinActiveCourse(selectedDate)) {
      return showSnack('Selected date is outside your active course dates');
    }

    const { error } = await supabase.from('task_logs').insert([
      {
        user_id: session.user.id,
        task_type_id: taskTypeId,
        amount,
        created_at: selectedDate.toISOString(),
        course_id: courseId,
      },
    ]);

    Keyboard.dismiss();
    showSnack(error ? 'Error logging tasks' : 'Tasks logged successfully');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? scale(100) : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.innerContent}>
              <PopoverTooltip
                tooltipText="Welcome to your Task Log Screen! Here you can log tasks by selecting a task type, adjusting the amount, and picking a date."
              />

              <View style={styles.headerRow}>
                <View style={styles.headerLeftPlaceholder} />
                <Text style={styles.headerTitle}>Select Task Type:</Text>
                <View style={styles.headerRightPlaceholder} />
              </View>

              <View style={styles.content}>
                <View style={styles.buttonContainer}>
                  {taskTypes
                    .filter(tt => !['gross_revenue', 'gross revenue'].includes(tt.name.toLowerCase()))
                    .map(tt => (
                      <WrapButton
                        key={tt.task_type_id}
                        onPress={() => {
                          setTaskTypeId(tt.task_type_id);
                          setGrossRevenue(false);
                          setAmount(1);
                          Keyboard.dismiss();
                        }}
                        label={formatTaskName(tt.name)}
                        selected={!grossRevenue && taskTypeId === tt.task_type_id}
                      />
                    ))}
                </View>

                <View style={styles.grossRevenueRow}>
                  <WrapButton
                    onPress={() => {
                      setGrossRevenue(true);
                      setTaskTypeId(7);
                      Keyboard.dismiss();
                    }}
                    label="Gross Revenue"
                    selected={grossRevenue}
                  />
                </View>

                <Text style={styles.label}>Amount:</Text>
                <View style={styles.amountContainer}>
                  <IconButton icon="minus" onPress={handleDecrease} style={styles.amountIncrementor} size={20} />
                  <TextInput
                    mode="outlined"
                    style={styles.amountInput}
                    theme={{ roundness: scale(3) }}
                    value={amount.toString()}
                    onChangeText={handleAmountChange}
                    keyboardType="numeric"
                    left={grossRevenue ? <TextInput.Affix text="$" /> : null}
                  />
                  <IconButton icon="plus" onPress={handleIncrease} style={styles.amountIncrementor} size={20} />
                </View>

                <TouchableRipple onPress={showDatePicker} style={styles.dateContainer}>
                  <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
                </TouchableRipple>

                {showPicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onChange}
                  />
                )}
              </View>
            </View>

            <View style={styles.logButtonContainer}>
              <Button
                mode="contained"
                onPress={handleLogTask}
                style={styles.logButton}
                labelStyle={styles.logButtonLabel}
              >
                Log
              </Button>
            </View>
          </ScrollView>

          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
          >
            {snackbarMessage}
          </Snackbar>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    marginTop: -40,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    width: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  innerContent: {
    paddingTop: scale(30),
    paddingHorizontal: scale(16),
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: scale(100),
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(10),
  },
  headerLeftPlaceholder: {
    width: scale(44),
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: scale(18),
    fontWeight: '600',
  },
  headerRightPlaceholder: {
    width: scale(44),
  },
  content: {
    padding: scale(16),
    alignItems: 'center',
  },
  label: {
    fontSize: scale(16),
    marginVertical: scale(8),
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  grossRevenueRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: scale(5),
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(16),
    justifyContent: 'center',
  },
  amountInput: {
    width: scale(120),
    backgroundColor: '#f6f6f6',
    textAlign: 'center',
    marginHorizontal: scale(10),
  },
  amountIncrementor: {
    backgroundColor: '#f6f6f6',
    borderWidth: 1,
    borderColor: '#b0b0b0',
  },
  dateContainer: {
    padding: scale(12),
    borderRadius: scale(5),
    backgroundColor: '#f6f6f6',
    marginVertical: scale(8),
    width: '100%',
    alignItems: 'center',
  },
  dateText: {
    fontSize: scale(16),
  },
  logButtonContainer: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
  },
  logButton: {
    alignSelf: 'center',
    width: '64%',
    paddingVertical: scale(6),
  },
  logButtonLabel: {
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  shadowWrapper: {
    width: '48%',
    marginVertical: scale(5),
    borderRadius: scale(50),
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 3.62,
  },
  wrapButton: {
    width: '100%',
    height: scale(60),
    borderRadius: scale(50),
    overflow: 'hidden',
  },
  wrapButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(8),
  },
  wrapButtonText: {
    fontSize: scale(16),
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default TaskLogScreen;

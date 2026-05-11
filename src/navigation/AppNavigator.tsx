// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import PipelineScreen from '../screens/PipelineScreen';
import ProspectListScreen from '../screens/ProspectListScreen';
import TaskLogScreen from '../screens/TaskLogScreen';
import { useTheme } from 'react-native-paper';
import theme from '../theme';
import PopoverTooltip from '../components/PopoverTooltip';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HEADER_TOOLTIPS: Record<string, string> = {
    Home:
        "Welcome to your Home Screen! Here you can:\n" +
        "\u2022 track weekly tasks\n" +
        "\u2022 adjust the quantities if needed\n" +
        "\u2022 navigate between weeks.\n\n" +
        "The red lines on some progression bars represent the minimal weekly amounts you should aim for!",
    Progress:
        "Welcome to your Progress Screen! Here you can view your daily progress trends, toggle between weekly and all-time views, and analyze your performance.\n\nThe red area is below the minimal threshold, so try to keep all your tasks above it!",
    "Log Task":
        "Welcome to your Task Log Screen! Here you can log tasks by selecting a task type, adjusting the amount, and picking a date.",
    "15/30":
        "Welcome to your Pipeline Contacts screen! Here you can manage your pipeline contacts and add prospects to the pipeline.",
    Contacts:
        "Welcome to your Contacts Page! Manage and filter your contacts here.",
};

// Gradient Header Background Component
const HeaderBackground = () => {
    const { colors } = useTheme();

    return (
        <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
        />
    );
};

function MainTabs() {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => {
                const tooltipText = HEADER_TOOLTIPS[route.name];

                return {
                    headerTransparent: false,
                    headerStyle: {
                        backgroundColor: 'transparent',
                        height: 100,
                    },
                    headerTitleAlign: 'center',
                    headerTintColor: colors.onPrimary,
                    headerTitleStyle: { fontWeight: 'bold' },
                    headerBackground: () => <HeaderBackground />,
                    headerRight: () => (
                        <View style={styles.headerActions}>
                            {tooltipText && (
                                <PopoverTooltip
                                    tooltipText={tooltipText}
                                    absolute={false}
                                    offset={4}
                                    containerStyle={styles.headerTooltipButton}
                                />
                            )}
                        </View>
                    ),
                    tabBarActiveTintColor: colors.primary,
                    tabBarStyle: {
                        backgroundColor: colors.surface,
                        height: 60,
                        paddingBottom: 0,
                    },
                    tabBarItemStyle: {
                        height: 60,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingBottom: 0,
                    },
                    tabBarIconStyle: {
                        marginTop: 0,
                        marginBottom: 0,
                        flex: 0,
                    },
                    tabBarLabelStyle: {
                        marginTop: 3,
                        fontSize: 10,
                        flexWrap: 'wrap',
                        width: 60,           // tweak until it fits nicely
                        textAlign: 'center', // center the wrapped text
                    },
                };
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    headerShown: true, // turn off header ONLY for Home
                    headerTransparent: true,
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Progress"
                component={ProgressScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="chart-line"
                            color={color}
                            size={size}
                        />
                    ),

                }}
            />
            <Tab.Screen
                name="Log Task"
                component={TaskLogScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="plus-circle"
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="15/30"
                component={PipelineScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="pipe"
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Contacts"
                component={ProspectListScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="account-group"
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Main"
                component={MainTabs}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    headerTooltipButton: {
        width: 40,
        height: 40,
    },
});

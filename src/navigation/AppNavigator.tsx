// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import PipelineScreen from '../screens/PipelineScreen';
import ProspectListScreen from '../screens/ProspectListScreen';
import TaskLogScreen from '../screens/TaskLogScreen';
import { useTheme } from 'react-native-paper';
import theme from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
            screenOptions={{
                headerTransparent: false,
                headerStyle: {
                    backgroundColor: 'transparent',
                    height: 100,
                },
                headerTitleAlign: 'center',
                headerTintColor: colors.onPrimary,
                headerTitleStyle: { fontWeight: 'bold' },
                headerBackground: () => <HeaderBackground />,
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
                    marginBottom: 0,
                    fontSize: 10,
                    flex: 0,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="home"
                            color={color}
                            size={size}
                        />
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
                name="15/30 Pipeline"
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
                name="Contacts Page"
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
    // No longer needed as we're using StyleSheet.absoluteFill
});
// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import PipelineScreen from '../screens/PipelineScreen';
import ProspectListScreen from '../screens/ProspectListScreen';
import TaskLogScreen1 from '../screens/TaskLogScreen1';
import TaskLogScreen2 from '../screens/TaskLogScreen2';

// Define the type for your stack navigator
export type AppStackParamList = {
    Main: undefined;
    TaskLogScreen2: undefined;
};

const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: 'tomato',
                tabBarInactiveTintColor: 'gray',
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Progress" component={ProgressScreen} />
            <Tab.Screen name="Log Task" component={TaskLogScreen1} />
            <Tab.Screen name="15/30 Pipeline" component={PipelineScreen} />
            <Tab.Screen name="Prospect List" component={ProspectListScreen} />
        </Tab.Navigator>
    );
}

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
    return (
        <Stack.Navigator initialRouteName="Main">
            {/* This screen is used for navigation from TaskLogScreen1 */}
            <Stack.Screen name="TaskLogScreen2" component={TaskLogScreen2} />
            <Stack.Screen
                name="Main"
                component={MainTabs}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

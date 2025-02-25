// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import PipelineScreen from '../screens/PipelineScreen';
import ProspectListScreen from '../screens/ProspectListScreen';
import TaskLogScreen from '../screens/TaskLogScreen';
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
            <Tab.Screen name="Log Task" component={TaskLogScreen} />
            <Tab.Screen name="15/30 Pipeline" component={PipelineScreen} />
            <Tab.Screen name="Prospect List" component={ProspectListScreen} />
        </Tab.Navigator>
    );
}

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator initialRouteName="Main">
            <Stack.Screen
                name="Main"
                component={MainTabs}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

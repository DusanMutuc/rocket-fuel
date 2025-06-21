// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';

import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import PipelineScreen from '../screens/PipelineScreen';
import ProspectListScreen from '../screens/ProspectListScreen';
import TaskLogScreen from '../screens/TaskLogScreen';
import theme from '../theme';
import { Image, } from 'react-native';
import { Dialog, Portal, Paragraph, Button } from 'react-native-paper';

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
    const [modalVisible, setModalVisible] = React.useState(false);

    const openPrivacyPolicy = () => {
        Linking.openURL('https://www.rocketfuelmembers.com/privacy-policy');
        setModalVisible(false);
    };

    return (
        <>
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
                    headerLeft: () => (
                        <Image
                            source={require('../../assets/logo.png')}
                            style={{ width: 100, height: 100, marginLeft: 10, resizeMode: 'contain' }}
                        />
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            style={{ marginRight: 16 }}
                        >
                            <MaterialCommunityIcons name="book-open-variant" size={24} color="black" />
                        </TouchableOpacity>
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
                        width: 60,
                        textAlign: 'center',
                    },
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        headerShown: true,
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
                            <MaterialCommunityIcons name="chart-line" color={color} size={size} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Log Task"
                    component={TaskLogScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="plus-circle" color={color} size={size} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="15/30"
                    component={PipelineScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="pipe" color={color} size={size} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Contacts"
                    component={ProspectListScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="account-group" color={color} size={size} />
                        ),
                    }}
                />
            </Tab.Navigator>


            <Portal>
                <Dialog
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    style={{ backgroundColor: 'white', borderRadius: 16 }}
                >
                    <Dialog.Title style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
                        Privacy Policy
                    </Dialog.Title>

                    <Dialog.Content>
                        <Paragraph style={{ fontSize: 16, textAlign: 'center', color: '#333' }}>
                            Do you want to be redirected to our Privacy Policy?
                        </Paragraph>
                    </Dialog.Content>

                    <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 16 }}>
                        <Button
                            onPress={() => setModalVisible(false)}
                            labelStyle={{fontWeight: 'bold' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onPress={openPrivacyPolicy}
                            labelStyle={{fontWeight: 'bold' }}
                        >
                            Yes
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </>
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

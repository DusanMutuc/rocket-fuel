// AuthNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';

export type AuthStackParamList = {
    Login: undefined;
    ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

type Props = {
    initialRouteName?: keyof AuthStackParamList;
    overrideScreen?: keyof AuthStackParamList;
};

const AuthNavigator: React.FC<Props> = ({ initialRouteName = 'Login', overrideScreen }) => {
    return (
        <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </Stack.Navigator>
    );
};

export default AuthNavigator;

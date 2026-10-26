import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Routes } from '@/constants/routes';
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import OTPScreen from '@/screens/auth/OTPScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '@/screens/auth/ResetPasswordScreen';
import CreatePasswordScreen from '@/screens/auth/CreatePasswordScreen';
const Stack = createNativeStackNavigator();
export default function AuthStack() {
    return (<Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={Routes.Login}>
      <Stack.Screen name={Routes.Login} component={LoginScreen}/>
      <Stack.Screen name={Routes.Register} component={RegisterScreen}/>
      <Stack.Screen name={Routes.OTP} component={OTPScreen}/>
      <Stack.Screen name={Routes.ForgotPassword} component={ForgotPasswordScreen}/>
      <Stack.Screen name={Routes.ResetPassword} component={ResetPasswordScreen}/>
      <Stack.Screen name={Routes.CreatePassword} component={CreatePasswordScreen}/>
    </Stack.Navigator>);
}

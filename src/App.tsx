import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import LoginScreen from "./features/auth/screens/LoginScreen";
import HomeTabs from "./navigators/HomeTabs";
import CustomerListScreen from "./features/customers/screens/CustomerListScreen";

export type RootStackParamList = {
  Login: undefined;
  HomeTabs: undefined;
  DaftarNasabah: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
          <Stack.Screen
            name="DaftarNasabah"
            component={CustomerListScreen}
            options={{ headerShown: true, title: "Daftar Nasabah" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

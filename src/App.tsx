import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";

import LoginScreen from "./features/auth/screens/LoginScreen";
import HomeTabs from "./navigators/HomeTabs";
import CustomerListScreen from "./features/customers/screens/CustomerListScreen";
import { useAuth } from "./stores/useAuth";
import { colors } from "./theme";

export type RootStackParamList = {
  Login: undefined;
  HomeTabs: undefined;
  DaftarNasabah: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { user, hydrated, hydrate } = useAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Show loading screen while hydrating auth state
  if (!hydrated) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="HomeTabs" component={HomeTabs} />
              <Stack.Screen
                name="DaftarNasabah"
                component={CustomerListScreen}
                options={{ headerShown: true, title: "Daftar Nasabah" }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

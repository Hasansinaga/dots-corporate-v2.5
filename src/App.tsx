import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

function LoginScreen({ navigation }: any) {
  const go = async () => {
    await AsyncStorage.setItem('token', 'dummy');
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text onPress={go}>Login (tap untuk masuk)</Text>
    </View>
  );
}

function HomeScreen() {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text>Home</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [boot, setBoot] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('token');
      setLoggedIn(!!t);
      setBoot(false);
    })();
  }, []);

  if (boot) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={loggedIn ? 'Home' : 'Login'} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen}/>
        <Stack.Screen name="Home" component={HomeScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

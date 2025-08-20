import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../features/home/screens/HomeScreen';
import CustomerListScreen from '../features/customers/screens/CustomerListScreen';

export type RootStackParamList = {
  DemoShowroom: undefined;
  DaftarNasabah: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DemoShowroom" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DaftarNasabah" component={CustomerListScreen} options={{ title: 'Daftar Nasabah' }} />
    </Stack.Navigator>
  );
}

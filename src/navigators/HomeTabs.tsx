import React from 'react';
import { View, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, List, QrCode, Bell, Settings } from 'lucide-react-native';

import HomeScreen from '../features/home/screens/HomeScreen';
import ActivityScreen from '../features/home/screens/ActivityScreen';
import QRScannerScreen from '../features/home/screens/QRScannerScreen';
import DemoDebugScreen from '../features/home/screens/DemoDebugScreen';
import NotificationScreen from '../features/home/screens/NotificationScreen';

import { colors, spacing, typography } from '../theme';

type TabParamList = {
  DemoShowroom: undefined;
  DemoActivity: undefined;
  Scan: undefined;
  DemoPodcastList: undefined;
  DemoDebug: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function HomeTabs() {
  const { bottom } = useSafeAreaInsets();

  const tabBarStyle: ViewStyle = {
    position: 'relative',
    backgroundColor: colors.background,
    borderTopColor: 'transparent',
    height: bottom + 72,
    paddingHorizontal: 12,
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.text,
          tabBarLabelStyle: $tabBarLabel,
          tabBarItemStyle: $tabBarItem,
        }}
      >
        <Tab.Screen
          name="DemoShowroom"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Beranda',
            tabBarIcon: ({ focused, color }) => (
              <Home size={28} color={focused ? colors.primaryColor : (color as string)} />
            ),
          }}
        />

        <Tab.Screen
          name="DemoActivity"
          component={ActivityScreen}
          options={{
            tabBarLabel: 'Aktivitas',
            tabBarIcon: ({ focused, color }) => (
              <List size={28} color={focused ? colors.primaryColor : (color as string)} />
            ),
          }}
        />

        <Tab.Screen
          name="Scan"
          component={QRScannerScreen}
          options={{
            tabBarLabel: 'Scan',
            tabBarItemStyle: { marginHorizontal: 16 },
            tabBarIconStyle: { top: -22 },
            tabBarIcon: () => (
              <View style={S.scanFab}>
                <QrCode size={24} color="#fff" />
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="DemoPodcastList"
          component={NotificationScreen}
          options={{
            tabBarLabel: 'Notifikasi',
            tabBarIcon: ({ focused, color }) => (
              <Bell size={28} color={focused ? colors.primaryColor : (color as string)} />
            ),
          }}
        />

        <Tab.Screen
          name="DemoDebug"
          component={DemoDebugScreen}
          options={{
            tabBarLabel: 'Pengaturan',
            tabBarIcon: ({ focused, color }) => (
              <Settings size={28} color={focused ? colors.primaryColor : (color as string)} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const $tabBarItem: ViewStyle = { paddingTop: spacing.md, marginHorizontal: 6 };
const $tabBarLabel: TextStyle = { fontSize: 12, fontFamily: typography.primary?.medium ?? 'System', lineHeight: 16 };

const S = StyleSheet.create({
  scanFab: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primaryColor,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
});

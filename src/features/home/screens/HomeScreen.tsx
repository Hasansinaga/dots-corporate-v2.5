import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../../navigation/types' 
import { colors } from '../../../theme' 

type Props = NativeStackScreenProps<AppStackParamList, 'Main'>  

export default function HomeScreen({ navigation }: Props) {
  const onLogout = () => {
    Alert.alert('Keluar?', 'Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: () => {
          navigation.getParent()?.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        },
      },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home</Text>
        <TouchableOpacity onPress={onLogout} style={{ marginTop: 16 }}>
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

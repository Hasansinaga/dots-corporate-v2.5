import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface AppBarProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
}

export default function AppBar({
  title = 'Dots Corporate',
  showBackButton = false,
  onBackPress,
  backgroundColor = colors.primary,
  textColor = colors.background,
}: AppBarProps) {
  return (
    <>
      <StatusBar 
        backgroundColor={backgroundColor} 
        barStyle="light-content" 
        translucent={false}
      />
      <View style={[S.appbar, { backgroundColor }]}>
        <Text style={[S.title, { color: textColor }]}>
          {title}
        </Text>
      </View>
    </>
  );
}

const S = StyleSheet.create({
  appbar: {
    height: 57,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.primary.bold,
    textAlign: 'left',
  },
});

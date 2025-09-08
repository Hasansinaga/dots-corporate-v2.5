import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  showText?: boolean;
  style?: any;
}

export default function Loading({ 
  size = 'small', 
  color = colors.primary, 
  text = 'Loading...',
  showText = true,
  style 
}: LoadingProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {showText && (
        <Text style={styles.text}>{text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.primary.regular,
  },
});

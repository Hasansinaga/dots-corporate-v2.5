import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const W = width * 0.78;
const H = 220;

export function CurvedScanOverlay() {
  const y = useSharedValue(20);

  useEffect(() => {
    y.value = withRepeat(
      withTiming(H - 20, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [y]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents="none"
    >
      <View style={styles.scanLine} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    width: W,
    height: H,
  },
  scanLine: {
    width: W,
    height: 4,
    backgroundColor: 'rgba(0, 200, 120, 0.9)',
    borderRadius: 2,
  },
});

export default CurvedScanOverlay;

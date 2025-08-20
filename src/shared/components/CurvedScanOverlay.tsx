import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
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

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

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

  const curve = `
    M 0 0
    Q ${W / 2} 22, ${W} 0
  `;

  return (
    <AnimatedSvg
      width={W}
      height={H}
      style={[styles.container, animatedStyle]}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(0, 200, 120, 0.9)" />
          <Stop offset="1" stopColor="rgba(0, 200, 120, 0.0)" />
        </LinearGradient>
      </Defs>

      <Path d={curve} stroke="url(#scanGrad)" strokeWidth={4} fill="none" />
    </AnimatedSvg>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
  },
});

export default CurvedScanOverlay;

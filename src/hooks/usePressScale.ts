import { useState } from 'react';
import { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';

import { spring } from '@/constants/motion';

// Liquid press feedback: the element eases down while the finger is on it and springs back on release.
// Spread the style onto an animated element and attach the two handlers to the Pressable.
export function usePressScale(pressedScale = 0.96) {
  const [isPressed, setIsPressed] = useState(false);

  // Derived from the pressed state, so the spring is interruptible: a release mid-press reverses from where it is.
  const scale = useDerivedValue(() => withSpring(isPressed ? pressedScale : 1, spring), [isPressed, pressedScale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return {
    animatedStyle,
    onPressIn: () => setIsPressed(true),
    onPressOut: () => setIsPressed(false),
  };
}

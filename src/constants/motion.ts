import {
  Easing,
  ReduceMotion,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

// Motion tokens shared by every animation in the app. Each one is marked ReduceMotion.System, so when the
// device has Reduce Motion on the animation completes instantly instead of moving.
export const duration = {
  fast: 120,
  base: 240,
  medium: 320,
  slow: 400,
  // Entrances that rise into place, such as the tab bar on launch.
  entrance: 600,
} as const;

export const easing = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.ease),
} as const;

// Interruptible: a new target mid-flight keeps the velocity, which is what makes the motion feel fluid.
export const spring: WithSpringConfig = {
  damping: 18,
  stiffness: 240,
  mass: 0.8,
  overshootClamping: true,
  reduceMotion: ReduceMotion.System,
};

export function timing(ms: number = duration.base, ease = easing.out): WithTimingConfig {
  return { duration: ms, easing: ease, reduceMotion: ReduceMotion.System };
}

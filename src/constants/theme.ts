import type { ViewStyle } from 'react-native';

// JS mirror of the tokens in src/global.css, for props NativeWind does not style
// (SVG strokes, shadows, numeric radii).
export const colors = {
  background: '#808080',
  canvas: '#e9eef3',
  ink: '#0a0a0a',
  inkMuted: '#8f8b84',
  inkFaint: '#c9c5bc',
  focus: '#0a0a0a',
  focusText: '#f2efe8',
  amber: '#f2a33a',
  coral: '#f26b5b',
  // Destructive actions only (swipe to delete).
  // Ink-faint lifted toward the canvas: the fill behind calendar chips.
  chip: '#e2ddd3',
} as const;

export const radii = {
  screen: 36,
  block: 24,
  card: 20,
} as const;

// Soft, high-blur lift: the surface floats without dirtying the interface.
export const liftShadow: ViewStyle = {
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  shadowRadius: 30,
  shadowOffset: { width: 0, height: 24 },
  elevation: 2,
};

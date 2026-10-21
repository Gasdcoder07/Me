import type { ViewStyle } from 'react-native';

// Colors are not here any more: they change with the theme. Use the className tokens, or
// `useTheme().colors` from '@/theme/ThemeProvider' when a prop needs a raw value.
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

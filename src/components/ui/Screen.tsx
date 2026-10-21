import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
};

// Full-bleed off-white canvas. SafeAreaView keeps content clear of the notch and
// status bar; the background covers the whole screen with no outer margins.
// The bottom edge is handled by the floating tab bar.
export function Screen({ children }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      {children}
    </SafeAreaView>
  );
}

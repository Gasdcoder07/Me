import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MeshBackground } from '@/components/ui/MeshBackground';
import { useTheme } from '@/theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  // Turn off for screens whose top block is an opaque surface with its own veil, so the mesh does not show a seam.
  mesh?: boolean;
};

// Full-bleed canvas with the theme's mesh behind the content. SafeAreaView keeps content clear of the notch and
// status bar; the background covers the whole screen with no outer margins.
// The bottom edge is handled by the floating tab bar.
export function Screen({ children, mesh = true }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      {mesh && <MeshBackground />}
      {children}
    </SafeAreaView>
  );
}

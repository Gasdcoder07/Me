import type { ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { LavaBackground } from '@/components/ui/LavaBackground';
import { useTheme } from '@/theme/ThemeProvider';

type DarkPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  paused?: boolean;
};

// Black focus surface with the same drifting glow as the home card. The glow is clipped to the panel's shape.
export function DarkPanel({ children, style, onLayout, paused = false }: DarkPanelProps) {
  const { colors } = useTheme();
  return (
    <View onLayout={onLayout} style={[{ overflow: 'hidden', backgroundColor: colors.focus }, style]}>
      <LavaBackground paused={paused} />
      {children}
    </View>
  );
}

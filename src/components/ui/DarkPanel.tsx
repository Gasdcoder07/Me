import type { ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { LavaBackground } from '@/components/ui/LavaBackground';
import { colors } from '@/constants/theme';

type DarkPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  paused?: boolean;
};

// Black focus surface with the same drifting glow as the home card. The glow is clipped to the panel's shape.
export function DarkPanel({ children, style, onLayout, paused = false }: DarkPanelProps) {
  return (
    <View onLayout={onLayout} style={[{ overflow: 'hidden', backgroundColor: colors.focus }, style]}>
      <LavaBackground paused={paused} />
      {children}
    </View>
  );
}

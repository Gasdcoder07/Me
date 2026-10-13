import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { radii } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

// Flat container with a hairline border. No fills beyond the canvas, no depth.
export function Card({ children, style }: CardProps) {
  return (
    <View
      className="shadow-md bg-canvas p-4 my-2"
      style={[{ borderRadius: radii.card }, style]}
    >
      {children}
    </View>
  );
}

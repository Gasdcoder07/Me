import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { type IconName, Icon } from '@/components/icons/Icon';
import { usePressScale } from '@/hooks/usePressScale';
import { useTheme } from '@/theme/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CircleButtonProps = {
  icon: IconName;
  label: string;
  onPress?: () => void;
  variant?: 'solid' | 'ghost' | 'inverse' | 'danger';
  size?: number;
};

// solid: active / primary action (black block, light icon).
// inverse: the same action placed on a black surface (light block, black icon).
// danger: destructive action (coral block, light icon).
// ghost: inactive, low contrast, no background.
// Press: the circle eases down under the finger and springs back on release.
export function CircleButton({ icon, label, onPress, variant = 'solid', size = 56 }: CircleButtonProps) {
  const { colors } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const isSolid = variant === 'solid';
  const isInverse = variant === 'inverse';
  const isDanger = variant === 'danger';

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSolid
            ? colors.accent
            : isInverse
              ? colors.focusText
              : isDanger
                ? colors.coral
                : 'transparent',
        },
        animatedStyle,
      ]}
    >
      <Icon
        name={icon}
        size={24}
        color={isSolid ? colors.onAccent : isInverse ? colors.focus : isDanger ? colors.focusText : colors.inkMuted}
      />
    </AnimatedPressable>
  );
}

import { Pressable } from 'react-native';

import { type IconName, Icon } from '@/components/icons/Icon';
import { colors } from '@/constants/theme';

type CircleButtonProps = {
  icon: IconName;
  label: string;
  onPress?: () => void;
  variant?: 'solid' | 'ghost' | 'inverse';
  size?: number;
};

// solid: active / primary action (black block, light icon).
// inverse: the same action placed on a black surface (light block, black icon).
// ghost: inactive, low contrast, no background.
export function CircleButton({ icon, label, onPress, variant = 'solid', size = 56 }: CircleButtonProps) {
  const isSolid = variant === 'solid';
  const isInverse = variant === 'inverse';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSolid ? colors.focus : isInverse ? colors.focusText : 'transparent',
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icon name={icon} size={24} color={isSolid ? colors.focusText : isInverse ? colors.focus : colors.inkMuted} />
    </Pressable>
  );
}

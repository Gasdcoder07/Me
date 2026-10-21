import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { type IconName, Icon } from '@/components/icons/Icon';
import { radii } from '@/constants/theme';
import { glassOnFocus } from '@/constants/themes';
import { usePressScale } from '@/hooks/usePressScale';
import { useTheme } from '@/theme/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ItemCardProps = {
  icon: IconName;
  badge: string;
  title: string;
  chips: string[];
  accessory?: ReactNode;
  accessibilityLabel: string;
  onPress: () => void;
};

// Dark card in the spirit of the discovery cards: an accent badge on top, a large title,
// and glass chips for the details. Pressing it opens the item's detail modal.
export function ItemCard({ icon, badge, title, chips, accessory, accessibilityLabel, onPress }: ItemCardProps) {
  const { colors } = useTheme();
  const chipStyle = glassOnFocus(colors);
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[{ borderRadius: radii.block, backgroundColor: colors.focus, padding: 20 }, animatedStyle]}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="flex-row items-center gap-2 rounded-full px-3 py-1.5"
          style={{ backgroundColor: colors.highlight }}
        >
          <Icon name={icon} size={16} color={colors.onHighlight} />
          <Text className="font-title text-xs uppercase text-on-highlight">{badge}</Text>
        </View>
        {accessory}
      </View>

      <Text
        className="mt-6 font-display text-2xl text-focus-text"
        style={{ letterSpacing: -0.8 }}
        numberOfLines={2}
      >
        {title}
      </Text>

      {chips.length > 0 && (
        <View className="mt-4 flex-row flex-wrap gap-2">
          {chips.map((chip) => (
            <View key={chip} className="rounded-full px-3 py-1.5" style={chipStyle}>
              <Text className="font-medium text-xs text-focus-text" numberOfLines={1}>
                {chip}
              </Text>
            </View>
          ))}
        </View>
      )}
    </AnimatedPressable>
  );
}

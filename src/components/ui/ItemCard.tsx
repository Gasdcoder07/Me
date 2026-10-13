import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type IconName, Icon } from '@/components/icons/Icon';
import { colors, radii } from '@/constants/theme';

type ItemCardProps = {
  icon: IconName;
  badge: string;
  title: string;
  chips: string[];
  accessory?: ReactNode;
  accessibilityLabel: string;
  onPress: () => void;
};

// Dark card in the spirit of the discovery cards: an amber badge on top, a large title,
// and glass chips for the details. Pressing it opens the item's detail modal.
export function ItemCard({ icon, badge, title, chips, accessory, accessibilityLabel, onPress }: ItemCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        { borderRadius: radii.block, backgroundColor: colors.focus, padding: 20 },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="flex-row items-center gap-2 rounded-full px-3 py-1.5"
          style={{ backgroundColor: colors.amber }}
        >
          <Icon name={icon} size={16} color={colors.focus} />
          <Text className="font-title text-xs uppercase text-focus">{badge}</Text>
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
    </Pressable>
  );
}

// Translucent chip for the black card, the same glass as the next-reminder card.
const chipStyle = {
  backgroundColor: 'rgba(239, 235, 226, 0.1)',
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: 'rgba(239, 235, 226, 0.25)',
};

import { Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { LavaBackground } from '@/components/ui/LavaBackground';
import { colors, radii } from '@/constants/theme';

type VaultSummaryBlockProps = {
  count: number;
  isPaused?: boolean;
};

// Focus block: pure black, large display number, amber as the single accent.
// The black base carries slow dark-grey glows that drift like lava behind the content.
export function VaultSummaryBlock({ count, isPaused = false }: VaultSummaryBlockProps) {
  return (
    <View className="bg-focus p-6" style={{ borderRadius: radii.block, overflow: 'hidden' }}>
      <LavaBackground paused={isPaused} />

      <View className="flex-row items-center justify-between">
        <Icon name="key" size={28} color={colors.amber} />
        <Text className="font-medium text-xs uppercase text-ink-muted">Cifrado en este dispositivo</Text>
      </View>

      {/* pt-2 + line height >= 1.2x font size: avoids clipping the top of the numeral. */}
      <View className="mt-8 pt-2">
        <Text
          className="font-display text-focus-text"
          style={{ fontSize: 112, lineHeight: 134, letterSpacing: -5 }}
        >
          {count}
        </Text>
      </View>
      <Text className="mt-2 font-regular text-base text-focus-text">credenciales guardadas</Text>
    </View>
  );
}

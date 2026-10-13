import { Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';

type ModulePlaceholderProps = {
  title: string;
  description: string;
};

// Placeholder for modules that are not built yet. Keeps the same header rhythm as the vault.
export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <Screen>
      <View className="flex-1 gap-2 px-6 pt-6">
        <View className="pt-2">
          <Text className="font-display text-ink" style={{ fontSize: 64, lineHeight: 77, letterSpacing: -3 }}>
            {title}
          </Text>
        </View>
        <Text className="font-regular text-base text-ink-muted">{description}</Text>
      </View>
    </Screen>
  );
}

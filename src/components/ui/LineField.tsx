import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors } from '@/constants/theme';

type LineFieldProps = TextInputProps & {
  label: string;
};

// Large text with only a hairline underneath. No boxes, no heavy borders.
export function LineField({ label, ...inputProps }: LineFieldProps) {
  return (
    <View className="gap-2">
      <Text className="font-medium text-xs uppercase text-ink-muted">{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkMuted}
        className="border-b border-ink-faint pb-2 font-title text-2xl text-ink"
        {...inputProps}
      />
    </View>
  );
}

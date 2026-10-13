import { Text, View } from 'react-native';

type DetailFieldProps = {
  label: string;
  value: string;
};

// Black block for one value, the same focus treatment as the vault summary.
// Selectable, so a long press copies the value.
export function DetailField({ label, value }: DetailFieldProps) {
  return (
    <View className="gap-2 rounded-block bg-focus/20 p-5">
      <Text className="font-medium text-xs uppercase text-focus-text" style={{ opacity: 0.6 }}>
        {label}
      </Text>
      <Text className="font-title text-xl text-focus-text" selectable>
        {value}
      </Text>
    </View>
  );
}

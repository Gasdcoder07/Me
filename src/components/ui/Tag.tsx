import { Text, View } from 'react-native';

type TagProps = {
  label: string;
};

// Outlined pill on the canvas, the same look as the category chips in the forms.
export function Tag({ label }: TagProps) {
  return (
    <View className="rounded-full border border-ink-faint px-4 py-2">
      <Text className="font-medium text-sm text-ink-muted">{label}</Text>
    </View>
  );
}

import { Text } from 'react-native';

type SectionTitleProps = {
  children: string;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return <Text className="font-title text-xl text-ink">{children}</Text>;
}

import { Text, View } from 'react-native';

import { withAlpha } from '@/constants/themes';
import type { Reminder } from '@/types/reminders';
import { formatShortDay, formatTime } from '@/utils/dates';
import { useTheme } from '@/theme/ThemeProvider';

type NextReminderCardProps = {
  reminder: Reminder | null;
};

// The reminder closest in time, shown first. Without upcoming reminders it shows an empty state.
// Translucent card for the dark top panel: a faint tint of the focus text, no hairline edge.
export function NextReminderCard({ reminder }: NextReminderCardProps) {
  const { colors } = useTheme();

  if (!reminder) {
    return (
      <View
        className="flex-1 justify-center rounded-block p-5"
        style={{ backgroundColor: withAlpha(colors.focusText, 0.1), minHeight: 96 }}
      >
        <Text className="font-regular text-lg text-focus-text" style={{ opacity: 0.6 }}>
          Sin recordatorios próximos
        </Text>
      </View>
    );
  }

  const remindAt = new Date(reminder.remindAt);

  return (
    <View
      className="flex-1 justify-between rounded-block p-5"
      style={{ backgroundColor: withAlpha(colors.focusText, 0.2), minHeight: 96 }}
    >
      <Text className="font-medium text-xs uppercase text-focus-text" style={{ opacity: 0.6 }}>
        Próximo
      </Text>

      <View className="gap-1">
        <Text className="font-title text-lg text-focus-text" numberOfLines={1}>
          {reminder.title}
        </Text>
        <Text className="font-regular text-sm" style={{ color: colors.focusText, opacity: 0.8 }}>
          {formatShortDay(remindAt)} · {formatTime(remindAt)}
        </Text>
      </View>
    </View>
  );
}

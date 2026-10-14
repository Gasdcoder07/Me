import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { Reminder } from '@/types/reminders';
import { formatShortDay, formatTime } from '@/utils/dates';

type NextReminderCardProps = {
  reminder: Reminder | null;
};

// Translucent card for the dark top panel: a faint canvas tint with a hairline edge.
const glassStyle = {
  backgroundColor: 'rgba(239, 235, 226, 0.1)',
  //borderWidth: StyleSheet.hairlineWidth,
  borderColor: 'rgba(239, 235, 226, 0.25)',
};

const glassStyleExisting = {
  backgroundColor: 'rgba(239, 235, 226, 0.2)',
  borderColor: 'rgba(239, 235, 226, 0.25)'
}

// The reminder closest in time, shown first. Without upcoming reminders it shows an empty state.
export function NextReminderCard({ reminder }: NextReminderCardProps) {
  if (!reminder) {
    return (
      <View className="flex-1 justify-center rounded-block p-5" style={[glassStyle, { minHeight: 96 }]}>
        <Text className="font-regular text-lg text-focus-text" style={{ opacity: 0.6 }}>
          Sin recordatorios próximos
        </Text>
      </View>
    );
  }

  const remindAt = new Date(reminder.remindAt);

  return (
    <View className="flex-1 justify-between rounded-block p-5" style={[glassStyleExisting, { minHeight: 96 }]}>
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

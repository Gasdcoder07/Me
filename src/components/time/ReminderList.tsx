import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { ItemCard } from '@/components/ui/ItemCard';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { colors } from '@/constants/theme';
import type { Reminder } from '@/types/reminders';
import { formatTime, weekdayShort } from '@/utils/dates';

type ReminderListProps = {
  reminders: Reminder[];
  // Current time in ms, passed in so rows stay pure during render.
  now: number;
  onOpen: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
};

// Same node-and-line rhythm as the vault and document rows. Reminders that already passed are dimmed.
export function ReminderList({ reminders, now, onOpen, onDelete }: ReminderListProps) {
  return (
    <View>
      {reminders.map((reminder, index) => (
        <ReminderRow
          key={reminder.id}
          reminder={reminder}
          hasPassed={reminder.remindAt < now}
          isLast={index === reminders.length - 1}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

type ReminderRowProps = {
  reminder: Reminder;
  hasPassed: boolean;
  isLast: boolean;
  onOpen: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
};

// Memoized: with `now` ticking every minute, a row only re-renders when its own "passed" state flips.
const ReminderRow = memo(function ReminderRow({ reminder, hasPassed, isLast, onOpen, onDelete }: ReminderRowProps) {
  const remindAt = new Date(reminder.remindAt);

  return (
    <View className="flex-row" style={{ opacity: hasPassed ? 0.45 : 1 }}>
      <View className="w-5 items-center">
        {!isLast && (
          <View
            className="mt-1 flex-1"
            style={{ width: 1, borderLeftWidth: 1, borderStyle: 'dashed', borderColor: colors.inkFaint }}
          />
        )}
      </View>

      <View className="mb-3 flex-1">
        <SwipeToDelete accessibilityLabel={`Borrar ${reminder.title}`} onDelete={() => onDelete(reminder)}>
          <ItemCard
            icon="clock"
            badge={`${weekdayShort(remindAt)} ${remindAt.getDate()}`}
            title={reminder.title}
            chips={[formatTime(remindAt)]}
            accessibilityLabel={`Abrir ${reminder.title}`}
            onPress={() => onOpen(reminder)}
          />
        </SwipeToDelete>
      </View>
    </View>
  );
});

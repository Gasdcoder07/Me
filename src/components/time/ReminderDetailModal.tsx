import { Text, View } from 'react-native';

import { CenteredModal } from '@/components/ui/CenteredModal';
import { DetailField } from '@/components/ui/DetailField';
import { Icon } from '@/components/icons/Icon';
import { colors } from '@/constants/theme';
import type { Reminder } from '@/types/reminders';
import { formatLongDay, formatTime } from '@/utils/dates';

type ReminderDetailModalProps = {
  reminder: Reminder;
  // Current time in ms, so the status reads correctly while the modal is open.
  now: number;
  onClose: () => void;
};

export function ReminderDetailModal({ reminder, now, onClose }: ReminderDetailModalProps) {
  const remindAt = new Date(reminder.remindAt);
  const hasPassed = reminder.remindAt < now;

  return (
    <CenteredModal onClose={onClose}>
      <View className="gap-6 rounded-block bg-focus p-6">
        <View className="flex-row items-center justify-between">
          <Icon name="clock" size={28} color={colors.amber} />
          <Text className="font-medium text-xs uppercase text-focus-text" style={{ opacity: 0.6 }}>
            {hasPassed ? 'Pasado' : 'Próximo'}
          </Text>
        </View>

        {/* Line height above 1.2x the size keeps the numeral fully inside its line box. */}
        <View>
          <Text
            className="font-display text-focus-text"
            style={{ fontSize: 96, lineHeight: 110, letterSpacing: -4 }}
          >
            {remindAt.getDate()}
          </Text>
          <Text className="font-regular text-base text-focus-text" style={{ opacity: 0.8 }}>
            {formatLongDay(remindAt)}
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <Text
          className="font-display text-ink"
          style={{ fontSize: 30, lineHeight: 36, letterSpacing: -1 }}
          numberOfLines={3}
        >
          {reminder.title}
        </Text>

      </View>

      <DetailField label="Hora" value={formatTime(remindAt)} />
    </CenteredModal>
  );
}

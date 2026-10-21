import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { CenteredModal } from '@/components/ui/CenteredModal';
import { CircleButton } from '@/components/ui/CircleButton';
import { DetailField } from '@/components/ui/DetailField';
import { Icon } from '@/components/icons/Icon';
import { deleteReminder } from '@/data/reminders';
import { cancelReminderNotifications } from '@/services/reminderNotifications';
import { useTheme } from '@/theme/ThemeProvider';
import type { Reminder } from '@/types/reminders';
import { formatLongDay, formatTime } from '@/utils/dates';

type ReminderDetailModalProps = {
  reminder: Reminder;
  // Current time in ms, so the status reads correctly while the modal is open.
  now: number;
  onClose: () => void;
  // Runs after the reminder is deleted, so the screen can refresh its list.
  onDeleted: () => Promise<void>;
};

export function ReminderDetailModal({ reminder, now, onClose, onDeleted }: ReminderDetailModalProps) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const remindAt = new Date(reminder.remindAt);
  const hasPassed = reminder.remindAt < now;
  const [isDeleting, setIsDeleting] = useState(false);
  // Set once the reminder is gone. The modal then closes with its own fade, not by disappearing.
  const [isDismissed, setIsDismissed] = useState(false);

  const deleteReminderAndClose = async () => {
    setIsDeleting(true);
    try {
      await cancelReminderNotifications(reminder.id);
      await deleteReminder(db, reminder.id);
    } catch {
      setIsDeleting(false);
      Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.');
      return;
    }
    setIsDismissed(true);
    void onDeleted();
  };

  const confirmDelete = () => {
    if (isDeleting) return;
    Alert.alert('Eliminar recordatorio', `¿Eliminar "${reminder.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void deleteReminderAndClose() },
    ]);
  };

  return (
    <CenteredModal
      onClose={onClose}
      dismissed={isDismissed}
      actions={
        <CircleButton
          icon="trash"
          label={`Eliminar ${reminder.title}`}
          variant="danger"
          size={56}
          onPress={confirmDelete}
        />
      }
    >
      <View className="gap-6 rounded-block bg-focus p-6">
        <View className="flex-row items-center justify-between">
          <Icon name="clock" size={28} color={colors.highlight} />
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

import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { MonthCalendar } from '@/components/time/MonthCalendar';
import { TimePicker, type TimeValue } from '@/components/time/TimePicker';
import { FormSheet } from '@/components/ui/FormSheet';
import { LineField } from '@/components/ui/LineField';
import { createReminder } from '@/data/reminders';
import { useFieldScroll } from '@/hooks/useKeyboard';
import { scheduleReminderNotifications } from '@/services/reminderNotifications';
import { startOfDay, startOfMonth } from '@/utils/dates';

const DEFAULT_TIME: TimeValue = { hours: 9, minutes: 0 };

type ReminderFormModalProps = {
  visible: boolean;
  onClose: () => void;
  // Runs after a reminder is written, so the screen can refresh its data.
  onSaved: () => Promise<void>;
};

// Bottom-sheet form. Title, day from the calendar, and time. Past moments are refused.
export function ReminderFormModal({ visible, onClose, onSaved }: ReminderFormModalProps) {
  const db = useSQLiteContext();
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(new Date()));
  const [time, setTime] = useState<TimeValue>(DEFAULT_TIME);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValid = title.trim() !== '';

  const closeAndReset = () => {
    const today = new Date();
    setTitle('');
    setSelectedDate(startOfDay(today));
    setDisplayedMonth(startOfMonth(today));
    setTime(DEFAULT_TIME);
    setErrorMessage(null);
    onClose();
  };

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    const remindAt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      time.hours,
      time.minutes,
    );

    if (remindAt.getTime() <= Date.now()) {
      setErrorMessage('Elige una fecha y hora futuras.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const reminder = await createReminder(db, { title: title.trim(), remindAt: remindAt.getTime() });
      // Saved first, so a notification failure can never lose the reminder itself.
      const alarmsScheduled = await scheduleReminderNotifications(reminder).catch(() => false);
      await onSaved();
      if (!alarmsScheduled) {
        Alert.alert(
          'Sin avisos',
          'El recordatorio se guardó, pero no podrá avisarte. Activa las notificaciones de Mi en Ajustes.',
        );
      }
      closeAndReset();
    } catch {
      setErrorMessage('No se pudo guardar el recordatorio. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const { scrollRef, fieldProps } = useFieldScroll();
  const titleField = fieldProps('title');

  return (
    <FormSheet
      visible={visible}
      onClose={closeAndReset}
      scrollRef={scrollRef}
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !isValid || isSaving }}
          disabled={!isValid || isSaving}
          onPress={handleSave}
          className="items-center rounded-full py-4 bg-accent"
          style={{ opacity: isValid ? 1 : 0.35 }}
        >
          <Text className="font-title text-base text-on-accent">
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Text>
        </Pressable>
      }
    >
      <Text className="font-display text-ink" style={{ fontSize: 30, lineHeight: 36, letterSpacing: -1 }}>
        Nuevo recordatorio
      </Text>

      <View onLayout={titleField.onLayout}>
        <LineField
          label="Recordatorio"
          placeholder="Ej. Pagar tarjeta"
          value={title}
          onChangeText={setTitle}
          onFocus={titleField.onFocus}
          returnKeyType="done"
        />
      </View>

      {/* Negative margin cancels the content inset, so the calendar runs edge to edge. */}
      <View className="gap-3" style={{ marginHorizontal: -24 }}>
        <Text className="px-6 font-medium text-xs uppercase text-ink-muted">Día</Text>
        <MonthCalendar
          compact
          month={displayedMonth}
          onChangeMonth={(month) => setDisplayedMonth(startOfMonth(month))}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          minDate={startOfDay(new Date())}
        />
      </View>

      <View className="gap-3">
        <Text className="font-medium text-xs uppercase text-ink-muted">Hora (24 h)</Text>
        <TimePicker value={time} onChange={setTime} />
      </View>

      {errorMessage && <Text className="font-regular text-sm text-ink">{errorMessage}</Text>}
    </FormSheet>
  );
}

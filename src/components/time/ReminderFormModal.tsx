import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';

import { MonthCalendar } from '@/components/time/MonthCalendar';
import { LineField } from '@/components/ui/LineField';
import { colors } from '@/constants/theme';
import { createReminder } from '@/data/reminders';
import { useFieldScroll, useKeyboardHeight } from '@/hooks/useKeyboard';
import { startOfDay, startOfMonth } from '@/utils/dates';

const DEFAULT_TIME = '09:00';

type ReminderFormModalProps = {
  visible: boolean;
  onClose: () => void;
  // Runs after a reminder is written, so the screen can refresh its data.
  onSaved: () => Promise<void>;
};

// Reads "HH:mm" in 24-hour format. Returns null when the text is not a real time.
function parseTime(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return { hours, minutes };
}

// Keeps digits only and inserts the colon after the hour, so typing "0930" reads "09:30".
function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

// Bottom-sheet form (iOS pageSheet). Title, day from the calendar, and time. Past moments are refused.
export function ReminderFormModal({ visible, onClose, onSaved }: ReminderFormModalProps) {
  const db = useSQLiteContext();
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(new Date()));
  const [time, setTime] = useState(DEFAULT_TIME);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedTime = parseTime(time);
  const isValid = title.trim() !== '' && parsedTime !== null;

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
    if (!isValid || !parsedTime || isSaving) return;

    const remindAt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      parsedTime.hours,
      parsedTime.minutes,
    );

    if (remindAt.getTime() <= Date.now()) {
      setErrorMessage('Elige una fecha y hora futuras.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createReminder(db, { title: title.trim(), remindAt: remindAt.getTime() });
      await onSaved();
      closeAndReset();
    } catch {
      setErrorMessage('No se pudo guardar el recordatorio. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const keyboard = useKeyboardHeight();
  const { scrollRef, fieldProps } = useFieldScroll();
  const titleField = fieldProps('title');
  const timeField = fieldProps('time');
  // The keyboard only adds bottom padding: the sheet keeps its place and the content above the keyboard scrolls.
  const bodyStyle = useAnimatedStyle(() => ({ paddingBottom: keyboard.value }), [keyboard]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeAndReset}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Animated.View style={[{ flex: 1 }, bodyStyle]}>
          <View className="flex-row items-center justify-between px-6 pt-2">
            <Pressable accessibilityRole="button" hitSlop={12} onPress={closeAndReset}>
              <Text className="font-medium text-base text-ink-muted">Cancelar</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, gap: 20 }}
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

            <View className="gap-2" onLayout={timeField.onLayout}>
              <LineField
                label="Hora (24 h)"
                placeholder={DEFAULT_TIME}
                value={time}
                onChangeText={(text) => setTime(formatTimeInput(text))}
                onFocus={timeField.onFocus}
                keyboardType="number-pad"
                maxLength={5}
              />
              {parsedTime === null && time !== '' && (
                <Text className="font-regular text-sm text-ink-muted">Escribe la hora como HH:mm.</Text>
              )}
            </View>

            {errorMessage && <Text className="font-regular text-sm text-ink">{errorMessage}</Text>}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !isValid || isSaving }}
              disabled={!isValid || isSaving}
              onPress={handleSave}
              className={`items-center rounded-full py-4 ${isValid ? 'bg-focus' : 'bg-ink-faint'}`}
            >
              <Text className={`font-title text-base ${isValid ? 'text-focus-text' : 'text-ink-muted'}`}>
                {isSaving ? 'Guardando…' : 'Guardar'}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

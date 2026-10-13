import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, type LayoutChangeEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MonthGrid, MonthHeader } from '@/components/time/MonthCalendar';
import { NextReminderCard } from '@/components/time/NextReminderCard';
import { ReminderDetailModal } from '@/components/time/ReminderDetailModal';
import { ReminderFormModal } from '@/components/time/ReminderFormModal';
import { ReminderList } from '@/components/time/ReminderList';
import { CircleButton } from '@/components/ui/CircleButton';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { colors } from '@/constants/theme';
import { deleteReminder } from '@/data/reminders';
import { useReminders } from '@/hooks/useReminders';
import type { Reminder } from '@/types/reminders';
import {
  dayKey,
  formatLongDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from '@/utils/dates';

export default function TimeScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { reminders, isLoading, reload } = useReminders();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [openedReminder, setOpenedReminder] = useState<Reminder | null>(null);
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(new Date()));
  // null means the whole month is listed; picking a day narrows the list to that day.
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Height of the dark top panel. The scrolling content starts right below it.
  const [panelHeight, setPanelHeight] = useState(0);
  // Refreshed every minute so the "next" card and the past rows stay accurate while the screen is open.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // The top of this screen is dark, so the status bar text turns light while the tab is focused.
  // The root layout keeps the default dark style for every other screen.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setStyle('light', true);
      return () => StatusBar.setStyle('dark', true);
    }, []),
  );

  const monthReminders = useMemo(
    () => reminders.filter((reminder) => isSameMonth(new Date(reminder.remindAt), displayedMonth)),
    [reminders, displayedMonth],
  );

  // Ordered earliest first, so each day's list is already in order for its chips.
  const remindersByDay = useMemo(() => {
    const groups = new Map<string, Reminder[]>();
    for (const reminder of monthReminders) {
      const key = dayKey(new Date(reminder.remindAt));
      groups.set(key, [...(groups.get(key) ?? []), reminder]);
    }
    return groups;
  }, [monthReminders]);

  const visibleReminders = useMemo(
    () =>
      selectedDate
        ? monthReminders.filter((reminder) => isSameDay(new Date(reminder.remindAt), selectedDate))
        : monthReminders,
    [monthReminders, selectedDate],
  );

  // The list is ordered earliest first, so the first one not yet past is the next.
  const nextReminder = reminders.find((reminder) => reminder.remindAt >= now) ?? null;

  const handleChangeMonth = (month: Date) => {
    setDisplayedMonth(startOfMonth(month));
    setSelectedDate(null);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate((current) => (current && isSameDay(current, date) ? null : date));
  };

  const handleDelete = (reminder: Reminder) => {
    Alert.alert('Eliminar recordatorio', `¿Eliminar "${reminder.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReminder(db, reminder.id);
            await reload();
          } catch {
            Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.');
          }
        },
      },
    ]);
  };

  const onPanelLayout = (event: LayoutChangeEvent) => {
    setPanelHeight(event.nativeEvent.layout.height);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: panelHeight, paddingBottom: 140, gap: 28 }}
      >
        <MonthGrid
          month={displayedMonth}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          remindersByDay={remindersByDay}
          nextReminderId={nextReminder?.id ?? null}
          now={now}
        />

        <View className="gap-4 px-6">
          <View className="flex-row items-end justify-between">
            <SectionTitle>{selectedDate ? formatLongDay(selectedDate) : 'Este mes'}</SectionTitle>
            {selectedDate && (
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setSelectedDate(null)}>
                <Text className="font-medium text-sm" style={{ color: colors.inkMuted }}>
                  Ver todo el mes
                </Text>
              </Pressable>
            )}
          </View>

          {!isLoading &&
            (visibleReminders.length === 0 ? (
              <Text className="font-regular text-base text-ink-muted">
                {selectedDate
                  ? 'No hay recordatorios para este día.'
                  : 'No hay recordatorios este mes. Usa + para crear el primero.'}
              </Text>
            ) : (
              <ReminderList
                reminders={visibleReminders}
                now={now}
                onOpen={setOpenedReminder}
                onDelete={handleDelete}
              />
            ))}
        </View>
      </ScrollView>

      {/* Absolute so it stays put while the grid scrolls; its top padding clears the status bar. */}
      <DarkPanel
        onLayout={onPanelLayout}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top + 12,
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
        }}
      >
        <View className="flex-row items-center gap-3 px-5 pb-2">
          <NextReminderCard reminder={nextReminder} />
          <CircleButton
            icon="plus"
            label="Agregar recordatorio"
            variant="inverse"
            size={56}
            onPress={() => setIsFormOpen(true)}
          />
        </View>

        <MonthHeader month={displayedMonth} onChangeMonth={handleChangeMonth} />
      </DarkPanel>

      {openedReminder && (
        <ReminderDetailModal reminder={openedReminder} now={now} onClose={() => setOpenedReminder(null)} />
      )}

      <ReminderFormModal visible={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={reload} />
    </View>
  );
}

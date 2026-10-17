import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { getNextReminder, listRemindersBetween } from '@/data/reminders';
import type { Reminder } from '@/types/reminders';
import { addMonths, startOfMonth } from '@/utils/dates';

// Reads the reminders of the month shown, plus the next reminder still to come.
// Call `reload` after a write, or when the next reminder's time has passed.
export function useReminders(month: Date) {
  const db = useSQLiteContext();
  const monthStart = startOfMonth(month).getTime();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [nextReminder, setNextReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const from = new Date(monthStart);
    try {
      const [monthReminders, next] = await Promise.all([
        listRemindersBetween(db, from, addMonths(from, 1)),
        getNextReminder(db, Date.now()),
      ]);
      setReminders(monthReminders);
      setNextReminder(next);
    } finally {
      setIsLoading(false);
    }
  }, [db, monthStart]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { reminders, nextReminder, isLoading, reload };
}

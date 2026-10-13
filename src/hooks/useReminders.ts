import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { listReminders } from '@/data/reminders';
import type { Reminder } from '@/types/reminders';

// Reads every reminder, earliest first. Call `reload` after a write to refresh every consumer.
export function useReminders() {
  const db = useSQLiteContext();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setReminders(await listReminders(db));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { reminders, isLoading, reload };
}

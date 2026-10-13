import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Reminder } from '@/types/reminders';

// Runs on every launch: the table creation is idempotent.
export async function migrateReminders(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      remind_at INTEGER NOT NULL
    );
  `);
}

// Earliest first, so the first reminder that has not passed yet is the next one.
export function listReminders(db: SQLiteDatabase): Promise<Reminder[]> {
  return db.getAllAsync<Reminder>(
    'SELECT id, title, remind_at AS remindAt FROM reminders ORDER BY remind_at ASC',
  );
}

export type NewReminder = Omit<Reminder, 'id'>;

export async function createReminder(db: SQLiteDatabase, input: NewReminder): Promise<Reminder> {
  const id = Crypto.randomUUID();

  await db.runAsync(
    'INSERT INTO reminders (id, title, remind_at) VALUES (?, ?, ?)',
    id,
    input.title,
    input.remindAt,
  );

  return { id, title: input.title, remindAt: input.remindAt };
}

export async function deleteReminder(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM reminders WHERE id = ?', id);
}

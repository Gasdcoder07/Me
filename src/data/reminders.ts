import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Reminder } from '@/types/reminders';

// Runs on every launch: the table and its index are both idempotent.
export async function migrateReminders(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      remind_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
  `);
}

// Reminders in [from, to), earliest first. The screen only shows one month, so it never loads the rest.
export function listRemindersBetween(db: SQLiteDatabase, from: Date, to: Date): Promise<Reminder[]> {
  return db.getAllAsync<Reminder>(
    'SELECT id, title, remind_at AS remindAt FROM reminders WHERE remind_at >= ? AND remind_at < ? ORDER BY remind_at ASC',
    from.getTime(),
    to.getTime(),
  );
}

// The first reminder at or after `now`, or null when none is left.
export function getNextReminder(db: SQLiteDatabase, now: number): Promise<Reminder | null> {
  return db.getFirstAsync<Reminder>(
    'SELECT id, title, remind_at AS remindAt FROM reminders WHERE remind_at >= ? ORDER BY remind_at ASC LIMIT 1',
    now,
  );
}

// The soonest reminders at or after `now`, earliest first. Feeds the alarm sync on launch.
export function listUpcomingReminders(db: SQLiteDatabase, now: number, limit: number): Promise<Reminder[]> {
  return db.getAllAsync<Reminder>(
    'SELECT id, title, remind_at AS remindAt FROM reminders WHERE remind_at >= ? ORDER BY remind_at ASC LIMIT ?',
    now,
    limit,
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

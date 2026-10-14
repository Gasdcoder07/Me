import type { SQLiteDatabase } from 'expo-sqlite';

// Only the owner's name is stored. There is no account or session: the row is a single fixed id.
// Runs on every launch: the table creation is idempotent.
export async function migrateOwner(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS owner (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      name TEXT NOT NULL
    );
  `);
}

export async function getOwnerName(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ name: string }>('SELECT name FROM owner WHERE id = 1');
  return row?.name ?? null;
}

export async function saveOwnerName(db: SQLiteDatabase, name: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO owner (id, name) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name',
    name,
  );
}

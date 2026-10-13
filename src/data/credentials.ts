import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

import type { Credential, CredentialCategory } from '@/types/vault';

export const CREDENTIALS_DATABASE_NAME = 'mi.db';

// Identidad has no username, so only the login categories carry one.
export type NewCredential =
  | { category: 'identity'; title: string; secret: string }
  | { category: 'banks' | 'access'; title: string; username: string; secret: string };

// Secrets never touch SQLite. The row keeps the metadata and the id; the secret
// (a password, or the identity datum) is stored in SecureStore (Keychain / Keystore) under this key.
const secretKey = (credentialId: string) => `credential.${credentialId}`;

type CredentialRow = {
  id: string;
  title: string;
  category: CredentialCategory;
  username: string | null;
};

const CREATE_CREDENTIALS_TABLE = `
  CREATE TABLE IF NOT EXISTS credentials (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    username TEXT
  );
`;

// Runs on every launch. Databases created before identity existed declare `username NOT NULL`,
// which rejects identity rows, so that table is rebuilt once and its rows are copied across.
export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string; notnull: number }>('PRAGMA table_info(credentials)');
  const usernameIsRequired = columns.some((column) => column.name === 'username' && column.notnull === 1);

  if (!usernameIsRequired) {
    await db.execAsync(CREATE_CREDENTIALS_TABLE);
    return;
  }

  await db.withTransactionAsync(async () => {
    await db.execAsync('ALTER TABLE credentials RENAME TO credentials_legacy');
    await db.execAsync(CREATE_CREDENTIALS_TABLE);
    await db.execAsync(
      'INSERT INTO credentials (id, title, category, username) SELECT id, title, category, username FROM credentials_legacy',
    );
    await db.execAsync('DROP TABLE credentials_legacy');
  });
}

// The username is only meaningful for the login categories, so identity never exposes one.
function toCredential(row: CredentialRow): Credential {
  if (row.category === 'identity') return { id: row.id, title: row.title, category: 'identity' };

  return { id: row.id, title: row.title, category: row.category, username: row.username ?? '' };
}

export async function listCredentials(db: SQLiteDatabase): Promise<Credential[]> {
  const rows = await db.getAllAsync<CredentialRow>(
    'SELECT id, title, category, username FROM credentials ORDER BY rowid DESC',
  );

  return rows.map(toCredential);
}

export async function createCredential(db: SQLiteDatabase, input: NewCredential): Promise<Credential> {
  const id = Crypto.randomUUID();
  const username = input.category === 'identity' ? null : input.username;

  await SecureStore.setItemAsync(secretKey(id), input.secret);

  try {
    await db.runAsync(
      'INSERT INTO credentials (id, title, category, username) VALUES (?, ?, ?, ?)',
      id,
      input.title,
      input.category,
      username,
    );
  } catch (error) {
    // Roll back the secret so no orphaned value stays in SecureStore.
    await SecureStore.deleteItemAsync(secretKey(id));
    throw error;
  }

  return toCredential({ id, title: input.title, category: input.category, username });
}

export function getCredentialSecret(credentialId: string): Promise<string | null> {
  return SecureStore.getItemAsync(secretKey(credentialId));
}

// The row goes first: if that fails, the secret is still there and nothing is lost. The secret is removed after.
export async function deleteCredential(db: SQLiteDatabase, credentialId: string): Promise<void> {
  await db.runAsync('DELETE FROM credentials WHERE id = ?', credentialId);
  await SecureStore.deleteItemAsync(secretKey(credentialId));
}

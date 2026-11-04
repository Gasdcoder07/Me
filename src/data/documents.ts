import * as Crypto from 'expo-crypto';
import { Directory, File, FileMode, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { DocumentCategory, StoredDocument } from '@/types/documents';
import { openBytes, sealBytes } from '@/services/crypto';

// Fixed ids so the built-in categories can be recognised by the UI (icons, defaults).
export const BUILTIN_CATEGORY_IDS = {
  identification: 'identification',
  school: 'school',
} as const;

const builtinCategories: (DocumentCategory & { sortOrder: number })[] = [
  { id: BUILTIN_CATEGORY_IDS.identification, name: 'Identificación', sortOrder: 0 },
  { id: BUILTIN_CATEGORY_IDS.school, name: 'Documento escolar', sortOrder: 1 },
];

// Encrypted copies live here, in the app's document folder. Only the sealed bytes are written: the plain file never is.
const documentsDirectory = () => new Directory(Paths.document, 'documents');
const encryptedFile = (documentId: string) => new File(documentsDirectory(), `${documentId}.enc`);

// Plain copies exist only while a document is open or being shared. They sit in the cache, one folder per
// document, and are removed when the viewer closes, when the share sheet is dismissed, and on lock.
const decryptedDirectory = () => new Directory(Paths.cache, 'mi-decrypted');
export const decryptedDirectoryUri = (): string => decryptedDirectory().uri;

// Runs on every launch: the table creation and the seed are both idempotent.
export async function migrateDocuments(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS document_categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES document_categories(id),
      file_name TEXT NOT NULL,
      mime_type TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
    CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
  `);

  for (const category of builtinCategories) {
    await db.runAsync(
      'INSERT OR IGNORE INTO document_categories (id, name, sort_order) VALUES (?, ?, ?)',
      category.id,
      category.name,
      category.sortOrder,
    );
  }
}

export function listDocumentCategories(db: SQLiteDatabase): Promise<DocumentCategory[]> {
  return db.getAllAsync<DocumentCategory>(
    'SELECT id, name FROM document_categories ORDER BY sort_order ASC',
  );
}

// Case-insensitive: typing an existing name returns that category instead of duplicating it.
export async function createDocumentCategory(db: SQLiteDatabase, name: string): Promise<DocumentCategory> {
  const existing = await db.getFirstAsync<DocumentCategory>(
    'SELECT id, name FROM document_categories WHERE name = ? COLLATE NOCASE',
    name,
  );
  if (existing) return existing;

  const id = Crypto.randomUUID();

  await db.runAsync(
    'INSERT INTO document_categories (id, name, sort_order) VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM document_categories))',
    id,
    name,
  );

  return { id, name };
}

export function isBuiltinCategory(categoryId: string): boolean {
  return (Object.values(BUILTIN_CATEGORY_IDS) as string[]).includes(categoryId);
}

export async function countDocumentsInCategory(db: SQLiteDatabase, categoryId: string): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM documents WHERE category_id = ?',
    categoryId,
  );

  return row?.total ?? 0;
}

// Removes a custom category together with its documents. Built-in categories are never deleted.
// The rows go in one transaction; the copied files are removed afterwards, best effort.
export async function deleteDocumentCategory(db: SQLiteDatabase, categoryId: string): Promise<void> {
  if (isBuiltinCategory(categoryId)) throw new Error('Built-in categories cannot be deleted');

  const ids = await db.getAllAsync<{ id: string }>('SELECT id FROM documents WHERE category_id = ?', categoryId);

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM documents WHERE category_id = ?', categoryId);
    await db.runAsync('DELETE FROM document_categories WHERE id = ?', categoryId);
  });

  for (const { id } of ids) {
    removeStoredFile(id);
  }
}

function removeStoredFile(documentId: string): void {
  try {
    const file = encryptedFile(documentId);
    if (file.exists) file.delete();
  } catch {
    // The row is already gone, so a leftover file is only wasted space. Nothing to recover here.
  }
}

// Removes every plain copy. Called on lock, so nothing decrypted outlives the unlocked session.
export function clearDecryptedFiles(): void {
  try {
    const directory = decryptedDirectory();
    if (directory.exists) directory.delete();
  } catch {
    // Nothing to recover here: the cache folder is also cleared by the system when space runs low.
  }
}

// Each use gets its own folder ('preview' for the viewer, 'share' for the share sheet), so closing one never
// removes the copy the other still needs. The copy keeps the real file name, so the share sheet shows it.
// The caller must call closeDocumentFile with the same use when it is done.
export type DecryptedCopyUse = 'preview' | 'share';

export async function openDocumentFile(document: StoredDocument, use: DecryptedCopyUse): Promise<File> {
  const sealed = await encryptedFile(document.id).bytes();
  const plain = openBytes(sealed);

  const folder = new Directory(decryptedDirectory(), `${document.id}-${use}`);
  if (!folder.exists) folder.create({ intermediates: true });

  const file = new File(folder, document.fileName.replace(/[/\\]/g, '_'));
  file.create({ overwrite: true });
  const handle = file.open(FileMode.ReadWrite);
  try {
    await handle.writeBytes(plain);
  } finally {
    handle.close();
  }

  return file;
}

export function closeDocumentFile(document: StoredDocument, use: DecryptedCopyUse): void {
  try {
    const folder = new Directory(decryptedDirectory(), `${document.id}-${use}`);
    if (folder.exists) folder.delete();
  } catch {
    // The folder is wiped on lock anyway.
  }
}

export function listDocuments(db: SQLiteDatabase): Promise<StoredDocument[]> {
  return db.getAllAsync<StoredDocument>(
    'SELECT id, name, category_id AS categoryId, file_name AS fileName, mime_type AS mimeType, created_at AS createdAt FROM documents ORDER BY created_at DESC',
  );
}

export type NewDocument = {
  name: string;
  categoryId: string;
  sourceUri: string;
  sourceName: string;
  mimeType: string | null;
};

// Reads the picked file, seals it with the master key and writes only the sealed bytes, then records the row.
// The picker's cache copy is deleted once it is sealed. If the insert fails, the sealed file is removed.
export async function importDocument(db: SQLiteDatabase, input: NewDocument): Promise<StoredDocument> {
  const id = Crypto.randomUUID();

  const directory = documentsDirectory();
  if (!directory.exists) directory.create({ intermediates: true });

  const source = new File(input.sourceUri);
  const sealed = sealBytes(await source.bytes());

  const destination = encryptedFile(id);
  destination.create();
  const handle = destination.open(FileMode.ReadWrite);
  try {
    await handle.writeBytes(sealed);
  } finally {
    handle.close();
  }

  // The picker's copy is a plain file in the cache. Remove it now, so the only copy left is the sealed one.
  removeCachedSource(source);

  const createdAt = Date.now();

  try {
    await db.runAsync(
      'INSERT INTO documents (id, name, category_id, file_name, mime_type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      input.name,
      input.categoryId,
      input.sourceName,
      input.mimeType,
      createdAt,
    );
  } catch (error) {
    if (destination.exists) destination.delete();
    throw error;
  }

  return {
    id,
    name: input.name,
    categoryId: input.categoryId,
    fileName: input.sourceName,
    mimeType: input.mimeType,
    createdAt,
  };
}

// Only ever deletes a file inside the cache folder, so a source picked from elsewhere is never touched.
function removeCachedSource(source: File): void {
  try {
    if (source.uri.startsWith(Paths.cache.uri) && source.exists) source.delete();
  } catch {
    // Best effort: if the delete fails, the system clears the cache when space runs low.
  }
}

// Removes the row, then the sealed file (best effort, see removeStoredFile).
export async function deleteDocument(db: SQLiteDatabase, documentId: string): Promise<void> {
  await db.runAsync('DELETE FROM documents WHERE id = ?', documentId);

  removeStoredFile(documentId);
}

import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { DocumentCategory, StoredDocument } from '@/types/documents';

// Fixed ids so the built-in categories can be recognised by the UI (icons, defaults).
export const BUILTIN_CATEGORY_IDS = {
  identification: 'identification',
  school: 'school',
} as const;

const builtinCategories: (DocumentCategory & { sortOrder: number })[] = [
  { id: BUILTIN_CATEGORY_IDS.identification, name: 'Identificación', sortOrder: 0 },
  { id: BUILTIN_CATEGORY_IDS.school, name: 'Documento escolar', sortOrder: 1 },
];

// Files are copied here so they outlive the picker's cache directory.
const documentsDirectory = () => new Directory(Paths.document, 'documents');

// The viewer reads the copied files through these URIs. The directory is also the read scope for WebView.
export const documentsDirectoryUri = (): string => documentsDirectory().uri;
export const documentFileUri = (fileName: string): string => new File(documentsDirectory(), fileName).uri;

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

  const files = await db.getAllAsync<{ fileName: string }>(
    'SELECT file_name AS fileName FROM documents WHERE category_id = ?',
    categoryId,
  );

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM documents WHERE category_id = ?', categoryId);
    await db.runAsync('DELETE FROM document_categories WHERE id = ?', categoryId);
  });

  for (const file of files) {
    removeStoredFile(file.fileName);
  }
}

function removeStoredFile(fileName: string): void {
  try {
    const file = new File(documentsDirectory(), fileName);
    if (file.exists) file.delete();
  } catch {
    // The row is already gone, so a leftover file is only wasted space. Nothing to recover here.
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

// Copies the picked file into the app's storage, then records it. If the insert fails,
// the copied file is removed so no orphan is left behind.
export async function importDocument(db: SQLiteDatabase, input: NewDocument): Promise<StoredDocument> {
  const id = Crypto.randomUUID();
  const extension = fileExtension(input.sourceName);
  const fileName = extension ? `${id}.${extension}` : id;

  const directory = documentsDirectory();
  if (!directory.exists) directory.create({ intermediates: true });

  const destination = new File(directory, fileName);
  await new File(input.sourceUri).copy(destination);

  const createdAt = Date.now();

  try {
    await db.runAsync(
      'INSERT INTO documents (id, name, category_id, file_name, mime_type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      input.name,
      input.categoryId,
      fileName,
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
    fileName,
    mimeType: input.mimeType,
    createdAt,
  };
}

// Removes the row, then the copied file (best effort, see removeStoredFile).
export async function deleteDocument(db: SQLiteDatabase, documentId: string): Promise<void> {
  const row = await db.getFirstAsync<{ fileName: string }>(
    'SELECT file_name AS fileName FROM documents WHERE id = ?',
    documentId,
  );

  await db.runAsync('DELETE FROM documents WHERE id = ?', documentId);

  if (row) removeStoredFile(row.fileName);
}

function fileExtension(fileName: string): string | null {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0 || dot === fileName.length - 1) return null;

  return fileName.slice(dot + 1).toLowerCase();
}

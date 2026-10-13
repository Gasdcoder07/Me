import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { listDocumentCategories, listDocuments } from '@/data/documents';
import type { DocumentCategory, StoredDocument } from '@/types/documents';

// Reads categories and documents from SQLite. Call `reload` after a write to refresh every consumer.
export function useDocuments() {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [nextCategories, nextDocuments] = await Promise.all([
        listDocumentCategories(db),
        listDocuments(db),
      ]);
      setCategories(nextCategories);
      setDocuments(nextDocuments);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { categories, documents, isLoading, reload };
}

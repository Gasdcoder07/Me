import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { listCredentials } from '@/data/credentials';
import type { Credential } from '@/types/vault';

// Reads the vault from SQLite. Call `reload` after a write to refresh every consumer.
export function useCredentials() {
  const db = useSQLiteContext();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setCredentials(await listCredentials(db));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { credentials, isLoading, reload };
}

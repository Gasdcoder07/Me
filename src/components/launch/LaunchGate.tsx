import { type ReactNode, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { SplashScreen } from '@/components/launch/SplashScreen';
import { WelcomeScreen } from '@/components/launch/WelcomeScreen';
import { getOwnerName, saveOwnerName } from '@/data/owner';
import { OwnerNameContext } from '@/hooks/useOwnerName';

// The splash stays long enough to read as a moment, even when the database opens instantly.
const SPLASH_MIN_MS = 1800;

type LaunchGateProps = {
  children: ReactNode;
};

// Runs on every launch, inside the database provider: splash, then the welcome greeting, then the children.
// Children (the lock and the app) mount only after the welcome, so nothing else shows before it.
export function LaunchGate({ children }: LaunchGateProps) {
  const db = useSQLiteContext();
  // undefined: the stored name has not been read yet. null: no name stored yet.
  const [savedName, setSavedName] = useState<string | null | undefined>(undefined);
  // null until the welcome is done; then the name the owner is using in this launch.
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [minimumElapsed, setMinimumElapsed] = useState(false);

  useEffect(() => {
    void getOwnerName(db).then(setSavedName);
  }, [db]);

  useEffect(() => {
    const timeout = setTimeout(() => setMinimumElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(timeout);
  }, []);

  if (savedName === undefined || !minimumElapsed) return <SplashScreen />;

  if (ownerName === null) {
    const handleContinue = async (name: string) => {
      if (name !== savedName) await saveOwnerName(db, name);
      setOwnerName(name);
    };

    return <WelcomeScreen savedName={savedName} onContinue={handleContinue} />;
  }

  return <OwnerNameContext.Provider value={ownerName}>{children}</OwnerNameContext.Provider>;
}

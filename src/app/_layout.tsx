import '../global.css';

import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LaunchGate } from '@/components/launch/LaunchGate';
import { SplashScreen } from '@/components/launch/SplashScreen';
import { AppLock } from '@/components/security/AppLock';
import { colors } from '@/constants/theme';
import { CREDENTIALS_DATABASE_NAME, migrateDatabase } from '@/data/credentials';
import { migrateDocuments } from '@/data/documents';
import { migrateOwner } from '@/data/owner';
import { migrateReminders } from '@/data/reminders';

// Module-level so its identity never changes. SQLiteProvider closes and reopens the database
// whenever onInit changes, which would cut off queries still running.
// Only schema is touched here: no vault data is read before the biometric unlock.
async function initializeDatabase(db: SQLiteDatabase) {
  await migrateDatabase(db);
  await migrateDocuments(db);
  await migrateReminders(db);
  await migrateOwner(db);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  // The splash covers both waits: the fonts here, and the database opening inside Suspense below.
  // Waiting for the fonts keeps the first frame from showing system fallbacks.
  // The database opens once and stays open. AppLock sits inside it, so locking the app
  // unmounts the screens but never closes the database under a query still in flight.
  // GestureHandlerRootView lets the swipe-to-delete rows receive pan gestures.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      {fontsLoaded ? (
        <Suspense fallback={<SplashScreen />}>
          <SQLiteProvider databaseName={CREDENTIALS_DATABASE_NAME} onInit={initializeDatabase} useSuspense>
            <LaunchGate>
              <AppLock>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.canvas },
                  }}
                />
              </AppLock>
            </LaunchGate>
          </SQLiteProvider>
        </Suspense>
      ) : (
        <SplashScreen showTitle={false} />
      )}
    </GestureHandlerRootView>
  );
}

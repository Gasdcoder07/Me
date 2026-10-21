import '../global.css';

import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LaunchGate } from '@/components/launch/LaunchGate';
import { SplashScreen } from '@/components/launch/SplashScreen';
import { AppLock } from '@/components/security/AppLock';
import { CREDENTIALS_DATABASE_NAME, migrateDatabase } from '@/data/credentials';
import { migrateDocuments } from '@/data/documents';
import { migrateOwner } from '@/data/owner';
import { migrateReminders } from '@/data/reminders';
import { syncReminderNotifications } from '@/services/reminderNotifications';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Module-level so its identity never changes. SQLiteProvider closes and reopens the database
// whenever onInit changes, which would cut off queries still running.
// Only schema is touched here: no vault data is read before the biometric unlock.
async function initializeDatabase(db: SQLiteDatabase) {
  await migrateDatabase(db);
  await migrateDocuments(db);
  await migrateReminders(db);
  await migrateOwner(db);
}

// Re-arms the reminder notifications once the database is open. Renders nothing.
function ReminderAlarmSync() {
  const db = useSQLiteContext();

  useEffect(() => {
    // A failed sync leaves the notifications already scheduled in place, so there is nothing to show.
    void syncReminderNotifications(db).catch(() => undefined);
  }, [db]);

  return null;
}

// Status bar follows the theme: light text on a dark canvas, dark text on a light one.
function ThemedStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusBar} />;
}

// Stack background follows the theme, so a route change never flashes the previous canvas.
function ThemedStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
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
  // ThemeProvider sits outside everything, so the splash screens and the database wait use the saved theme too.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedStatusBar />
        {fontsLoaded ? (
          <Suspense fallback={<SplashScreen />}>
            <SQLiteProvider databaseName={CREDENTIALS_DATABASE_NAME} onInit={initializeDatabase} useSuspense>
              <ReminderAlarmSync />
              <LaunchGate>
                <AppLock>
                  <ThemedStack />
                </AppLock>
              </LaunchGate>
            </SQLiteProvider>
          </Suspense>
        ) : (
          <SplashScreen showTitle={false} />
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

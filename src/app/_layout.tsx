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
import { sqlCipherKeyStatement } from '@/services/crypto';
import { syncReminderNotifications } from '@/services/reminderNotifications';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Module-level so its identity never changes. SQLiteProvider closes and reopens the database
// whenever onInit changes, which would cut off queries still running.
// The key statement must run first: until it does, the file is unreadable. AppLock loads the key before this runs.
async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(sqlCipherKeyStatement());
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

  // The splash covers the font wait. Waiting for the fonts keeps the first frame from showing system fallbacks.
  // AppLock is the outermost gate after the fonts: the encrypted database opens only inside it, after the biometric
  // unlock. Locking the app closes the database and unmounts the screens together.
  // GestureHandlerRootView lets the swipe-to-delete rows receive pan gestures.
  // ThemeProvider sits outside everything, so the splash screens and the lock screen use the saved theme too.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedStatusBar />
        {fontsLoaded ? (
          <AppLock>
            <Suspense fallback={<SplashScreen />}>
              <SQLiteProvider databaseName={CREDENTIALS_DATABASE_NAME} onInit={initializeDatabase} useSuspense>
                <ReminderAlarmSync />
                <LaunchGate>
                  <ThemedStack />
                </LaunchGate>
              </SQLiteProvider>
            </Suspense>
          </AppLock>
        ) : (
          <SplashScreen showTitle={false} />
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppLock } from '@/components/security/AppLock';
import { colors } from '@/constants/theme';
import { CREDENTIALS_DATABASE_NAME, migrateDatabase } from '@/data/credentials';
import { migrateDocuments } from '@/data/documents';
import { migrateReminders } from '@/data/reminders';

// Module-level so its identity never changes. SQLiteProvider closes and reopens the database
// whenever onInit changes, which would cut off queries still running.
// Only schema is touched here: no vault data is read before the biometric unlock.
async function initializeDatabase(db: SQLiteDatabase) {
  await migrateDatabase(db);
  await migrateDocuments(db);
  await migrateReminders(db);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  // Wait for the fonts so the first frame never shows system fallbacks.
  if (!fontsLoaded) return null;

  // The database opens once and stays open. AppLock sits inside it, so locking the app
  // unmounts the screens but never closes the database under a query still in flight.
  // GestureHandlerRootView lets the swipe-to-delete rows receive pan gestures.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <SQLiteProvider databaseName={CREDENTIALS_DATABASE_NAME} onInit={initializeDatabase}>
        <AppLock>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.canvas },
            }}
          />
        </AppLock>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

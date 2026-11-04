import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';

import { Icon } from '@/components/icons/Icon';
import { clearDecryptedFiles } from '@/data/documents';
import { clearMasterKey, unlockMasterKey } from '@/services/crypto';
import { useTheme } from '@/theme/ThemeProvider';

type LockStatus = 'locked' | 'failed' | 'unlocked';

type AppLockProps = {
  children: ReactNode;
};

// Blurs the app in the app switcher snapshot. iOS only: Android uses the window flag below instead.
const SWITCHER_BLUR_INTENSITY = 1;

// Wraps the database and every screen. Nothing below mounts, and the database cannot open, until the user passes
// Face ID / Touch ID (or the device passcode fallback). Going to the background locks the vault: the key leaves
// memory, the plain copies are deleted, and the children unmount.
// Inactive is not a lock: the system sheets (document picker, share sheet, notification prompt) all cause it.
export function AppLock({ children }: AppLockProps) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<LockStatus>('locked');
  // Mirror of `status` for AppState listeners, which would otherwise see a stale value.
  const statusRef = useRef<LockStatus>('locked');
  const isAuthenticatingRef = useRef(false);

  // Screenshots and screen recording are blocked for as long as the app is open.
  ScreenCapture.usePreventScreenCapture();

  const updateStatus = useCallback((next: LockStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const lock = useCallback(() => {
    clearMasterKey();
    clearDecryptedFiles();
    updateStatus('locked');
  }, [updateStatus]);

  const authenticate = useCallback(async () => {
    if (isAuthenticatingRef.current) return;
    isAuthenticatingRef.current = true;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquea Mi',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (!result.success) {
        updateStatus('failed');
        return;
      }

      // Fails when the device has no passcode: the Keychain refuses the key, so the vault stays locked.
      await unlockMasterKey();
      updateStatus('unlocked');
    } catch {
      updateStatus('failed');
    } finally {
      isAuthenticatingRef.current = false;
    }
  }, [updateStatus]);

  // Prompt on launch. Deferred one tick so the lock screen paints before the system dialog.
  useEffect(() => {
    const timeout = setTimeout(() => void authenticate(), 0);
    return () => clearTimeout(timeout);
  }, [authenticate]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void ScreenCapture.enableAppSwitcherProtectionAsync(SWITCHER_BLUR_INTENSITY).catch(() => undefined);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        lock();
      } else if (nextAppState === 'active' && statusRef.current === 'locked') {
        void authenticate();
      }
    });

    return () => subscription.remove();
  }, [authenticate, lock]);

  if (status === 'unlocked') {
    return <>{children}</>;
  }

  // Deliberately quiet: just the canvas, a faint key, and a retry if auth failed.
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View className="flex-1 items-center justify-center gap-4">
        <Icon name="key" size={40} color={colors.inkFaint} />
        <Text className="font-regular text-sm text-ink-muted">Mi está bloqueada</Text>
        {status === 'failed' && (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => void authenticate()}>
            <Text className="font-medium text-sm text-ink">Intentar de nuevo</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

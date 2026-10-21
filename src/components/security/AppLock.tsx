import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';

import { Icon } from '@/components/icons/Icon';
import { useOwnerName } from '@/hooks/useOwnerName';
import { useTheme } from '@/theme/ThemeProvider';

type LockStatus = 'locked' | 'failed' | 'unlocked';

type AppLockProps = {
  children: ReactNode;
};

// Children are not mounted until the user passes Face ID / Touch ID (or the device
// passcode fallback), so no vault data is read or rendered before unlock.
// The vault locks again whenever the app goes to the background.
export function AppLock({ children }: AppLockProps) {
  const { colors } = useTheme();
  const ownerName = useOwnerName();
  const [status, setStatus] = useState<LockStatus>('locked');
  // Mirror of `status` for AppState listeners, which would otherwise see a stale value.
  const statusRef = useRef<LockStatus>('locked');
  const isAuthenticatingRef = useRef(false);

  const updateStatus = useCallback((next: LockStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const authenticate = useCallback(async () => {
    if (isAuthenticatingRef.current) return;
    isAuthenticatingRef.current = true;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquea Mi',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      updateStatus(result.success ? 'unlocked' : 'failed');
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
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        updateStatus('locked');
      } else if (nextAppState === 'active' && statusRef.current === 'locked') {
        void authenticate();
      }
    });

    return () => subscription.remove();
  }, [authenticate, updateStatus]);

  if (status === 'unlocked') {
    return <>{children}</>;
  }

  // Deliberately quiet: just the canvas, a faint key, and a retry if auth failed.
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View className="flex-1 items-center justify-center gap-4">
        <Icon name="key" size={40} color={colors.inkFaint} />
        <Text className="font-regular text-sm text-ink-muted">Bóveda de {ownerName} bloqueada</Text>
        {status === 'failed' && (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => void authenticate()}>
            <Text className="font-medium text-sm text-ink">Intentar de nuevo</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';

import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { LineField } from '@/components/ui/LineField';
import { credentialUsernameLabel } from '@/components/vault/credentialCategory';
import { createCredential, type NewCredential } from '@/data/credentials';
import { useFieldScroll, useKeyboardHeight } from '@/hooks/useKeyboard';
import { radii } from '@/constants/theme';
import type { CredentialCategory, LoginCategory } from '@/types/vault';

// One draft holds every field, so switching category keeps what was typed in each one.
type CredentialDraft = {
  category: CredentialCategory;
  title: string;
  username: string;
  password: string;
  data: string;
};

const emptyDraft: CredentialDraft = {
  category: 'banks',
  title: '',
  username: '',
  password: '',
  data: '',
};

const categoryOptions: { value: CredentialCategory; label: string }[] = [
  { value: 'identity', label: 'Identidad' },
  { value: 'banks', label: 'Bancos' },
  { value: 'access', label: 'Accesos' },
];

const usernamePlaceholder: Record<LoginCategory, string> = {
  banks: 'Ej. nombre de usuario',
  access: 'Ej. nombre@correo.com',
};

// Identidad needs a title and its datum. Bancos and accesos need a title, a username and a password.
function isComplete(draft: CredentialDraft): boolean {
  if (draft.title.trim() === '') return false;
  if (draft.category === 'identity') return draft.data !== '';

  return draft.username.trim() !== '' && draft.password !== '';
}

type CredentialFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const SHEET_ANIMATION = { duration: 280, easing: Easing.out(Easing.cubic) };

// Bottom sheet covering ~3/4 of the screen. Only the fields scroll; the save button stays pinned at the bottom.
// The Modal does not animate itself: the backdrop fades and the sheet slides separately, so the dim layer stays put.
export function CredentialFormModal({ visible, onClose, onSaved }: CredentialFormModalProps) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * 0.75;
  const [draft, setDraft] = useState<CredentialDraft>(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const keyboard = useKeyboardHeight();
  const { scrollRef, fieldProps } = useFieldScroll();
  const titleField = fieldProps('title');
  const usernameField = fieldProps('username');
  const passwordField = fieldProps('password');
  const dataField = fieldProps('data');
  // Keeps the Modal mounted while the closing animation runs.
  const [isRendered, setIsRendered] = useState(visible);
  // 0 = hidden, 1 = fully open.
  const progress = useSharedValue(0);

  // Mount the Modal in the same render that opens it, so the slide-in has a frame to start from.
  if (visible && !isRendered) setIsRendered(true);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, SHEET_ANIMATION);
    } else {
      progress.value = withTiming(0, SHEET_ANIMATION, (finished) => {
        if (finished) scheduleOnRN(setIsRendered, false);
      });
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  // The sheet keeps its place. The keyboard only adds bottom padding, which lifts the footer above it.
  const sheetStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: (1 - progress.value) * sheetHeight }],
      paddingBottom: Math.max(insets.bottom, keyboard.value) + 24,
    }),
    [sheetHeight, insets.bottom, keyboard],
  );

  const isValid = isComplete(draft);

  const updateDraft = <K extends keyof CredentialDraft>(key: K, value: CredentialDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const closeAndReset = () => {
    setDraft(emptyDraft);
    setErrorMessage(null);
    onClose();
  };

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);

    const title = draft.title.trim();
    const input: NewCredential =
      draft.category === 'identity'
        ? { category: 'identity', title, secret: draft.data }
        : { category: draft.category, title, username: draft.username.trim(), secret: draft.password };

    try {
      await createCredential(db, input);
      await onSaved();
      closeAndReset();
    } catch {
      setErrorMessage('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={isRendered} transparent animationType="none" onRequestClose={closeAndReset}>
      <View className="flex-1 justify-end">
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 10, 10, 0.35)' }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" onPress={closeAndReset} />
        </Animated.View>

        <Animated.View
          className="bg-canvas"
          style={[
            {
              height: sheetHeight,
              borderTopLeftRadius: radii.screen,
              borderTopRightRadius: radii.screen,
            },
            sheetStyle,
          ]}
        >
          <View className="flex-row items-center justify-between px-6 pt-6">
            <Pressable accessibilityRole="button" hitSlop={12} onPress={closeAndReset}>
              <Text className="font-medium text-base text-ink-muted">Cancelar</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 28 }}
          >
            <View className="pt-2">
              <Text className="font-display text-ink" style={{ fontSize: 48, lineHeight: 58, letterSpacing: -2 }}>
                Nueva credencial
              </Text>
            </View>

            {/* The category comes first: it decides which fields appear below. */}
            <View className="gap-3">
              <Text className="font-medium text-xs uppercase text-ink-muted">Categoría</Text>
              <SegmentedToggle
                options={categoryOptions}
                value={draft.category}
                onChange={(value) => updateDraft('category', value)}
              />
            </View>

            <View onLayout={titleField.onLayout}>
              <LineField
                label="Título"
                placeholder="Ej. Cuenta de nómina"
                value={draft.title}
                onChangeText={(value) => updateDraft('title', value)}
                onFocus={titleField.onFocus}
                returnKeyType="next"
              />
            </View>

            {draft.category === 'identity' ? (
              <View onLayout={dataField.onLayout}>
                <LineField
                  label="Dato"
                  placeholder="Ej. Número de pasaporte"
                  value={draft.data}
                  onChangeText={(value) => updateDraft('data', value)}
                  onFocus={dataField.onFocus}
                  autoCorrect={false}
                  autoComplete="off"
                  returnKeyType="done"
                />
              </View>
            ) : (
              <>
                <View onLayout={usernameField.onLayout}>
                  <LineField
                    label={credentialUsernameLabel[draft.category]}
                    placeholder={usernamePlaceholder[draft.category]}
                    value={draft.username}
                    onChangeText={(value) => updateDraft('username', value)}
                    onFocus={usernameField.onFocus}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    textContentType="username"
                    returnKeyType="next"
                  />
                </View>

                <View onLayout={passwordField.onLayout}>
                  <LineField
                    label="Contraseña"
                    placeholder="••••••••"
                    value={draft.password}
                    onChangeText={(value) => updateDraft('password', value)}
                    onFocus={passwordField.onFocus}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                  />
                </View>
              </>
            )}

            {errorMessage && <Text className="font-regular text-sm text-ink">{errorMessage}</Text>}
          </ScrollView>

          <View className="px-6 pt-4">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !isValid || isSaving }}
              disabled={!isValid || isSaving}
              onPress={handleSave}
              className={`items-center rounded-full py-4 ${isValid ? 'bg-focus' : 'bg-ink-faint'}`}
            >
              <Text className={`font-title text-base ${isValid ? 'text-focus-text' : 'text-ink-muted'}`}>
                {isSaving ? 'Guardando…' : 'Guardar'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

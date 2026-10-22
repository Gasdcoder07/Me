import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { FormSheet } from '@/components/ui/FormSheet';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { LineField } from '@/components/ui/LineField';
import { credentialUsernameLabel } from '@/components/vault/credentialCategory';
import { createCredential, type NewCredential } from '@/data/credentials';
import { useFieldScroll } from '@/hooks/useKeyboard';
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

export function CredentialFormModal({ visible, onClose, onSaved }: CredentialFormModalProps) {
  const db = useSQLiteContext();
  const [draft, setDraft] = useState<CredentialDraft>(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { scrollRef, fieldProps } = useFieldScroll();
  const titleField = fieldProps('title');
  const usernameField = fieldProps('username');
  const passwordField = fieldProps('password');
  const dataField = fieldProps('data');

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
    <FormSheet
      visible={visible}
      onClose={closeAndReset}
      scrollRef={scrollRef}
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !isValid || isSaving }}
          disabled={!isValid || isSaving}
          onPress={handleSave}
          className="items-center rounded-full py-4 bg-accent"
          style={{ opacity: isValid ? 1 : 0.35 }}
        >
          <Text className="font-title text-base text-on-accent">
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Text>
        </Pressable>
      }
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
    </FormSheet>
  );
}

import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { ItemCard } from '@/components/ui/ItemCard';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { CredentialDetailModal } from '@/components/vault/CredentialDetailModal';
import { credentialCategoryIcon, credentialCategoryLabel } from '@/components/vault/credentialCategory';
import { getCredentialSecret } from '@/data/credentials';
import type { Credential } from '@/types/vault';

type CredentialListProps = {
  credentials: Credential[];
  onDelete: (credential: Credential) => void;
};

type OpenedCredential = {
  credential: Credential;
  secret: string;
};

// Each row opens a centred detail. The secret is never listed here, and it is only read
// from SecureStore after Face ID (or the device passcode) has succeeded.
export function CredentialList({ credentials, onDelete }: CredentialListProps) {
  const [opened, setOpened] = useState<OpenedCredential | null>(null);

  const handleOpen = async (credential: Credential) => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirma tu identidad para ver ${credential.title}`,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (!result.success) return;

      const secret = await getCredentialSecret(credential.id);
      if (secret === null) {
        Alert.alert('Sin datos', 'No encontramos los datos guardados de esta credencial.');
        return;
      }

      setOpened({ credential, secret });
    } catch {
      Alert.alert('No se pudo abrir', 'Inténtalo de nuevo.');
    }
  };

  return (
    <>
      {credentials.length === 0 ? (
        <Text className="font-regular text-base text-ink-muted">No hay elementos en esta categoría.</Text>
      ) : (
        <View className="gap-3">
          {credentials.map((credential) => (
            <SwipeToDelete
              key={credential.id}
              accessibilityLabel={`Borrar ${credential.title}`}
              onDelete={() => onDelete(credential)}
            >
              <ItemCard
                icon={credentialCategoryIcon[credential.category]}
                badge={credentialCategoryLabel[credential.category]}
                title={credential.title}
                chips={credential.category === 'identity' ? [] : [credential.username]}
                accessibilityLabel={`Abrir ${credential.title}`}
                onPress={() => void handleOpen(credential)}
              />
            </SwipeToDelete>
          ))}
        </View>
      )}

      {opened && (
        <CredentialDetailModal
          credential={opened.credential}
          secret={opened.secret}
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
}

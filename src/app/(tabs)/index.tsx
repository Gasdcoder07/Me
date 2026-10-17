import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSQLiteContext } from 'expo-sqlite';

import { CircleButton } from '@/components/ui/CircleButton';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { CredentialFormModal } from '@/components/vault/CredentialFormModal';
import { CredentialList } from '@/components/vault/CredentialList';
import { VaultSummaryBlock } from '@/components/vault/VaultSummaryBlock';
import { deleteCredential } from '@/data/credentials';
import { useCredentials } from '@/hooks/useCredentials';
import { useOwnerName } from '@/hooks/useOwnerName';
import type { Credential, VaultFilter } from '@/types/vault';

const filterOptions: { value: VaultFilter; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'banks', label: 'Bancos' },
  { value: 'access', label: 'Accesos' },
  { value: 'identity', label: 'Identidad' },
];

export default function VaultScreen() {
  const db = useSQLiteContext();
  const ownerName = useOwnerName();
  const { credentials, isLoading, reload } = useCredentials();
  const [filter, setFilter] = useState<VaultFilter>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // The glow behind the summary pauses once the summary has scrolled out of view. A boolean state
  // changes only at that edge, so the screen does not re-render on every scroll frame.
  const [isSummaryOffscreen, setIsSummaryOffscreen] = useState(false);
  const summaryBottom = useRef(0);

  const handleSummaryLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    summaryBottom.current = y + height;
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsSummaryOffscreen(event.nativeEvent.contentOffset.y > summaryBottom.current);
  };

  const visibleCredentials = useMemo(
    () => (filter === 'all' ? credentials : credentials.filter((credential) => credential.category === filter)),
    [credentials, filter],
  );

  const handleDelete = (credential: Credential) => {
    Alert.alert('Eliminar credencial', `¿Eliminar "${credential.title}"? Sus datos protegidos también se borran.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            // Second check after the confirmation: the delete is irreversible, so it needs Face ID / Touch ID again.
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: `Confirma tu identidad para eliminar ${credential.title}`,
              cancelLabel: 'Cancelar',
              disableDeviceFallback: false,
            });
            if (!result.success) return;

            await deleteCredential(db, credential.id);
            await reload();
          } catch {
            Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 140, gap: 32 }}
      >
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="font-regular text-sm text-ink-muted">Hola, {ownerName}</Text>
            {/* pt-2 + line height >= 1.2x font size: keeps the top of the glyphs inside the line box. */}
            <View className="pt-2">
              <Text className="font-display text-ink" style={{ fontSize: 64, lineHeight: 77, letterSpacing: -3 }}>
                Bóveda
              </Text>
            </View>
          </View>
          <CircleButton
            icon="plus"
            label="Agregar credencial"
            variant="solid"
            size={56}
            onPress={() => setIsFormOpen(true)}
          />
        </View>

        <View onLayout={handleSummaryLayout}>
          <VaultSummaryBlock
            count={credentials.length}
            isPaused={isFormOpen || isDetailOpen || isSummaryOffscreen}
          />
        </View>

        <SegmentedToggle options={filterOptions} value={filter} onChange={setFilter} />

        <View className="gap-4">
          <SectionTitle>Elementos</SectionTitle>
          {!isLoading &&
            (credentials.length === 0 ? (
              <Text className="font-regular text-base text-ink-muted">
                Tu bóveda está vacía. Usa + para guardar tu primera credencial.
              </Text>
            ) : (
              <CredentialList
                credentials={visibleCredentials}
                onDelete={handleDelete}
                onDetailOpenChange={setIsDetailOpen}
              />
            ))}
        </View>
      </ScrollView>

      <CredentialFormModal
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={reload}
      />
    </Screen>
  );
}

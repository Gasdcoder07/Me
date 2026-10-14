import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { CategoryFilter } from '@/components/documents/CategoryFilter';
import { DocumentDetailModal } from '@/components/documents/DocumentDetailModal';
import { DocumentFormModal } from '@/components/documents/DocumentFormModal';
import { DocumentList } from '@/components/documents/DocumentList';
import { CircleButton } from '@/components/ui/CircleButton';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { deleteDocument } from '@/data/documents';
import { useDocuments } from '@/hooks/useDocuments';
import { useOwnerName } from '@/hooks/useOwnerName';
import { ALL_DOCUMENTS, type StoredDocument } from '@/types/documents';

export default function FilesScreen() {
  const db = useSQLiteContext();
  const ownerName = useOwnerName();
  const { categories, documents, isLoading, reload } = useDocuments();
  const [filter, setFilter] = useState<string>(ALL_DOCUMENTS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [openedDocument, setOpenedDocument] = useState<StoredDocument | null>(null);

  const visibleDocuments = useMemo(
    () => (filter === ALL_DOCUMENTS ? documents : documents.filter((document) => document.categoryId === filter)),
    [documents, filter],
  );

  const handleDelete = (document: StoredDocument) => {
    Alert.alert('Eliminar documento', `¿Eliminar "${document.name}"? El archivo se borra del dispositivo.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(db, document.id);
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
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 140, gap: 32 }}
      >
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="font-regular text-sm text-ink-muted">Documentos de {ownerName}</Text>
            {/* pt-2 + line height >= 1.2x font size: keeps the top of the glyphs inside the line box. */}
            <View className="pt-2">
              <Text className="font-display text-ink" style={{ fontSize: 64, lineHeight: 77, letterSpacing: -3 }}>
                Archivos
              </Text>
            </View>
          </View>
          <CircleButton
            icon="plus"
            label="Agregar documento"
            variant="solid"
            size={56}
            onPress={() => setIsFormOpen(true)}
          />
        </View>

        <CategoryFilter categories={categories} value={filter} onChange={setFilter} onChanged={reload} />

        <View className="gap-4">
          <SectionTitle>Documentos</SectionTitle>
          {!isLoading &&
            (documents.length === 0 ? (
              <Text className="font-regular text-base text-ink-muted">
                Aún no hay documentos. Usa + para subir el primero.
              </Text>
            ) : visibleDocuments.length === 0 ? (
              <Text className="font-regular text-base text-ink-muted">No hay documentos en esta categoría.</Text>
            ) : (
              <DocumentList
                documents={visibleDocuments}
                categories={categories}
                onOpen={setOpenedDocument}
                onDelete={handleDelete}
              />
            ))}
        </View>
      </ScrollView>

      {openedDocument && (
        <DocumentDetailModal
          document={openedDocument}
          categoryName={categories.find((category) => category.id === openedDocument.categoryId)?.name ?? ''}
          onClose={() => setOpenedDocument(null)}
        />
      )}

      <DocumentFormModal
        visible={isFormOpen}
        categories={categories}
        onClose={() => setIsFormOpen(false)}
        onChanged={reload}
      />
    </Screen>
  );
}

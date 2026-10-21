import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSQLiteContext } from 'expo-sqlite';

import { Icon } from '@/components/icons/Icon';
import { FormSheet } from '@/components/ui/FormSheet';
import { LineField } from '@/components/ui/LineField';
import { createDocumentCategory, importDocument } from '@/data/documents';
import { useFieldScroll } from '@/hooks/useKeyboard';
import { useTheme } from '@/theme/ThemeProvider';
import type { DocumentCategory } from '@/types/documents';

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string | null;
};

type DocumentFormModalProps = {
  visible: boolean;
  categories: DocumentCategory[];
  onClose: () => void;
  // Runs after a document or a category is written, so the screen can refresh its data.
  onChanged: () => Promise<void>;
};

// Bottom-sheet form. Name, file and category; categories can be created inline.
export function DocumentFormModal({ visible, categories, onClose, onChanged }: DocumentFormModalProps) {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValid = name.trim() !== '' && pickedFile !== null && categoryId !== null;

  const closeAndReset = () => {
    setName('');
    setPickedFile(null);
    setCategoryId(null);
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setErrorMessage(null);
    onClose();
  };

  const handlePickFile = async () => {
    setErrorMessage(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      setPickedFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? null });

      // Pre-fill the name from the file, without its extension, if the user has not typed one yet.
      if (name.trim() === '') setName(asset.name.replace(/\.[^.]+$/, ''));
    } catch {
      setErrorMessage('No se pudo abrir el archivo. Inténtalo de nuevo.');
    }
  };

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (trimmed === '') return;

    try {
      const category = await createDocumentCategory(db, trimmed);
      await onChanged();
      setCategoryId(category.id);
      setNewCategoryName('');
      setIsCreatingCategory(false);
    } catch {
      setErrorMessage('No se pudo crear la categoría. Inténtalo de nuevo.');
    }
  };

  const handleSave = async () => {
    if (!isValid || !pickedFile || !categoryId || isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await importDocument(db, {
        name: name.trim(),
        categoryId,
        sourceUri: pickedFile.uri,
        sourceName: pickedFile.name,
        mimeType: pickedFile.mimeType,
      });
      await onChanged();
      closeAndReset();
    } catch {
      setErrorMessage('No se pudo guardar el documento. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const { scrollRef, fieldProps, scrollToEnd } = useFieldScroll();
  const nameField = fieldProps('name');

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
          className={`items-center rounded-full py-4 ${isValid ? 'bg-focus' : 'bg-ink-faint'}`}
        >
          <Text className={`font-title text-base ${isValid ? 'text-focus-text' : 'text-ink-muted'}`}>
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Text>
        </Pressable>
      }
    >
      <View className="pt-2">
        <Text className="font-display text-ink" style={{ fontSize: 48, lineHeight: 58, letterSpacing: -2 }}>
          Nuevo documento
        </Text>
      </View>

      <View className="gap-3">
        <Text className="font-medium text-xs uppercase text-ink-muted">Archivo</Text>
        <Pressable
          accessibilityRole="button"
          onPress={handlePickFile}
          className="flex-row items-center gap-3 rounded-card border border-ink-faint p-4"
        >
          <Icon name="files" size={22} color={colors.ink} />
          <Text className="flex-1 font-regular text-base text-ink" numberOfLines={1}>
            {pickedFile ? pickedFile.name : 'Seleccionar PDF o foto'}
          </Text>
        </Pressable>
      </View>

      <View onLayout={nameField.onLayout}>
        <LineField
          label="Nombre"
          placeholder="Ej. INE frente"
          value={name}
          onChangeText={setName}
          onFocus={nameField.onFocus}
          returnKeyType="done"
        />
      </View>

      <View className="gap-3">
        <Text className="font-medium text-xs uppercase text-ink-muted">Tipo</Text>
        <View className="flex-row flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = categoryId === category.id;

            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setCategoryId(category.id)}
                className={`rounded-full border px-4 py-2 ${isSelected ? 'border-focus bg-focus' : 'border-ink-faint'}`}
              >
                <Text className={`font-medium text-sm ${isSelected ? 'text-focus-text' : 'text-ink-muted'}`}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            accessibilityRole="button"
            onPress={() => setIsCreatingCategory((current) => !current)}
            className="rounded-full border border-ink-muted px-4 py-2"
            style={{ borderStyle: 'dashed' }}
          >
            <Text className="font-medium text-sm text-ink-muted">+ Nueva</Text>
          </Pressable>
        </View>

        {isCreatingCategory && (
          <View className="flex-row items-end gap-3">
            <View className="flex-1">
              <LineField
                label="Nueva categoría"
                placeholder="Ej. Salud"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                onFocus={scrollToEnd}
                returnKeyType="done"
                onSubmitEditing={handleCreateCategory}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: newCategoryName.trim() === '' }}
              disabled={newCategoryName.trim() === ''}
              onPress={handleCreateCategory}
              className="mb-1 rounded-full bg-focus px-5 py-3"
              style={{ opacity: newCategoryName.trim() === '' ? 0.4 : 1 }}
            >
              <Text className="font-title text-sm text-focus-text">Crear</Text>
            </Pressable>
          </View>
        )}
      </View>

      {errorMessage && <Text className="font-regular text-sm text-ink">{errorMessage}</Text>}
    </FormSheet>
  );
}

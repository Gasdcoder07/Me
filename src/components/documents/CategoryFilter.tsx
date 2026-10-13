import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';

import { Icon } from '@/components/icons/Icon';
import { LineField } from '@/components/ui/LineField';
import { colors, radii } from '@/constants/theme';
import { useKeyboardHeight } from '@/hooks/useKeyboard';
import {
  countDocumentsInCategory,
  createDocumentCategory,
  deleteDocumentCategory,
  isBuiltinCategory,
} from '@/data/documents';
import { ALL_DOCUMENTS, type DocumentCategory } from '@/types/documents';

type CategoryFilterProps = {
  categories: DocumentCategory[];
  value: string;
  onChange: (value: string) => void;
  // Runs after a category is created or deleted, so the screen can refresh its data.
  onChanged: () => Promise<void>;
};

// Fixed row on top of the list: "Todo", the two built-in categories, and a fourth
// slot with a dropdown that holds every custom category. The dropdown also creates and
// deletes them. The active pill is a solid block.
export function CategoryFilter({ categories, value, onChange, onChanged }: CategoryFilterProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const builtinCategories = categories.filter((category) => isBuiltinCategory(category.id));
  const customCategories = categories.filter((category) => !isBuiltinCategory(category.id));
  const selectedCustom = customCategories.find((category) => category.id === value);

  return (
    <>
      <View className="flex-row flex-wrap gap-2">
        <FilterPill label="Todo" isActive={value === ALL_DOCUMENTS} onPress={() => onChange(ALL_DOCUMENTS)} />

        {builtinCategories.map((category) => (
          <FilterPill
            key={category.id}
            label={category.name}
            isActive={value === category.id}
            onPress={() => onChange(category.id)}
          />
        ))}

        <FilterPill
          label={selectedCustom ? selectedCustom.name : 'Más'}
          isActive={selectedCustom !== undefined}
          trailing
          onPress={() => setIsMenuOpen(true)}
        />
      </View>

      <CategoryMenu
        visible={isMenuOpen}
        customCategories={customCategories}
        value={value}
        onSelect={(categoryId) => {
          onChange(categoryId);
          setIsMenuOpen(false);
        }}
        onCreated={async (category) => {
          await onChanged();
          onChange(category.id);
          setIsMenuOpen(false);
        }}
        onDeleted={async (categoryId) => {
          if (value === categoryId) onChange(ALL_DOCUMENTS);
          await onChanged();
        }}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}

type FilterPillProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
  trailing?: boolean;
};

function FilterPill({ label, isActive, onPress, trailing = false }: FilterPillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      className={`flex-row items-center gap-1 rounded-full border px-4 py-2 ${
        isActive ? 'border-focus bg-focus' : 'border-ink-faint'
      }`}
    >
      <Text className={`font-medium text-sm ${isActive ? 'text-focus-text' : 'text-ink-muted'}`}>{label}</Text>
      {trailing && (
        <Icon name="chevron" size={16} color={isActive ? colors.focusText : colors.inkMuted} />
      )}
    </Pressable>
  );
}

type CategoryMenuProps = {
  visible: boolean;
  customCategories: DocumentCategory[];
  value: string;
  onSelect: (categoryId: string) => void;
  onCreated: (category: DocumentCategory) => Promise<void>;
  onDeleted: (categoryId: string) => Promise<void>;
  onClose: () => void;
};

// Bottom sheet with every custom category. Rows filter the list or can be deleted.
// "Nueva categoría" switches the same sheet to a name field, so only one modal is ever open.
function CategoryMenu({
  visible,
  customCategories,
  value,
  onSelect,
  onCreated,
  onDeleted,
  onClose,
}: CategoryMenuProps) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  // The keyboard only adds bottom padding, so the sheet clears it without the backdrop or the screen moving.
  const sheetStyle = useAnimatedStyle(
    () => ({ paddingBottom: Math.max(insets.bottom, keyboard.value) + 24 }),
    [insets.bottom, keyboard],
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isNameValid = newName.trim() !== '';

  const resetCreate = () => {
    setIsCreating(false);
    setNewName('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetCreate();
    onClose();
  };

  const handleCreate = async () => {
    if (!isNameValid || isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const category = await createDocumentCategory(db, newName.trim());
      resetCreate();
      await onCreated(category);
    } catch {
      setErrorMessage('No se pudo crear la categoría. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async (category: DocumentCategory) => {
    try {
      const documentCount = await countDocumentsInCategory(db, category.id);
      const message =
        documentCount === 0
          ? 'La categoría se eliminará.'
          : `También se eliminarán sus ${documentCount} ${documentCount === 1 ? 'documento' : 'documentos'}. Esta acción no se puede deshacer.`;

      Alert.alert(`Eliminar "${category.name}"`, message, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocumentCategory(db, category.id);
              await onDeleted(category.id);
            } catch {
              Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.');
            }
          },
        },
      ]);
    } catch {
      Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(10, 10, 10, 0.35)' }}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" onPress={handleClose} />

        <Animated.View
          className="gap-2 bg-canvas px-6 pt-6"
          style={[{ borderTopLeftRadius: radii.screen, borderTopRightRadius: radii.screen }, sheetStyle]}
        >
          {isCreating ? (
            <>
              <Text className="font-medium text-xs uppercase text-ink-muted">Nueva categoría</Text>
              <View className="pb-2">
                <LineField
                  label="Nombre"
                  placeholder="Ej. Salud"
                  value={newName}
                  onChangeText={setNewName}
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                  autoFocus
                />
              </View>

              {errorMessage && <Text className="font-regular text-sm text-ink">{errorMessage}</Text>}

              <View className="flex-row items-center justify-between pt-2">
                <Pressable accessibilityRole="button" hitSlop={12} onPress={resetCreate}>
                  <Text className="font-medium text-base text-ink-muted">Volver</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !isNameValid || isSaving }}
                  disabled={!isNameValid || isSaving}
                  onPress={handleCreate}
                  className={`rounded-full px-6 py-3 ${isNameValid ? 'bg-focus' : 'bg-ink-faint'}`}
                >
                  <Text className={`font-title text-sm ${isNameValid ? 'text-focus-text' : 'text-ink-muted'}`}>
                    {isSaving ? 'Guardando…' : 'Guardar'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text className="font-medium text-xs uppercase text-ink-muted">Mis categorías</Text>

              {customCategories.length === 0 && (
                <Text className="py-4 font-regular text-base text-ink-muted">Aún no tienes categorías propias.</Text>
              )}

              {customCategories.map((category) => {
                const isSelected = value === category.id;

                return (
                  <View key={category.id} className="flex-row items-center gap-3 py-2">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => onSelect(category.id)}
                      className="flex-1 flex-row items-center gap-3 py-2"
                    >
                      <View
                        className={`h-3 w-3 rounded-full ${isSelected ? 'bg-focus' : ''}`}
                        style={isSelected ? undefined : { borderWidth: 1.5, borderColor: colors.inkFaint }}
                      />
                      <Text
                        className={`flex-1 font-title text-lg ${isSelected ? 'text-ink' : 'text-ink-muted'}`}
                        numberOfLines={1}
                      >
                        {category.name}
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${category.name}`}
                      hitSlop={12}
                      onPress={() => confirmDelete(category)}
                    >
                      <Icon name="trash" size={20} color={colors.inkMuted} />
                    </Pressable>
                  </View>
                );
              })}

              <Pressable
                accessibilityRole="button"
                onPress={() => setIsCreating(true)}
                className="mt-2 flex-row items-center gap-3 border-t border-ink-faint py-4"
              >
                <Icon name="plus" size={20} color={colors.ink} />
                <Text className="font-title text-base text-ink">Nueva categoría</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

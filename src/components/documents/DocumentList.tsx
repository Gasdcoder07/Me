import { memo } from 'react';
import { View } from 'react-native';

import { type IconName } from '@/components/icons/Icon';
import { ItemCard } from '@/components/ui/ItemCard';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { BUILTIN_CATEGORY_IDS } from '@/data/documents';
import { type StoredDocument } from '@/types/documents';

const categoryIcon: Record<string, IconName> = {
  [BUILTIN_CATEGORY_IDS.identification]: 'id',
  [BUILTIN_CATEGORY_IDS.school]: 'book',
};

type DocumentListProps = {
  documents: StoredDocument[];
  onOpen: (document: StoredDocument) => void;
  onDelete: (document: StoredDocument) => void;
};

// Cards sit inside the screen gutter the Files screen already provides.
export function DocumentList({ documents, onOpen, onDelete }: DocumentListProps) {
  return (
    <View className="gap-3">
      {documents.map((document) => (
        <DocumentRow
          key={document.id}
          document={document}
          icon={categoryIcon[document.categoryId] ?? 'files'}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

type DocumentRowProps = {
  document: StoredDocument;
  icon: IconName;
  onOpen: (document: StoredDocument) => void;
  onDelete: (document: StoredDocument) => void;
};

// Memoized: rows only re-render when their own document changes.
const DocumentRow = memo(function DocumentRow({
  document,
  icon,
  onOpen,
  onDelete,
}: DocumentRowProps) {
  return (
    <SwipeToDelete accessibilityLabel={`Borrar ${document.name}`} onDelete={() => onDelete(document)}>
      <ItemCard
        icon={icon}
        title={document.name}
        chips={[]}
        large
        accessibilityLabel={`Abrir ${document.name}`}
        onPress={() => onOpen(document)}
      />
    </SwipeToDelete>
  );
});

import { View } from 'react-native';

import { type IconName } from '@/components/icons/Icon';
import { ItemCard } from '@/components/ui/ItemCard';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { colors } from '@/constants/theme';
import { BUILTIN_CATEGORY_IDS } from '@/data/documents';
import { type DocumentCategory, type StoredDocument, isPdfDocument } from '@/types/documents';

const categoryIcon: Record<string, IconName> = {
  [BUILTIN_CATEGORY_IDS.identification]: 'id',
  [BUILTIN_CATEGORY_IDS.school]: 'book',
};

type DocumentListProps = {
  documents: StoredDocument[];
  categories: DocumentCategory[];
  onOpen: (document: StoredDocument) => void;
  onDelete: (document: StoredDocument) => void;
};

// Same node-and-line rhythm as the vault rows: each card links to the next by a dashed line.
export function DocumentList({ documents, categories, onOpen, onDelete }: DocumentListProps) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <View>
      {documents.map((document, index) => (
        <DocumentRow
          key={document.id}
          document={document}
          icon={categoryIcon[document.categoryId] ?? 'files'}
          categoryName={categoryNames.get(document.categoryId) ?? ''}
          isLast={index === documents.length - 1}
          onOpen={() => onOpen(document)}
          onDelete={() => onDelete(document)}
        />
      ))}
    </View>
  );
}

type DocumentRowProps = {
  document: StoredDocument;
  icon: IconName;
  categoryName: string;
  isLast: boolean;
  onOpen: () => void;
  onDelete: () => void;
};

function DocumentRow({ document, icon, categoryName, isLast, onOpen, onDelete }: DocumentRowProps) {
  return (
    <View className="flex-row">
      <View className="w-5 items-center">
        <View
          className="mt-6 h-3 w-3 rounded-full bg-canvas"
          style={{ borderWidth: 1.5, borderColor: colors.ink }}
        />
        {!isLast && (
          <View
            className="mt-1 flex-1"
            style={{ width: 1, borderLeftWidth: 1, borderStyle: 'dashed', borderColor: colors.inkFaint }}
          />
        )}
      </View>

      <View className="mb-3 ml-3 flex-1">
        <SwipeToDelete accessibilityLabel={`Borrar ${document.name}`} onDelete={onDelete}>
          <ItemCard
            icon={icon}
            badge={categoryName}
            title={document.name}
            chips={[isPdfDocument(document) ? 'PDF' : 'Imagen']}
            accessibilityLabel={`Abrir ${document.name}`}
            onPress={onOpen}
          />
        </SwipeToDelete>
      </View>
    </View>
  );
}

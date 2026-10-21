import { Image, Text, View } from 'react-native';
import type WebViewComponent from 'react-native-webview';

import { CenteredModal } from '@/components/ui/CenteredModal';
import { DetailField } from '@/components/ui/DetailField';
import { Tag } from '@/components/ui/Tag';
import { useTheme } from '@/theme/ThemeProvider';
import { documentFileUri, documentsDirectoryUri } from '@/data/documents';
import type { StoredDocument } from '@/types/documents';
import { isPdfDocument } from '@/types/documents';
import { formatLongDay } from '@/utils/dates';

// Height of the cover viewer. Tall enough to read a page header, short enough to keep the panel on screen.
const VIEWER_HEIGHT = 360;

type DocumentDetailModalProps = {
  document: StoredDocument;
  categoryName: string;
  onClose: () => void;
};

// The top block is the document's cover: the first page of a PDF, or the picture itself.
export function DocumentDetailModal({ document, categoryName, onClose }: DocumentDetailModalProps) {
  const { colors } = useTheme();
  const isPdf = isPdfDocument(document);

  return (
    <CenteredModal onClose={onClose}>
      <View className="overflow-hidden rounded-block" style={{ height: VIEWER_HEIGHT, backgroundColor: colors.chip }}>
        <CoverViewer uri={documentFileUri(document.fileName)} isPdf={isPdf} name={document.name} />
      </View>

      {/* pt-2 + line height >= 1.2x font size: keeps the top of the glyphs inside the line box. */}
      <View className="gap-3 pt-2">
        <Text
          className="font-display text-ink"
          style={{ fontSize: 36, lineHeight: 42, letterSpacing: -1.5 }}
          numberOfLines={2}
        >
          {document.name}
        </Text>

        <View className="flex-row flex-wrap gap-2">
          <Tag label={categoryName} />
          <Tag label={isPdf ? 'PDF' : 'Imagen'} />
        </View>
      </View>

      <DetailField label="Agregado" value={formatLongDay(new Date(document.createdAt))} />
    </CenteredModal>
  );
}

type CoverViewerProps = {
  uri: string;
  isPdf: boolean;
  name: string;
};

// react-native-webview needs a native module that older builds do not contain, and importing it throws.
// It is loaded inside try/catch at module scope: a missing module leaves WebView null, and the PDF
// branch shows a hint instead of breaking the whole Files screen.
const WebView = loadWebView();

function loadWebView(): typeof WebViewComponent | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-webview').default as typeof WebViewComponent;
  } catch {
    return null;
  }
}

// WebView renders PDFs on iOS from a local file. The read scope is the documents folder, so the
// viewer cannot reach anything else on the device. Android WebView does not draw PDFs inline.
function CoverViewer({ uri, isPdf, name }: CoverViewerProps) {
  if (isPdf) {
    if (!WebView) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center font-regular text-sm text-ink-muted">
            La vista previa de PDF necesita reconstruir la app una vez.
          </Text>
        </View>
      );
    }

    return (
      <WebView
        source={{ uri }}
        originWhitelist={['file://*']}
        allowingReadAccessToURL={documentsDirectoryUri()}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      resizeMode="contain"
      accessibilityLabel={`Portada de ${name}`}
      style={{ flex: 1 }}
    />
  );
}

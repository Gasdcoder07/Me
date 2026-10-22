import { Alert, Image, Text, View } from 'react-native';
import type * as ExpoSharing from 'expo-sharing';
import type WebViewComponent from 'react-native-webview';

import { CenteredModal } from '@/components/ui/CenteredModal';
import { CircleButton } from '@/components/ui/CircleButton';
import { DetailField } from '@/components/ui/DetailField';
import { Tag } from '@/components/ui/Tag';
import { useTheme } from '@/theme/ThemeProvider';
import { documentFileUri, documentsDirectoryUri } from '@/data/documents';
import type { StoredDocument } from '@/types/documents';
import { isPdfDocument } from '@/types/documents';
import { formatLongDay } from '@/utils/dates';

// Side of the square cover viewer. The whole picture fits inside it, and the modal never stretches it.
const PREVIEW_SIZE = 240;

type DocumentDetailModalProps = {
  document: StoredDocument;
  categoryName: string;
  onClose: () => void;
};

// The top block is the document's cover: the first page of a PDF, or the picture itself.
export function DocumentDetailModal({ document, categoryName, onClose }: DocumentDetailModalProps) {
  const { colors } = useTheme();
  const isPdf = isPdfDocument(document);
  const uri = documentFileUri(document.fileName);

  // Opens the system share sheet, where the file can be saved to the Files app.
  const handleDownload = async () => {
    if (!sharing) {
      Alert.alert('Descarga no disponible', 'Reconstruye la app una vez para activar la descarga.');
      return;
    }

    try {
      await sharing.shareAsync(uri, {
        mimeType: document.mimeType ?? undefined,
        UTI: isPdf ? 'com.adobe.pdf' : 'public.image',
        dialogTitle: document.name,
      });
    } catch {
      Alert.alert('No se pudo descargar', 'Inténtalo de nuevo.');
    }
  };

  return (
    <CenteredModal onClose={onClose}>
      <View
        className="overflow-hidden rounded-block"
        style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, alignSelf: "center", backgroundColor: colors.chip }}
      >
        <CoverViewer uri={uri} isPdf={isPdf} name={document.name} />
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

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row flex-wrap gap-2">
            <Tag label={categoryName} />
            <Tag label={isPdf ? 'PDF' : 'Imagen'} />
          </View>
          <CircleButton icon="download" label="Descargar documento" variant="solid" size={48} onPress={handleDownload} />
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

// expo-sharing is a native module too. Builds made before it was added do not contain it, and importing it throws,
// so it is loaded the same way as WebView: a missing module leaves sharing null and the download button explains why.
const sharing = loadSharing();

function loadSharing(): typeof ExpoSharing | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-sharing') as typeof ExpoSharing;
  } catch {
    return null;
  }
}

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

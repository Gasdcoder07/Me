import { useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import type * as ExpoSharing from 'expo-sharing';
import type WebViewComponent from 'react-native-webview';

import { CenteredModal } from '@/components/ui/CenteredModal';
import { CircleButton } from '@/components/ui/CircleButton';
import { DetailField } from '@/components/ui/DetailField';
import { Tag } from '@/components/ui/Tag';
import { useTheme } from '@/theme/ThemeProvider';
import { closeDocumentFile, decryptedDirectoryUri, openDocumentFile } from '@/data/documents';
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

  // Re-checks the user, then opens the share sheet with a plain copy. The stored document is never changed,
  // and the copy is deleted as soon as the sheet closes.
  const handleDownload = async () => {
    if (!sharing) {
      Alert.alert('Descarga no disponible', 'Reconstruye la app una vez para activar la descarga.');
      return;
    }

    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma para compartir el documento',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (!auth.success) return;

      const file = await openDocumentFile(document, 'share');
      await sharing.shareAsync(file.uri, {
        mimeType: document.mimeType ?? undefined,
        UTI: isPdf ? 'com.adobe.pdf' : 'public.image',
        dialogTitle: document.name,
      });
    } catch {
      Alert.alert('No se pudo descargar', 'Inténtalo de nuevo.');
    } finally {
      closeDocumentFile(document, 'share');
    }
  };

  return (
    <CenteredModal onClose={onClose}>
      <View
        className="overflow-hidden rounded-block"
        style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, alignSelf: "center", backgroundColor: colors.chip }}
      >
        <CoverViewer document={document} isPdf={isPdf} />
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
  document: StoredDocument;
  isPdf: boolean;
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

// The plain copy is made when the viewer mounts and deleted when it unmounts. Nothing is rendered from
// the sealed file directly. WebView renders PDFs on iOS from that copy, and its read scope is the copy folder only.
// Android WebView does not draw PDFs inline.
function CoverViewer({ document, isPdf }: CoverViewerProps) {
  const [uri, setUri] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    openDocumentFile(document, 'preview')
      .then((file) => {
        // The viewer closed before the copy was ready, so the copy is removed right away.
        if (isMounted) setUri(file.uri);
        else closeDocumentFile(document, 'preview');
      })
      .catch(() => {
        if (isMounted) setHasFailed(true);
      });

    return () => {
      isMounted = false;
      closeDocumentFile(document, 'preview');
    };
  }, [document]);

  if (hasFailed) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center font-regular text-sm text-ink-muted">No se pudo abrir el documento.</Text>
      </View>
    );
  }

  // Blank until the copy is ready. The read is local and fast, so no spinner is shown.
  if (uri === null) return <View style={{ flex: 1 }} />;

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
        allowingReadAccessToURL={decryptedDirectoryUri()}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      resizeMode="contain"
      accessibilityLabel={`Portada de ${document.name}`}
      style={{ flex: 1 }}
    />
  );
}

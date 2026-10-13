export type DocumentCategory = {
  id: string;
  name: string;
};

// The file itself lives in the app's document directory. The row keeps only its
// name, so the path is resolved at read time and survives container changes.
export type StoredDocument = {
  id: string;
  name: string;
  categoryId: string;
  fileName: string;
  mimeType: string | null;
  createdAt: number;
};

// Sentinel for the "Todo" filter. Any other value is a category id.
export const ALL_DOCUMENTS = 'all';

// The picker only admits PDFs and images, so anything that is not a PDF is shown as an image.
export function isPdfDocument(document: StoredDocument): boolean {
  return document.mimeType === 'application/pdf' || document.fileName.toLowerCase().endsWith('.pdf');
}

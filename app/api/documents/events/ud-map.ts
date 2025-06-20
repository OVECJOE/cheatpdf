// User-Document mapping for SSE events
// This file manages the mapping between document IDs and user IDs for real-time progress updates

const documentUserMap = new Map<string, string>();

/**
 * Register a document-user mapping for SSE events
 * @param documentId - The document ID
 * @param userId - The user ID
 */
export function registerDocumentUser(documentId: string, userId: string): void {
  documentUserMap.set(documentId, userId);
  console.log(`Registered document ${documentId} for user ${userId}`);
}

/**
 * Get the user ID associated with a document ID
 * @param documentId - The document ID
 * @returns The user ID or undefined if not found
 */
export function getDocumentUser(documentId: string): string | undefined {
  return documentUserMap.get(documentId);
}

/**
 * Unregister a document-user mapping
 * @param documentId - The document ID
 */
export function unregisterDocumentUser(documentId: string): void {
  const userId = documentUserMap.get(documentId);
  if (userId) {
    documentUserMap.delete(documentId);
    console.log(`Unregistered document ${documentId} for user ${userId}`);
  }
}

/**
 * Get all document-user mappings
 * @returns Array of [documentId, userId] pairs
 */
export function allDocumentUserEntries(): [string, string][] {
  return Array.from(documentUserMap.entries());
}

/**
 * Get all documents for a specific user
 * @param userId - The user ID
 * @returns Array of document IDs
 */
export function getDocumentsForUser(userId: string): string[] {
  const documents: string[] = [];
  for (const [docId, mappedUserId] of documentUserMap.entries()) {
    if (mappedUserId === userId) {
      documents.push(docId);
    }
  }
  return documents;
}

/**
 * Clear all mappings for a user (useful when user disconnects)
 * @param userId - The user ID
 */
export function clearUserMappings(userId: string): void {
  const documentsToRemove: string[] = [];
  for (const [docId, mappedUserId] of documentUserMap.entries()) {
    if (mappedUserId === userId) {
      documentsToRemove.push(docId);
    }
  }
  
  documentsToRemove.forEach(docId => {
    documentUserMap.delete(docId);
  });
  
  if (documentsToRemove.length > 0) {
    console.log(`Cleared ${documentsToRemove.length} document mappings for user ${userId}`);
  }
} 
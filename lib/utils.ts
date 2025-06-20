import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);
}

export const getStageDisplayName = (stage: string): string => {
  switch (stage) {
    case 'VALIDATING':
      return 'Validating PDF file...';
    case 'PDF_PARSE':
      return 'Extracting text from PDF...';
    case 'PDF_LOADER':
      return 'Loading PDF content...';
    case 'PER_PAGE':
      return 'Processing with OCR...';
    case 'CHUNKING':
      return 'Splitting into chunks...';
    case 'VECTORIZING':
      return 'Creating searchable vectors...';
    default:
      return stage || 'Processing...';
  }
};
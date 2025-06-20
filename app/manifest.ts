import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CheatPDF - AI-Powered Study Assistant',
    short_name: 'CheatPDF',
    description: 'Transform your PDFs into smart study partners. Chat with documents, generate practice exams, and study smarter with AI.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    categories: ['education', 'productivity', 'utilities'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
      {
        src: '/favicon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/favicon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'Upload Document',
        short_name: 'Upload',
        description: 'Upload a new PDF document',
        url: '/dashboard/upload',
        icons: [
          {
            src: '/file.svg',
            sizes: '96x96'
          }
        ]
      },
      {
        name: 'My Documents',
        short_name: 'Documents',
        description: 'View your uploaded documents',
        url: '/dashboard/documents',
        icons: [
          {
            src: '/window.svg',
            sizes: '96x96'
          }
        ]
      },
      {
        name: 'Create Exam',
        short_name: 'Exam',
        description: 'Generate a practice exam',
        url: '/dashboard/exams/new',
        icons: [
          {
            src: '/globe.svg',
            sizes: '96x96'
          }
        ]
      }
    ]
  }
} 
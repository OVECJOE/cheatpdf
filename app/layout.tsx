import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/sw-registration";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cheatpdf.live'),
  title: {
    default: "CheatPDF - AI-Powered Study Assistant | Chat with PDFs & Generate Exams",
    template: "%s | CheatPDF"
  },
  description: "Transform your PDFs into smart study partners. Chat with documents, generate practice exams, and study smarter with AI. Perfect for students, researchers, and professionals. Upload PDFs and get instant answers, summaries, and personalized practice tests.",
  keywords: [
    "AI study assistant",
    "PDF chat",
    "document analysis",
    "practice exams",
    "study tools",
    "AI tutor",
    "PDF to quiz",
    "document summarization",
    "study materials",
    "exam preparation",
    "AI learning",
    "PDF reader",
    "study partner",
    "academic AI",
    "document processing",
    "smart study",
    "AI education",
    "PDF analysis",
    "study help",
    "exam practice"
  ],
  authors: [{ name: "CheatPDF Team" }],
  creator: "CheatPDF",
  publisher: "CheatPDF",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cheatpdf.live",
    siteName: "CheatPDF",
    title: "CheatPDF - AI-Powered Study Assistant | Chat with PDFs & Generate Exams",
    description: "Transform your PDFs into smart study partners. Chat with documents, generate practice exams, and study smarter with AI. Perfect for students, researchers, and professionals.",
    images: [
      {
        url: "https://cheatpdf.live/og-image.png",
        width: 1200,
        height: 630,
        alt: "CheatPDF - AI-Powered Study Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CheatPDF - AI-Powered Study Assistant | Chat with PDFs & Generate Exams",
    description: "Transform your PDFs into smart study partners. Chat with documents, generate practice exams, and study smarter with AI.",
    images: ["https://cheatpdf.live/og-image.png"],
    creator: "@cheatpdf",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: "https://cheatpdf.live",
  },
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-lt-installed="true">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "CheatPDF",
              "description": "AI-powered study assistant that transforms PDFs into interactive learning experiences",
              "url": "https://cheatpdf.live",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free tier available with premium features"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1250",
                "bestRating": "5",
                "worstRating": "1"
              },
              "author": {
                "@type": "Organization",
                "name": "CheatPDF",
                "url": "https://cheatpdf.live"
              },
              "featureList": [
                "AI Chat with PDFs",
                "Practice Exam Generation",
                "Document Summarization",
                "Smart Study Tools"
              ]
            })
          }}
        />
        
        {/* Structured Data for FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How does CheatPDF work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CheatPDF uses advanced AI to analyze your PDF documents, extract key information, and create interactive study experiences. You can chat with your documents, generate practice exams, and get instant answers to your questions."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What file types does CheatPDF support?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Currently, CheatPDF supports PDF files up to 100MB. We're working on adding support for more document formats in the future."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is CheatPDF free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! CheatPDF offers a free tier that allows you to upload up to 5 documents and chat with them. Premium features like unlimited documents and practice exam generation are available with a subscription."
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-center"
            richColors
            closeButton
            expand
            duration={3000}
          />
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
}

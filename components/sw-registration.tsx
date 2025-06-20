"use client";

import { useEffect } from 'react';

// Global variable to store the install prompt event
declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      // Listen for the beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e as BeforeInstallPromptEvent;
        window.dispatchEvent(new CustomEvent('installPromptAvailable'));
      });

      // Listen for successful installation
      window.addEventListener('appinstalled', () => {
        window.deferredPrompt = null;
        window.dispatchEvent(new CustomEvent('appInstalled'));
      });

      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker updated and activated');
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'SKIP_WAITING':
            // Handle skip waiting if needed
            break;
          case 'CACHE_UPDATED':
            console.log('Cache updated:', data);
            break;
          default:
            // Handle other message types
            break;
        }
      });
    }
  }, []);

  return null;
} 
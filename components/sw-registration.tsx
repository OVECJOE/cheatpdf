"use client";

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

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
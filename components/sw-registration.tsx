"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function ServiceWorkerRegistration() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none'
        })
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  if (isDevelopment) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          if (isDevelopment) {
            console.warn('Service Worker registration failed:', error);
          }
        });

      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Send session key to service worker when authenticated and ready
  useEffect(() => {
    async function sendSessionKeyToSW() {
      if (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        session?.user?.id &&
        navigator.serviceWorker.controller
      ) {
        // Derive a 32-byte key from user id (SHA-256, base64)
        const enc = new TextEncoder().encode(session.user.id);
        const hash = await window.crypto.subtle.digest('SHA-256', enc);
        const base64Key = btoa(String.fromCharCode(...new Uint8Array(hash)));
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_SESSION_KEY',
          key: base64Key,
        });
      }
    }
    if (status === 'authenticated') {
      sendSessionKeyToSW();
    }
  }, [session?.user?.id, status]);

  return null;
} 
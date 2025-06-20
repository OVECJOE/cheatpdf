"use client";

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Check if we're in development
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // Register service worker
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none' // Always check for updates
        })
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('New service worker available');
                  // In development, reload immediately
                  if (isDevelopment) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
          
          // In development, provide more detailed error information
          if (isDevelopment) {
            console.error('Service Worker Error Details:', {
              error: error.message,
              stack: error.stack,
              name: error.name
            });
          }
        });

      // Handle service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        // Only reload in production to avoid development reload loops
        if (!isDevelopment) {
          window.location.reload();
        }
      });

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch((error) => {
          console.warn('Failed to request notification permission:', error);
        });
      }
    } else {
      console.log('Service Worker not supported in this browser');
    }
  }, []);

  return null; // This component doesn't render anything
} 
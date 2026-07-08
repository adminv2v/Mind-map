export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export const setupPWAInstallPrompt = (callback: (event: BeforeInstallPromptEvent) => void) => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    callback(deferredPrompt);
  });
};

export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;

  return outcome === 'accepted';
};

export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

export const detectPlatform = (): 'windows' | 'android' | 'macos' | 'ios' | 'other' => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }

  if (/android/.test(userAgent)) {
    return 'android';
  }

  if (/mac/.test(platform)) {
    return 'macos';
  }

  if (/win/.test(platform)) {
    return 'windows';
  }

  return 'other';
};

export const registerServiceWorker = (_onUpdateAvailable: () => void) => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter((name) => name.startsWith('mindmap-pro-'))
              .map((name) => caches.delete(name))
          );
        }
      } catch (error) {
        // Service Worker not supported or failed to register
        // This is OK - the app works as a normal website without offline caching.
        const message = error instanceof Error ? error.message : String(error);
        console.log('Service Worker not available:', message);
      }
    });
  }
};

export const activateUpdate = () => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
};

// Service Worker registration for PWA support

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('🆕 Nueva versión disponible');
                  
                  // Optionally prompt user to reload
                  if (confirm('Hay una nueva versión disponible. ¿Recargar ahora?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('❌ Error al registrar Service Worker:', error);
        });
    });
  } else {
    console.log('⚠️ Service Workers no soportados en este navegador');
  }
}

// Handle installation prompt
let deferredPrompt: any = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    console.log('📱 PWA instalable');
    
    // Optionally show custom install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalada');
    deferredPrompt = null;
    
    // Hide install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
    
    // Optional: Track installation
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_installed', {
        event_category: 'engagement',
        event_label: 'PWA Installation'
      });
    }
  });
}

export function promptInstall() {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Usuario aceptó instalar PWA');
      } else {
        console.log('❌ Usuario rechazó instalar PWA');
      }
      deferredPrompt = null;
    });
  } else {
    // Fallback instructions for browsers that don't support beforeinstallprompt
    alert(
      'Para instalar esta app:\n\n' +
      '📱 Android Chrome: Menú (⋮) → "Agregar a pantalla de inicio"\n' +
      '📱 iPhone Safari: Compartir (↑) → "Agregar a pantalla de inicio"'
    );
  }
}

// Check if running as PWA
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// Get PWA display mode
export function getPWADisplayMode(): string {
  if (isPWA()) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}

// Track PWA usage
export function trackPWAUsage() {
  const displayMode = getPWADisplayMode();
  console.log('📊 Display mode:', displayMode);
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_display_mode', {
      event_category: 'engagement',
      event_label: displayMode
    });
  }
}

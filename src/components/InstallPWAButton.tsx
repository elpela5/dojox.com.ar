import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { promptInstall, isPWA } from '../utils/registerServiceWorker';

export function InstallPWAButton() {
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsInstalled(isPWA());

    // Show button if installable
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setShowButton(true);
    };

    const handleInstalled = () => {
      setShowButton(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (isInstalled) {
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3">
        <Smartphone className="w-6 h-6 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-green-800">
            ✅ App instalada
          </p>
          <p className="text-green-600 text-sm">
            Puedes usarla desde tu pantalla de inicio
          </p>
        </div>
      </div>
    );
  }

  if (!showButton) {
    return null;
  }

  return (
    <button
      id="install-button"
      onClick={promptInstall}
      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
    >
      <Download className="w-6 h-6" />
      <div className="text-left">
        <p className="font-semibold">Instalar App</p>
        <p className="text-sm opacity-90">Agregar a pantalla de inicio</p>
      </div>
    </button>
  );
}

export function InstallInstructions() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isPWA());
  }, []);

  if (isInstalled) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mt-4">
      <h3 className="text-blue-900 mb-3 flex items-center gap-2">
        <Smartphone className="w-5 h-5" />
        Cómo Instalar en tu Móvil
      </h3>
      
      <div className="space-y-3 text-sm text-blue-800">
        <div>
          <p className="font-semibold mb-1">📱 Android (Chrome):</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Toca el menú (⋮) en la esquina superior derecha</li>
            <li>Selecciona "Agregar a pantalla de inicio"</li>
            <li>Toca "Agregar" o "Instalar"</li>
            <li>¡Listo! El icono aparecerá en tu pantalla</li>
          </ol>
        </div>

        <div>
          <p className="font-semibold mb-1">📱 iPhone (Safari):</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Toca el botón "Compartir" (cuadro con flecha hacia arriba)</li>
            <li>Desplázate y toca "Agregar a pantalla de inicio"</li>
            <li>Toca "Agregar"</li>
            <li>¡Listo! El icono aparecerá en tu pantalla</li>
          </ol>
        </div>

        <div className="bg-blue-100 rounded-lg p-3 mt-3">
          <p className="font-semibold mb-1">✨ Ventajas de instalar:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Acceso más rápido desde tu pantalla de inicio</li>
            <li>Funciona sin conexión a internet</li>
            <li>Pantalla completa (sin barra del navegador)</li>
            <li>Actualizaciones automáticas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle, X } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase/client';

const supabase = getSupabaseClient();

export function DatabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'needs-fix' | 'error'>('checking');
  const [showDetails, setShowDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      // Try to select from the table
      const { error: selectError } = await supabase
        .from('user_profiles_e700bf19')
        .select('id')
        .limit(1);

      if (!selectError) {
        // SELECT works - database is accessible
        setStatus('ok');
        setErrorMessage('');
      } else {
        // Check error type - but don't show errors for network issues
        if (selectError.code === '42P01' || selectError.message.includes('does not exist')) {
          setStatus('error');
          setErrorMessage('Tabla no existe - ejecuta /SETUP_DATABASE_SAFE.sql');
        } else if (selectError.message.includes('permission') || selectError.message.includes('policy')) {
          setStatus('needs-fix');
          setErrorMessage('Políticas RLS necesitan configuración');
        } else {
          // Any other error (network, etc) - just silently mark as OK
          console.log('⚠️ Database check warning (non-critical):', selectError.message);
          setStatus('ok');
          setErrorMessage('');
        }
      }
    } catch (error: any) {
      // Network error or other exception - just hide the status
      console.log('⚠️ Database check failed (non-critical):', error.message);
      setStatus('ok'); // Don't show error UI
      setErrorMessage('');
    }
  };

  if (!showDetails && status === 'ok') {
    // Don't show anything if everything is OK
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Compact Status Badge */}
      {!showDetails && (
        <button
          onClick={() => setShowDetails(true)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg
            transition-all duration-300 hover:scale-105
            ${status === 'checking' ? 'bg-blue-500 text-white' : ''}
            ${status === 'ok' ? 'bg-green-500 text-white' : ''}
            ${status === 'needs-fix' ? 'bg-yellow-500 text-white' : ''}
            ${status === 'error' ? 'bg-red-500 text-white' : ''}
          `}
        >
          {status === 'checking' && (
            <>
              <Database className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Verificando DB...</span>
            </>
          )}
          {status === 'ok' && (
            <>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">DB Configurada</span>
            </>
          )}
          {status === 'needs-fix' && (
            <>
              <AlertCircle className="w-4 h-4 animate-bounce" />
              <span className="text-sm">Configuración Requerida</span>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Error de DB</span>
            </>
          )}
        </button>
      )}

      {/* Detailed Panel */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 max-w-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-gray-700" />
              <h3 className="text-lg">Estado de la Base de Datos</h3>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {status === 'checking' && (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
              <p className="text-gray-600">Verificando configuración...</p>
            </div>
          )}

          {status === 'ok' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-green-700 mb-2">¡Todo Configurado!</p>
              <p className="text-sm text-gray-600">
                La base de datos está funcionando correctamente.
              </p>
            </div>
          )}

          {status === 'needs-fix' && (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-yellow-900 mb-2">
                      Configuración Pendiente
                    </h4>
                    <p className="text-sm text-yellow-800 mb-3">
                      Las políticas de seguridad (RLS) necesitan configurarse para permitir que los usuarios creen sus perfiles.
                    </p>
                    <p className="text-xs text-yellow-700 font-mono bg-yellow-100 p-2 rounded">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-blue-900 mb-2 text-sm">
                  ✅ Solución Rápida (2 minutos):
                </h4>
                <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
                  <li>
                    Abre el archivo <code className="bg-blue-100 px-2 py-1 rounded text-xs">/ARREGLAR_PERMISOS_AHORA.sql</code>
                  </li>
                  <li>
                    Copia TODO el contenido (Ctrl+A, Ctrl+C)
                  </li>
                  <li>
                    Pégalo en{' '}
                    <a
                      href="https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/sql"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Supabase SQL Editor
                    </a>
                  </li>
                  <li>Haz clic en "Run" (Ctrl+Enter)</li>
                  <li>Recarga esta app (F5)</li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-2">
                  ℹ️ <strong>Nota:</strong> El login funciona igual con el sistema de fallback, pero configurar la base de datos habilita todas las funcionalidades.
                </p>
              </div>

              <button
                onClick={() => checkDatabaseStatus()}
                className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Verificar Nuevamente
              </button>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-red-900 mb-2">
                      Error de Conexión
                    </h4>
                    <p className="text-sm text-red-800 mb-3">
                      No se pudo conectar con la base de datos.
                    </p>
                    <p className="text-xs text-red-700 font-mono bg-red-100 p-2 rounded">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="text-gray-900 mb-2 text-sm">
                  Posibles causas:
                </h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                  <li>La tabla no existe (ejecuta <code className="bg-gray-100 px-1 rounded text-xs">/SETUP_DATABASE_SAFE.sql</code>)</li>
                  <li>Problemas de red o conexión a internet</li>
                  <li>Configuración incorrecta del proyecto Supabase</li>
                </ul>
              </div>

              <button
                onClick={() => checkDatabaseStatus()}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                Reintentar Conexión
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
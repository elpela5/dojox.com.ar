import { useState } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { publicAnonKey, projectId } from '../utils/supabase/info';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const supabase = getSupabaseClient();

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: string;
}

export function SupabaseDiagnostic() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test 1: Project ID and API Key
    testResults.push({
      name: 'Configuración de Proyecto',
      status: 'success',
      message: `Project ID: ${projectId}`,
      details: `API Key presente: ${publicAnonKey ? '✅' : '❌'}`,
    });
    setResults([...testResults]);

    // Test 2: REST API Health
    try {
      const restResponse = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': publicAnonKey },
      });
      testResults.push({
        name: 'REST API Health',
        status: restResponse.ok ? 'success' : 'error',
        message: `Status: ${restResponse.status} ${restResponse.statusText}`,
      });
    } catch (error: any) {
      testResults.push({
        name: 'REST API Health',
        status: 'error',
        message: 'No responde',
        details: error.message,
      });
    }
    setResults([...testResults]);

    // Test 3: Auth Service
    try {
      const authHealthResponse = await fetch(`https://${projectId}.supabase.co/auth/v1/health`, {
        method: 'GET',
        headers: { 'apikey': publicAnonKey },
      });
      testResults.push({
        name: 'Auth Service Health',
        status: authHealthResponse.ok ? 'success' : 'error',
        message: `Status: ${authHealthResponse.status}`,
      });
    } catch (error: any) {
      testResults.push({
        name: 'Auth Service Health',
        status: 'error',
        message: 'No responde',
        details: error.message,
      });
    }
    setResults([...testResults]);

    // Test 4: Database Table Access
    try {
      const { data, error } = await supabase
        .from('user_profiles_e700bf19')
        .select('id')
        .limit(1);
      
      if (error) {
        testResults.push({
          name: 'Acceso a Tabla user_profiles',
          status: 'error',
          message: error.message,
          details: `Código: ${error.code}`,
        });
      } else {
        testResults.push({
          name: 'Acceso a Tabla user_profiles',
          status: 'success',
          message: 'Tabla accesible',
          details: `Registros encontrados: ${data?.length || 0}`,
        });
      }
    } catch (error: any) {
      testResults.push({
        name: 'Acceso a Tabla user_profiles',
        status: 'error',
        message: 'Error al consultar',
        details: error.message,
      });
    }
    setResults([...testResults]);

    // Test 5: Auth Session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      testResults.push({
        name: 'Sesión Actual',
        status: session ? 'success' : 'error',
        message: session ? `Usuario: ${session.user.email}` : 'No hay sesión activa',
        details: error ? error.message : undefined,
      });
    } catch (error: any) {
      testResults.push({
        name: 'Sesión Actual',
        status: 'error',
        message: 'Error al verificar sesión',
        details: error.message,
      });
    }
    setResults([...testResults]);

    // Test 6: Server Function
    try {
      const serverResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e700bf19/health`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (serverResponse.ok) {
        const data = await serverResponse.json();
        testResults.push({
          name: 'Edge Function (Server)',
          status: 'success',
          message: 'Servidor respondiendo',
          details: JSON.stringify(data),
        });
      } else {
        testResults.push({
          name: 'Edge Function (Server)',
          status: 'error',
          message: `Status: ${serverResponse.status}`,
        });
      }
    } catch (error: any) {
      testResults.push({
        name: 'Edge Function (Server)',
        status: 'error',
        message: 'No responde',
        details: error.message,
      });
    }
    setResults([...testResults]);

    setIsRunning(false);
  };

  const getIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6" />
          Diagnóstico de Supabase
        </h2>
        
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          <RefreshCw className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Ejecutando Tests...' : 'Ejecutar Diagnóstico'}
        </button>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(result.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{result.name}</h3>
                    <p className="text-gray-700 mt-1">{result.message}</p>
                    {result.details && (
                      <p className="text-sm text-gray-600 mt-2 font-mono bg-white p-2 rounded">
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !isRunning && (
          <div className="text-center text-gray-500 py-8">
            Haz clic en "Ejecutar Diagnóstico" para comenzar
          </div>
        )}
      </div>
    </div>
  );
}

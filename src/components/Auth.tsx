import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { LogIn, UserPlus, Swords, Mail, AlertCircle, Check, Copy, CheckCircle, Trash2, Activity } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase/client';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SupabaseDiagnostic } from './SupabaseDiagnostic';
import dojoXLogo from 'figma:asset/a2750f5576f21540f363b8e030649a2b492d4bc3.png';

const supabase = getSupabaseClient();

export function Auth() {
  const { login, register, resetPassword } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredCredentials, setRegisteredCredentials] = useState({ email: '', password: '' });
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearingSession, setClearingSession] = useState(false);

  const handleClearSession = async () => {
    if (!confirm('¿Estás seguro de que quieres limpiar la sesión? Esto cerrará cualquier sesión activa.')) {
      return;
    }

    setClearingSession(true);
    
    // Add timeout for clearing session
    const timeoutId = setTimeout(() => {
      console.log('⏱️ Clear session timeout - forcing reload');
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }, 5000); // 5 second timeout
    
    try {
      console.log('🧹 Clearing all sessions...');
      await supabase.auth.signOut();
      
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      clearTimeout(timeoutId);
      console.log('✅ All sessions cleared');
      alert('✅ Sesión limpiada. Recarga la página e intenta nuevamente.');
      
      // Reload page
      window.location.reload();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error clearing session:', error);
      
      // Force clear even if there's an error
      localStorage.clear();
      sessionStorage.clear();
      alert('⚠️ Sesión limpiada (forzado). Recargando página...');
      window.location.reload();
    } finally {
      setClearingSession(false);
    }
  };

  const copyToClipboard = (text: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const success = await login(formData.email, formData.password);
      if (!success) {
        setError('Email o contraseña incorrectos. Si no tienes cuenta, regístrate.');
      }
    } else {
      if (!formData.username) {
        setError('Por favor ingresa un nombre de usuario');
        setLoading(false);
        return;
      }
      const success = await register(formData.username, formData.email, formData.password);
      
      if (success) {
        // Show success modal with credentials
        setRegisteredCredentials({ email: formData.email, password: formData.password });
        setShowSuccessModal(true);
      }
      // Error is shown by register function via alert
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage(null);
    
    const result = await resetPassword(resetEmail);
    
    if (result.success) {
      setResetMessage({ 
        type: 'success', 
        text: '¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.' 
      });
      setResetEmail('');
    } else {
      setResetMessage({ 
        type: 'error', 
        text: result.error || 'No se pudo enviar el correo. Verifica el email e intenta de nuevo' 
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <ImageWithFallback
                src={dojoXLogo}
                alt="Yomotsu Dojo X"
                className="w-64 h-48 sm:w-80 sm:h-60 object-contain relative z-10"
              />
            </div>
          </div>
          <p className="text-gray-400 text-lg">Gestiona tus torneos y colección</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8">
          {/* Help Banner */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
            <p className="text-sm text-gray-300">
              {isLogin ? (
                <>
                  <strong className="text-blue-400">¿Primera vez?</strong> Haz clic en <strong className="text-purple-400">"Registrarse"</strong> arriba para crear tu cuenta.
                </>
              ) : (
                <>
                  <strong className="text-blue-400">¿Ya tienes cuenta?</strong> Haz clic en <strong className="text-purple-400">"Iniciar Sesión"</strong> arriba.
                </>
              )}
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              <LogIn className="w-5 h-5 inline-block mr-2" />
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              <UserPlus className="w-5 h-5 inline-block mr-2" />
              Registrarse
            </button>
          </div>

          {showForgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="mb-4">
                <h3 className="text-white text-xl mb-2">Recuperar Contraseña</h3>
                <p className="text-sm text-gray-400">
                  Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Email</label>
                <input
                  id="reset-email"
                  name="reset-email"
                  type="email"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {resetMessage && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl backdrop-blur-sm ${
                    resetMessage.type === 'success'
                      ? 'bg-green-500/10 border-2 border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border-2 border-red-500/30 text-red-400'
                  }`}
                >
                  {resetMessage.type === 'success' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>{resetMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-purple-500/30"
                disabled={loading || !resetEmail}
              >
                <Mail className="w-5 h-5" />
                {loading ? 'Enviando...' : 'Enviar Correo de Recuperación'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetMessage(null);
                  setResetEmail('');
                }}
                className="w-full bg-gray-800 text-gray-300 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 border border-gray-700 font-medium"
              >
                Volver al inicio de sesión
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Nombre de Usuario</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-300 mb-2 font-medium">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                  placeholder={isLogin ? "tu@email.com" : "ejemplo@gmail.com"}
                  required
                />
                {!isLogin && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Usa un email real como @gmail.com, @outlook.com, etc.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">Contraseña</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl backdrop-blur-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
              >
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h3 className="text-white text-xl text-center mb-2">¡Cuenta Creada Exitosamente!</h3>
            <p className="text-gray-400 text-center mb-6">
              Guarda tus credenciales de acceso:
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-300 text-sm mb-1 font-medium">Email</label>
                <div className="relative">
                  <input
                    type="text"
                    value={registeredCredentials.email}
                    className="w-full px-4 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-xl text-white"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(registeredCredentials.email, 'email')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                    title="Copiar email"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-1 font-medium">Contraseña</label>
                <div className="relative">
                  <input
                    type="text"
                    value={registeredCredentials.password}
                    className="w-full px-4 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(registeredCredentials.password, 'password')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                    title="Copiar contraseña"
                  >
                    {copiedField === 'password' ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-300">
                  <p className="font-semibold mb-1">⚠️ Importante:</p>
                  <p>No recibirás un email de confirmación. Guarda tus credenciales ahora, ya has iniciado sesión automáticamente.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-purple-500/30"
            >
              Entendido, Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
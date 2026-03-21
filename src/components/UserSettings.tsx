import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Lock, User, Mail, Check, X, AlertCircle } from 'lucide-react';

export function UserSettings() {
  const { user, changePassword, changeUsername } = useUser();
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 text-center">
        <p className="text-yellow-700">Debes iniciar sesión para acceder a la configuración</p>
      </div>
    );
  }

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setMessage({ type: 'error', text: 'El nombre de usuario no puede estar vacío' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await changeUsername(newUsername);

    if (result.success) {
      setMessage({ type: 'success', text: '¡Nombre de usuario actualizado exitosamente!' });
      setNewUsername('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al cambiar el nombre de usuario' });
    }

    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await changePassword(newPassword);

    if (result.success) {
      setMessage({ type: 'success', text: '¡Contraseña actualizada exitosamente!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al cambiar la contraseña' });
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          Información de la Cuenta
        </h2>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Email</span>
            </div>
            <p className="text-gray-900 pl-7">{user.email}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Usuario Actual</span>
            </div>
            <p className="text-gray-900 pl-7">{user.username}</p>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 flex items-center gap-2 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border-2 border-green-300 text-green-700'
                : 'bg-red-50 border-2 border-red-300 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Change Username */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="mb-4 text-gray-900">Cambiar Nombre de Usuario</h3>
          <form onSubmit={handleChangeUsername} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Nuevo nombre de usuario</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={user.username}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newUsername.trim()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5" />
              {loading ? 'Actualizando...' : 'Actualizar Nombre de Usuario'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="mb-4 text-gray-900">Cambiar Contraseña</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

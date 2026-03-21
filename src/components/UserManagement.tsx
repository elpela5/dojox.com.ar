import { useState, useEffect } from 'react';
import { Crown, Shield, User, Trash2, AlertTriangle, Edit2, Check, X, Key, Scale } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { CafecitoButton } from './CafecitoButton';

export function UserManagement() {
  const { user: currentUser, getAllUsers, updateUserRole, adminChangeUsername, adminChangePassword, adminDeleteUser, allUsers } = useUser();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedUsername, setEditedUsername] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [changingPasswordUserId, setChangingPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Use allUsers from context (realtime)
  const users = allUsers;

  if (!currentUser || (currentUser.role !== 'developer' && currentUser.role !== 'admin')) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p>No tienes permisos para acceder a esta sección</p>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'judge' | 'user') => {
    updateUserRole(userId, newRole);
    // Reload users from Supabase after role change
    setTimeout(() => getAllUsers(), 500);
  };

  const startEdit = (userId: string, currentValue: string = '') => {
    setEditingUserId(userId);
    setEditedUsername(currentValue);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditedUsername('');
  };

  const saveEdit = async () => {
    if (!editingUserId) return;

    const result = await adminChangeUsername(editingUserId, editedUsername);
    if (result.success) {
      alert('Nombre de usuario actualizado exitosamente');
      getAllUsers(); // Reload from Supabase
      cancelEdit();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const startPasswordChange = (userId: string) => {
    setChangingPasswordUserId(userId);
    setNewPassword('');
  };

  const cancelPasswordChange = () => {
    setChangingPasswordUserId(null);
    setNewPassword('');
  };

  const savePasswordChange = async () => {
    if (!changingPasswordUserId || !newPassword) return;

    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const result = await adminChangePassword(changingPasswordUserId, newPassword);
    if (result.success) {
      alert('✅ Contraseña actualizada exitosamente');
      cancelPasswordChange();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    setLoading(true);
    const result = await adminDeleteUser(userId);
    if (result.success) {
      alert('Usuario eliminado exitosamente');
      getAllUsers(); // Reload from Supabase
      setShowDeleteConfirm(null);
    } else {
      alert(`Error: ${result.error}`);
    }
    setLoading(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'developer':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-5 h-5 text-purple-500" />;
      case 'judge':
        return <Scale className="w-5 h-5 text-blue-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'developer':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'judge':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'developer':
        return 'Desarrollador';
      case 'admin':
        return 'Administrador';
      case 'judge':
        return 'Juez';
      default:
        return 'Usuario';
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-8 h-8 text-yellow-500" />
        <div>
          <h2>Gestión de Usuarios</h2>
          <p className="text-gray-600">Panel de control de desarrollador</p>
        </div>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-yellow-900 mb-1">Permisos del Sistema</h3>
            <ul className="text-yellow-800 space-y-1">
              <li>• <strong>Desarrollador:</strong> Control total del sistema</li>
              <li>• <strong>Administrador:</strong> Puede agregar jugadores y gestionar torneos</li>
              <li>• <strong>Juez:</strong> Puede evaluar y calificar a los jugadores</li>
              <li>• <strong>Usuario:</strong> Solo puede inscribirse a torneos</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="mb-4">Usuarios Registrados ({users.length})</h3>
        
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {u.profilePicture ? (
                  <img
                    src={u.profilePicture}
                    alt={u.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white">
                    <User className="w-6 h-6" />
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-gray-900">{u.username}</h3>
                    {getRoleIcon(u.role)}
                  </div>
                  <p className="text-gray-600">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded border-2 ${getRoleBadge(u.role)}`}
                >
                  {getRoleLabel(u.role)}
                </span>

                {u.role !== 'developer' && (
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as 'admin' | 'judge' | 'user')}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                    <option value="judge">Juez</option>
                  </select>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span>ID: {u.id}</span>
                  <span className="mx-2">•</span>
                  <span>Registrado: {new Date(u.createdAt).toLocaleDateString('es-ES')}</span>
                </div>

                {u.role !== 'developer' && !(currentUser.role === 'admin' && u.role === 'developer') && (
                  <div className="flex gap-2">
                    {editingUserId === u.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editedUsername}
                          onChange={(e) => setEditedUsername(e.target.value)}
                          className="px-3 py-1 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="Nuevo nombre"
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          disabled={!editedUsername.trim()}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                          title="Guardar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-300 transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(u.id, u.username)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          title="Editar nombre de usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Editar Nombre</span>
                        </button>
                        <button
                          onClick={() => startPasswordChange(u.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                          title="Cambiar contraseña"
                        >
                          <Key className="w-4 h-4" />
                          <span>Cambiar Contraseña</span>
                        </button>
                        {currentUser.role === 'developer' && (
                          <button
                            onClick={() => setShowDeleteConfirm(u.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No hay usuarios registrados aún</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            
            <h3 className="text-gray-900 text-center mb-2">¿Eliminar Usuario?</h3>
            <p className="text-gray-600 text-center mb-6">
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de{' '}
              <strong>{users.find(u => u.id === showDeleteConfirm)?.username}</strong>.
            </p>
            
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">⚠️ Advertencia:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Se eliminará la cuenta de Supabase</li>
                    <li>Se eliminarán todos los datos del usuario</li>
                    <li>El usuario no podrá iniciar sesión</li>
                    <li>Esta acción es irreversible</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Eliminar Usuario
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Change Password Modal */}
      {changingPasswordUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Key className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            
            <h3 className="text-gray-900 text-center mb-2">Cambiar Contraseña</h3>
            <p className="text-gray-600 text-center mb-6">
              Establecer nueva contraseña para{' '}
              <strong>{users.find(u => u.id === changingPasswordUserId)?.username}</strong>
            </p>
            
            <div className="mb-6">
              <label htmlFor="newPassword" className="block text-sm text-gray-700 mb-2">
                Nueva Contraseña (mínimo 6 caracteres)
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ingresa la nueva contraseña"
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <Key className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-800">
                  <p className="font-semibold mb-1">ℹ️ Información:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>La contraseña será actualizada inmediatamente</li>
                    <li>El usuario podrá iniciar sesión con la nueva contraseña</li>
                    <li>Se recomienda informar al usuario sobre el cambio</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelPasswordChange}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={savePasswordChange}
                disabled={loading || !newPassword || newPassword.length < 6}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    Cambiar Contraseña
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <CafecitoButton />
    </div>
  );
}
import { useState } from 'react';
import { UserCircle, Camera, Shield, Calendar } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { UserSettings } from './UserSettings';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CafecitoButton } from './CafecitoButton';

export function Profile() {
  const { user, updateProfilePicture } = useUser();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es muy grande. Por favor selecciona una imagen menor a 2MB.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateProfilePicture(base64String);
      setUploading(false);
    };

    reader.onerror = () => {
      alert('Error al cargar la imagen');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  if (!user) return null;

  const createdDate = new Date(user.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getRoleBadge = () => {
    switch (user.role) {
      case 'developer':
        return (
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full border-2 border-yellow-300">
            <Shield className="w-5 h-5" />
            <span>Desarrollador</span>
          </div>
        );
      case 'admin':
        return (
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full border-2 border-purple-300">
            <Shield className="w-5 h-5" />
            <span>Administrador</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full border-2 border-blue-300">
            <UserCircle className="w-5 h-5" />
            <span>Usuario</span>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <UserCircle className="w-8 h-8 text-indigo-500" />
        <h2>Mi Perfil</h2>
      </div>

      <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-400">
                  <UserCircle className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            <button
              onClick={() => document.getElementById('fileInput')?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-gray-900 mb-2">{user.username}</h3>
            <p className="text-gray-600 mb-3">{user.email}</p>
            <div className="mb-3">{getRoleBadge()}</div>
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Miembro desde {createdDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h3 className="mb-4">Información de la Cuenta</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Usuario:</span>
            <span className="text-gray-900">{user.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Email:</span>
            <span className="text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Rol:</span>
            <span className="text-gray-900 capitalize">
              {user.role === 'developer' ? 'Desarrollador' : user.role === 'admin' ? 'Administrador' : 'Usuario'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">ID de Usuario:</span>
            <span className="text-gray-900 font-mono text-sm">{user.id}</span>
          </div>
        </div>
      </div>

      {(user.role === 'admin' || user.role === 'developer') && (
        <div className="mt-6 bg-purple-50 border-2 border-purple-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-purple-900 mb-1">Permisos Especiales</h3>
              <p className="text-purple-800">
                {user.role === 'developer' 
                  ? 'Tienes control total del sistema y puedes gestionar usuarios y torneos.'
                  : 'Puedes agregar jugadores manualmente y gestionar los resultados de torneos.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="mt-4 bg-blue-50 text-blue-600 p-3 rounded-lg text-center">
          Subiendo imagen...
        </div>
      )}

      <div className="mt-6">
        <UserSettings />
      </div>

      <div className="mt-6">
        <CafecitoButton />
      </div>
    </div>
  );
}
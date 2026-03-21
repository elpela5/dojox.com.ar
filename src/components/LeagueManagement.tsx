import { useState } from 'react';
import { Trophy, Plus, Edit, Trash2, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useSync } from '../contexts/SyncContext';

export function LeagueManagement() {
  const { user } = useUser();
  const { leagues, saveLeague, deleteLeague } = useSync();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [editingLeague, setEditingLeague] = useState<{ id: string; name: string } | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  if (!isAdmin) {
    return null;
  }

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim() || !user) return;

    const newLeague = {
      id: `league-${Date.now()}`,
      name: leagueName.trim(),
      createdAt: new Date().toISOString(),
      createdBy: user.username,
    };

    await saveLeague(newLeague);
    setLeagueName('');
    setShowCreateForm(false);
  };

  const handleEditLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeague || !leagueName.trim()) return;

    const updatedLeague = {
      ...leagues.find(l => l.id === editingLeague.id),
      name: leagueName.trim(),
    };

    await saveLeague(updatedLeague);
    setLeagueName('');
    setEditingLeague(null);
  };

  const handleDeleteLeague = async (leagueId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta liga?')) return;
    await deleteLeague(leagueId);
  };

  const startEdit = (league: any) => {
    setEditingLeague(league);
    setLeagueName(league.name);
    setShowCreateForm(false);
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-500" />
          <h3 className="text-gray-900">Gestión de Ligas</h3>
        </div>
        {!showCreateForm && !editingLeague && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Liga
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateLeague} className="mb-4 bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
          <label className="block text-sm text-purple-900 mb-2">Nombre de la Liga</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              placeholder="Ej: Liga Regional Sur"
              className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              autoFocus
              required
            />
            <button
              type="submit"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setLeagueName('');
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Edit Form */}
      {editingLeague && (
        <form onSubmit={handleEditLeague} className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
          <label className="block text-sm text-blue-900 mb-2">Editar Liga</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingLeague(null);
                setLeagueName('');
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Leagues List */}
      {leagues.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          No hay ligas creadas. Crea la primera liga para comenzar.
        </p>
      ) : (
        <div className="space-y-2">
          {leagues.map((league) => (
            <div
              key={league.id}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg group"
            >
              <div>
                <p className="font-medium text-gray-900">{league.name}</p>
                <p className="text-xs text-gray-500">
                  Creada por {league.createdBy} • {new Date(league.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(league)}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                  title="Editar liga"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteLeague(league.id)}
                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                  title="Eliminar liga"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Sobre las Ligas:</strong> Los torneos pueden asignarse a una liga específica. Los puntos de liga usan un sistema diferente al ranking general: 1°=15pts, 2°=12pts, 3°=10pts, 4°=7pts, 5°-8°=2pts. En torneos combinados, el ganador de la fase suiza recibe 10 puntos extra.
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Plus, Swords, Calendar, Users, Trophy, Trash2, AlertTriangle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useSync } from '../contexts/SyncContext';
import { CafecitoButton } from './CafecitoButton';

interface Tournament {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  playerCount: number;
  currentRound: number;
  totalRounds: number;
  status: 'preparing' | 'active' | 'finished';
  format?: 'swiss' | 'single-elimination' | 'combined'; // NEW: Tournament format
  combinedSettings?: { // NEW: Settings for combined format
    swissRounds: number;
    topCut: number;
  };
  leagueId?: string; // NEW: Associated league ID (optional, null = general ranking only)
}

interface TournamentListProps {
  onSelectTournament: (tournamentId: string) => void;
}

export function TournamentList({ onSelectTournament }: TournamentListProps) {
  const { user } = useUser();
  const { tournaments, saveTournament, deleteTournament: deleteTournamentSync, leagues } = useSync();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentFormat, setTournamentFormat] = useState<'swiss' | 'single-elimination' | 'combined'>('swiss');
  const [swissRounds, setSwissRounds] = useState(3);
  const [topCut, setTopCut] = useState(8);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(''); // NEW: Selected league
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; tournamentId: string; tournamentName: string }>({
    show: false,
    tournamentId: '',
    tournamentName: '',
  });

  // No need for useEffect - use context state directly

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentName.trim() || !user) return;

    const newTournament: Tournament = {
      id: Date.now().toString(),
      name: tournamentName,
      createdAt: new Date().toISOString(),
      createdBy: user.username,
      playerCount: 0,
      currentRound: 0,
      totalRounds: 0, // Will be calculated automatically when tournament starts
      status: 'preparing',
      format: tournamentFormat,
      combinedSettings: tournamentFormat === 'combined' ? { swissRounds, topCut } : undefined,
      leagueId: selectedLeagueId || undefined, // NEW: Add leagueId to tournament
    };

    // Only update through SyncContext - don't update local state
    await saveTournament(newTournament);
    
    setTournamentName('');
    setTournamentFormat('swiss');
    setSwissRounds(3);
    setTopCut(8);
    setSelectedLeagueId(''); // NEW: Reset selected league
    setShowCreateForm(false);
  };

  const openDeleteConfirm = (e: React.MouseEvent, tournament: Tournament) => {
    e.stopPropagation(); // Prevent opening the tournament
    setDeleteConfirm({
      show: true,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
    });
  };

  const deleteTournament = async () => {
    const tournamentId = deleteConfirm.tournamentId;
    
    // Only update through SyncContext - don't update local state
    await deleteTournamentSync(tournamentId);
    
    // Close confirmation modal
    setDeleteConfirm({ show: false, tournamentId: '', tournamentName: '' });
  };

  const canCreateTournament = user?.role === 'admin' || user?.role === 'developer';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Swords className="w-8 h-8 text-blue-500" />
          <h2>Torneos</h2>
        </div>
        {canCreateTournament && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Torneo
          </button>
        )}
      </div>

      {showCreateForm && canCreateTournament && (
        <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <h3 className="mb-3">Crear Nuevo Torneo</h3>
          <form onSubmit={createTournament} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nombre del torneo</label>
              <input
                type="text"
                placeholder="Ej: Campeonato Regional 2025"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>
            
            {/* Format Selection */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Formato del torneo</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTournamentFormat('swiss')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    tournamentFormat === 'swiss'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium text-sm mb-1">🔄 Suizo</div>
                  <div className="text-xs text-gray-600">Rondas automáticas por cantidad de jugadores</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setTournamentFormat('single-elimination')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    tournamentFormat === 'single-elimination'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium text-sm mb-1">🏆 Eliminación</div>
                  <div className="text-xs text-gray-600">Bracket directo, final, semifinal, etc.</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setTournamentFormat('combined')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    tournamentFormat === 'combined'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium text-sm mb-1">⚡ Combinado</div>
                  <div className="text-xs text-gray-600">Suizo + corte a top + eliminación</div>
                </button>
              </div>
            </div>

            {/* Combined Format Settings */}
            {tournamentFormat === 'combined' && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 space-y-3">
                <p className="text-sm text-purple-900 font-medium">Configuración Formato Combinado</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-purple-900 mb-1">Rondas Suizas</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={swissRounds}
                      onChange={(e) => setSwissRounds(parseInt(e.target.value) || 3)}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-purple-900 mb-1">Corte a Top</label>
                    <select
                      value={topCut}
                      onChange={(e) => setTopCut(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value={4}>Top 4</option>
                      <option value={8}>Top 8</option>
                      <option value={16}>Top 16</option>
                      <option value={32}>Top 32</option>
                    </select>
                  </div>
                </div>
                
                <p className="text-xs text-purple-800">
                  Se jugarán {swissRounds} ronda{swissRounds > 1 ? 's' : ''} suiza{swissRounds > 1 ? 's' : ''}, luego los mejores {topCut} jugadores pasarán a eliminación directa.
                </p>
              </div>
            )}
            
            {/* League Selection */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Liga (Opcional)</label>
              <select
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin liga - Solo ranking general</option>
                {leagues.map((league: any) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {selectedLeagueId 
                  ? '🏆 Los puntos del torneo sumarán tanto al ranking general como a la liga seleccionada con sistema diferenciado (1°=15pts, 2°=12pts, 3°=10pts, 4°=7pts, 5°-8°=2pts)'
                  : '📊 Los puntos del torneo solo sumarán al ranking general (1°=10pts, 2°=9pts, 3°=8pts, etc.)'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Crear Torneo
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setTournamentName('');
                  setTournamentFormat('swiss');
                  setSwissRounds(3);
                  setTopCut(8);
                  setSelectedLeagueId(''); // NEW: Reset selected league
                }}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {tournaments.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No hay torneos disponibles</p>
          {canCreateTournament && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear el primer torneo
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 transition-all hover:shadow-lg relative group"
          >
            {/* Delete Button - Only for admins and developers */}
            {canCreateTournament && (
              <button
                onClick={(e) => openDeleteConfirm(e, tournament)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                title="Eliminar torneo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div
              className="cursor-pointer"
              onClick={() => onSelectTournament(tournament.id)}
            >
              <div className="flex items-start justify-between mb-3 pr-8">
                <h3 className="text-gray-900">{tournament.name}</h3>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    tournament.status === 'preparing'
                      ? 'bg-yellow-100 text-yellow-700'
                      : tournament.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tournament.status === 'preparing' && 'Preparando'}
                  {tournament.status === 'active' && 'En curso'}
                  {tournament.status === 'finished' && 'Finalizado'}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(tournament.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{tournament.playerCount} jugadores</span>
                </div>
                {/* Format Badge */}
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4" />
                  <span className={`text-xs px-2 py-1 rounded ${
                    tournament.format === 'single-elimination' 
                      ? 'bg-orange-100 text-orange-700'
                      : tournament.format === 'combined'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tournament.format === 'single-elimination' && '🏆 Eliminación'}
                    {tournament.format === 'combined' && '⚡ Combinado'}
                    {(!tournament.format || tournament.format === 'swiss') && '🔄 Suizo'}
                  </span>
                </div>
                {tournament.totalRounds > 0 ? (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span>
                      {tournament.currentRound > 0 
                        ? `Ronda ${tournament.currentRound} de ${tournament.totalRounds}`
                        : `${tournament.totalRounds} rondas totales`
                      }
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs">
                      Rondas por calcular
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                  Creado por {tournament.createdBy}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-gray-900">Confirmar Eliminación</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el torneo <strong>"{deleteConfirm.tournamentName}"</strong>?
              <br />
              <br />
              Esta acción eliminará permanentemente:
            </p>
            
            <ul className="text-gray-600 mb-6 space-y-1 pl-5 list-disc">
              <li>Todos los jugadores registrados</li>
              <li>Todas las partidas y resultados</li>
              <li>Todo el historial del torneo</li>
            </ul>
            
            <p className="text-red-600 mb-6">
              Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, tournamentId: '', tournamentName: '' })}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={deleteTournament}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <CafecitoButton />
    </div>
  );
}
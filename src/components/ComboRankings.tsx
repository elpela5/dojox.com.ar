import { useState, useEffect } from 'react';
import { Trophy, Plus, TrendingUp, Star, Trash2, TrendingDown, Minus, Info, Calendar, Filter } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useUser } from '../contexts/UserContext';
import { CafecitoButton } from './CafecitoButton';

type ComboMode = 'standard' | 'custom';

type ComboConfig = 
  | {
      mode: 'standard';
      name: string;
      blade: string;
      ratchet: string;
      bit: string;
    }
  | {
      mode: 'custom';
      name: string;
      lockChip: string;
      mainBlade: string;
      assistBlade: string;
      ratchet: string;
      bit: string;
    };

interface WeeklyUse {
  weekNumber: number;
  weekStartDate: string;
  points: number;
  tournamentIds: string[];
  positions: number[]; // Posiciones obtenidas en torneos de esa semana
}

interface Combo extends ComboConfig {
  id: string;
  totalPoints: number;
  decayedPoints?: number; // Puntos actuales después del decaimiento
  appearances: number;
  lastAppearanceDate?: string; // ISO date string
  lastTournamentId?: string;
  weeklyHistory?: WeeklyUse[]; // Histórico de usos semanales
  previousPoints?: number; // Puntos de la semana anterior (para calcular tendencia)
  trend?: 'up' | 'down' | 'stable'; // Tendencia calculada
  wins?: number;
  losses?: number;
  rating?: number;
}

// Constantes del sistema
const DECAY_FACTOR = 0.90; // 10% de decaimiento semanal
const POSITION_POINTS = [100, 80, 65, 52, 42, 34, 27, 21, 16, 12]; // Puntos por posición (1º a 10º)

// Función para obtener el número de semana desde epoch
function getWeekNumber(date: Date = new Date()): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor(date.getTime() / msPerWeek);
}

// Función para obtener el inicio de la semana actual
function getWeekStartDate(weekNumber: number): string {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return new Date(weekNumber * msPerWeek).toISOString();
}

export function ComboRankings() {
  const { combos, catalog, saveCombo, deleteCombo, tournaments, players } = useSync();
  const { user } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [weekFilter, setWeekFilter] = useState<'4weeks' | '8weeks' | 'all'>('4weeks');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [formData, setFormData] = useState({
    mode: 'standard' as 'standard' | 'custom',
    name: '',
    blade: '',
    ratchet: '',
    bit: '',
    lockChip: '',
    mainBlade: '',
    assistBlade: '',
  });

  // Check if user is admin or developer
  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  // Calcular puntos con decaimiento para cada combo
  const calculateDecayedPoints = (combo: Combo): Combo => {
    const currentWeek = getWeekNumber();
    const weeklyHistory = combo.weeklyHistory || [];
    
    // Si no hay historial, mantener los puntos totales actuales
    if (weeklyHistory.length === 0) {
      return {
        ...combo,
        decayedPoints: combo.totalPoints,
        trend: 'stable',
      };
    }

    // Calcular puntos con decaimiento semanal
    let decayedPoints = 0;
    const weeksToConsider = weekFilter === '4weeks' ? 4 : weekFilter === '8weeks' ? 8 : Infinity;
    
    weeklyHistory.forEach((weekData) => {
      const weeksAgo = currentWeek - weekData.weekNumber;
      
      // Filtrar según el filtro seleccionado
      if (weeksAgo > weeksToConsider) return;
      
      // Aplicar decaimiento: puntos * (DECAY_FACTOR ^ semanas_transcurridas)
      const decayMultiplier = Math.pow(DECAY_FACTOR, weeksAgo);
      decayedPoints += weekData.points * decayMultiplier;
    });

    // Calcular tendencia comparando con puntos previos
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (combo.previousPoints !== undefined) {
      const diff = decayedPoints - combo.previousPoints;
      if (diff > 5) trend = 'up';
      else if (diff < -5) trend = 'down';
    }

    return {
      ...combo,
      decayedPoints: Math.round(decayedPoints),
      trend,
    };
  };

  // Procesar combos con decaimiento y calcular tendencias
  const processedCombos = combos.map(calculateDecayedPoints);
  
  // Ordenar por puntos con decaimiento
  const sortedCombos = [...processedCombos].sort(
    (a: Combo, b: Combo) => (b.decayedPoints || b.totalPoints) - (a.decayedPoints || a.totalPoints)
  );

  // Función para obtener el icono de tendencia
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" title="Subiendo" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" title="Bajando" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" title="Estable" />;
    }
  };

  // Función para obtener usos en últimas N semanas
  const getRecentUses = (combo: Combo, weeks: number): number => {
    if (!combo.weeklyHistory) return 0;
    const currentWeek = getWeekNumber();
    return combo.weeklyHistory.filter(
      (week) => currentWeek - week.weekNumber <= weeks
    ).length;
  };

  // Debug: Log catalog and combos state
  useEffect(() => {
    console.log('📦 ComboRankings - Catalog loaded:', catalog?.length || 0, 'pieces');
    console.log('📦 ComboRankings - Combos loaded:', combos?.length || 0, 'combos');
    if (combos && combos.length > 0) {
      console.log('📦 First combo sample:', combos[0]);
    }
    if (catalog && catalog.length > 0) {
      console.log('📦 First catalog item sample:', catalog[0]);
    }
  }, [catalog, combos]);

  // Helper function to get piece name by ID from catalog
  const getPieceName = (pieceId: string): string => {
    if (!pieceId) return 'Unknown';
    
    // If catalog is not loaded, return the pieceId as-is
    if (!catalog || catalog.length === 0) {
      return pieceId;
    }
    
    // Try to find the piece in catalog by ID
    const piece = catalog.find((item: any) => item.id === pieceId);
    
    if (piece && piece.name) {
      return piece.name;
    }
    
    // If not found in catalog, assume it's already a name (manual entry)
    return pieceId;
  };

  // Helper function to get bit initials for display
  const getBitInitials = (bitId: string): string => {
    const bitName = getPieceName(bitId);
    
    if (!bitName || bitName === 'Unknown') return bitName;
    if (bitName.length <= 2) return bitName;
    
    const words = bitName.split(/[\s-]+/).filter(w => w.length > 0);
    if (words.length > 1) {
      return words.map(word => word[0]).join('').toUpperCase();
    }
    
    return bitName.substring(0, 2).toUpperCase();
  };

  // Helper function to generate combo display name automatically
  const getComboDisplayName = (combo: Combo): string => {
    if (combo.name && combo.name.trim() && !combo.name.includes('•')) {
      return combo.name;
    }
    
    if (combo.mode === 'standard') {
      const bladeName = getPieceName(combo.blade);
      const ratchetName = getPieceName(combo.ratchet);
      const bitInitials = getBitInitials(combo.bit);
      return `${bladeName} ${ratchetName}${bitInitials}`;
    } else {
      const lockChipName = getPieceName(combo.lockChip);
      const mainBladeName = getPieceName(combo.mainBlade);
      const assistBladeName = getPieceName(combo.assistBlade);
      const ratchetName = getPieceName(combo.ratchet);
      const bitInitials = getBitInitials(combo.bit);
      return `${lockChipName} ${mainBladeName} ${assistBladeName} ${ratchetName}${bitInitials}`;
    }
  };

  // Helper function to generate combo details for display
  const getComboDetails = (combo: Combo): string => {
    if (combo.mode === 'standard') {
      return `${getPieceName(combo.blade)} • ${getPieceName(combo.ratchet)} • ${getPieceName(combo.bit)}`;
    } else {
      return `${getPieceName(combo.lockChip)} • ${getPieceName(combo.mainBlade)} • ${getPieceName(combo.assistBlade)} • ${getPieceName(combo.ratchet)} • ${getPieceName(combo.bit)}`;
    }
  };

  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let newCombo: Combo;
    
    if (formData.mode === 'standard') {
      newCombo = {
        id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mode: 'standard',
        name: formData.name,
        blade: formData.blade,
        ratchet: formData.ratchet,
        bit: formData.bit,
        totalPoints: 1500,
        appearances: 0,
      };
    } else {
      newCombo = {
        id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mode: 'custom',
        name: formData.name,
        lockChip: formData.lockChip,
        mainBlade: formData.mainBlade,
        assistBlade: formData.assistBlade,
        ratchet: formData.ratchet,
        bit: formData.bit,
        totalPoints: 1500,
        appearances: 0,
      };
    }
    
    await saveCombo(newCombo);
    setFormData({ 
      mode: 'standard', 
      name: '', 
      blade: '', 
      ratchet: '', 
      bit: '', 
      lockChip: '', 
      mainBlade: '', 
      assistBlade: '' 
    });
    setShowAddForm(false);
  };

  const handleDeleteCombo = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este combo?')) {
      await deleteCombo(id);
    }
  };

  const updateRecord = async (id: string, type: 'win' | 'loss') => {
    const combo = combos.find((c: Combo) => c.id === id);
    if (!combo) return;

    const pointsChange = type === 'win' ? 25 : -15;
    const updatedCombo = {
      ...combo,
      totalPoints: Math.max(0, combo.totalPoints + pointsChange),
    };
    
    await saveCombo(updatedCombo);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h2>Top Combos Ganadores</h2>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Combo
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSaveCombo} className="bg-purple-50 p-6 rounded-xl mb-6">
          <h3 className="mb-4">Agregar Nuevo Combo</h3>
          
          {/* Mode Selector */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Modo del Combo:</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'standard' })}
                className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                  formData.mode === 'standard'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                }`}
              >
                <div className="text-center">
                  <p className="text-sm">Standard</p>
                  <p className="text-xs opacity-75 mt-1">Blade • Ratchet • Bit</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'custom' })}
                className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                  formData.mode === 'custom'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                }`}
              >
                <div className="text-center">
                  <p className="text-sm">Custom</p>
                  <p className="text-xs opacity-75 mt-1">Lock • Main • Assist • Ratchet • Bit</p>
                </div>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre del combo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            
            {formData.mode === 'standard' ? (
              <>
                <input
                  type="text"
                  placeholder="Blade (nombre o ID)"
                  value={formData.blade}
                  onChange={(e) => setFormData({ ...formData, blade: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Ratchet (nombre o ID)"
                  value={formData.ratchet}
                  onChange={(e) => setFormData({ ...formData, ratchet: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Bit (nombre o ID)"
                  value={formData.bit}
                  onChange={(e) => setFormData({ ...formData, bit: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Lock Chip (nombre o ID)"
                  value={formData.lockChip}
                  onChange={(e) => setFormData({ ...formData, lockChip: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Main Blade (nombre o ID)"
                  value={formData.mainBlade}
                  onChange={(e) => setFormData({ ...formData, mainBlade: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Assist Blade (nombre o ID)"
                  value={formData.assistBlade}
                  onChange={(e) => setFormData({ ...formData, assistBlade: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Ratchet (nombre o ID)"
                  value={formData.ratchet}
                  onChange={(e) => setFormData({ ...formData, ratchet: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Bit (nombre o ID)"
                  value={formData.bit}
                  onChange={(e) => setFormData({ ...formData, bit: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </>
            )}
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormData({ 
                  mode: 'standard', 
                  name: '', 
                  blade: '', 
                  ratchet: '', 
                  bit: '', 
                  lockChip: '', 
                  mainBlade: '', 
                  assistBlade: '' 
                });
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 relative">
        <button
          onClick={() => setShowInfoTooltip(!showInfoTooltip)}
          className="absolute top-3 right-3 p-2 hover:bg-blue-100 rounded-full transition-colors"
          title="Información del sistema"
        >
          <Info className="w-5 h-5 text-blue-600" />
        </button>
        
        <div className="flex items-start gap-3 pr-10">
          <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-900 mb-1">Sistema de Ranking con Decaimiento Temporal</h3>
            <p className="text-blue-800 text-sm mb-2">
              Los combos ganan puntos según su posición en torneos (1º = 100 pts, 2º = 80 pts, ... 10º = 12 pts).
              Los puntos pierden 10% de valor cada semana para reflejar el meta actual.
            </p>
            
            {showInfoTooltip && (
              <div className="mt-3 p-3 bg-white border border-blue-300 rounded-lg text-sm">
                <p className="text-blue-900 mb-2">
                  <strong>📊 Cómo funciona:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Los combos se toman de los decks del Top 10 de cada torneo completado</li>
                  <li>Cada posición otorga puntos específicos (1º=100, 2º=80, 3º=65, etc.)</li>
                  <li>Los puntos se degradan 10% por semana sin uso</li>
                  <li>Combos que reaparecen renuevan su vigencia</li>
                  <li>El ranking refleja el meta actual, no solo el histórico</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtro de semanas */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Ver combos de:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setWeekFilter('4weeks')}
            className={`px-4 py-2 rounded-lg transition-all ${
              weekFilter === '4weeks'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
            }`}
          >
            Últimas 4 semanas
          </button>
          <button
            onClick={() => setWeekFilter('8weeks')}
            className={`px-4 py-2 rounded-lg transition-all ${
              weekFilter === '8weeks'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
            }`}
          >
            Últimas 8 semanas
          </button>
          <button
            onClick={() => setWeekFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              weekFilter === 'all'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
            }`}
          >
            Histórico completo
          </button>
        </div>
      </div>

      {/* Top 10 Combos - Vista destacada */}
      <div id="top-10-combos" className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Top 10 Combos Destacados
          </h3>
          {sortedCombos.length > 10 && (
            <a 
              href="#all-combos-table"
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Ver Tabla Completa
              <TrendingDown className="w-4 h-4" />
            </a>
          )}
        </div>
        {sortedCombos.slice(0, 10).map((combo: Combo, index: number) => {
          const comboModeLabel = combo.mode === 'custom' ? '🔧 Custom' : '⚡ Standard';

          return (
            <div
              key={combo.id}
              className={`bg-white border-2 rounded-xl p-5 hover:shadow-lg transition-all ${
                index === 0
                  ? 'border-yellow-400 shadow-xl'
                  : index === 1
                  ? 'border-gray-300 shadow-lg'
                  : index === 2
                  ? 'border-orange-300 shadow-lg'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full ${
                      index === 0
                        ? 'bg-yellow-400 text-yellow-900'
                        : index === 1
                        ? 'bg-gray-300 text-gray-700'
                        : index === 2
                        ? 'bg-orange-400 text-orange-900'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {index === 0 ? <Star className="w-6 h-6" /> : <span>#{index + 1}</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-900">{getComboDisplayName(combo)}</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {comboModeLabel}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {getComboDetails(combo)}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteCombo(combo.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Eliminar combo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-gray-600 text-xs mb-1">Puntos Actuales</p>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-600 text-xl">{combo.decayedPoints || combo.totalPoints}</span>
                    {getTrendIcon(combo.trend)}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-gray-600 text-xs mb-1">Usos Recientes</p>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 text-xl">{getRecentUses(combo, 4)}</span>
                    <span className="text-gray-500 text-xs">/4sem</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-gray-600 text-xs mb-1">Total Histórico</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600 text-xl">{combo.appearances || 0}</span>
                  </div>
                </div>
              </div>

              {combo.lastAppearanceDate && (
                <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Última aparición: {new Date(combo.lastAppearanceDate).toLocaleDateString('es-ES')}
                </div>
              )}

              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateRecord(combo.id, 'win')}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    + Victoria (+25 pts)
                  </button>
                  <button
                    onClick={() => updateRecord(combo.id, 'loss')}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    + Derrota (-15 pts)
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {sortedCombos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No hay combos registrados. ¡Agrega tu primer combo!</p>
          </div>
        )}
      </div>

      {/* Tabla completa de todos los combos */}
      {sortedCombos.length > 0 && (
        <div id="all-combos-table" className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Tabla Completa de Combos</h3>
            <a 
              href="#top-10-combos"
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm"
            >
              <Trophy className="w-4 h-4" />
              Volver al Top 10
            </a>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Combo</th>
                    <th className="px-4 py-3 text-center">Modo</th>
                    <th className="px-4 py-3 text-center">Puntos</th>
                    <th className="px-4 py-3 text-center">Tendencia</th>
                    <th className="px-4 py-3 text-center">Apariciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCombos.map((combo: Combo, index: number) => {
                    const comboModeLabel = combo.mode === 'custom' ? 'Custom' : 'Standard';
                    const comboName = combo.mode === 'standard'
                      ? `${getPieceName(combo.blade)} • ${getPieceName(combo.ratchet)} • ${getPieceName(combo.bit)}`
                      : `${getPieceName(combo.lockChip)} • ${getPieceName(combo.mainBlade)} • ${getPieceName(combo.assistBlade)} • ${getPieceName(combo.ratchet)} • ${getPieceName(combo.bit)}`;
                    
                    return (
                      <tr 
                        key={combo.id}
                        className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                          index < 3 ? 'bg-yellow-50 font-medium' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          {index < 3 ? (
                            <span className="text-yellow-600 font-bold">#{index + 1}</span>
                          ) : (
                            <span className="text-gray-600">#{index + 1}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{combo.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-md">{comboName}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            combo.mode === 'custom' 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {comboModeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-purple-600 font-bold">
                            {combo.decayedPoints || combo.totalPoints}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getTrendIcon(combo.trend)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {combo.appearances}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <CafecitoButton />
    </div>
  );
}
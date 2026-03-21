import { useState, useEffect, useRef } from 'react';
import { Trophy, ArrowLeft, Play, Edit, RotateCcw, UserPlus, X, Flag, Plus, UserX, UserCheck } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useSync } from '../contexts/SyncContext';
import { assignGlobalSequenceToTournament, syncTournamentDataToRankings } from '../utils/tournamentStats';
import { extractTop10CombosFromTournament } from '../utils/extractTopCombos';

interface Player {
  id: string;
  name: string;
  userId?: string;
  profilePicture?: string;
  deckId?: string;
  deckBeyblades?: any[];
  deckName?: string;
  eliminated?: boolean;
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  winner: string | null;
  player1Score: number;
  player2Score: number;
}

interface SingleEliminationTournamentProps {
  tournamentId: string;
  onBack: () => void;
}

export function SingleEliminationTournament({ tournamentId: tournamentProp, onBack }: SingleEliminationTournamentProps) {
  const { user } = useUser();
  const { tournaments, saveTournament, users, decks, combos, saveCombo, catalog } = useSync();
  
  const [tournamentName, setTournamentName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [tournamentStatus, setTournamentStatus] = useState<'preparing' | 'active' | 'finished'>('preparing');
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [player1Score, setPlayer1Score] = useState('');
  const [player2Score, setPlayer2Score] = useState('');
  const [showDeckSelectionModal, setShowDeckSelectionModal] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [userDecks, setUserDecks] = useState<any[]>([]);
  const isFinalizingTournamentRef = useRef(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Auto-sync tournament data from SyncContext
  useEffect(() => {
    const tournament = tournaments.find(t => t.id === tournamentProp);
    if (tournament) {
      setTournamentName(tournament.name || '');
      setTotalRounds(tournament.totalRounds || 0);
      setPlayers(tournament.players || []);
      setMatches(tournament.matches || []);
      setCurrentRound(tournament.currentRound || 0);
      setTournamentStarted(tournament.started || false);
      setTournamentStatus(tournament.status || 'preparing');
    }
  }, [tournaments, tournamentProp]);

  // Auto-sync user's decks
  useEffect(() => {
    setUserDecks(decks || []);
  }, [decks]);

  // Calculate tournament rounds based on players
  const calculateBracketRounds = (playerCount: number): number => {
    if (playerCount < 2) return 0;
    return Math.ceil(Math.log2(playerCount));
  };

  // Save tournament data
  const saveTournamentData = async (updatedData: Partial<any>) => {
    const tournament = tournaments.find(t => t.id === tournamentProp);
    const updatedTournament = {
      ...(tournament || {}),
      id: tournamentProp,
      name: tournamentName,
      totalRounds: updatedData.totalRounds !== undefined ? updatedData.totalRounds : totalRounds,
      players: updatedData.players !== undefined ? updatedData.players : players,
      matches: updatedData.matches !== undefined ? updatedData.matches : matches,
      currentRound: updatedData.currentRound !== undefined ? updatedData.currentRound : currentRound,
      started: updatedData.started !== undefined ? updatedData.started : tournamentStarted,
      createdAt: tournament?.createdAt || new Date().toISOString(),
      createdBy: tournament?.createdBy || user?.username || 'Unknown',
      playerCount: updatedData.players?.length || players.length,
      format: 'single-elimination',
      status: tournament?.globalSequence ? 'finished' : (updatedData.started !== undefined ? updatedData.started : tournamentStarted) ? 'active' : 'preparing',
    };

    await saveTournament(updatedTournament);
  };

  // Add player with deck selection (self-registration)
  const addPlayer = async () => {
    if (!user) return;
    setShowDeckSelectionModal(true);
  };

  // Add player manually (admin only)
  const addPlayerManually = () => {
    if (!isAdmin) return;
    setShowAddPlayerModal(true);
  };

  const confirmAddPlayerManually = async () => {
    if (!newPlayerName.trim()) {
      alert('Debes ingresar un nombre');
      return;
    }

    const newPlayer: Player = {
      id: `${Date.now()}-${Math.random()}`,
      name: newPlayerName.trim(),
      eliminated: false,
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    await saveTournamentData({ players: updatedPlayers });

    setShowAddPlayerModal(false);
    setNewPlayerName('');
  };

  const confirmDeckSelection = async () => {
    if (!selectedDeckId) {
      alert('Debes seleccionar un deck');
      return;
    }

    const selectedDeck = userDecks.find(d => d.id === selectedDeckId);
    if (!selectedDeck) {
      alert('Deck no encontrado');
      return;
    }

    const newPlayer: Player = {
      id: `${Date.now()}-${Math.random()}`,
      name: user.username,
      userId: user.id,
      profilePicture: user.profilePicture,
      deckId: selectedDeck.id,
      deckBeyblades: selectedDeck.beyblades,
      deckName: selectedDeck.name,
      eliminated: false,
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    await saveTournamentData({ players: updatedPlayers });

    setShowDeckSelectionModal(false);
    setSelectedDeckId('');
  };

  // Remove player
  const removePlayer = async (playerId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este jugador?')) return;

    const updatedPlayers = players.filter(p => p.id !== playerId);
    setPlayers(updatedPlayers);
    await saveTournamentData({ players: updatedPlayers });
  };

  // Rollback round - recalculate bracket
  const rollbackRound = async () => {
    if (!isAdmin) {
      alert('Solo los administradores pueden retroceder rondas');
      return;
    }

    if (currentRound <= 1) {
      alert('No se puede retroceder desde la primera ronda');
      return;
    }

    if (!confirm(`⚠️ ¿Retroceder de ${getRoundName(currentRound)} a ${getRoundName(currentRound - 1)}?\n\nEsto eliminará todos los partidos de las rondas ${currentRound} en adelante y recalculará el bracket.\n\n⚠️ Esta acción NO se puede deshacer.`)) {
      return;
    }

    // Keep only matches from previous rounds
    const updatedMatches = matches.filter(m => m.round < currentRound);

    // Recalculate bracket from the rollback round
    const newCurrentRound = currentRound - 1;
    
    setMatches(updatedMatches);
    setCurrentRound(newCurrentRound);

    await saveTournamentData({
      matches: updatedMatches,
      currentRound: newCurrentRound,
    });

    alert(`✅ Retrocedido a ${getRoundName(newCurrentRound)}`);
  };

  // Start tournament
  const startTournament = async () => {
    if (players.length < 2) {
      alert('Se necesitan al menos 2 jugadores para iniciar el torneo');
      return;
    }

    // Calculate rounds
    const rounds = calculateBracketRounds(players.length);

    // Shuffle players randomly
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Calculate bracket size (next power of 2)
    const bracketSize = Math.pow(2, rounds);

    // Create first round matches
    const firstRoundMatches: Match[] = [];

    // Add matches for available players
    for (let i = 0; i < bracketSize / 2; i++) {
      const player1 = shuffledPlayers[i * 2] || null;
      const player2 = shuffledPlayers[i * 2 + 1] || null;

      firstRoundMatches.push({
        id: `match-${Date.now()}-${i}`,
        round: 1,
        matchNumber: i + 1,
        player1,
        player2,
        winner: player1 && !player2 ? player1.id : player2 && !player1 ? player2.id : null,
        player1Score: 0,
        player2Score: 0,
      });
    }

    setMatches(firstRoundMatches);
    setCurrentRound(1);
    setTotalRounds(rounds);
    setTournamentStarted(true);

    await saveTournamentData({
      players: shuffledPlayers,
      matches: firstRoundMatches,
      currentRound: 1,
      totalRounds: rounds,
      started: true,
    });
  };

  // Open score modal
  const openScoreModal = (match: Match) => {
    setSelectedMatch(match);
    setPlayer1Score('');
    setPlayer2Score('');
    setShowScoreModal(true);
  };

  // Submit match result
  const submitMatchResult = async () => {
    if (!selectedMatch) return;

    const p1Score = parseInt(player1Score) || 0;
    const p2Score = parseInt(player2Score) || 0;

    if (p1Score === p2Score) {
      alert('No puede haber empates en eliminación directa. Debe haber un ganador.');
      return;
    }

    const winner = p1Score > p2Score ? selectedMatch.player1!.id : selectedMatch.player2!.id;

    // Update match
    const updatedMatches = matches.map(m =>
      m.id === selectedMatch.id
        ? { ...m, winner, player1Score: p1Score, player2Score: p2Score }
        : m
    );

    setMatches(updatedMatches);
    await saveTournamentData({ matches: updatedMatches });

    setShowScoreModal(false);
    setSelectedMatch(null);
    setPlayer1Score('');
    setPlayer2Score('');
  };

  // Edit match result (revert and allow re-entry)
  const editMatchResult = (match: Match) => {
    if (!isAdmin) return;

    // Only allow editing matches from current round
    if (match.round !== currentRound) {
      alert('Solo puedes editar partidos de la ronda actual');
      return;
    }

    if (!confirm(`¿Editar el resultado de este partido?\n\n${match.player1?.name} vs ${match.player2?.name}\n\nSe borrará el resultado actual y podrás ingresarlo nuevamente.`)) {
      return;
    }

    // Reset the match
    const updatedMatches = matches.map(m =>
      m.id === match.id
        ? { ...m, winner: null, player1Score: 0, player2Score: 0 }
        : m
    );

    setMatches(updatedMatches);
    saveTournamentData({ matches: updatedMatches });
  };

  // Advance to next round
  const advanceToNextRound = async () => {
    const currentRoundMatches = matches.filter(m => m.round === currentRound);
    const allMatchesComplete = currentRoundMatches.every(m => m.winner);

    if (!allMatchesComplete) {
      alert('Debes completar todos los partidos de la ronda actual antes de avanzar');
      return;
    }

    // Get winners
    const winners = currentRoundMatches.map(m => {
      const winnerPlayer = m.winner === m.player1?.id ? m.player1 : m.player2;
      return winnerPlayer!;
    });

    // Check if tournament is finished
    if (currentRound === totalRounds) {
      await finalizeTournament();
      return;
    }

    // Create next round matches
    const nextRoundMatches: Match[] = [];
    for (let i = 0; i < winners.length / 2; i++) {
      nextRoundMatches.push({
        id: `match-${Date.now()}-${i}`,
        round: currentRound + 1,
        matchNumber: i + 1,
        player1: winners[i * 2],
        player2: winners[i * 2 + 1],
        winner: null,
        player1Score: 0,
        player2Score: 0,
      });
    }

    const updatedMatches = [...matches, ...nextRoundMatches];
    setMatches(updatedMatches);
    setCurrentRound(currentRound + 1);

    await saveTournamentData({
      matches: updatedMatches,
      currentRound: currentRound + 1,
    });
  };

  // Finalize tournament
  const finalizeTournament = async () => {
    try {
      if (isFinalizingTournamentRef.current) {
        console.log('⏭️ Tournament finalization already in progress, skipping');
        return;
      }

      const tournament = tournaments.find(t => t.id === tournamentProp);
      if (tournament?.globalSequence) {
        console.log('✅ Tournament already finalized');
        return;
      }

      isFinalizingTournamentRef.current = true;

      const globalSequence = assignGlobalSequenceToTournament(tournamentProp);
      const finalStandings = calculateFinalStandings();

      if (tournament) {
        const updatedTournament = {
          ...tournament,
          globalSequence,
          status: 'finished',
          players: finalStandings,
          matches,
          currentRound,
          name: tournamentName,
          totalRounds,
        };

        await saveTournament(updatedTournament);
        await syncTournamentDataToRankings(globalSequence, finalStandings, saveTournament);

        try {
          await extractTop10CombosFromTournament(tournamentProp, finalStandings, decks, combos, saveCombo, catalog);
        } catch (error) {
          console.error('⚠️ Error extracting combos:', error);
        }
      }

      setTournamentStatus('finished');
      alert('🏆 ¡Torneo Completo!\n\nLos puntos han sido asignados al ranking.\n\nRevisa la pestaña CLASIFICACIÓN para ver la clasificación actualizada.');
    } catch (error) {
      console.error('❌ Error finalizing tournament:', error);
    } finally {
      isFinalizingTournamentRef.current = false;
    }
  };

  // Calculate final standings based on elimination round
  const calculateFinalStandings = (): Player[] => {
    const standings: Player[] = [];
    const roundResults: Map<number, { winners: Player[], losers: Player[] }> = new Map();

    for (let round = totalRounds; round >= 1; round--) {
      const roundMatches = matches.filter(m => m.round === round);
      const winners: Player[] = [];
      const losers: Player[] = [];

      roundMatches.forEach(match => {
        if (match.winner) {
          const winnerPlayer = match.winner === match.player1?.id ? match.player1 : match.player2;
          const loserPlayer = match.winner === match.player1?.id ? match.player2 : match.player1;
          
          if (winnerPlayer) winners.push(winnerPlayer);
          if (loserPlayer) losers.push(loserPlayer);
        }
      });

      roundResults.set(round, { winners, losers });
    }

    const finalMatch = matches.find(m => m.round === totalRounds);
    if (finalMatch?.winner) {
      const champion = finalMatch.winner === finalMatch.player1?.id ? finalMatch.player1 : finalMatch.player2;
      if (champion) {
        standings.push({ ...champion, points: 0, wins: 0, losses: 0, draws: 0 } as any);
      }

      const runnerUp = finalMatch.winner === finalMatch.player1?.id ? finalMatch.player2 : finalMatch.player1;
      if (runnerUp) {
        standings.push({ ...runnerUp, points: 0, wins: 0, losses: 0, draws: 0 } as any);
      }
    }

    for (let round = totalRounds - 1; round >= 1; round--) {
      const roundData = roundResults.get(round);
      if (roundData?.losers) {
        roundData.losers.forEach((player: Player) => {
          if (!standings.find(p => p.id === player.id)) {
            standings.push({ ...player, points: 0, wins: 0, losses: 0, draws: 0 } as any);
          }
        });
      }
    }

    return standings;
  };

  // Get round name
  const getRoundName = (round: number): string => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semifinal';
    if (round === totalRounds - 2) return 'Cuartos de Final';
    if (round === totalRounds - 3) return 'Octavos de Final';
    return `Ronda ${round}`;
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'developer';
  const currentRoundMatches = matches.filter(m => m.round === currentRound);
  const allCurrentMatchesComplete = currentRoundMatches.every(m => m.winner);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <Trophy className="w-8 h-8 text-orange-500" />
          <div>
            <h2 className="text-gray-900">{tournamentName || 'Torneo Eliminación Directa'}</h2>
            <p className="text-sm text-gray-500">Formato: Eliminación Directa</p>
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && tournamentStarted && tournamentStatus !== 'finished' && currentRound > 1 && (
          <button
            onClick={rollbackRound}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="hidden sm:inline">Retroceder Ronda</span>
          </button>
        )}
      </div>

      {/* Status Banner */}
      {tournamentStatus === 'finished' && (
        <div className="mb-6 bg-green-100 border-2 border-green-500 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          <span className="font-medium">Torneo Finalizado - Resultados bloqueados</span>
        </div>
      )}

      {/* Pre-tournament: Player Registration */}
      {!tournamentStarted && tournamentStatus !== 'finished' && (
        <div className="space-y-4">
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
            <h3 className="mb-2 text-orange-900">Registro de Jugadores</h3>
            <p className="text-sm text-orange-800 mb-3">
              Registra a todos los jugadores antes de iniciar el torneo. Se sortearán automáticamente en un bracket.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={addPlayer}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Registrarse
              </button>

              {isAdmin && (
                <button
                  onClick={addPlayerManually}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Jugador
                </button>
              )}
            </div>
          </div>

          {/* Players List */}
          {players.length > 0 && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <h3 className="mb-3">Jugadores Registrados ({players.length})</h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      {player.profilePicture && (
                        <img src={player.profilePicture} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <div>
                        <p className="font-medium">{player.name}</p>
                        {player.deckName && (
                          <p className="text-xs text-gray-500">Deck: {player.deckName}</p>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Tournament */}
          {isAdmin && players.length >= 2 && (
            <button
              onClick={startTournament}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
            >
              <Play className="w-6 h-6" />
              Iniciar Torneo
            </button>
          )}
        </div>
      )}

      {/* Tournament in progress */}
      {tournamentStarted && (
        <div className="space-y-6">
          {/* Round Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{getRoundName(currentRound)}</h3>
                <p className="text-sm opacity-90">Ronda {currentRound} de {totalRounds}</p>
              </div>
              {allCurrentMatchesComplete && currentRound < totalRounds && isAdmin && (
                <button
                  onClick={advanceToNextRound}
                  className="bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Siguiente Ronda
                </button>
              )}
              {allCurrentMatchesComplete && currentRound === totalRounds && isAdmin && (
                <button
                  onClick={finalizeTournament}
                  className="bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
                >
                  <Flag className="w-5 h-5" />
                  Finalizar Torneo
                </button>
              )}
            </div>
          </div>

          {/* Matches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentRoundMatches.map((match) => (
              <div
                key={match.id}
                className={`border-2 rounded-xl p-4 ${
                  match.winner ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
                }`}
              >
                <p className="text-sm text-gray-500 mb-3">Partido {match.matchNumber}</p>
                
                <div className="space-y-2">
                  {/* Player 1 */}
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    match.winner === match.player1?.id ? 'bg-green-200' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      {match.player1?.profilePicture && (
                        <img src={match.player1.profilePicture} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <span className="font-medium">{match.player1?.name || 'BYE'}</span>
                    </div>
                    {match.winner && <span className="text-lg font-bold">{match.player1Score}</span>}
                  </div>

                  {/* Player 2 */}
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    match.winner === match.player2?.id ? 'bg-green-200' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      {match.player2?.profilePicture && (
                        <img src={match.player2.profilePicture} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <span className="font-medium">{match.player2?.name || 'BYE'}</span>
                    </div>
                    {match.winner && <span className="text-lg font-bold">{match.player2Score}</span>}
                  </div>
                </div>

                {/* Actions */}
                {!match.winner && match.player1 && match.player2 && isAdmin && tournamentStatus !== 'finished' && (
                  <button
                    onClick={() => openScoreModal(match)}
                    className="w-full mt-3 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Ingresar Resultado
                  </button>
                )}

                {match.winner && match.round === currentRound && isAdmin && tournamentStatus !== 'finished' && (
                  <button
                    onClick={() => editMatchResult(match)}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Resultado
                  </button>
                )}

                {match.winner && (
                  <div className="mt-3 text-center">
                    <span className="text-sm text-green-700 font-medium flex items-center justify-center gap-1">
                      <Trophy className="w-4 h-4" />
                      Ganador: {match.winner === match.player1?.id ? match.player1.name : match.player2?.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8">
            <h3 className="mb-4">Ingresar Resultado</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  {selectedMatch.player1?.name} - Puntos
                </label>
                <input
                  type="number"
                  min="0"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  {selectedMatch.player2?.name} - Puntos
                </label>
                <input
                  type="number"
                  min="0"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>

              <p className="text-xs text-orange-600">
                ⚠️ No puede haber empates en eliminación directa
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScoreModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={submitMatchResult}
                className="flex-1 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deck Selection Modal */}
      {showDeckSelectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8">
            <h3 className="mb-4">Selecciona tu Deck</h3>
            
            {userDecks.length === 0 ? (
              <p className="text-gray-600 mb-4">No tienes decks creados. Ve a la sección Colección para crear uno.</p>
            ) : (
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {userDecks.map((deck) => (
                  <button
                    key={deck.id}
                    onClick={() => setSelectedDeckId(deck.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedDeckId === deck.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <p className="font-medium">{deck.name}</p>
                    <p className="text-sm text-gray-500">{deck.beyblades?.length || 0} beyblades</p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeckSelectionModal(false);
                  setSelectedDeckId('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              {userDecks.length > 0 && (
                <button
                  onClick={confirmDeckSelection}
                  className="flex-1 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                >
                  Confirmar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Player Manually Modal (Admin) */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8">
            <h3 className="mb-4">Agregar Jugador Manualmente</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Nombre del Jugador
                </label>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingresa el nombre"
                  onKeyPress={(e) => e.key === 'Enter' && confirmAddPlayerManually()}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddPlayerModal(false);
                  setNewPlayerName('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAddPlayerManually}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
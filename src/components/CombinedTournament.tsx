import { useState, useEffect, useRef } from 'react';
import { Trophy, ArrowLeft, Play, Edit, RotateCcw, UserPlus, X, Flag, Target, Zap, Plus } from 'lucide-react';
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
  points: number;
  wins: number;
  losses: number;
  draws: number;
  opponents: string[];
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
  isElimination?: boolean;
  isThirdPlaceMatch?: boolean; // NEW: Special match for 3rd place
}

interface CombinedTournamentProps {
  tournamentId: string;
  onBack: () => void;
}

export function CombinedTournament({ tournamentId: tournamentProp, onBack }: CombinedTournamentProps) {
  const { user } = useUser();
  const { tournaments, saveTournament, users, decks, combos, saveCombo, catalog } = useSync();
  
  const [tournamentName, setTournamentName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [swissRounds, setSwissRounds] = useState(3);
  const [topCut, setTopCut] = useState(8);
  const [totalRounds, setTotalRounds] = useState(0);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [tournamentPhase, setTournamentPhase] = useState<'swiss' | 'elimination'>('swiss');
  const [eliminationRound, setEliminationRound] = useState(0);
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
      setPlayers(tournament.players || []);
      setMatches(tournament.matches || []);
      setCurrentRound(tournament.currentRound || 0);
      setTournamentStarted(tournament.started || false);
      setTournamentStatus(tournament.status || 'preparing');
      setTournamentPhase(tournament.phase || 'swiss');
      setEliminationRound(tournament.eliminationRound || 0);
      
      if (tournament.combinedSettings) {
        setSwissRounds(tournament.combinedSettings.swissRounds || 3);
        setTopCut(tournament.combinedSettings.topCut || 8);
      }
      
      const eliminationRoundsCount = Math.ceil(Math.log2(tournament.combinedSettings?.topCut || 8));
      setTotalRounds((tournament.combinedSettings?.swissRounds || 3) + eliminationRoundsCount);
    }
  }, [tournaments, tournamentProp]);

  // Auto-sync user's decks
  useEffect(() => {
    setUserDecks(decks || []);
  }, [decks]);

  // Save tournament data
  const saveTournamentData = async (updatedData: Partial<any>) => {
    const tournament = tournaments.find(t => t.id === tournamentProp);
    const updatedTournament = {
      ...(tournament || {}),
      id: tournamentProp,
      name: tournamentName,
      players: updatedData.players !== undefined ? updatedData.players : players,
      matches: updatedData.matches !== undefined ? updatedData.matches : matches,
      currentRound: updatedData.currentRound !== undefined ? updatedData.currentRound : currentRound,
      started: updatedData.started !== undefined ? updatedData.started : tournamentStarted,
      phase: updatedData.phase !== undefined ? updatedData.phase : tournamentPhase,
      eliminationRound: updatedData.eliminationRound !== undefined ? updatedData.eliminationRound : eliminationRound,
      swissStandings: updatedData.swissStandings !== undefined ? updatedData.swissStandings : tournament?.swissStandings, // CRITICAL: Preserve swissStandings!
      createdAt: tournament?.createdAt || new Date().toISOString(),
      createdBy: tournament?.createdBy || user?.username || 'Unknown',
      playerCount: updatedData.players?.length || players.length,
      totalRounds,
      format: 'combined',
      combinedSettings: { swissRounds, topCut },
      status: tournament?.globalSequence ? 'finished' : (updatedData.started !== undefined ? updatedData.started : tournamentStarted) ? 'active' : 'preparing',
    };

    console.log('💾💾💾 SAVING TOURNAMENT DATA 💾💾💾');
    console.log('swissStandings being saved:', updatedTournament.swissStandings);
    console.log('💾💾💾💾💾💾💾💾💾💾💾💾💾💾💾💾');

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

    // Check if we're in elimination phase
    if (tournamentPhase === 'elimination') {
      alert('No se pueden agregar jugadores durante la fase de eliminación');
      return;
    }

    const newPlayer: Player = {
      id: `${Date.now()}-${Math.random()}`,
      name: newPlayerName.trim(),
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      opponents: [],
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

    // Check if we're in elimination phase
    if (tournamentPhase === 'elimination') {
      alert('No se pueden agregar jugadores durante la fase de eliminación');
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
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      opponents: [],
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

  // Rollback round - handles both swiss and elimination phases
  const rollbackRound = async () => {
    if (!isAdmin) {
      alert('Solo los administradores pueden retroceder rondas');
      return;
    }

    if (tournamentPhase === 'swiss') {
      // Swiss phase rollback
      if (currentRound <= 1) {
        alert('No se puede retroceder desde la primera ronda');
        return;
      }

      if (!confirm(`⚠️ ¿Retroceder de Ronda ${currentRound} a Ronda ${currentRound - 1}?\n\nEsto eliminará todos los partidos de la Ronda ${currentRound} y revertirá las estadísticas.\n\n⚠️ Esta acción NO se puede deshacer.`)) {
        return;
      }

      // Get matches to revert
      const matchesToRevert = matches.filter(m => m.round === currentRound && !m.isElimination);

      // Revert player stats
      const revertedPlayers = players.map(player => {
        const playerMatches = matchesToRevert.filter(m => 
          m.player1?.id === player.id || m.player2?.id === player.id
        );

        let pointsToRemove = 0;
        let winsToRemove = 0;
        let lossesToRemove = 0;
        let drawsToRemove = 0;
        const opponentsToRemove = new Set<string>();

        playerMatches.forEach(match => {
          if (match.winner === player.id) {
            pointsToRemove += 3;
            winsToRemove += 1;
            const opponentId = match.player1?.id === player.id ? match.player2?.id : match.player1?.id;
            if (opponentId) opponentsToRemove.add(opponentId);
          } else if (match.winner === null && match.player1 && match.player2) {
            pointsToRemove += 1;
            drawsToRemove += 1;
            const opponentId = match.player1?.id === player.id ? match.player2?.id : match.player1?.id;
            if (opponentId) opponentsToRemove.add(opponentId);
          } else if (match.winner && match.winner !== player.id) {
            lossesToRemove += 1;
            const opponentId = match.player1?.id === player.id ? match.player2?.id : match.player1?.id;
            if (opponentId) opponentsToRemove.add(opponentId);
          }
        });

        return {
          ...player,
          points: Math.max(0, player.points - pointsToRemove),
          wins: Math.max(0, player.wins - winsToRemove),
          losses: Math.max(0, player.losses - lossesToRemove),
          draws: Math.max(0, player.draws - drawsToRemove),
          opponents: player.opponents.filter(opp => !opponentsToRemove.has(opp)),
        };
      });

      // Remove matches from current round
      const updatedMatches = matches.filter(m => m.round !== currentRound || m.isElimination);

      setPlayers(revertedPlayers);
      setMatches(updatedMatches);
      setCurrentRound(currentRound - 1);

      await saveTournamentData({
        players: revertedPlayers,
        matches: updatedMatches,
        currentRound: currentRound - 1,
      });

      alert(`✅ Retrocedido a Ronda ${currentRound - 1}`);

    } else {
      // Elimination phase rollback
      if (eliminationRound === 1) {
        // Going back to swiss phase
        if (!confirm(`⚠️ ¿Volver a la fase suiza?\n\nEsto eliminará todo el bracket de eliminación y volverás a la última ronda suiza.\n\n⚠️ Esta acción NO se puede deshacer.`)) {
          return;
        }

        // Remove all elimination matches
        const updatedMatches = matches.filter(m => !m.isElimination);

        setMatches(updatedMatches);
        setTournamentPhase('swiss');
        setEliminationRound(0);
        setCurrentRound(swissRounds);

        await saveTournamentData({
          matches: updatedMatches,
          phase: 'swiss',
          eliminationRound: 0,
          currentRound: swissRounds,
        });

        alert(`✅ Vuelto a Fase Suiza - Ronda ${swissRounds}`);

      } else {
        // Going back one elimination round
        if (!confirm(`⚠️ ¿Retroceder de ${getEliminationRoundName(eliminationRound)} a ${getEliminationRoundName(eliminationRound - 1)}?\n\nEsto eliminará todos los partidos de ${getEliminationRoundName(eliminationRound)} y recalculará el bracket.\n\n⚠️ Esta acción NO se puede deshacer.`)) {
          return;
        }

        // Remove matches from current elimination round
        const updatedMatches = matches.filter(m => !m.isElimination || m.round < eliminationRound);

        setMatches(updatedMatches);
        setEliminationRound(eliminationRound - 1);

        await saveTournamentData({
          matches: updatedMatches,
          eliminationRound: eliminationRound - 1,
        });

        alert(`✅ Retrocedido a ${getEliminationRoundName(eliminationRound - 1)}`);
      }
    }
  };

  // Start tournament (Swiss phase)
  const startTournament = async () => {
    if (players.length < 2) {
      alert('Se necesitan al menos 2 jugadores para iniciar el torneo');
      return;
    }

    if (players.length < topCut) {
      alert(`Se necesitan al menos ${topCut} jugadores para el corte a Top ${topCut}`);
      return;
    }

    const firstRoundMatches = generateSwissRound(players, 1);

    setMatches(firstRoundMatches);
    setCurrentRound(1);
    setTournamentStarted(true);
    setTournamentPhase('swiss');

    await saveTournamentData({
      matches: firstRoundMatches,
      currentRound: 1,
      started: true,
      phase: 'swiss',
    });
  };

  // Generate Swiss round pairings
  const generateSwissRound = (currentPlayers: Player[], round: number): Match[] => {
    const sortedPlayers = [...currentPlayers].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return 0;
    });

    const paired: Set<string> = new Set();
    const newMatches: Match[] = [];
    let matchNumber = 1;

    for (let i = 0; i < sortedPlayers.length; i++) {
      if (paired.has(sortedPlayers[i].id)) continue;

      const player1 = sortedPlayers[i];
      let player2: Player | null = null;

      for (let j = i + 1; j < sortedPlayers.length; j++) {
        if (paired.has(sortedPlayers[j].id)) continue;
        if (!player1.opponents.includes(sortedPlayers[j].id)) {
          player2 = sortedPlayers[j];
          break;
        }
      }

      if (!player2) {
        for (let j = i + 1; j < sortedPlayers.length; j++) {
          if (!paired.has(sortedPlayers[j].id)) {
            player2 = sortedPlayers[j];
            break;
          }
        }
      }

      if (player2) {
        newMatches.push({
          id: `match-${Date.now()}-${matchNumber}`,
          round,
          matchNumber,
          player1,
          player2,
          winner: null,
          player1Score: 0,
          player2Score: 0,
          isElimination: false,
        });

        paired.add(player1.id);
        paired.add(player2.id);
        matchNumber++;
      } else {
        const updatedPlayer = { ...player1, points: player1.points + 3 };
        const playerIndex = currentPlayers.findIndex(p => p.id === player1.id);
        if (playerIndex !== -1) {
          currentPlayers[playerIndex] = updatedPlayer;
        }
      }
    }

    return newMatches;
  };

  // Open score modal
  const openScoreModal = (match: Match) => {
    setSelectedMatch(match);
    setPlayer1Score('');
    setPlayer2Score('');
    setShowScoreModal(true);
  };

  // Submit match result (Swiss phase)
  const submitSwissMatchResult = async () => {
    if (!selectedMatch) return;

    const p1Score = parseInt(player1Score) || 0;
    const p2Score = parseInt(player2Score) || 0;

    let winner: string | null = null;
    if (p1Score > p2Score) winner = selectedMatch.player1!.id;
    else if (p2Score > p1Score) winner = selectedMatch.player2!.id;

    const updatedMatches = matches.map(m =>
      m.id === selectedMatch.id
        ? { ...m, winner, player1Score: p1Score, player2Score: p2Score }
        : m
    );

    const updatedPlayers = players.map(p => {
      if (p.id === selectedMatch.player1!.id) {
        return {
          ...p,
          points: p.points + (winner === p.id ? 3 : winner === null ? 1 : 0),
          wins: p.wins + (winner === p.id ? 1 : 0),
          losses: p.losses + (winner === selectedMatch.player2!.id ? 1 : 0),
          draws: p.draws + (winner === null ? 1 : 0),
          opponents: [...p.opponents, selectedMatch.player2!.id],
        };
      }
      if (p.id === selectedMatch.player2!.id) {
        return {
          ...p,
          points: p.points + (winner === p.id ? 3 : winner === null ? 1 : 0),
          wins: p.wins + (winner === p.id ? 1 : 0),
          losses: p.losses + (winner === selectedMatch.player1!.id ? 1 : 0),
          draws: p.draws + (winner === null ? 1 : 0),
          opponents: [...p.opponents, selectedMatch.player1!.id],
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    setMatches(updatedMatches);
    await saveTournamentData({ players: updatedPlayers, matches: updatedMatches });

    setShowScoreModal(false);
    setSelectedMatch(null);
    setPlayer1Score('');
    setPlayer2Score('');
  };

  // Submit match result (Elimination phase)
  const submitEliminationMatchResult = async () => {
    if (!selectedMatch) return;

    const p1Score = parseInt(player1Score) || 0;
    const p2Score = parseInt(player2Score) || 0;

    if (p1Score === p2Score) {
      alert('No puede haber empates en eliminación directa. Debe haber un ganador.');
      return;
    }

    const winner = p1Score > p2Score ? selectedMatch.player1!.id : selectedMatch.player2!.id;

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

  // Edit match result (handles both Swiss and Elimination phases)
  const editMatchResult = (match: Match) => {
    if (!isAdmin) return;

    // Check if editing is allowed
    if (tournamentPhase === 'swiss') {
      // Swiss phase: only allow editing matches from current round
      if (match.round !== currentRound) {
        alert('Solo puedes editar partidos de la ronda actual');
        return;
      }

      if (!confirm(`¿Editar el resultado de este partido?\n\n${match.player1?.name} vs ${match.player2?.name}\n\nSe revertirán las estadísticas y podrás ingresar el resultado nuevamente.`)) {
        return;
      }

      // Revert player stats
      const updatedPlayers = players.map(player => {
        if (player.id === match.player1?.id) {
          const pointsToRemove = match.winner === player.id ? 3 : match.winner === null ? 1 : 0;
          const winsToRemove = match.winner === player.id ? 1 : 0;
          const lossesToRemove = match.winner && match.winner !== player.id ? 1 : 0;
          const drawsToRemove = match.winner === null ? 1 : 0;

          return {
            ...player,
            points: Math.max(0, player.points - pointsToRemove),
            wins: Math.max(0, player.wins - winsToRemove),
            losses: Math.max(0, player.losses - lossesToRemove),
            draws: Math.max(0, player.draws - drawsToRemove),
            opponents: player.opponents.filter(opp => opp !== match.player2?.id),
          };
        }
        if (player.id === match.player2?.id) {
          const pointsToRemove = match.winner === player.id ? 3 : match.winner === null ? 1 : 0;
          const winsToRemove = match.winner === player.id ? 1 : 0;
          const lossesToRemove = match.winner && match.winner !== player.id ? 1 : 0;
          const drawsToRemove = match.winner === null ? 1 : 0;

          return {
            ...player,
            points: Math.max(0, player.points - pointsToRemove),
            wins: Math.max(0, player.wins - winsToRemove),
            losses: Math.max(0, player.losses - lossesToRemove),
            draws: Math.max(0, player.draws - drawsToRemove),
            opponents: player.opponents.filter(opp => opp !== match.player1?.id),
          };
        }
        return player;
      });

      // Reset match
      const updatedMatches = matches.map(m =>
        m.id === match.id
          ? { ...m, winner: null, player1Score: 0, player2Score: 0 }
          : m
      );

      setPlayers(updatedPlayers);
      setMatches(updatedMatches);
      saveTournamentData({ players: updatedPlayers, matches: updatedMatches });

    } else {
      // Elimination phase: only allow editing matches from current elimination round
      if (match.round !== eliminationRound) {
        alert('Solo puedes editar partidos de la ronda actual');
        return;
      }

      if (!confirm(`¿Editar el resultado de este partido?\n\n${match.player1?.name} vs ${match.player2?.name}\n\nSe borrará el resultado actual y podrás ingresarlo nuevamente.`)) {
        return;
      }

      // Reset match
      const updatedMatches = matches.map(m =>
        m.id === match.id
          ? { ...m, winner: null, player1Score: 0, player2Score: 0 }
          : m
      );

      setMatches(updatedMatches);
      saveTournamentData({ matches: updatedMatches });
    }
  };

  // Advance to next swiss round
  const advanceSwissRound = async () => {
    const currentRoundMatches = matches.filter(m => m.round === currentRound && !m.isElimination);
    const allMatchesComplete = currentRoundMatches.every(m => m.winner !== null || (m.player1Score === 0 && m.player2Score === 0 && m.winner === null));

    if (!allMatchesComplete) {
      alert('Debes completar todos los partidos de la ronda actual antes de avanzar');
      return;
    }

    if (currentRound >= swissRounds) {
      await startEliminationPhase();
      return;
    }

    const nextRoundMatches = generateSwissRound(players, currentRound + 1);
    const updatedMatches = [...matches, ...nextRoundMatches];

    setMatches(updatedMatches);
    setCurrentRound(currentRound + 1);

    await saveTournamentData({
      matches: updatedMatches,
      currentRound: currentRound + 1,
    });
  };

  // Start elimination phase
  const startEliminationPhase = async () => {
    const sortedPlayers = [...players].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return 0;
    });

    const topPlayers = sortedPlayers.slice(0, topCut);
    const eliminationMatches: Match[] = [];
    
    for (let i = 0; i < topPlayers.length / 2; i++) {
      eliminationMatches.push({
        id: `elim-match-${Date.now()}-${i}`,
        round: 1,
        matchNumber: i + 1,
        player1: topPlayers[i],
        player2: topPlayers[topPlayers.length - 1 - i],
        winner: null,
        player1Score: 0,
        player2Score: 0,
        isElimination: true,
      });
    }

    const updatedMatches = [...matches, ...eliminationMatches];

    setMatches(updatedMatches);
    setTournamentPhase('elimination');
    setEliminationRound(1);

    console.log('🏆🏆🏆 SAVING SWISS STANDINGS 🏆🏆🏆');
    console.log('Total swiss players:', sortedPlayers.length);
    console.log('Swiss winner (1st place):', sortedPlayers[0]);
    console.log('Swiss winner NAME:', sortedPlayers[0].name);
    console.log('Full swissStandings:', JSON.stringify(sortedPlayers));
    console.log('🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆');

    await saveTournamentData({
      matches: updatedMatches,
      phase: 'elimination',
      eliminationRound: 1,
      swissStandings: sortedPlayers, // NEW: Save swiss standings for league bonus calculation
    });

    alert(`🎯 ¡Fase Suiza Completada!\n\nLos mejores ${topCut} jugadores avanzan a eliminación directa.`);
  };

  // Advance to next elimination round
  const advanceEliminationRound = async () => {
    const currentEliminationMatches = matches.filter(m => m.isElimination && m.round === eliminationRound && !m.isThirdPlaceMatch);
    const allMatchesComplete = currentEliminationMatches.every(m => m.winner);

    if (!allMatchesComplete) {
      alert('Debes completar todos los partidos de la ronda actual antes de avanzar');
      return;
    }

    const winners = currentEliminationMatches.map(m => {
      const winnerPlayer = m.winner === m.player1?.id ? m.player1 : m.player2;
      return winnerPlayer!;
    });

    const eliminationRoundsCount = Math.ceil(Math.log2(topCut));
    
    // Check if we just completed semifinals - need to create 3rd place match
    const isSemifinal = eliminationRound === eliminationRoundsCount - 1;
    
    if (isSemifinal) {
      // Get losers from semifinal
      const semifinalLosers = currentEliminationMatches.map(m => {
        const loser = m.winner === m.player1?.id ? m.player2 : m.player1;
        return loser!;
      });
      
      // Create 3rd place match
      const thirdPlaceMatch: Match = {
        id: `third-place-match-${Date.now()}`,
        round: eliminationRound + 0.5, // Special round between semifinal and final
        matchNumber: 1,
        player1: semifinalLosers[0],
        player2: semifinalLosers[1],
        winner: null,
        player1Score: 0,
        player2Score: 0,
        isElimination: true,
        isThirdPlaceMatch: true,
      };
      
      // Create final match
      const finalMatch: Match = {
        id: `elim-match-${Date.now()}-0`,
        round: eliminationRound + 1,
        matchNumber: 1,
        player1: winners[0],
        player2: winners[1],
        winner: null,
        player1Score: 0,
        player2Score: 0,
        isElimination: true,
      };
      
      const updatedMatches = [...matches, thirdPlaceMatch, finalMatch];
      setMatches(updatedMatches);
      setEliminationRound(eliminationRound + 0.5); // Move to 3rd place match
      
      await saveTournamentData({
        matches: updatedMatches,
        eliminationRound: eliminationRound + 0.5,
      });
      
      alert('🥉 Ahora se jugará el partido por el 3er lugar');
      return;
    }
    
    // Check if we just completed 3rd place match - advance to final
    if (eliminationRound === eliminationRoundsCount - 0.5) {
      const thirdPlaceMatch = matches.find(m => m.isThirdPlaceMatch);
      if (!thirdPlaceMatch?.winner) {
        alert('Debes completar el partido por el 3er lugar antes de avanzar a la final');
        return;
      }
      
      setEliminationRound(eliminationRoundsCount);
      await saveTournamentData({
        eliminationRound: eliminationRoundsCount,
      });
      
      alert('🏆 Ahora se jugará la Final');
      return;
    }

    if (eliminationRound >= eliminationRoundsCount) {
      await finalizeTournament();
      return;
    }

    const nextRoundMatches: Match[] = [];
    for (let i = 0; i < winners.length / 2; i++) {
      nextRoundMatches.push({
        id: `elim-match-${Date.now()}-${i}`,
        round: eliminationRound + 1,
        matchNumber: i + 1,
        player1: winners[i * 2],
        player2: winners[i * 2 + 1],
        winner: null,
        player1Score: 0,
        player2Score: 0,
        isElimination: true,
      });
    }

    const updatedMatches = [...matches, ...nextRoundMatches];
    setMatches(updatedMatches);
    setEliminationRound(eliminationRound + 1);

    await saveTournamentData({
      matches: updatedMatches,
      eliminationRound: eliminationRound + 1,
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
        console.log('🏁 Finalizing tournament with swissStandings:', tournament.swissStandings);
        
        const updatedTournament = {
          ...tournament,
          globalSequence,
          status: 'finished',
          players: finalStandings,
          matches,
          currentRound,
          phase: tournamentPhase,
          eliminationRound,
          name: tournamentName,
          totalRounds,
          swissStandings: tournament.swissStandings, // PRESERVE: Keep swiss standings for league bonus calculation
        };

        console.log('💾 Saving finished tournament with swissStandings:', updatedTournament.swissStandings);

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

  // Calculate final standings
  const calculateFinalStandings = (): Player[] => {
    const standings: Player[] = []
    const eliminationRoundsCount = Math.ceil(Math.log2(topCut));

    // 1st and 2nd place: Final match
    const finalMatch = matches.find(m => m.isElimination && m.round === eliminationRoundsCount && !m.isThirdPlaceMatch);
    if (finalMatch?.winner) {
      const champion = finalMatch.winner === finalMatch.player1?.id ? finalMatch.player1 : finalMatch.player2;
      const runnerUp = finalMatch.winner === finalMatch.player1?.id ? finalMatch.player2 : finalMatch.player1;
      
      if (champion) standings.push(champion);
      if (runnerUp) standings.push(runnerUp);
    }
    
    // 3rd and 4th place: Third place match
    const thirdPlaceMatch = matches.find(m => m.isThirdPlaceMatch);
    if (thirdPlaceMatch?.winner) {
      const thirdPlace = thirdPlaceMatch.winner === thirdPlaceMatch.player1?.id ? thirdPlaceMatch.player1 : thirdPlaceMatch.player2;
      const fourthPlace = thirdPlaceMatch.winner === thirdPlaceMatch.player1?.id ? thirdPlaceMatch.player2 : thirdPlaceMatch.player1;
      
      if (thirdPlace) standings.push(thirdPlace);
      if (fourthPlace) standings.push(fourthPlace);
    }

    // 5th place onwards: losers from earlier rounds
    for (let round = eliminationRoundsCount - 1; round >= 1; round--) {
      const roundMatches = matches.filter(m => m.isElimination && m.round === round && !m.isThirdPlaceMatch);
      roundMatches.forEach(match => {
        if (match.winner) {
          const loser = match.winner === match.player1?.id ? match.player2 : match.player1;
          if (loser && !standings.find(p => p.id === loser.id)) {
            standings.push(loser);
          }
        }
      });
    }

    // Players who didn't make the cut
    const playersNotInCut = players
      .filter(p => !standings.find(s => s.id === p.id))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return 0;
      });

    standings.push(...playersNotInCut);
    return standings;
  };

  // Get elimination round name
  const getEliminationRoundName = (round: number): string => {
    const totalEliminationRounds = Math.ceil(Math.log2(topCut));
    if (round === totalEliminationRounds) return 'Final';
    if (round === totalEliminationRounds - 0.5) return 'Partido por el 3er Lugar';
    if (round === totalEliminationRounds - 1) return 'Semifinal';
    if (round === totalEliminationRounds - 2) return 'Cuartos de Final';
    if (round === totalEliminationRounds - 3) return 'Octavos de Final';
    return `Ronda ${round}`;
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'developer';
  
  const currentMatches = tournamentPhase === 'swiss'
    ? matches.filter(m => m.round === currentRound && !m.isElimination)
    : matches.filter(m => m.isElimination && m.round === eliminationRound);
  
  const allCurrentMatchesComplete = currentMatches.every(m => m.winner !== null || (m.player1Score === 0 && m.player2Score === 0));

  const sortedPlayers = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return 0;
  });

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
          <Zap className="w-8 h-8 text-purple-500" />
          <div>
            <h2 className="text-gray-900">{tournamentName || 'Torneo Combinado'}</h2>
            <p className="text-sm text-gray-500">
              Formato: {tournamentPhase === 'swiss' ? 'Suizo' : 'Eliminación Directa'}
            </p>
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && tournamentStarted && tournamentStatus !== 'finished' && (
          <button
            onClick={rollbackRound}
            disabled={(tournamentPhase === 'swiss' && currentRound <= 1) || (tournamentPhase === 'elimination' && eliminationRound <= 0)}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="hidden sm:inline">Retroceder Ronda</span>
          </button>
        )}
      </div>

      {/* Phase Indicator */}
      {tournamentStarted && tournamentStatus !== 'finished' && (
        <div className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">
                {tournamentPhase === 'swiss' ? '🔄 Fase Suiza' : '🏆 Fase Eliminación Directa'}
              </p>
              <p className="text-2xl font-bold">
                {tournamentPhase === 'swiss' 
                  ? `Ronda ${currentRound} de ${swissRounds}`
                  : getEliminationRoundName(eliminationRound)
                }
              </p>
            </div>
            {tournamentPhase === 'swiss' && (
              <div className="text-right">
                <p className="text-sm opacity-90">Próximo corte</p>
                <p className="text-xl font-bold">Top {topCut}</p>
              </div>
            )}
          </div>
        </div>
      )}

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
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <h3 className="mb-2 text-purple-900">Registro de Jugadores</h3>
            <div className="mb-3 bg-purple-100 border border-purple-300 rounded-lg p-3">
              <p className="text-sm text-purple-900 font-medium mb-2">Configuración del Torneo:</p>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• <strong>{swissRounds}</strong> rondas suizas</li>
                <li>• Corte a <strong>Top {topCut}</strong></li>
                <li>• Los mejores {topCut} avanzan a eliminación directa</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={addPlayer}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
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
          {isAdmin && players.length >= topCut && (
            <button
              onClick={startTournament}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
            >
              <Play className="w-6 h-6" />
              Iniciar Torneo
            </button>
          )}

          {isAdmin && players.length > 0 && players.length < topCut && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              Se necesitan al menos {topCut} jugadores para el corte a Top {topCut}. Actualmente: {players.length} jugador{players.length !== 1 ? 'es' : ''}.
            </div>
          )}
        </div>
      )}

      {/* Tournament in progress */}
      {tournamentStarted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Matches */}
          <div className="lg:col-span-2 space-y-4">
            {/* Round Actions */}
            {isAdmin && allCurrentMatchesComplete && tournamentStatus !== 'finished' && (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                {tournamentPhase === 'swiss' && currentRound < swissRounds && (
                  <button
                    onClick={advanceSwissRound}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Siguiente Ronda Suiza
                  </button>
                )}
                {tournamentPhase === 'swiss' && currentRound >= swissRounds && (
                  <button
                    onClick={startEliminationPhase}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Target className="w-5 h-5" />
                    Iniciar Fase de Eliminación (Top {topCut})
                  </button>
                )}
                {tournamentPhase === 'elimination' && eliminationRound < Math.ceil(Math.log2(topCut)) && (
                  <button
                    onClick={advanceEliminationRound}
                    className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Siguiente Ronda de Eliminación
                  </button>
                )}
                {tournamentPhase === 'elimination' && eliminationRound >= Math.ceil(Math.log2(topCut)) && (
                  <button
                    onClick={finalizeTournament}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Flag className="w-5 h-5" />
                    Finalizar Torneo
                  </button>
                )}
              </div>
            )}

            {/* Add Player During Swiss Phase */}
            {isAdmin && tournamentPhase === 'swiss' && tournamentStatus !== 'finished' && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 flex items-center justify-between">
                <p className="text-sm text-blue-900">Agregar más jugadores durante la fase suiza</p>
                <button
                  onClick={addPlayerManually}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            )}

            {/* Matches */}
            <div className="grid grid-cols-1 gap-4">
              {currentMatches.map((match) => (
                <div
                  key={match.id}
                  className={`border-2 rounded-xl p-4 ${
                    match.winner ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
                  } ${match.isThirdPlaceMatch ? 'border-yellow-400 bg-yellow-50' : ''}`}
                >
                  {match.isThirdPlaceMatch && (
                    <div className="mb-3 flex items-center justify-center">
                      <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        🥉 PARTIDO POR EL 3ER LUGAR
                      </span>
                    </div>
                  )}
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
                        <span className="font-medium">{match.player1?.name || 'TBD'}</span>
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
                        <span className="font-medium">{match.player2?.name || 'TBD'}</span>
                      </div>
                      {match.winner && <span className="text-lg font-bold">{match.player2Score}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  {!match.winner && isAdmin && tournamentStatus !== 'finished' && (
                    <button
                      onClick={() => openScoreModal(match)}
                      className={`w-full mt-3 text-white py-2 rounded-lg transition-colors ${
                        tournamentPhase === 'swiss' 
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      Ingresar Resultado
                    </button>
                  )}

                  {match.winner && (
                    <>
                      {((tournamentPhase === 'swiss' && match.round === currentRound) || 
                        (tournamentPhase === 'elimination' && match.round === eliminationRound)) && 
                        isAdmin && tournamentStatus !== 'finished' && (
                        <button
                          onClick={() => editMatchResult(match)}
                          className={`w-full mt-3 flex items-center justify-center gap-2 text-white py-2 rounded-lg transition-colors text-sm ${
                            tournamentPhase === 'swiss'
                              ? 'bg-blue-500 hover:bg-blue-600'
                              : 'bg-orange-500 hover:bg-orange-600'
                          }`}
                        >
                          <Edit className="w-4 h-4" />
                          Editar Resultado
                        </button>
                      )}

                      <div className="mt-3 text-center">
                        <span className="text-sm text-green-700 font-medium flex items-center justify-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {tournamentPhase === 'swiss' 
                            ? `Ganador: ${match.winner === match.player1?.id ? match.player1.name : match.player2?.name}`
                            : `Avanza: ${match.winner === match.player1?.id ? match.player1.name : match.player2?.name}`
                          }
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar - Standings */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sticky top-4">
              <h3 className="mb-3">
                {tournamentPhase === 'swiss' ? 'Clasificación Actual' : 'Top Cut'}
              </h3>
              
              <div className="space-y-2">
                {(tournamentPhase === 'swiss' ? sortedPlayers : sortedPlayers.slice(0, topCut)).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      tournamentPhase === 'swiss' && index < topCut
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-500 w-6">#{index + 1}</span>
                      {player.profilePicture && (
                        <img src={player.profilePicture} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <span className="font-medium text-sm">{player.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{player.points} pts</p>
                      <p className="text-xs text-gray-500">{player.wins}W-{player.losses}L-{player.draws}D</p>
                    </div>
                  </div>
                ))}
              </div>

              {tournamentPhase === 'swiss' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 text-center">
                    Los primeros {topCut} avanzan a eliminación directa
                  </p>
                </div>
              )}
            </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="0"
                />
              </div>

              {tournamentPhase === 'elimination' && (
                <p className="text-xs text-orange-600">
                  ⚠️ En eliminación directa no puede haber empates
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScoreModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={tournamentPhase === 'swiss' ? submitSwissMatchResult : submitEliminationMatchResult}
                className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
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
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
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
                  className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
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
            
            {tournamentPhase === 'elimination' && (
              <div className="mb-4 bg-red-50 border border-red-300 text-red-800 px-3 py-2 rounded-lg text-sm">
                ⚠️ No se pueden agregar jugadores durante la fase de eliminación
              </div>
            )}

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
                  disabled={tournamentPhase === 'elimination'}
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
              {tournamentPhase !== 'elimination' && (
                <button
                  onClick={confirmAddPlayerManually}
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Agregar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
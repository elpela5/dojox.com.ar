import { useState, useEffect, useRef } from 'react';
import { Swords, Plus, Play, RotateCcw, Trophy, X, UserPlus, ArrowLeft, Edit, UserX, UserCheck, Flag } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useSync } from '../contexts/SyncContext';
import { assignGlobalSequenceToTournament, syncTournamentDataToRankings } from '../utils/tournamentStats';
import { extractTop10CombosFromTournament } from '../utils/extractTopCombos';

interface Player {
  id: string;
  name: string;
  userId?: string;
  profilePicture?: string;
  deckId?: string; // NEW: Deck selected for tournament
  deckBeyblades?: any[]; // NEW: Store deck beyblades snapshot at registration
  deckName?: string; // NEW: Store deck name for display
  points: number;
  wins: number;
  losses: number;
  draws: number;
  byeCount: number;
  opponents: string[];
  pointsFor: number;
  pointsAgainst: number;
  disqualified?: boolean; // NEW: Player is disqualified
}

interface Match {
  id: string;
  player1: string;
  player2: string;
  winner: string | null;
  round: number;
  isBye?: boolean;
  isDraw?: boolean;
  player1Score?: number;
  player2Score?: number;
}

interface SwissTournamentProps {
  tournamentId: string;
  onBack: () => void;
}

export function SwissTournamentComponent({ tournamentId: tournamentProp, onBack }: SwissTournamentProps) {
  const { user } = useUser();
  const { tournaments, saveTournament, deleteTournament, combos, saveCombo, decks, catalog } = useSync();
  const [tournamentName, setTournamentName] = useState('');
  const [totalRounds, setTotalRounds] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [tournamentStatus, setTournamentStatus] = useState<'preparing' | 'active' | 'finished'>('preparing');
  const [playerName, setPlayerName] = useState('');
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [player1Score, setPlayer1Score] = useState('');
  const [player2Score, setPlayer2Score] = useState('');
  const [showDeckSelectionModal, setShowDeckSelectionModal] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [userDecks, setUserDecks] = useState<any[]>([]);
  const isFinalizingTournamentRef = useRef(false); // Prevent duplicate finalization

  // Calculate optimal number of rounds for Swiss system
  const calculateOptimalRounds = (playerCount: number): number => {
    if (playerCount < 2) return 0;
    // Swiss system formula: log₂(players) rounded up
    // This ensures there's likely to be an undefeated winner
    return Math.ceil(Math.log2(playerCount));
  };

  // Auto-sync tournament data from SyncContext (real-time)
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

  // Auto-sync user's decks (real-time)
  useEffect(() => {
    setUserDecks(decks || []);
  }, [decks]);

  // Save tournament data to sync context
  const saveTournamentData = async (updatedData: Partial<{
    players: Player[];
    matches: Match[];
    currentRound: number;
    started: boolean;
    totalRounds: number;
  }>) => {
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
      status: (() => {
        // Only mark as 'finished' if tournament already has a globalSequence (manual finalization)
        if (tournament?.globalSequence) {
          return 'finished';
        }
        
        const finalStarted = updatedData.started !== undefined ? updatedData.started : tournamentStarted;
        
        return finalStarted
          ? 'active'
          : 'preparing';
      })(),
    };

    await saveTournament(updatedTournament);

    // Also save to localStorage for backward compatibility
    if (updatedData.players !== undefined) {
      localStorage.setItem(`tournament-${tournamentProp}-players`, JSON.stringify(updatedData.players));
    }
    if (updatedData.matches !== undefined) {
      localStorage.setItem(`tournament-${tournamentProp}-matches`, JSON.stringify(updatedData.matches));
    }
    if (updatedData.currentRound !== undefined) {
      localStorage.setItem(`tournament-${tournamentProp}-round`, updatedData.currentRound.toString());
    }
    if (updatedData.started !== undefined) {
      localStorage.setItem(`tournament-${tournamentProp}-started`, JSON.stringify(updatedData.started));
    }
  };

  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: playerName,
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      byeCount: 0,
      opponents: [],
      pointsFor: 0,
      pointsAgainst: 0,
    };

    const updated = [...players, newPlayer];
    setPlayers(updated);
    saveTournamentData({ players: updated });
    setPlayerName('');
  };

  const registerSelf = () => {
    if (!user) return;
    
    // Check if already registered
    if (players.some((p) => p.userId === user.id)) {
      alert('Ya estás registrado en este torneo');
      return;
    }

    // Show deck selection modal (optional - user can skip)
    setShowDeckSelectionModal(true);
  };

  const confirmRegistration = () => {
    if (!user) return;

    // Deck selection is now OPTIONAL - no validation needed

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: user.username,
      userId: user.id,
      profilePicture: user.profilePicture,
      deckId: selectedDeckId || undefined, // Optional: Save selected deck if one was chosen
      deckBeyblades: selectedDeckId ? decks.find((d) => d.id === selectedDeckId)?.beyblades : undefined, // Store deck snapshot
      deckName: selectedDeckId ? decks.find((d) => d.id === selectedDeckId)?.name : undefined, // Store deck name
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      byeCount: 0,
      opponents: [],
      pointsFor: 0,
      pointsAgainst: 0,
    };

    const updated = [...players, newPlayer];
    setPlayers(updated);
    saveTournamentData({ players: updated });
    setShowDeckSelectionModal(false);
    setSelectedDeckId('');
  };

  const removePlayer = (id: string) => {
    const updated = players.filter((p) => p.id !== id);
    setPlayers(updated);
    saveTournamentData({ players: updated });
  };

  const toggleDisqualify = (id: string) => {
    const player = players.find((p) => p.id === id);
    if (!player) return;

    const newStatus = !player.disqualified;
    const confirmMessage = newStatus
      ? `¿Descalificar a ${player.name}? El jugador no participará en futuras rondas.`
      : `¿Reactivar a ${player.name}? El jugador podrá participar en futuras rondas.`;

    if (confirm(confirmMessage)) {
      const updated = players.map((p) =>
        p.id === id ? { ...p, disqualified: newStatus } : p
      );
      setPlayers(updated);
      saveTournamentData({ players: updated });
    }
  };

  // NEW: Rollback to previous round (admin/developer only)
  const rollbackRound = () => {
    if (user?.role !== 'admin' && user?.role !== 'developer') {
      alert('Solo los administradores y desarrolladores pueden retroceder rondas');
      return;
    }

    if (currentRound === 0) {
      alert('No hay rondas anteriores para retroceder');
      return;
    }

    // Get matches from the current round to revert their results
    const currentRoundMatches = matches.filter(m => m.round === currentRound);
    const matchCount = currentRoundMatches.length;
    const completedMatches = currentRoundMatches.filter(m => m.winner !== null || m.isBye).length;
    const pendingMatches = matchCount - completedMatches;

    const warningMessage = pendingMatches > 0
      ? `⚠️ ¿Estás seguro de retroceder de la Ronda ${currentRound} a la Ronda ${currentRound - 1}?\n\nEsto eliminará:\n• ${matchCount} ${matchCount === 1 ? 'partido' : 'partidos'} de la Ronda ${currentRound}\n  (${completedMatches} completados, ${pendingMatches} pendientes)\n• Todos los puntos y estadísticas de esos partidos\n\n⚠️ Esta acción NO se puede deshacer.`
      : `⚠️ ¿Estás seguro de retroceder de la Ronda ${currentRound} a la Ronda ${currentRound - 1}?\n\nEsto eliminará:\n• ${matchCount} ${matchCount === 1 ? 'partido completado' : 'partidos completados'} de la Ronda ${currentRound}\n• Todos los puntos y estadísticas de esos partidos\n\n⚠️ Esta acción NO se puede deshacer.`;

    if (!confirm(warningMessage)) {
      return;
    }

    console.log('🔙 Rolling back round...');
    console.log('   Current round:', currentRound);
    console.log('   Target round:', currentRound - 1);
    console.log('   Matches to revert:', matchCount);
    console.log('   Completed matches:', completedMatches);
    console.log('   Pending matches:', pendingMatches);

    // Revert player stats from current round matches
    const revertedPlayers = players.map(player => {
      const playerMatches = currentRoundMatches.filter(m => 
        m.player1Id === player.id || m.player2Id === player.id
      );

      let pointsToRemove = 0;
      let winsToRemove = 0;
      let lossesToRemove = 0;
      let drawsToRemove = 0;
      let byesToRemove = 0;
      let pointsForToRemove = 0;
      let pointsAgainstToRemove = 0;
      const opponentsToRemove = new Set<string>();

      playerMatches.forEach(match => {
        if (match.isBye) {
          pointsToRemove += 3;
          byesToRemove += 1;
        } else if (match.winner === player.id) {
          pointsToRemove += 3;
          winsToRemove += 1;
          const opponentId = match.player1Id === player.id ? match.player2Id : match.player1Id;
          opponentsToRemove.add(opponentId);
          pointsForToRemove += (match.player1Id === player.id ? match.player1Score : match.player2Score) || 0;
          pointsAgainstToRemove += (match.player1Id === player.id ? match.player2Score : match.player1Score) || 0;
        } else if (match.isDraw) {
          pointsToRemove += 1;
          drawsToRemove += 1;
          const opponentId = match.player1Id === player.id ? match.player2Id : match.player1Id;
          opponentsToRemove.add(opponentId);
          pointsForToRemove += (match.player1Id === player.id ? match.player1Score : match.player2Score) || 0;
          pointsAgainstToRemove += (match.player1Id === player.id ? match.player2Score : match.player1Score) || 0;
        } else if (match.winner && match.winner !== player.id) {
          lossesToRemove += 1;
          const opponentId = match.player1Id === player.id ? match.player2Id : match.player1Id;
          opponentsToRemove.add(opponentId);
          pointsForToRemove += (match.player1Id === player.id ? match.player1Score : match.player2Score) || 0;
          pointsAgainstToRemove += (match.player1Id === player.id ? match.player2Score : match.player1Score) || 0;
        }
      });

      return {
        ...player,
        points: Math.max(0, player.points - pointsToRemove),
        wins: Math.max(0, player.wins - winsToRemove),
        losses: Math.max(0, player.losses - lossesToRemove),
        draws: Math.max(0, player.draws - drawsToRemove),
        byeCount: Math.max(0, player.byeCount - byesToRemove),
        opponents: player.opponents.filter(opp => !opponentsToRemove.has(opp)),
        pointsFor: Math.max(0, player.pointsFor - pointsForToRemove),
        pointsAgainst: Math.max(0, player.pointsAgainst - pointsAgainstToRemove),
      };
    });

    // Remove matches from the current round
    const remainingMatches = matches.filter(m => m.round !== currentRound);
    const newRound = currentRound - 1;

    console.log('   Reverted players count:', revertedPlayers.length);
    console.log('   Remaining matches:', remainingMatches.length);
    console.log('   New round:', newRound);

    setPlayers(revertedPlayers);
    setMatches(remainingMatches);
    setCurrentRound(newRound);

    saveTournamentData({
      players: revertedPlayers,
      matches: remainingMatches,
      currentRound: newRound,
    });

    alert(`✅ Ronda retrocedida exitosamente\n\nAhora estás en la Ronda ${newRound}\n\nPuedes volver a generar los emparejamientos si lo deseas.`);
  };

  // NEW: Add player mid-tournament (admin/developer only)
  const addPlayerMidTournament = () => {
    if (user?.role !== 'admin' && user?.role !== 'developer') {
      alert('Solo los administradores y desarrolladores pueden agregar jugadores durante el torneo');
      return;
    }

    if (!tournamentStarted) {
      alert('Usa el formulario normal de agregar jugadores antes de iniciar el torneo');
      return;
    }

    const playerNameInput = prompt('Nombre del jugador que llega tarde:');
    if (!playerNameInput || !playerNameInput.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: playerNameInput.trim(),
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      byeCount: 0,
      opponents: [],
      pointsFor: 0,
      pointsAgainst: 0,
    };

    const updated = [...players, newPlayer];
    setPlayers(updated);
    saveTournamentData({ players: updated });

    console.log('➕ Player added mid-tournament:');
    console.log('   Name:', playerNameInput.trim());
    console.log('   Current round:', currentRound);
    console.log('   Total players now:', updated.length);

    alert(`✅ Jugador "${playerNameInput.trim()}" agregado exitosamente\n\n• Comenzará con 0 puntos\n• Será emparejado en la Ronda ${currentRound + 1}\n• Total de jugadores: ${updated.length}`);
  };

  const generatePairings = async () => {
    console.log('🎲 Generating pairings...');
    console.log('   Total players:', players.length);
    console.log('   Current round:', currentRound);
    console.log('   Next round will be:', currentRound + 1);
    
    // Filter out disqualified players
    const activePlayers = players.filter((p) => !p.disqualified);
    console.log('   Active players (non-disqualified):', activePlayers.length);
    
    // Auto-calculate total rounds if this is the first round (tournament start)
    let calculatedTotalRounds = totalRounds;
    if (currentRound === 0 && totalRounds === 0) {
      calculatedTotalRounds = calculateOptimalRounds(activePlayers.length);
      setTotalRounds(calculatedTotalRounds);
      console.log('📊 Auto-calculated optimal rounds:', calculatedTotalRounds);
      console.log('   Formula: log₂(' + activePlayers.length + ') = ' + calculatedTotalRounds + ' rondas');
    }
    
    activePlayers.forEach(p => {
      console.log(`   - ${p.name}: ${p.points} pts, ${p.wins}W-${p.losses}L-${p.draws}D, opponents: [${p.opponents.map(oppId => {
        const opp = players.find(pl => pl.id === oppId);
        return opp?.name || oppId;
      }).join(', ')}]`);
    });

    if (activePlayers.length < 2) {
      alert('No hay suficientes jugadores activos para generar emparejamientos');
      return;
    }

    const sortedPlayers = [...activePlayers].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    });
    
    console.log('   Players sorted by points:', sortedPlayers.map(p => `${p.name} (${p.points}pts)`).join(', '));

    const paired = new Set<string>();
    const newMatches: Match[] = [];

    // Swiss pairing algorithm with fallback for edge cases
    for (let i = 0; i < sortedPlayers.length; i++) {
      if (paired.has(sortedPlayers[i].id)) continue;

      let foundPair = false;
      
      // Try to find an opponent this player hasn't faced yet
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        if (
          !paired.has(sortedPlayers[j].id) &&
          !sortedPlayers[i].opponents.includes(sortedPlayers[j].id)
        ) {
          newMatches.push({
            id: Date.now().toString() + '-' + i + '-' + j,
            player1: sortedPlayers[i].id,
            player2: sortedPlayers[j].id,
            winner: null,
            round: currentRound + 1,
          });
          paired.add(sortedPlayers[i].id);
          paired.add(sortedPlayers[j].id);
          foundPair = true;
          break;
        }
      }

      // FALLBACK: If no unpaired opponent found, pair with anyone available
      // (This can happen in small tournaments or after adding players mid-tournament)
      if (!foundPair) {
        for (let j = i + 1; j < sortedPlayers.length; j++) {
          if (!paired.has(sortedPlayers[j].id)) {
            console.log(`⚠️ Pairing players who already faced each other: ${sortedPlayers[i].name} vs ${sortedPlayers[j].name}`);
            newMatches.push({
              id: Date.now().toString() + '-' + i + '-' + j + '-repeat',
              player1: sortedPlayers[i].id,
              player2: sortedPlayers[j].id,
              winner: null,
              round: currentRound + 1,
            });
            paired.add(sortedPlayers[i].id);
            paired.add(sortedPlayers[j].id);
            foundPair = true;
            break;
          }
        }
      }
    }

    // Handle byes
    let updatedPlayers = players;
    if (sortedPlayers.length % 2 !== 0) {
      const unpairedPlayer = sortedPlayers.find((p) => !paired.has(p.id));
      if (unpairedPlayer) {
        newMatches.push({
          id: Date.now().toString() + '-bye',
          player1: unpairedPlayer.id,
          player2: '',
          winner: unpairedPlayer.id,
          round: currentRound + 1,
          isBye: true,
        });
        paired.add(unpairedPlayer.id);
        
        // Automatically give points to the player with bye
        updatedPlayers = players.map((player) => {
          if (player.id === unpairedPlayer.id) {
            return {
              ...player,
              points: player.points + 3,
              wins: player.wins + 1,
              byeCount: player.byeCount + 1,
              pointsFor: player.pointsFor + 4, // BYE cuenta como 4-0
              pointsAgainst: player.pointsAgainst + 0,
            };
          }
          return player;
        });
        
        setPlayers(updatedPlayers);
        saveTournamentData({ players: updatedPlayers });
      }
    }

    console.log('   Generated matches:', newMatches.length);
    console.log('   Paired players:', paired.size, '/', sortedPlayers.length);
    
    // Verify all active players are paired (or have bye)
    const unpairedPlayers = sortedPlayers.filter(p => !paired.has(p.id));
    if (unpairedPlayers.length > 0) {
      console.warn('⚠️ WARNING: Some players were not paired!', unpairedPlayers.map(p => p.name));
    }
    
    newMatches.forEach((match, idx) => {
      const p1 = sortedPlayers.find(p => p.id === match.player1);
      const p2 = match.player2 ? sortedPlayers.find(p => p.id === match.player2) : null;
      console.log(`   Match ${idx + 1}: ${p1?.name || '?'} vs ${p2?.name || 'BYE'}`);
    });

    const updatedMatches = [...matches, ...newMatches];
    setMatches(updatedMatches);
    const newRound = currentRound + 1;
    setCurrentRound(newRound);
    setTournamentStarted(true);

    saveTournamentData({ 
      matches: updatedMatches, 
      currentRound: newRound, 
      started: true,
      totalRounds: calculatedTotalRounds
    });

    // Note: Tournament finalization now happens manually via the "Finalizar Torneo" button
    // after all final round matches are completed
  };

  const recordResult = (matchId: string, winnerId: string | 'draw') => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    let updatedPlayers;
    let updatedMatches;

    if (winnerId === 'draw') {
      // Handle draw
      updatedPlayers = players.map((player) => {
        if (player.id === match.player1 || player.id === match.player2) {
          const opponentId = player.id === match.player1 ? match.player2 : match.player1;
          return {
            ...player,
            points: player.points + 1,
            draws: player.draws + 1,
            opponents: [...player.opponents, opponentId],
          };
        }
        return player;
      });

      updatedMatches = matches.map((m) =>
        m.id === matchId ? { ...m, winner: 'draw', isDraw: true } : m
      );
    } else {
      // Handle win/loss
      const loserId = match.player1 === winnerId ? match.player2 : match.player1;

      updatedPlayers = players.map((player) => {
        if (player.id === winnerId) {
          return {
            ...player,
            points: player.points + 3,
            wins: player.wins + 1,
            opponents: [...player.opponents, loserId],
          };
        } else if (player.id === loserId) {
          return {
            ...player,
            losses: player.losses + 1,
            opponents: [...player.opponents, winnerId],
          };
        }
        return player;
      });

      updatedMatches = matches.map((m) =>
        m.id === matchId ? { ...m, winner: winnerId } : m
      );
    }

    setPlayers(updatedPlayers);
    setMatches(updatedMatches);
    saveTournamentData({ players: updatedPlayers, matches: updatedMatches });
    
    // Removed automatic tournament finalization - now handled by manual "Finalizar Torneo" button
  };
  
  // Finalize tournament manually
  const finalizeTournament = async () => {
    try {
      console.log('🔍 finalizeTournament called');
      console.log('   Total rounds:', totalRounds);
      console.log('   Current round:', currentRound);
      console.log('   Players count:', players.length);
      console.log('   Matches count:', matches.length);
      
      const tournament = tournaments.find(t => t.id === tournamentProp);
      console.log('📋 Found tournament:', tournament);
      
      // Check if already finalized
      if (tournament?.globalSequence) {
        console.log('✅ Tournament already has globalSequence:', tournament.globalSequence);
        return;
      }
      
      // Prevent duplicate finalization using ref
      if (isFinalizingTournamentRef.current) {
        console.log('⏭️ Tournament finalization already in progress, skipping...');
        return;
      }
      
      // Set finalization flag
      isFinalizingTournamentRef.current = true;
      console.log('🚀 Starting tournament finalization process...');
      // Assign global sequence number
      const globalSequence = assignGlobalSequenceToTournament(tournamentProp);
      console.log('📊 Assigned globalSequence:', globalSequence);
      
      // Update tournament with globalSequence and ensure status is 'finished'
      if (tournament) {
        const updatedTournament = {
          ...tournament,
          globalSequence,
          status: 'finished',
          players: players,
          matches: matches,
          currentRound,
          name: tournamentName,
          totalRounds,
        };
        
        console.log('💾 Saving tournament with data:', updatedTournament);
        
        try {
          await saveTournament(updatedTournament);
          console.log('✅ Tournament saved with globalSequence');
          console.log('✅ Saved tournament status:', updatedTournament.status);
          console.log('✅ Saved tournament players:', updatedTournament.players.length);
        } catch (error) {
          console.error('⚠️ Error saving tournament:', error);
          // Continue even if save fails
        }
      }
      
      // Extract top 10 combos
      console.log('📦 Starting combo extraction...');
      console.log('   Tournament ID:', tournamentProp);
      console.log('   Current players count:', players.length);
      console.log('   Decks available:', decks.length);
      console.log('   Existing combos count:', combos.length);
      console.log('   Catalog items:', catalog.length);
      
      try {
        await extractTop10CombosFromTournament(tournamentProp, players, decks, combos, saveCombo, catalog);
        console.log('✅ Top 10 combos extracted from tournament');
      } catch (error) {
        console.error('⚠️ Error extracting top 10 combos (non-critical):', error);
        console.error('   Error details:', error);
        // Continue even if extraction fails
      }
      
      // Sync to rankings (localStorage fallback)
      try {
        syncTournamentDataToRankings();
        console.log('✅ Tournament data synced to rankings');
      } catch (error) {
        console.error('⚠️ Error syncing tournament data to rankings (non-critical):', error);
        // Continue even if sync fails
      }
      
      // Show completion message
      console.log('🎉 Tournament finalization completed successfully!');
      alert(`🏆 ¡Torneo Completo!\n\nLos puntos han sido asignados al ranking.\n\nRevisa la pestaña CLASIFICACIÓN para ver la clasificación actualizada.`);
    } catch (error) {
      console.error('⚠️ Error in checkAndFinalizeTournament:', error);
      // Don't throw - tournament completion shouldn't fail completely
    } finally {
      // Reset finalization flag
      isFinalizingTournamentRef.current = false;
      console.log('🔓 Tournament finalization flag reset');
    }
  };

  // Manual tournament finalization (admin/developer only)
  const manuallyFinishTournament = async () => {
    if (user?.role !== 'admin' && user?.role !== 'developer') {
      alert('Solo los administradores y desarrolladores pueden finalizar torneos manualmente');
      return;
    }

    const pendingMatches = matches.filter(m => m.winner === null && !m.isBye).length;
    const confirmMessage = pendingMatches > 0
      ? `⚠️ ¿Estás seguro de finalizar este torneo manualmente?\n\n⚠️ HAY ${pendingMatches} PARTIDA(S) SIN RESULTADO\n\nEsto hará que:\n• El torneo se marque como FINALIZADO\n• Los puntos se asignen al ranking global\n• Los combos se extraigan del top 10\n• NO se puedan editar más resultados\n\nLos partidos sin resultado no contarán para la clasificación final.\n\n¿Deseas continuar?`
      : `¿Estás seguro de finalizar este torneo?\n\nEsto hará que:\n• El torneo se marque como FINALIZADO\n• Los puntos se asignen al ranking global\n• Los combos se extraigan del top 10\n• NO se puedan editar más resultados\n\n¿Deseas continuar?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Force finalization
    await finalizeTournament();
  };

  // Open score modal
  const openScoreModal = (match: Match) => {
    setSelectedMatch(match);
    setPlayer1Score('');
    setPlayer2Score('');
    setShowScoreModal(true);
  };

  // Close score modal
  const closeScoreModal = () => {
    setShowScoreModal(false);
    setSelectedMatch(null);
    setPlayer1Score('');
    setPlayer2Score('');
  };

  // Submit score with points
  const submitScoreWithPoints = () => {
    if (!selectedMatch) return;

    const score1 = parseInt(player1Score);
    const score2 = parseInt(player2Score);

    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      alert('Por favor ingresa puntajes válidos (números mayores o iguales a 0)');
      return;
    }

    let winnerId: string | 'draw';
    if (score1 > score2) {
      winnerId = selectedMatch.player1;
    } else if (score2 > score1) {
      winnerId = selectedMatch.player2;
    } else {
      winnerId = 'draw';
    }

    const updatedPlayers = recordResultWithScores(selectedMatch.id, winnerId, score1, score2);
    closeScoreModal();

    // Removed automatic tournament finalization - now handled by manual "Finalizar Torneo" button
  };

  const recordResultWithScores = (matchId: string, winnerId: string | 'draw', score1: number, score2: number): Player[] | undefined => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return undefined;

    let updatedPlayers;
    let updatedMatches;

    if (winnerId === 'draw') {
      // Handle draw
      updatedPlayers = players.map((player) => {
        if (player.id === match.player1) {
          return {
            ...player,
            points: player.points + 1,
            draws: player.draws + 1,
            opponents: [...player.opponents, match.player2],
            pointsFor: player.pointsFor + score1,
            pointsAgainst: player.pointsAgainst + score2,
          };
        } else if (player.id === match.player2) {
          return {
            ...player,
            points: player.points + 1,
            draws: player.draws + 1,
            opponents: [...player.opponents, match.player1],
            pointsFor: player.pointsFor + score2,
            pointsAgainst: player.pointsAgainst + score1,
          };
        }
        return player;
      });

      updatedMatches = matches.map((m) =>
        m.id === matchId ? { ...m, winner: 'draw', isDraw: true, player1Score: score1, player2Score: score2 } : m
      );
    } else {
      // Handle win/loss
      const loserId = match.player1 === winnerId ? match.player2 : match.player1;

      updatedPlayers = players.map((player) => {
        if (player.id === winnerId) {
          const isPlayer1 = winnerId === match.player1;
          return {
            ...player,
            points: player.points + 3,
            wins: player.wins + 1,
            opponents: [...player.opponents, loserId],
            pointsFor: player.pointsFor + (isPlayer1 ? score1 : score2),
            pointsAgainst: player.pointsAgainst + (isPlayer1 ? score2 : score1),
          };
        } else if (player.id === loserId) {
          const isPlayer1 = loserId === match.player1;
          return {
            ...player,
            losses: player.losses + 1,
            opponents: [...player.opponents, winnerId],
            pointsFor: player.pointsFor + (isPlayer1 ? score1 : score2),
            pointsAgainst: player.pointsAgainst + (isPlayer1 ? score2 : score1),
          };
        }
        return player;
      });

      updatedMatches = matches.map((m) =>
        m.id === matchId ? { ...m, winner: winnerId, player1Score: score1, player2Score: score2 } : m
      );
    }

    setPlayers(updatedPlayers);
    setMatches(updatedMatches);
    saveTournamentData({ players: updatedPlayers, matches: updatedMatches });
    return updatedPlayers;
  };

  const revertMatchResult = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match || !match.winner) return;

    // Don't allow editing matches from previous rounds
    if (match.round !== currentRound) {
      alert('Solo puedes editar partidas de la ronda actual');
      return;
    }

    // Don't allow reverting BYE matches
    if (match.isBye) {
      alert('No puedes editar partidas de descanso (BYE)');
      return;
    }

    const score1 = match.player1Score || 0;
    const score2 = match.player2Score || 0;

    let updatedPlayers;

    if (match.isDraw) {
      // Revert draw
      updatedPlayers = players.map((player) => {
        if (player.id === match.player1) {
          return {
            ...player,
            points: player.points - 1,
            draws: player.draws - 1,
            opponents: player.opponents.filter(id => id !== match.player2),
            pointsFor: player.pointsFor - score1,
            pointsAgainst: player.pointsAgainst - score2,
          };
        } else if (player.id === match.player2) {
          return {
            ...player,
            points: player.points - 1,
            draws: player.draws - 1,
            opponents: player.opponents.filter(id => id !== match.player1),
            pointsFor: player.pointsFor - score2,
            pointsAgainst: player.pointsAgainst - score1,
          };
        }
        return player;
      });
    } else {
      // Revert win/loss
      const winnerId = match.winner;
      const loserId = match.player1 === winnerId ? match.player2 : match.player1;

      updatedPlayers = players.map((player) => {
        if (player.id === winnerId) {
          const isPlayer1 = winnerId === match.player1;
          return {
            ...player,
            points: player.points - 3,
            wins: player.wins - 1,
            opponents: player.opponents.filter(id => id !== loserId),
            pointsFor: player.pointsFor - (isPlayer1 ? score1 : score2),
            pointsAgainst: player.pointsAgainst - (isPlayer1 ? score2 : score1),
          };
        } else if (player.id === loserId) {
          const isPlayer1 = loserId === match.player1;
          return {
            ...player,
            losses: player.losses - 1,
            opponents: player.opponents.filter(id => id !== winnerId),
            pointsFor: player.pointsFor - (isPlayer1 ? score1 : score2),
            pointsAgainst: player.pointsAgainst - (isPlayer1 ? score2 : score1),
          };
        }
        return player;
      });
    }

    // Reset the match
    const updatedMatches = matches.map((m) =>
      m.id === matchId 
        ? { ...m, winner: null, isDraw: false, player1Score: undefined, player2Score: undefined } 
        : m
    );

    setPlayers(updatedPlayers);
    setMatches(updatedMatches);
    saveTournamentData({ players: updatedPlayers, matches: updatedMatches });
  };

  const resetTournament = () => {
    const resetPlayers = players.map((p) => ({
      ...p,
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      byeCount: 0,
      opponents: [],
      pointsFor: 0,
      pointsAgainst: 0,
      disqualified: false, // NEW: Reset disqualified status
    }));
    setPlayers(resetPlayers);
    setMatches([]);
    setCurrentRound(0);
    setTournamentStarted(false);
    saveTournamentData({ players: resetPlayers, matches: [], currentRound: 0, started: false });
  };

  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || 'Desconocido';
  };

  const getPlayerInfo = (id: string) => {
    return players.find((p) => p.id === id);
  };

  // Calculate Buchholz (sum of opponents' points)
  const calculateBuchholz = (player: Player) => {
    return player.opponents.reduce((sum, opponentId) => {
      const opponent = players.find((p) => p.id === opponentId);
      return sum + (opponent?.points || 0);
    }, 0);
  };

  // Calculate match score (wins + draws*0.5)
  const calculateMatchScore = (player: Player) => {
    return player.wins + player.draws * 0.5;
  };

  const roundMatches = matches.filter((m) => m.round === currentRound);
  const allRoundMatchesCompleted = roundMatches.every((m) => m.winner !== null);
  
  const standings = [...players].sort((a, b) => {
    // 1. Puntos totales
    if (b.points !== a.points) return b.points - a.points;
    
    // 2. Tie Break (Match Score: wins + draws*0.5)
    const aMatchScore = calculateMatchScore(a);
    const bMatchScore = calculateMatchScore(b);
    if (bMatchScore !== aMatchScore) return bMatchScore - aMatchScore;
    
    // 3. Buchholz
    const aBuchholz = calculateBuchholz(a);
    const bBuchholz = calculateBuchholz(b);
    if (bBuchholz !== aBuchholz) return bBuchholz - aBuchholz;
    
    // 4. Diferencia de puntos
    const aPointDiff = a.pointsFor - a.pointsAgainst;
    const bPointDiff = b.pointsFor - b.pointsAgainst;
    return bPointDiff - aPointDiff;
  });

  return (
    <div className="max-w-full overflow-hidden">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver a Torneos
      </button>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Swords className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
          <div>
            <h2 className="text-xl sm:text-2xl">{tournamentName || 'Torneo Suizo'}</h2>
            {tournamentStarted && totalRounds > 0 && (
              <p className="text-gray-600 text-sm">
                Ronda {currentRound} de {totalRounds}
                {currentRound >= totalRounds && (
                  <span className="ml-2 text-green-600">✓ Torneo Completo</span>
                )}
              </p>
            )}
            {tournamentStarted && totalRounds === 0 && (
              <p className="text-gray-600 text-sm">Ronda {currentRound}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Admin & Developer Controls */}
          {tournamentStarted && (user?.role === 'admin' || user?.role === 'developer') && tournamentStatus !== 'finished' && (
            <>
              <button
                onClick={rollbackRound}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentRound === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
                disabled={currentRound === 0}
                title={currentRound === 0 ? 'No hay rondas anteriores' : 'Retroceder a la ronda anterior'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Retroceder Ronda</span>
                <span className="sm:hidden">Atrás</span>
              </button>
              <button
                onClick={addPlayerMidTournament}
                className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar Jugador</span>
                <span className="sm:hidden">+</span>
              </button>
              <button
                onClick={manuallyFinishTournament}
                className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                title="Finalizar torneo manualmente (no se podrán editar más resultados)"
              >
                <Flag className="w-4 h-4" />
                <span className="hidden sm:inline">Finalizar Torneo</span>
                <span className="sm:hidden">Finalizar</span>
              </button>
            </>
          )}
          {tournamentStarted && tournamentStatus === 'finished' && (
            <div className="bg-green-100 border-2 border-green-500 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
              <Trophy className="w-5 h-5" />
              <span>Torneo Finalizado - Resultados bloqueados</span>
            </div>
          )}
          {tournamentStarted && (
            <button
              onClick={resetTournament}
              className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Reiniciar</span>
              <span className="sm:hidden">Reset</span>
            </button>
          )}
        </div>
      </div>

      {!tournamentStarted && (
        <>
          {(user?.role === 'admin' || user?.role === 'developer') && (
            <form onSubmit={addPlayer} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre del jugador"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Agregar</span>
                  <span className="sm:hidden">+</span>
                </button>
              </div>
            </form>
          )}

          {user && !players.some((p) => p.userId === user.id) && (
            <button
              onClick={registerSelf}
              className="w-full mb-6 flex items-center justify-center gap-2 bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              Inscribirme al Torneo
            </button>
          )}

          {user && players.some((p) => p.userId === user.id) && (
            <div className="mb-6 bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center text-green-700">
              ✓ Ya estás inscrito en este torneo
            </div>
          )}

          <div className="mb-6">
            <h3 className="mb-3">Jugadores Registrados ({players.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {player.profilePicture ? (
                      <img
                        src={player.profilePicture}
                        alt={player.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-gray-900">{player.name}</span>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'developer') && (
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {players.length >= 2 && (user?.role === 'admin' || user?.role === 'developer') && (
            <>
              {/* Tournament Info Card */}
              <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 rounded-lg p-2 flex-shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Sistema Suizo - Configuración Automática</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <p className="font-semibold text-blue-700 mb-1">Tu Torneo:</p>
                        <p><span className="font-medium">• Jugadores:</span> {players.filter(p => !p.disqualified).length}</p>
                        <p><span className="font-medium">• Rondas:</span> {calculateOptimalRounds(players.filter(p => !p.disqualified).length)} rondas</p>
                      </div>
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer hover:text-gray-800 font-medium">
                          ℹ️ ¿Cómo se calculan las rondas?
                        </summary>
                        <div className="mt-2 pl-4 space-y-1">
                          <p>Fórmula: log₂(jugadores) redondeado hacia arriba</p>
                          <p className="font-mono bg-gray-100 p-1 rounded">4 jugadores → 2 rondas</p>
                          <p className="font-mono bg-gray-100 p-1 rounded">6-8 jugadores → 3 rondas</p>
                          <p className="font-mono bg-gray-100 p-1 rounded">9-16 jugadores → 4 rondas</p>
                          <p className="font-mono bg-gray-100 p-1 rounded">17-32 jugadores → 5 rondas</p>
                          <p className="mt-2 text-gray-700">Esto garantiza que haya un ganador invicto o lo más cercano posible.</p>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={generatePairings}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Iniciar Torneo
              </button>
            </>
          )}

          {players.length >= 2 && user?.role === 'user' && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 text-center text-blue-700">
              Esperando a que un administrador inicie el torneo...
            </div>
          )}
        </>
      )}

      {tournamentStarted && (
        <>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Current Round Matches */}
            <div>
              <h3 className="mb-4 text-lg sm:text-xl">Partidas Ronda {currentRound}</h3>
              <div className="space-y-3">
                {roundMatches.map((match) => {
                  const player1Info = getPlayerInfo(match.player1);
                  const player2Info = getPlayerInfo(match.player2);
                  
                  // Handle bye matches
                  if (match.isBye) {
                    return (
                      <div
                        key={match.id}
                        className="bg-green-50 border-2 border-green-400 rounded-xl p-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {player1Info?.profilePicture ? (
                              <img
                                src={player1Info.profilePicture}
                                alt={player1Info.name}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                                {player1Info?.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <p className="text-gray-900 text-sm truncate">{getPlayerName(match.player1)}</p>
                          </div>
                          <div className="text-green-600 flex items-center gap-2 text-sm">
                            <Trophy className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Descanso - Victoria automática (+3 pts)</span>
                            <span className="sm:hidden">Descanso (+3 pts)</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={match.id}
                      className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                        <div className="flex-1 space-y-2 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {player1Info?.profilePicture ? (
                                <img
                                  src={player1Info.profilePicture}
                                  alt={player1Info.name}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white flex-shrink-0">
                                  {player1Info?.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <p className="text-gray-900 text-sm truncate">{getPlayerName(match.player1)}</p>
                            </div>
                            {match.player1Score !== undefined && (
                              <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                                match.winner === match.player1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {match.player1Score}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-xs pl-10">vs</p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {player2Info?.profilePicture ? (
                                <img
                                  src={player2Info.profilePicture}
                                  alt={player2Info.name}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center text-white flex-shrink-0">
                                  {player2Info?.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <p className="text-gray-900 text-sm truncate">{getPlayerName(match.player2)}</p>
                            </div>
                            {match.player2Score !== undefined && (
                              <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                                match.winner === match.player2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {match.player2Score}
                              </span>
                            )}
                          </div>
                        </div>
                        {match.winner && match.winner !== 'draw' && (
                          <div className="text-green-600 flex items-center gap-1 ml-3 flex-shrink-0">
                            <Trophy className="w-5 h-5" />
                          </div>
                        )}
                        {match.isDraw && (
                          <div className="text-gray-600 flex items-center gap-1 ml-3 flex-shrink-0 text-sm">
                            <span>Empate</span>
                          </div>
                        )}
                      </div>
                      {!match.winner && (user?.role === 'admin' || user?.role === 'developer' || user?.role === 'judge') && tournamentStatus !== 'finished' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openScoreModal(match)}
                            className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          >
                            Ingresar Puntaje
                          </button>
                        </div>
                      )}
                      {!match.winner && tournamentStatus === 'finished' && (
                        <div className="bg-gray-200 text-gray-600 py-2 rounded-lg text-center text-sm">
                          Partido sin resultado
                        </div>
                      )}
                      {match.winner && (user?.role === 'admin' || user?.role === 'developer' || user?.role === 'judge') && tournamentStatus !== 'finished' && (
                        <button
                          onClick={() => revertMatchResult(match.id)}
                          className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline">Editar Resultado</span>
                          <span className="sm:hidden">Editar</span>
                        </button>
                      )}
                      {match.winner && tournamentStatus === 'finished' && (
                        <div className="w-full bg-gray-200 text-gray-600 py-2 rounded-lg text-center text-sm">
                          Resultado final
                        </div>
                      )}
                      {!match.winner && user?.role === 'user' && (
                        <div className="bg-gray-100 text-gray-600 py-2 rounded-lg text-center text-sm">
                          Esperando resultado
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {allRoundMatchesCompleted && (user?.role === 'admin' || user?.role === 'developer') && tournamentStatus !== 'finished' && (
                <>
                  {currentRound < totalRounds ? (
                    <button
                      onClick={generatePairings}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Siguiente Ronda
                    </button>
                  ) : (
                    <button
                      onClick={finalizeTournament}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                    >
                      <Trophy className="w-5 h-5" />
                      Finalizar Torneo
                    </button>
                  )}
                </>
              )}
              {tournamentStatus === 'finished' && (
                <div className="w-full mt-4 bg-green-100 border-2 border-green-500 text-green-800 px-6 py-3 rounded-lg text-center flex items-center justify-center gap-2 font-medium">
                  <Trophy className="w-5 h-5" />
                  Torneo Finalizado - Clasificación Final
                </div>
              )}
              {allRoundMatchesCompleted && (user?.role === 'user' || user?.role === 'judge') && (
                <div className="mt-4 bg-green-50 border-2 border-green-300 rounded-xl p-3 text-center text-green-700">
                  {(totalRounds === 0 || currentRound < totalRounds) 
                    ? 'Ronda completada. Esperando siguiente ronda...' 
                    : '¡Torneo Completo!'
                  }
                </div>
              )}
            </div>

            {/* Standings */}
            <div>
              <h3 className="mb-4 text-lg sm:text-xl">Clasificación Detallada</h3>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full bg-white rounded-lg overflow-hidden text-xs sm:text-sm min-w-[600px]">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs">Rango</th>
                      <th className="px-2 py-2 text-left text-xs">Participante</th>
                      <th className="px-2 py-2 text-center text-xs">G-P-E</th>
                      <th className="px-2 py-2 text-center text-xs">Adiós</th>
                      <th className="px-2 py-2 text-center text-xs">Punt.</th>
                      <th className="px-2 py-2 text-center text-xs">TB</th>
                      <th className="px-2 py-2 text-center text-xs">Buch.</th>
                      <th className="px-2 py-2 text-center text-xs">Dif.</th>
                      {(user?.role === 'admin' || user?.role === 'developer') && (
                        <th className="px-2 py-2 text-center text-xs">Estado</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((player, index) => {
                      const matchScore = calculateMatchScore(player);
                      const buchholz = calculateBuchholz(player);
                      const pointDiff = player.pointsFor - player.pointsAgainst;
                      
                      return (
                        <tr
                          key={player.id}
                          className={`border-b border-gray-200 ${
                            player.disqualified 
                              ? 'bg-red-50 opacity-60' 
                              : index === 0 
                              ? 'bg-yellow-50' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-2 py-2">
                            <span className={`${index === 0 && !player.disqualified ? 'text-yellow-600' : 'text-gray-700'}`}>
                              #{index + 1}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              {player.profilePicture ? (
                                <img
                                  src={player.profilePicture}
                                  alt={player.name}
                                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs flex-shrink-0">
                                  {player.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="text-gray-900 text-sm truncate">{player.name}</span>
                                {player.disqualified && (
                                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">DQ</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-sm text-gray-700">
                            {player.wins}-{player.losses}-{player.draws}
                          </td>
                          <td className="px-2 py-2 text-center text-sm text-gray-700">
                            {player.byeCount}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                              {player.points}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center text-sm text-gray-700">
                            {matchScore.toFixed(1)}
                          </td>
                          <td className="px-2 py-2 text-center text-sm text-gray-700">
                            {buchholz}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              pointDiff > 0 
                                ? 'bg-green-100 text-green-700' 
                                : pointDiff < 0 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {pointDiff > 0 ? '+' : ''}{pointDiff}
                            </span>
                          </td>
                          {(user?.role === 'admin' || user?.role === 'developer') && (
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => toggleDisqualify(player.id)}
                                className={`p-1 rounded hover:bg-opacity-80 transition-colors ${
                                  player.disqualified
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                                title={player.disqualified ? 'Reactivar jugador' : 'Descalificar jugador'}
                              >
                                {player.disqualified ? (
                                  <UserCheck className="w-4 h-4" />
                                ) : (
                                  <UserX className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 bg-blue-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="mb-1"><strong>Leyenda:</strong></p>
                <p>• <strong>G-P-E:</strong> Ganados-Perdidos-Empatados</p>
                <p>• <strong>Adiós:</strong> Cantidad de descansos (+1.0 por cada uno)</p>
                <p>• <strong>Punt.:</strong> Puntuación total (Victoria=3pts, Empate=1pt, Adiós=3pts)</p>
                <p>• <strong>TB (Tie Break):</strong> Victorias + Empates×0.5</p>
                <p>• <strong>Buch. (Buchholz):</strong> Suma de puntos de los oponentes enfrentados</p>
                <p>• <strong>Dif.:</strong> Diferencia de puntos (Puntos a favor - Puntos en contra)</p>
                {(user?.role === 'admin' || user?.role === 'developer') && (
                  <p className="mt-2">• <strong>DQ:</strong> Jugador descalificado (no participará en futuras rondas)</p>
                )}
              </div>
            </div>
          </div>

          {/* Previous Rounds History */}
          {currentRound > 1 && (
            <div className="mt-6">
              <h3 className="mb-4 text-lg sm:text-xl">Historial de Rondas Previas</h3>
              <div className="space-y-4">
                {Array.from({ length: currentRound - 1 }, (_, i) => i + 1)
                  .reverse()
                  .map((roundNumber) => {
                    const roundMatches = matches.filter((m) => m.round === roundNumber);
                    
                    return (
                      <div key={roundNumber} className="bg-white border-2 border-gray-200 rounded-xl p-4">
                        <h4 className="mb-3 text-gray-700">
                          Ronda {roundNumber}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {roundMatches.map((match) => {
                            const player1Info = getPlayerInfo(match.player1);
                            const player2Info = getPlayerInfo(match.player2);
                            
                            // Handle bye matches
                            if (match.isBye) {
                              return (
                                <div
                                  key={match.id}
                                  className="bg-green-50 border border-green-300 rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {player1Info?.profilePicture ? (
                                        <img
                                          src={player1Info.profilePicture}
                                          alt={player1Info.name}
                                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0 text-xs">
                                          {player1Info?.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <p className="text-gray-900 text-sm truncate">{getPlayerName(match.player1)}</p>
                                    </div>
                                    <div className="text-green-600 flex items-center gap-1 text-xs flex-shrink-0">
                                      <Trophy className="w-4 h-4" />
                                      <span className="hidden sm:inline">BYE</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <div
                                key={match.id}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {player1Info?.profilePicture ? (
                                        <img
                                          src={player1Info.profilePicture}
                                          alt={player1Info.name}
                                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-blue-400 flex items-center justify-center text-white flex-shrink-0 text-xs">
                                          {player1Info?.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <p className="text-gray-900 text-sm truncate">{getPlayerName(match.player1)}</p>
                                      {match.winner === match.player1 && (
                                        <Trophy className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      )}
                                    </div>
                                    {match.player1Score !== undefined && (
                                      <span className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${
                                        match.winner === match.player1 
                                          ? 'bg-green-500 text-white' 
                                          : match.isDraw 
                                          ? 'bg-gray-400 text-white'
                                          : 'bg-gray-200 text-gray-700'
                                      }`}>
                                        {match.player1Score}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {player2Info?.profilePicture ? (
                                        <img
                                          src={player2Info.profilePicture}
                                          alt={player2Info.name}
                                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-purple-400 flex items-center justify-center text-white flex-shrink-0 text-xs">
                                          {player2Info?.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <p className="text-gray-900 text-sm truncate">{getPlayerName(match.player2)}</p>
                                      {match.winner === match.player2 && (
                                        <Trophy className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      )}
                                    </div>
                                    {match.player2Score !== undefined && (
                                      <span className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${
                                        match.winner === match.player2 
                                          ? 'bg-green-500 text-white' 
                                          : match.isDraw 
                                          ? 'bg-gray-400 text-white'
                                          : 'bg-gray-200 text-gray-700'
                                      }`}>
                                        {match.player2Score}
                                      </span>
                                    )}
                                  </div>
                                  {match.isDraw && (
                                    <div className="text-center text-xs text-gray-600 pt-1 border-t border-gray-200">
                                      Empate
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Score Modal */}
      {showScoreModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8">
            <h3 className="text-gray-900 mb-6 text-center">Registrar Puntaje de Partida</h3>
            
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getPlayerInfo(selectedMatch.player1)?.profilePicture ? (
                      <img
                        src={getPlayerInfo(selectedMatch.player1)?.profilePicture}
                        alt={getPlayerName(selectedMatch.player1)}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        {getPlayerName(selectedMatch.player1).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-gray-900">{getPlayerName(selectedMatch.player1)}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={player1Score}
                    onChange={(e) => setPlayer1Score(e.target.value)}
                    placeholder="0"
                    className="w-20 px-4 py-2 text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl"
                  />
                </div>
              </div>

              <div className="text-center text-gray-500">VS</div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getPlayerInfo(selectedMatch.player2)?.profilePicture ? (
                      <img
                        src={getPlayerInfo(selectedMatch.player2)?.profilePicture}
                        alt={getPlayerName(selectedMatch.player2)}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white">
                        {getPlayerName(selectedMatch.player2).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-gray-900">{getPlayerName(selectedMatch.player2)}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={player2Score}
                    onChange={(e) => setPlayer2Score(e.target.value)}
                    placeholder="0"
                    className="w-20 px-4 py-2 text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitScoreWithPoints}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Guardar Resultado
              </button>
              <button
                onClick={closeScoreModal}
                className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deck Selection Modal */}
      {showDeckSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8">
            <h3 className="text-gray-900 mb-2 text-center">Selecciona un Deck (Opcional)</h3>
            <p className="text-gray-600 text-sm text-center mb-6">
              Puedes inscribirte sin seleccionar un deck si lo prefieres
            </p>
            
            {userDecks.length > 0 ? (
              <div className="space-y-4 mb-6">
                {userDecks.map((deck: any) => (
                  <div
                    key={deck.id}
                    className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white">
                        {deck.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-900">{deck.name}</span>
                    </div>
                    <button
                      onClick={() => setSelectedDeckId(deck.id)}
                      className={`px-4 py-2 rounded-lg ${
                        selectedDeckId === deck.id ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {selectedDeckId === deck.id ? '✓ Seleccionado' : 'Seleccionar'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-6 bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center text-gray-600">
                No tienes decks creados. Puedes inscribirte sin deck o crear uno en la sección de Colección.
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={confirmRegistration}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                {selectedDeckId ? 'Inscribirme con Deck Seleccionado' : 'Inscribirme sin Deck'}
              </button>
              <button
                onClick={() => {
                  setShowDeckSelectionModal(false);
                  setSelectedDeckId('');
                }}
                className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export with the expected name
export const SwissTournament = SwissTournamentComponent;
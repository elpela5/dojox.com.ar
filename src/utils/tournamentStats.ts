// Utility functions to calculate player rankings from tournament data

// Global tournament sequence tracking
export function getGlobalTournamentSequence(): number {
  const sequence = localStorage.getItem('global-tournament-sequence');
  return sequence ? parseInt(sequence) : 0;
}

export function incrementGlobalTournamentSequence(): number {
  const current = getGlobalTournamentSequence();
  const next = current + 1;
  localStorage.setItem('global-tournament-sequence', next.toString());
  return next;
}

export function assignGlobalSequenceToTournament(tournamentId: string): number {
  // Check if tournament already has a sequence number
  const existingSequence = localStorage.getItem(`tournament-${tournamentId}-globalSequence`);
  if (existingSequence) {
    return parseInt(existingSequence);
  }
  
  // Assign new sequence number
  const sequenceNumber = incrementGlobalTournamentSequence();
  localStorage.setItem(`tournament-${tournamentId}-globalSequence`, sequenceNumber.toString());
  return sequenceNumber;
}

export function getTournamentGlobalSequence(tournamentId: string): number | null {
  const sequence = localStorage.getItem(`tournament-${tournamentId}-globalSequence`);
  return sequence ? parseInt(sequence) : null;
}

interface TournamentPlayer {
  id: string;
  name: string;
  userId?: string;
  profilePicture?: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  byeCount: number;
  opponents: string[];
}

interface TournamentMatch {
  id: string;
  player1: string;
  player2: string;
  winner: string | null;
  round: number;
  isBye?: boolean;
  isDraw?: boolean;
}

interface PlayerStats {
  id: string;
  name: string;
  points: number;
  wins: number;
  losses: number;
  tournaments: number;
  championships: number;
  userId?: string;
  manualAdjustments?: {
    wins: number;
    losses: number;
    tournaments: number;
    championships: number;
    points: number;
  };
}

// Calculate points based on tournament position (1st = 10pts, 2nd = 9pts, etc.)
export function calculatePositionPoints(position: number): number {
  if (position <= 0 || position > 10) return 0;
  return 11 - position;
}

// Get all tournaments from localStorage
export function getAllTournaments(): string[] {
  const tournamentsData = localStorage.getItem('beyblade-tournaments');
  if (!tournamentsData) return [];
  
  const tournaments = JSON.parse(tournamentsData);
  return tournaments.map((t: any) => t.id);
}

// Get tournament players with their final standings
export function getTournamentPlayers(tournamentId: string): TournamentPlayer[] {
  const playersData = localStorage.getItem(`tournament-${tournamentId}-players`);
  if (!playersData) return [];
  
  return JSON.parse(playersData);
}

// Get tournament status
export function getTournamentStatus(tournamentId: string): {
  started: boolean;
  currentRound: number;
  totalRounds: number;
  isCompleted: boolean;
} {
  const started = localStorage.getItem(`tournament-${tournamentId}-started`) === 'true';
  const currentRound = parseInt(localStorage.getItem(`tournament-${tournamentId}-round`) || '0');
  const totalRounds = parseInt(localStorage.getItem(`tournament-${tournamentId}-totalRounds`) || '0');
  
  // A tournament is completed if:
  // 1. It has started
  // 2. totalRounds > 0 and currentRound >= totalRounds
  const isCompleted = started && totalRounds > 0 && currentRound >= totalRounds;
  
  return {
    started,
    currentRound,
    totalRounds,
    isCompleted
  };
}

// Calculate player rankings from all tournaments with 45-tournament sliding window for points
export function calculatePlayerRankingsFromTournaments(): Map<string, PlayerStats> {
  const playerStatsMap = new Map<string, PlayerStats>();
  const tournamentIds = getAllTournaments();
  
  // Get current global sequence to determine which tournaments are in the window
  const currentGlobalSequence = getGlobalTournamentSequence();
  const windowStart = Math.max(1, currentGlobalSequence - 44); // Last 45 tournaments
  
  // Structure to track tournament participations per player
  const playerTournamentHistory = new Map<string, Array<{
    tournamentId: string;
    globalSequence: number;
    position: number;
    positionPoints: number;
    wins: number;
    losses: number;
    wasChampion: boolean;
  }>>();
  
  tournamentIds.forEach(tournamentId => {
    const status = getTournamentStatus(tournamentId);
    
    // Only process started tournaments
    if (!status.started) return;
    
    const players = getTournamentPlayers(tournamentId);
    const globalSequence = getTournamentGlobalSequence(tournamentId);
    
    // If tournament is completed but doesn't have a sequence, assign one
    if (status.isCompleted && !globalSequence) {
      const newSequence = assignGlobalSequenceToTournament(tournamentId);
      // Re-call this function to use the new sequence
      return;
    }
    
    // Sort players by points to get final standings
    const sortedPlayers = [...players].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    });
    
    sortedPlayers.forEach((player, index) => {
      const position = index + 1;
      const playerId = player.userId || player.name; // Use userId if available, otherwise name
      
      let stats = playerStatsMap.get(playerId);
      
      if (!stats) {
        stats = {
          id: playerId,
          name: player.name,
          points: 0,
          wins: 0,
          losses: 0,
          tournaments: 0,
          championships: 0,
          userId: player.userId,
        };
        playerStatsMap.set(playerId, stats);
      }
      
      // Always add tournament count (no window limit for participation count)
      stats.tournaments += 1;
      
      // Always add wins and losses (no window limit)
      stats.wins += player.wins;
      stats.losses += player.losses;
      
      // For completed tournaments, track history
      if (status.isCompleted && globalSequence) {
        const positionPoints = calculatePositionPoints(position);
        const wasChampion = position === 1;
        
        // Track this tournament participation
        if (!playerTournamentHistory.has(playerId)) {
          playerTournamentHistory.set(playerId, []);
        }
        playerTournamentHistory.get(playerId)!.push({
          tournamentId,
          globalSequence,
          position,
          positionPoints,
          wins: player.wins,
          losses: player.losses,
          wasChampion
        });
        
        // Only add points if tournament is within the 45-tournament window
        if (globalSequence >= windowStart) {
          stats.points += positionPoints;
          
          // Add championship if first place
          if (wasChampion) {
            stats.championships += 1;
          }
        }
      }
    });
  });
  
  // Store the tournament history for each player (useful for debugging/display)
  playerTournamentHistory.forEach((history, playerId) => {
    const stats = playerStatsMap.get(playerId);
    if (stats) {
      (stats as any).tournamentHistory = history;
    }
  });
  
  return playerStatsMap;
}

// Get player stats as array sorted by points
export function getPlayerRankings(): PlayerStats[] {
  const playerStatsMap = calculatePlayerRankingsFromTournaments();
  const rankings = Array.from(playerStatsMap.values());
  
  // Sort by points (descending), then by wins (descending), then by losses (ascending)
  return rankings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });
}

// Sync tournament data to player rankings in localStorage
export function syncTournamentDataToRankings(): void {
  try {
    const tournamentRankings = getPlayerRankings();
    
    // Get existing rankings (includes both tournament and manual data)
    const existingRankings = JSON.parse(localStorage.getItem('player-rankings') || '[]');
    
    // Create a map of existing players with their manual adjustments
    const existingPlayersMap = new Map<string, any>();
    existingRankings.forEach((player: any) => {
      existingPlayersMap.set(player.id, player);
    });
    
    // Create a map for tournament data
    const tournamentPlayersMap = new Map<string, any>();
    tournamentRankings.forEach((ranking) => {
      tournamentPlayersMap.set(ranking.id, ranking);
    });
    
    // Merge data: tournament data + manual adjustments
    const mergedRankings: any[] = [];
    
    // First, process all tournament players
    tournamentRankings.forEach((tournamentPlayer) => {
      const existingPlayer = existingPlayersMap.get(tournamentPlayer.id);
      
      if (existingPlayer && existingPlayer.manualAdjustments) {
        // Player exists with manual adjustments - merge them
        mergedRankings.push({
          ...tournamentPlayer,
          // Add manual adjustments to tournament stats
          wins: tournamentPlayer.wins + (existingPlayer.manualAdjustments.wins || 0),
          losses: tournamentPlayer.losses + (existingPlayer.manualAdjustments.losses || 0),
          tournaments: tournamentPlayer.tournaments + (existingPlayer.manualAdjustments.tournaments || 0),
          championships: tournamentPlayer.championships + (existingPlayer.manualAdjustments.championships || 0),
          points: tournamentPlayer.points + (existingPlayer.manualAdjustments.points || 0),
          manualAdjustments: existingPlayer.manualAdjustments,
          fromTournament: true
        });
      } else {
        // New tournament player or existing player without manual adjustments
        mergedRankings.push({
          ...tournamentPlayer,
          manualAdjustments: existingPlayer?.manualAdjustments || { wins: 0, losses: 0, tournaments: 0, championships: 0, points: 0 },
          fromTournament: true
        });
      }
    });
    
    // Then, add manual-only players (not in any tournament)
    existingRankings.forEach((existingPlayer: any) => {
      if (!tournamentPlayersMap.has(existingPlayer.id) && !existingPlayer.fromTournament) {
        mergedRankings.push(existingPlayer);
      }
    });
    
    // Sort merged rankings
    const sortedMerged = mergedRankings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    });
    
    localStorage.setItem('player-rankings', JSON.stringify(sortedMerged));
    console.log(`✅ Synced ${sortedMerged.length} players to rankings`);
  } catch (error) {
    console.error('❌ Error syncing tournament data to rankings:', error);
  }
}

// Get tournament wins/losses for a specific player
export function getPlayerTournamentHistory(playerId: string): {
  tournamentId: string;
  tournamentName: string;
  position: number;
  wins: number;
  losses: number;
  points: number;
}[] {
  const tournamentIds = getAllTournaments();
  const history: any[] = [];
  
  tournamentIds.forEach(tournamentId => {
    const status = getTournamentStatus(tournamentId);
    if (!status.started) return;
    
    const players = getTournamentPlayers(tournamentId);
    const player = players.find(p => p.userId === playerId || p.name === playerId);
    
    if (player) {
      const sortedPlayers = [...players].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.losses - b.losses;
      });
      
      const position = sortedPlayers.findIndex(p => p.id === player.id) + 1;
      const tournamentName = localStorage.getItem(`tournament-${tournamentId}-name`) || 'Torneo';
      
      history.push({
        tournamentId,
        tournamentName,
        position,
        wins: player.wins,
        losses: player.losses,
        points: player.points,
      });
    }
  });
  
  return history;
}
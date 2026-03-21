import { useState, useEffect, useRef } from 'react';
import { Trophy, Users, X, Plus, TrendingUp, Star, RefreshCw, Medal, Crown, Award } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useSync } from '../contexts/SyncContext';
import { CafecitoButton } from './CafecitoButton';
import { assignGlobalSequenceToTournament } from '../utils/tournamentStats';
import { LeagueManagement } from './LeagueManagement'; // NEW: League management component
import { calculateLeaguePoints, calculateGeneralPoints } from '../utils/leaguePoints'; // NEW: Point calculation

interface Player {
  id: string;
  name: string;
  points: number;
  wins: number;
  losses: number;
  tournaments: number;
  championships: number;
  fromTournament?: boolean;
  userId?: string;
}

export function PlayerRankings() {
  const { user } = useUser();
  const { tournaments, saveTournament, leagues, saveLeague, users } = useSync(); // NEW: Add saveLeague from context
  const [players, setPlayers] = useState<Player[]>([]);
  const [leaguePlayers, setLeaguePlayers] = useState<Map<string, Player[]>>(new Map()); // NEW: League rankings
  const [selectedTab, setSelectedTab] = useState<'general' | string>('general'); // NEW: Tab selection (general or leagueId)
  const [showForm, setShowForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });

  // Track which tournaments have been fixed to prevent infinite loops
  const fixedTournamentsRef = useRef<Set<string>>(new Set());

  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  // NEW: Helper function to find registered user by name
  const findRegisteredUserByName = (playerName: string) => {
    if (!users || !Array.isArray(users)) return null;
    return users.find((u: any) => u.displayName?.toLowerCase().trim() === playerName.toLowerCase().trim());
  };

  // NEW: Helper function to save league players to Supabase
  const saveLeaguePlayers = async (leagueId: string, players: Player[]) => {
    const league = leagues.find((l: any) => l.id === leagueId);
    if (league) {
      await saveLeague({
        ...league,
        manualPlayers: players,
      });
      console.log('✅ League players saved to Supabase');
    }
  };

  // NEW: Function to fix finished tournaments without globalSequence
  const fixTournamentsWithoutSequence = async () => {
    const finishedWithoutSequence = tournaments.filter(
      (t: any) => t.status === 'finished' && !t.globalSequence && !fixedTournamentsRef.current.has(t.id)
    );

    if (finishedWithoutSequence.length === 0) return;

    console.log('🔧 Found', finishedWithoutSequence.length, 'finished tournaments without globalSequence');

    for (const tournament of finishedWithoutSequence) {
      try {
        console.log('🔧 Fixing tournament:', tournament.name || tournament.id);
        
        // Mark as being fixed to prevent duplicate processing
        fixedTournamentsRef.current.add(tournament.id);
        
        // Assign global sequence
        const globalSequence = assignGlobalSequenceToTournament(tournament.id);
        console.log('📊 Assigned globalSequence:', globalSequence);

        // Update tournament with globalSequence
        const updatedTournament = {
          ...tournament,
          globalSequence,
          status: 'finished',
        };

        await saveTournament(updatedTournament);
        console.log('✅ Tournament fixed and saved:', tournament.name || tournament.id);
      } catch (error) {
        console.error('⚠️ Error fixing tournament:', tournament.id, error);
        // Remove from fixed set if there was an error so it can be retried
        fixedTournamentsRef.current.delete(tournament.id);
      }
    }
  };

  // Function to calculate rankings from tournament data
  const calculateRankingsFromTournaments = () => {
    console.log('🔄 calculateRankingsFromTournaments called');
    console.log('📊 Input tournaments:', tournaments);
    
    const playerStatsMap = new Map<string, Player>();

    // Get the latest 45 tournaments
    const completedTournaments = tournaments
      .filter((t: any) => t.status === 'finished' && t.globalSequence)
      .sort((a: any, b: any) => b.globalSequence - a.globalSequence)
      .slice(0, 45);

    console.log('✅ Completed tournaments with globalSequence:', completedTournaments.length);
    console.log('📋 Completed tournaments:', completedTournaments);

    completedTournaments.forEach((tournament: any) => {
      console.log('🏆 Processing tournament:', tournament.name || tournament.id);
      
      if (!tournament.players || !Array.isArray(tournament.players)) {
        console.log('⚠️ Tournament has no players array:', tournament);
        return;
      }

      console.log('👥 Tournament has', tournament.players.length, 'players');

      // Sort players by tournament standings
      const sortedPlayers = [...tournament.players].sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.losses - b.losses;
      });

      console.log('📊 Sorted players:', sortedPlayers);

      sortedPlayers.forEach((player: any, index: number) => {
        const position = index + 1;
        
        // NEW: Try to match with registered user by name if no userId
        let playerId = player.userId || player.name;
        let playerName = player.name;
        
        if (!player.userId) {
          const registeredUser = findRegisteredUserByName(player.name);
          if (registeredUser) {
            playerId = registeredUser.id;
            playerName = registeredUser.displayName;
            console.log(`🔗 Matched "${player.name}" with registered user:`, registeredUser.displayName, registeredUser.id);
          }
        }

        console.log(`🎯 Processing player ${position}: ${playerName} (ID: ${playerId})`);

        let stats = playerStatsMap.get(playerId);

        if (!stats) {
          stats = {
            id: playerId,
            name: playerName,
            points: 0,
            wins: 0,
            losses: 0,
            tournaments: 0,
            championships: 0,
            userId: player.userId,
            fromTournament: true,
          };
          playerStatsMap.set(playerId, stats);
          console.log('✨ Created new player stats:', stats);
        }

        // Count tournament participation
        stats.tournaments += 1;
        stats.wins += player.wins || 0;
        stats.losses += player.losses || 0;

        // Calculate position points using GENERAL system (10, 9, 8...)
        const positionPoints = calculateGeneralPoints(position);
        stats.points += positionPoints;

        console.log(`📈 Player ${playerName}: +${positionPoints} points (position ${position}), total: ${stats.points}`);

        // Count championships
        if (position === 1) {
          stats.championships += 1;
          console.log(`🏆 Championship for ${playerName}!`);
        }
      });
    });

    // Convert to array and sort
    const rankings = Array.from(playerStatsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    });

    console.log('🎖️ Final rankings:', rankings);
    return rankings;
  };

  // NEW: Calculate league-specific rankings
  const calculateLeagueRankings = (leagueId: string) => {
    console.log('🏆 calculateLeagueRankings called for league:', leagueId);
    
    const playerStatsMap = new Map<string, Player>();

    // Get tournaments for this league only
    const leagueTournaments = tournaments
      .filter((t: any) => t.status === 'finished' && t.globalSequence && t.leagueId === leagueId)
      .sort((a: any, b: any) => b.globalSequence - a.globalSequence)
      .slice(0, 45); // Also limit league tournaments to 45

    console.log('✅ League tournaments:', leagueTournaments.length);

    leagueTournaments.forEach((tournament: any) => {
      console.log('🏆 Processing league tournament:', tournament.name || tournament.id);
      
      if (!tournament.players || !Array.isArray(tournament.players)) {
        console.log('⚠️ Tournament has no players array:', tournament);
        return;
      }

      // Sort players by tournament standings
      const sortedPlayers = [...tournament.players].sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.losses - b.losses;
      });

      // Detect swiss winner for combined tournaments (bonus only for leagues)
      // SIMPLE SOLUTION: Compare by NAME instead of complex ID matching
      let swissWinnerName: string | null = null;
      console.log('🔍🔍🔍 CHECKING SWISS BONUS 🔍🔍🔍');
      console.log('Tournament name:', tournament.name);
      console.log('Tournament format:', tournament.format);
      console.log('Has swissStandings?:', !!tournament.swissStandings);
      console.log('swissStandings:', JSON.stringify(tournament.swissStandings));
      
      if (tournament.format === 'combined' && tournament.swissStandings && tournament.swissStandings.length > 0) {
        const swissWinner = tournament.swissStandings[0];
        swissWinnerName = swissWinner.name;
        console.log('✅✅✅ SWISS WINNER DETECTED ✅✅✅');
        console.log('WINNER NAME:', swissWinnerName);
        console.log('This player will get +10 bonus points!');
        console.log('✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅');
      } else {
        console.log('❌ NO SWISS BONUS for this tournament');
        console.log('Reason: format=' + tournament.format + ', hasSwiss=' + !!tournament.swissStandings);
      }

      sortedPlayers.forEach((player: any, index: number) => {
        const position = index + 1;
        
        // NEW: Try to match with registered user by name if no userId
        let playerId = player.userId || player.name;
        let playerName = player.name;
        
        if (!player.userId) {
          const registeredUser = findRegisteredUserByName(player.name);
          if (registeredUser) {
            playerId = registeredUser.id;
            playerName = registeredUser.displayName;
            console.log(`🔗 [League] Matched "${player.name}" with registered user:`, registeredUser.displayName, registeredUser.id);
          }
        }

        let stats = playerStatsMap.get(playerId);

        if (!stats) {
          stats = {
            id: playerId,
            name: playerName,
            points: 0,
            wins: 0,
            losses: 0,
            tournaments: 0,
            championships: 0,
            userId: player.userId || (playerId !== player.name ? playerId : undefined),
            fromTournament: true,
          };
          playerStatsMap.set(playerId, stats);
        }

        // Count tournament participation
        stats.tournaments += 1;
        stats.wins += player.wins || 0;
        stats.losses += player.losses || 0;

        // Calculate position points using LEAGUE system (15, 12, 10, 7, 2)
        // SIMPLE: Compare by NAME
        const isSwissWinner = player.name === swissWinnerName;
        
        if (swissWinnerName) {
          console.log(`🔍🔍🔍 COMPARING PLAYER 🔍🔍🔍`);
          console.log(`Player name: "${player.name}"`);
          console.log(`Swiss winner name: "${swissWinnerName}"`);
          console.log(`Match?: ${isSwissWinner}`);
          console.log(`Position: ${position}`);
        }
        
        const positionPoints = calculateLeaguePoints(position, isSwissWinner);
        stats.points += positionPoints;

        if (isSwissWinner) {
          console.log(`🎉🎉🎉 SWISS BONUS APPLIED! 🎉🎉🎉`);
          console.log(`Player ${playerName} got +${positionPoints} points (includes +10 swiss bonus!)`);
          console.log(`Total points for ${playerName}: ${stats.points}`);
          console.log(`🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉`);
        } else {
          console.log(`📈 League Player ${playerName}: +${positionPoints} points (position ${position}), total: ${stats.points}`);
        }

        // Count championships
        if (position === 1) {
          stats.championships += 1;
        }
      });
    });

    // NEW: Load manual players from league and merge with tournament-based players
    const league = leagues.find((l: any) => l.id === leagueId);
    if (league && league.manualPlayers && Array.isArray(league.manualPlayers)) {
      console.log('📋 Loading manual players from league:', league.manualPlayers.length);
      league.manualPlayers.forEach((manualPlayer: Player) => {
        const existing = playerStatsMap.get(manualPlayer.id);
        if (existing) {
          // Merge manual adjustments with tournament stats
          console.log('🔀 Merging manual player with existing:', manualPlayer.name);
        } else {
          // Add pure manual player
          console.log('➕ Adding pure manual player:', manualPlayer.name);
          playerStatsMap.set(manualPlayer.id, manualPlayer);
        }
      });
    }

    // Convert to array and sort
    const rankings = Array.from(playerStatsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    });

    console.log('🎖️ Final league rankings:', rankings);
    return rankings;
  };

  // Load rankings
  const loadPlayers = () => {
    const rankings = calculateRankingsFromTournaments();
    setPlayers(rankings);
  };

  // Auto-recalculate when tournaments change (real-time sync)
  useEffect(() => {
    if (tournaments && tournaments.length >= 0) {
      console.log('🔄 PlayerRankings: Recalculating rankings...');
      console.log('Total tournaments:', tournaments.length);
      console.log('All tournaments:', tournaments);
      
      const finished = tournaments.filter((t: any) => t.status === 'finished');
      console.log('Finished tournaments:', finished.length);
      console.log('Finished tournaments data:', finished);
      
      const withSequence = finished.filter((t: any) => t.globalSequence);
      console.log('Finished tournaments with globalSequence:', withSequence.length);
      console.log('Tournaments with sequence:', withSequence);
      
      // FIX: Check for finished tournaments without globalSequence
      const withoutSequence = finished.filter((t: any) => !t.globalSequence);
      if (withoutSequence.length > 0) {
        console.log('⚠️ Found', withoutSequence.length, 'finished tournaments without globalSequence');
        console.log('🔧 Fixing tournaments...');
        fixTournamentsWithoutSequence();
        // Return early - the fix will trigger a re-render via Supabase sync
        return;
      }
      
      if (withSequence.length > 0) {
        console.log('Sample tournament with sequence:', withSequence[0]);
        console.log('Sample tournament players:', withSequence[0].players);
      }
      
      // Calculate general rankings
      loadPlayers();
      
      // Calculate league rankings for each league
      const newLeaguePlayers = new Map<string, Player[]>();
      leagues.forEach((league: any) => {
        const leagueRankings = calculateLeagueRankings(league.id);
        newLeaguePlayers.set(league.id, leagueRankings);
        console.log(`🏆 League ${league.name} has ${leagueRankings.length} players`);
      });
      setLeaguePlayers(newLeaguePlayers);
      
      const calculatedPlayers = calculateRankingsFromTournaments();
      console.log('👥 Calculated players:', calculatedPlayers.length);
      console.log('Calculated players data:', calculatedPlayers);
      if (calculatedPlayers.length > 0) {
        console.log('Top 3 players:', calculatedPlayers.slice(0, 3));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournaments, leagues]);

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine if we're in a league context
    const isLeagueContext = selectedTab !== 'general';
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: formData.name,
      points: 0,
      wins: 0,
      losses: 0,
      tournaments: 0,
      championships: 0,
    };
    
    if (isLeagueContext) {
      // Add to league-specific rankings and save to Supabase
      const currentLeaguePlayers = leaguePlayers.get(selectedTab) || [];
      const updated = [...currentLeaguePlayers, newPlayer];
      const newLeaguePlayers = new Map(leaguePlayers);
      newLeaguePlayers.set(selectedTab, updated);
      setLeaguePlayers(newLeaguePlayers);
      
      // Save to Supabase
      const league = leagues.find((l: any) => l.id === selectedTab);
      if (league) {
        await saveLeague({
          ...league,
          manualPlayers: updated,
        });
        console.log('✅ Manual player saved to Supabase for league:', selectedTab);
      }
    } else {
      // Add to general rankings - currently not supported in Supabase, keep localStorage
      const updated = [...players, newPlayer];
      setPlayers(updated);
      localStorage.setItem('player-rankings', JSON.stringify(updated));
      console.log('⚠️ General rankings still using localStorage');
    }
    
    setFormData({ name: '' });
    setShowForm(false);
  };

  const updateWin = async (id: string) => {
    const isLeagueContext = selectedTab !== 'general';
    const targetPlayers = isLeagueContext ? leaguePlayers.get(selectedTab) || [] : players;
    
    const updated = targetPlayers.map((player) => {
      if (player.id === id) {
        const manualAdj = (player as any).manualAdjustments || { wins: 0, losses: 0, tournaments: 0, championships: 0, points: 0 };
        return {
          ...player,
          wins: player.wins + 1,
          manualAdjustments: {
            ...manualAdj,
            wins: manualAdj.wins + 1,
          }
        };
      }
      return player;
    });
    
    if (isLeagueContext) {
      const newLeaguePlayers = new Map(leaguePlayers);
      newLeaguePlayers.set(selectedTab, updated);
      setLeaguePlayers(newLeaguePlayers);
      await saveLeaguePlayers(selectedTab, updated);
    } else {
      setPlayers(updated);
      localStorage.setItem('player-rankings', JSON.stringify(updated));
    }
  };

  const removeWin = async (id: string) => {
    const isLeagueContext = selectedTab !== 'general';
    const targetPlayers = isLeagueContext ? leaguePlayers.get(selectedTab) || [] : players;
    
    const updated = targetPlayers.map((player) => {
      if (player.id === id) {
        const manualAdj = (player as any).manualAdjustments || { wins: 0, losses: 0, tournaments: 0, championships: 0, points: 0 };
        return {
          ...player,
          wins: Math.max(0, player.wins - 1),
          manualAdjustments: {
            ...manualAdj,
            wins: manualAdj.wins - 1,
          }
        };
      }
      return player;
    });
    
    if (isLeagueContext) {
      const newLeaguePlayers = new Map(leaguePlayers);
      newLeaguePlayers.set(selectedTab, updated);
      setLeaguePlayers(newLeaguePlayers);
      await saveLeaguePlayers(selectedTab, updated);
    } else {
      setPlayers(updated);
      localStorage.setItem('player-rankings', JSON.stringify(updated));
    }
  };

  const updateLoss = async (id: string) => {
    const isLeagueContext = selectedTab !== 'general';
    const targetPlayers = isLeagueContext ? leaguePlayers.get(selectedTab) || [] : players;
    
    const updated = targetPlayers.map((player) => {
      if (player.id === id) {
        const manualAdj = (player as any).manualAdjustments || { wins: 0, losses: 0, tournaments: 0, championships: 0, points: 0 };
        return {
          ...player,
          losses: player.losses + 1,
          manualAdjustments: {
            ...manualAdj,
            losses: manualAdj.losses + 1,
          }
        };
      }
      return player;
    });
    
    if (isLeagueContext) {
      const newLeaguePlayers = new Map(leaguePlayers);
      newLeaguePlayers.set(selectedTab, updated);
      setLeaguePlayers(newLeaguePlayers);
      await saveLeaguePlayers(selectedTab, updated);
    } else {
      setPlayers(updated);
      localStorage.setItem('player-rankings', JSON.stringify(updated));
    }
  };

  const removeLoss = async (id: string) => {
    const isLeagueContext = selectedTab !== 'general';
    const targetPlayers = isLeagueContext ? leaguePlayers.get(selectedTab) || [] : players;
    
    const updated = targetPlayers.map((player) => {
      if (player.id === id) {
        const manualAdj = (player as any).manualAdjustments || { wins: 0, losses: 0, tournaments: 0, championships: 0, points: 0 };
        return {
          ...player,
          losses: Math.max(0, player.losses - 1),
          manualAdjustments: {
            ...manualAdj,
            losses: manualAdj.losses - 1,
          }
        };
      }
      return player;
    });
    
    if (isLeagueContext) {
      const newLeaguePlayers = new Map(leaguePlayers);
      newLeaguePlayers.set(selectedTab, updated);
      setLeaguePlayers(newLeaguePlayers);
      await saveLeaguePlayers(selectedTab, updated);
    } else {
      setPlayers(updated);
      localStorage.setItem('player-rankings', JSON.stringify(updated));
    }
  };

  const addTournament = async (id: string) => {
    // Determine if we're in a league context
    const isLeagueContext = selectedTab !== 'general';
    
    const maxPosition = isLeagueContext ? 8 : 10;
    const position = prompt(`¿En qué posición terminó? (1-${maxPosition})`);
    if (!position) return;
    
    const pos = parseInt(position);
    if (isNaN(pos) || pos < 1 || pos > maxPosition) {
      alert(`Por favor ingresa un número entre 1 y ${maxPosition}`);
      return;
    }

    // Calculate points based on context
    const pointsEarned = isLeagueContext 
      ? calculateLeaguePoints(pos, false) // Use league system (no swiss bonus for manual adds)
      : calculateGeneralPoints(pos); // Use general system
    
    const wonChampionship = pos === 1;

    const targetPlayers = isLeagueContext ? leaguePlayers.get(selectedTab) || [] : players;
    
    const updated = targetPlayers.map((player) => {
      if (player.id === id) {
        const manualAdj = (player as any).manualAdjustments || { wins: 0, losses: 0, tournaments: 0, championships: 0, points: 0 };
        return {
          ...player,
          tournaments: player.tournaments + 1,
          championships: wonChampionship ? player.championships + 1 : player.championships,
          points: player.points + pointsEarned,
          manualAdjustments: {
            ...manualAdj,
            tournaments: manualAdj.tournaments + 1,
            championships: wonChampionship ? manualAdj.championships + 1 : manualAdj.championships,
            points: manualAdj.points + pointsEarned,
          }
        };
      }
      return player;
    });
    
    if (isLeagueContext) {
      const newLeaguePlayers = new Map(leaguePlayers);
      newLeaguePlayers.set(selectedTab, updated);
      setLeaguePlayers(newLeaguePlayers);
      await saveLeaguePlayers(selectedTab, updated);
    } else {
      setPlayers(updated);
      localStorage.setItem('player-rankings', JSON.stringify(updated));
    }
  };

  const removeTournament = async (id: string) => {
    const isLeagueContext = selectedTab !== 'general';
    const maxPosition = isLeagueContext ? 8 : 10;
    
    const position = prompt(`¿Qué posición quieres restar? (1-${maxPosition})`);
    if (!position) return;
    
    const pos = parseInt(position);
    if (isNaN(pos) || pos < 1 || pos > maxPosition) {
      alert(`Por favor ingresa un número entre 1 y ${maxPosition}`);
      return;
    }

    // Calculate points based on context
    const pointsToRemove = isLeagueContext 
      ? calculateLeaguePoints(pos, false) // Use league system
      : calculateGeneralPoints(pos); // Use general system
    const wasChampionship = pos === 1;

    const targetPlayers = isLeagueContext ? leaguePlayers.get(selectedTab) || [] : players;

    const updated = targetPlayers.map((player) => {
      if (player.id === id) {
        const manualAdj = (player as any).manualAdjustments || { wins: 0, losses: 0, tournaments: 0, championships: 0, points: 0 };
        return {
          ...player,
          tournaments: Math.max(0, player.tournaments - 1),
          championships: wasChampionship ? Math.max(0, player.championships - 1) : player.championships,
          points: Math.max(0, player.points - pointsToRemove),
          manualAdjustments: {
            ...manualAdj,
            tournaments: manualAdj.tournaments - 1,
            championships: wasChampionship ? manualAdj.championships - 1 : manualAdj.championships,
            points: manualAdj.points - pointsToRemove,
          }
        };
      }
      return player;
    });
    
    if (isLeagueContext) {
      const newLeaguePlayers = new Map(leaguePlayers);
      newLeaguePlayers.set(selectedTab, updated);
      setLeaguePlayers(newLeaguePlayers);
      await saveLeaguePlayers(selectedTab, updated);
    } else {
      setPlayers(updated);
      localStorage.setItem('player-rankings', JSON.stringify(updated));
    }
  };

  const deletePlayer = async (id: string) => {
    const isLeagueContext = selectedTab !== 'general';
    const targetPlayers = isLeagueContext ? leaguePlayers.get(selectedTab) || [] : players;
    
    const updated = targetPlayers.filter((p) => p.id !== id);
    
    if (isLeagueContext) {
      const newLeaguePlayers = new Map(leaguePlayers);
      newLeaguePlayers.set(selectedTab, updated);
      setLeaguePlayers(newLeaguePlayers);
      await saveLeaguePlayers(selectedTab, updated);
    } else {
      setPlayers(updated);
      localStorage.setItem('player-rankings', JSON.stringify(updated));
    }
  };

  // NEW: Get the correct player list based on selected tab
  const currentPlayers = selectedTab === 'general' 
    ? players 
    : (leaguePlayers.get(selectedTab) || []);

  const sortedPlayers = [...currentPlayers].sort((a, b) => b.points - a.points);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Star className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Star className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Star className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getTier = (points: number) => {
    if (points >= 51) return { name: 'Master', color: 'bg-purple-600', nextTier: null, pointsNeeded: null };
    if (points >= 38) return { name: 'Diamante', color: 'bg-blue-600', nextTier: 'Master', pointsNeeded: 51 - points };
    if (points >= 25) return { name: 'Platino', color: 'bg-cyan-500', nextTier: 'Diamante', pointsNeeded: 38 - points };
    if (points >= 16) return { name: 'Oro', color: 'bg-yellow-500', nextTier: 'Platino', pointsNeeded: 25 - points };
    if (points >= 8) return { name: 'Plata', color: 'bg-gray-400', nextTier: 'Oro', pointsNeeded: 16 - points };
    return { name: 'Bronce', color: 'bg-orange-700', nextTier: 'Plata', pointsNeeded: 8 - points };
  };

  return (
    <div>
      {/* League Management (only for admins) */}
      {isAdmin && <LeagueManagement />}

      {/* Tabs for General Ranking and Leagues */}
      {leagues.length > 0 && (
        <div className="mb-6 bg-white border-2 border-gray-200 rounded-xl p-2">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedTab('general')}
              className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                selectedTab === 'general'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Ranking General
            </button>
            {leagues.map((league: any) => (
              <button
                key={league.id}
                onClick={() => setSelectedTab(league.id)}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  selectedTab === league.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏆 {league.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-500" />
          <h2>{selectedTab === 'general' ? 'Clasificación de Jugadores' : leagues.find((l: any) => l.id === selectedTab)?.name || 'Liga'}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadPlayers}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            title="Sincronizar con torneos"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          {/* Show "New Player" button for admins */}
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center gap-2 ${selectedTab === 'general' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'} text-white px-4 py-2 rounded-lg transition-colors`}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Jugador</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className={`mb-6 ${selectedTab === 'general' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} border-2 rounded-xl p-4`}>
        <div className="flex items-start gap-3">
          <RefreshCw className={`w-5 h-5 ${selectedTab === 'general' ? 'text-blue-600' : 'text-purple-600'} flex-shrink-0 mt-0.5`} />
          <div>
            <h3 className={`${selectedTab === 'general' ? 'text-blue-900' : 'text-purple-900'} mb-1`}>
              {selectedTab === 'general' ? 'Ranking General' : `Liga: ${leagues.find((l: any) => l.id === selectedTab)?.name || ''}`}
            </h3>
            {selectedTab === 'general' ? (
              <>
                <p className="text-blue-800 text-sm mb-2">
                  El ranking se actualiza automáticamente con los datos de todos los torneos. 
                  Los puntos se calculan según la posición final en torneos completados (1° = 10 pts, 2° = 9 pts, 3° = 8 pts, etc.).
                </p>
                <p className="text-blue-800 text-sm">
                  <strong>Sistema de Ventana Deslizante:</strong> Los puntos tienen memoria de 45 torneos. 
                  A partir del torneo 46, se elimina el resultado del torneo 1. En el torneo 47, se elimina el resultado del torneo 2, y así sucesivamente.
                </p>
              </>
            ) : (
              <>
                <p className="text-purple-800 text-sm mb-2">
                  Esta liga utiliza un sistema de puntuación diferenciado: <strong>1° = 15 pts, 2° = 12 pts, 3° = 10 pts, 4° = 7 pts, 5°-8° = 2 pts cada uno</strong>.
                </p>
                <p className="text-purple-800 text-sm mb-2">
                  <strong>Bonus especial:</strong> En torneos combinados (Suizo + Eliminación), el ganador de la fase suiza recibe <strong>10 puntos extra</strong> sumados al total de su posición final.
                </p>
                <p className="text-purple-800 text-sm">
                  <strong>Sistema de Ventana Deslizante:</strong> Los puntos tienen memoria de 45 torneos de esta liga específicamente.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tiers Info */}
      <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <Trophy className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-purple-900 mb-1">Sistema de Tiers</h3>
            <p className="text-purple-800 text-sm mb-3">
              Los jugadores se clasifican en diferentes tiers según sus puntos acumulados:
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-orange-700 text-white rounded-lg p-3 text-center">
            <p className="text-lg mb-1">🥉 Bronce</p>
            <p className="text-sm opacity-90">0 - 7 pts</p>
          </div>
          <div className="bg-gray-400 text-white rounded-lg p-3 text-center">
            <p className="text-lg mb-1">🥈 Plata</p>
            <p className="text-sm opacity-90">8 - 15 pts</p>
          </div>
          <div className="bg-yellow-500 text-white rounded-lg p-3 text-center">
            <p className="text-lg mb-1">🥇 Oro</p>
            <p className="text-sm opacity-90">16 - 24 pts</p>
          </div>
          <div className="bg-cyan-500 text-white rounded-lg p-3 text-center">
            <p className="text-lg mb-1">💎 Platino</p>
            <p className="text-sm opacity-90">25 - 37 pts</p>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-3 text-center">
            <p className="text-lg mb-1">💠 Diamante</p>
            <p className="text-sm opacity-90">38 - 50 pts</p>
          </div>
          <div className="bg-purple-600 text-white rounded-lg p-3 text-center">
            <p className="text-lg mb-1">👑 Master</p>
            <p className="text-sm opacity-90">51+ pts</p>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={addPlayer} className={`${selectedTab === 'general' ? 'bg-indigo-50' : 'bg-purple-50'} p-6 rounded-xl mb-6`}>
          <h3 className="mb-4">Agregar Nuevo Jugador</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre del jugador"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className={`${selectedTab === 'general' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'} text-white px-6 py-2 rounded-lg transition-colors`}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Podio - Top 3 */}
      {sortedPlayers.length >= 3 && (
        <div className="mb-8">
          <h3 className="text-center mb-6 text-gray-700 flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Top 3 Jugadores
          </h3>
          
          {/* Vista Desktop - Podio horizontal */}
          <div className="hidden md:grid grid-cols-3 gap-4 max-w-5xl mx-auto items-end">
            {/* 2do Lugar */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-br from-gray-300 to-gray-500 text-white rounded-2xl p-6 w-full shadow-xl transform hover:scale-105 transition-transform">
                <div className="flex flex-col items-center">
                  <Medal className="w-12 h-12 mb-3" />
                  <div className="text-center mb-4">
                    <p className="text-4xl mb-1">2°</p>
                    <p className="text-xl truncate">{sortedPlayers[1].name}</p>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                      <p className="text-xs opacity-90">Puntos</p>
                      <p className="text-2xl">{sortedPlayers[1].points}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                        <p className="opacity-90">Torneos</p>
                        <p className="text-lg">{sortedPlayers[1].tournaments}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                        <p className="opacity-90">Títulos</p>
                        <p className="text-lg">{sortedPlayers[1].championships}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 1er Lugar */}
            <div className="flex flex-col items-center -mt-8">
              <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-2xl p-8 w-full shadow-2xl transform hover:scale-105 transition-transform border-4 border-yellow-300">
                <div className="flex flex-col items-center">
                  <Crown className="w-16 h-16 mb-4 animate-pulse" />
                  <div className="text-center mb-4">
                    <p className="text-5xl mb-2">1°</p>
                    <p className="text-2xl truncate">{sortedPlayers[0].name}</p>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg p-3 text-center">
                      <p className="text-sm opacity-90">Puntos</p>
                      <p className="text-3xl">{sortedPlayers[0].points}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white/30 backdrop-blur-sm rounded-lg p-2 text-center">
                        <p className="opacity-90">Torneos</p>
                        <p className="text-xl">{sortedPlayers[0].tournaments}</p>
                      </div>
                      <div className="bg-white/30 backdrop-blur-sm rounded-lg p-2 text-center">
                        <p className="opacity-90">Títulos</p>
                        <p className="text-xl">{sortedPlayers[0].championships}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3er Lugar */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-br from-orange-600 to-orange-800 text-white rounded-2xl p-6 w-full shadow-xl transform hover:scale-105 transition-transform">
                <div className="flex flex-col items-center">
                  <Award className="w-12 h-12 mb-3" />
                  <div className="text-center mb-4">
                    <p className="text-4xl mb-1">3°</p>
                    <p className="text-xl truncate">{sortedPlayers[2].name}</p>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                      <p className="text-xs opacity-90">Puntos</p>
                      <p className="text-2xl">{sortedPlayers[2].points}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                        <p className="opacity-90">Torneos</p>
                        <p className="text-lg">{sortedPlayers[2].tournaments}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                        <p className="opacity-90">Títulos</p>
                        <p className="text-lg">{sortedPlayers[2].championships}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vista Mobile - Podio vertical */}
          <div className="md:hidden space-y-4 max-w-md mx-auto">
            {/* 1er Lugar */}
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-2xl p-6 shadow-2xl border-4 border-yellow-300">
              <div className="flex items-center gap-4 mb-4">
                <Crown className="w-12 h-12 animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-3xl mb-1">1° Lugar</p>
                  <p className="text-xl truncate">{sortedPlayers[0].name}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/30 backdrop-blur-sm rounded-lg p-3 text-center">
                  <p className="text-xs opacity-90 mb-1">Puntos</p>
                  <p className="text-2xl">{sortedPlayers[0].points}</p>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-lg p-3 text-center">
                  <p className="text-xs opacity-90 mb-1">Torneos</p>
                  <p className="text-2xl">{sortedPlayers[0].tournaments}</p>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-lg p-3 text-center">
                  <p className="text-xs opacity-90 mb-1">Títulos</p>
                  <p className="text-2xl">{sortedPlayers[0].championships}</p>
                </div>
              </div>
            </div>

            {/* 2do Lugar */}
            <div className="bg-gradient-to-br from-gray-300 to-gray-500 text-white rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <Medal className="w-10 h-10 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-2xl mb-1">2° Lugar</p>
                  <p className="text-lg truncate">{sortedPlayers[1].name}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                  <p className="text-xs opacity-90 mb-1">Puntos</p>
                  <p className="text-xl">{sortedPlayers[1].points}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                  <p className="text-xs opacity-90 mb-1">Torneos</p>
                  <p className="text-xl">{sortedPlayers[1].tournaments}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                  <p className="text-xs opacity-90 mb-1">Títulos</p>
                  <p className="text-xl">{sortedPlayers[1].championships}</p>
                </div>
              </div>
            </div>

            {/* 3er Lugar */}
            <div className="bg-gradient-to-br from-orange-600 to-orange-800 text-white rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <Award className="w-10 h-10 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-2xl mb-1">3° Lugar</p>
                  <p className="text-lg truncate">{sortedPlayers[2].name}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                  <p className="text-xs opacity-90 mb-1">Puntos</p>
                  <p className="text-xl">{sortedPlayers[2].points}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                  <p className="text-xs opacity-90 mb-1">Torneos</p>
                  <p className="text-xl">{sortedPlayers[2].tournaments}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                  <p className="text-xs opacity-90 mb-1">Títulos</p>
                  <p className="text-xl">{sortedPlayers[2].championships}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla del resto de jugadores */}
      {sortedPlayers.length >= 3 && (
        <div>
          <h3 className="text-center mb-4 text-gray-700">Clasificación General</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left p-3 text-gray-700">Pos</th>
                  <th className="text-left p-3 text-gray-700">Jugador</th>
                  <th className="text-left p-3 text-gray-700">Tier</th>
                  <th className="text-center p-3 text-gray-700">Puntos</th>
                  <th className="text-center p-3 text-gray-700">Victorias</th>
                  <th className="text-center p-3 text-gray-700">Derrotas</th>
                  <th className="text-center p-3 text-gray-700">Win Rate</th>
                  <th className="text-center p-3 text-gray-700">Torneos</th>
                  <th className="text-center p-3 text-gray-700">Títulos</th>
                  {isAdmin && <th className="text-center p-3 text-gray-700">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player, index) => {
                  const tier = getTier(player.points);
                  const winRate =
                    player.wins + player.losses > 0
                      ? Math.round((player.wins / (player.wins + player.losses)) * 100)
                      : 0;

                  return (
                    <tr
                      key={player.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-50' : index === 2 ? 'bg-orange-50' : ''
                      }`}
                    >
                      <td className="p-3 text-gray-900">#{index + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{player.name}</span>
                          {player.fromTournament && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Torneo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className={`${tier.color} text-white px-3 py-1 rounded text-sm text-center`}>
                            {tier.name}
                          </span>
                          {tier.nextTier && (
                            <span className="text-xs text-gray-500 text-center">
                              {tier.pointsNeeded} pts → {tier.nextTier}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-indigo-600 flex items-center justify-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {player.points}
                        </span>
                      </td>
                      <td className="p-3 text-center text-green-600">{player.wins}</td>
                      <td className="p-3 text-center text-red-600">{player.losses}</td>
                      <td className="p-3 text-center text-blue-600">{winRate}%</td>
                      <td className="p-3 text-center text-purple-600">{player.tournaments}</td>
                      <td className="p-3 text-center">
                        <span className="text-yellow-600 flex items-center justify-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {player.championships}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
                              className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors text-sm"
                            >
                              {selectedPlayer === player.id ? 'Cerrar' : 'Editar'}
                            </button>
                            <button
                              onClick={() => deletePlayer(player.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}</tbody>
            </table>
          </div>

          {/* Panel de edición expandible para cada jugador */}
          {isAdmin && sortedPlayers.map((player, index) => {
            if (selectedPlayer !== player.id) return null;
            
            return (
              <div key={`edit-${player.id}`} className="mt-2 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
                <h4 className="text-gray-900 mb-3">Editar estadísticas de {player.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button
                    onClick={() => updateWin(player.id)}
                    className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    + Victoria
                  </button>
                  <button
                    onClick={() => removeWin(player.id)}
                    className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    - Victoria
                  </button>
                  <button
                    onClick={() => updateLoss(player.id)}
                    className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    + Derrota
                  </button>
                  <button
                    onClick={() => removeLoss(player.id)}
                    className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    - Derrota
                  </button>
                  <button
                    onClick={() => addTournament(player.id)}
                    className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors text-sm"
                  >
                    + Torneo
                  </button>
                  <button
                    onClick={() => removeTournament(player.id)}
                    className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    - Torneo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mostrar solo el top 3 si hay menos de 4 jugadores */}
      {sortedPlayers.length > 0 && sortedPlayers.length <= 3 && (
        <div className="space-y-4">
          {sortedPlayers.map((player, index) => {
            const tier = getTier(player.points);
            const winRate =
              player.wins + player.losses > 0
                ? Math.round((player.wins / (player.wins + player.losses)) * 100)
                : 0;

            return (
              <div
                key={player.id}
                className={`bg-white border-2 rounded-xl p-5 transition-all ${
                  index === 0
                    ? 'border-yellow-400 shadow-xl'
                    : index === 1
                    ? 'border-gray-300 shadow-lg'
                    : index === 2
                    ? 'border-orange-300 shadow-lg'
                    : 'border-gray-200 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      {getRankIcon(index)}
                      <p className="text-gray-900 mt-1">#{index + 1}</p>
                    </div>
                    <div>
                      <h3 className="text-gray-900 mb-1">
                        {player.name}
                        {player.fromTournament && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Torneo
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`${tier.color} text-white px-3 py-1 rounded`}>
                          {tier.name}
                        </span>
                        <span className="text-indigo-600 flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {player.points} pts
                        </span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => deletePlayer(player.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-gray-600">Victorias</p>
                    <p className="text-green-600">{player.wins}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-gray-600">Derrotas</p>
                    <p className="text-red-600">{player.losses}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-gray-600">Win Rate</p>
                    <p className="text-blue-600">{winRate}%</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-gray-600">Torneos</p>
                    <p className="text-purple-600">{player.tournaments}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <p className="text-gray-600">Campeonatos</p>
                    <p className="text-yellow-600 flex items-center justify-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {player.championships}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => updateWin(player.id)}
                        className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        + Victoria
                      </button>
                      <button
                        onClick={() => removeWin(player.id)}
                        className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        - Victoria
                      </button>
                      <button
                        onClick={() => updateLoss(player.id)}
                        className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        + Derrota
                      </button>
                      <button
                        onClick={() => removeLoss(player.id)}
                        className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        - Derrota
                      </button>
                      <button
                        onClick={() => addTournament(player.id)}
                        className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        + Torneo
                      </button>
                      <button
                        onClick={() => removeTournament(player.id)}
                        className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        - Torneo
                      </button>
                    </>
                  ) : (
                    <div className="col-span-full bg-gray-100 text-gray-600 py-3 rounded-lg text-center">
                      🔒 Solo los administradores pueden editar estadísticas
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sortedPlayers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>No hay jugadores registrados. ¡Agrega el primero!</p>
        </div>
      )}

      <CafecitoButton />
    </div>
  );
}
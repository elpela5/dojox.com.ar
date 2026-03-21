// Utility function to extract top 10 combos from a completed tournament
// and add them to the global combos ranking with points

interface MasterItem {
  id: string;
  name: string;
  type: 'blade' | 'ratchet' | 'bit' | 'lock-chip' | 'main-blade' | 'assist-blade';
  imageUrl?: string;
}

type BeybladeConfig = 
  | {
      type: 'standard';
      blade: string;
      ratchet: string;
      bit: string;
    }
  | {
      type: 'custom';
      lockChip: string;
      mainBlade: string;
      assistBlade: string;
      ratchet: string;
      bit: string;
    };

interface Deck {
  id: string;
  name: string;
  beyblades: BeybladeConfig[];
}

interface Player {
  id: string;
  name: string;
  userId?: string;
  deckId?: string;
  deckBeyblades?: BeybladeConfig[];
  deckName?: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
}

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
  appearances: number; // How many times this combo has appeared in top 10s
  lastAppearanceDate?: string; // ISO date string
  lastTournamentId?: string; // Track last tournament where it appeared
  weeklyHistory?: WeeklyUse[]; // Histórico de usos semanales
  previousPoints?: number; // Puntos de la semana anterior (para calcular tendencia)
  trend?: 'up' | 'down' | 'stable'; // Tendencia calculada
}

// Constantes del sistema (deben coincidir con ComboRankings.tsx)
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

// Calculate Buchholz for sorting
function calculateBuchholz(player: Player, allPlayers: Player[]): number {
  let buchholz = 0;
  // This is a simplified version - you'd need opponent tracking
  return buchholz;
}

// Sort players by tournament standing
function sortPlayersByStanding(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aMatchScore = a.wins + a.draws * 0.5;
    const bMatchScore = b.wins + b.draws * 0.5;
    if (bMatchScore !== aMatchScore) return bMatchScore - aMatchScore;
    return 0;
  });
}

// Check if two combos are identical
function areCombosEqual(combo1: ComboConfig, combo2: ComboConfig): boolean {
  if (combo1.mode !== combo2.mode) return false;
  
  if (combo1.mode === 'standard' && combo2.mode === 'standard') {
    return (
      combo1.blade === combo2.blade &&
      combo1.ratchet === combo2.ratchet &&
      combo1.bit === combo2.bit
    );
  }
  
  if (combo1.mode === 'custom' && combo2.mode === 'custom') {
    return (
      combo1.lockChip === combo2.lockChip &&
      combo1.mainBlade === combo2.mainBlade &&
      combo1.assistBlade === combo2.assistBlade &&
      combo1.ratchet === combo2.ratchet &&
      combo1.bit === combo2.bit
    );
  }
  
  return false;
}

// Generate combo name from beyblade config
function generateComboName(beyblade: BeybladeConfig, catalog: MasterItem[]): string {
  // Helper function to get item name from catalog by ID
  const getItemName = (id: string): string => {
    const item = catalog.find(i => i.id === id);
    return item?.name || id;
  };

  // Helper function to get initials of bit name (all words)
  const getBitInitial = (bitId: string): string => {
    const bitName = getItemName(bitId);
    // Split by spaces and take first letter of each word
    const words = bitName.split(' ');
    const initials = words.map(word => word.charAt(0).toUpperCase()).join('');
    return initials;
  };

  if (beyblade.type === 'standard') {
    // Format: "blade ratchet bit_inicial"
    const bladeName = getItemName(beyblade.blade);
    const ratchetName = getItemName(beyblade.ratchet);
    const bitInitial = getBitInitial(beyblade.bit);
    return `${bladeName} ${ratchetName}${bitInitial}`;
  } else {
    // Format: "lockChip mainBlade assistBlade ratchet bit_inicial"
    const lockChipName = getItemName(beyblade.lockChip);
    const mainBladeName = getItemName(beyblade.mainBlade);
    const assistBladeName = getItemName(beyblade.assistBlade);
    const ratchetName = getItemName(beyblade.ratchet);
    const bitInitial = getBitInitial(beyblade.bit);
    return `${lockChipName} ${mainBladeName} ${assistBladeName} ${ratchetName}${bitInitial}`;
  }
}

// Main function to extract top 10 combos and update global rankings
export async function extractTop10CombosFromTournament(
  tournamentId: string, 
  tournamentPlayers: Player[], 
  allDecks: Deck[],
  existingCombos: Combo[],
  saveComboCallback: (combo: Combo) => Promise<void>,
  catalog: MasterItem[] = [] // Add catalog parameter with default value
): Promise<void> {
  try {
    console.log('🎯 extractTop10CombosFromTournament called with catalog items:', catalog?.length || 0);
    
    if (!tournamentPlayers || tournamentPlayers.length === 0) {
      console.warn(`⚠️ No players found for tournament ${tournamentId}`);
      return;
    }
    
    const players: Player[] = tournamentPlayers;
    
    // Sort players by standing
    const sortedPlayers = sortPlayersByStanding(players);
    
    // Get top 10
    const top10 = sortedPlayers.slice(0, 10);
    
    // Extract combos from top 10 players
    const combosToAdd: ComboConfig[] = [];
    const comboPoints: Map<string, number> = new Map(); // Track points per combo
    const comboPositions: Map<string, number[]> = new Map(); // Track positions per combo
    
    top10.forEach((player, index) => {
      // Points: 1st place = 100pts, 2nd = 80pts, etc.
      const pointsForPosition = POSITION_POINTS[index];
      const position = index + 1; // 1st, 2nd, 3rd, etc.
      
      console.log(`\n🏆 Processing player #${position}: ${player.name}`);
      
      // Check if player has deck beyblades stored (new system)
      if (player.deckBeyblades && player.deckBeyblades.length > 0 && player.deckName) {
        console.log(`✅ Found deck snapshot \"${player.deckName}\" for player ${player.name} (position ${position})`);
        console.log(`📦 Deck contains ${player.deckBeyblades.length} beyblades:`);
        
        // Extract all beyblades from the stored deck snapshot
        player.deckBeyblades.forEach((beyblade, beybladeIndex) => {
          console.log(`   [${beybladeIndex + 1}/${player.deckBeyblades!.length}] ${beyblade.type === 'standard' ? 'Standard' : 'Custom'}`);
          
          const comboConfig: ComboConfig = beyblade.type === 'standard'
            ? {
                mode: 'standard',
                name: generateComboName(beyblade, catalog),
                blade: beyblade.blade,
                ratchet: beyblade.ratchet,
                bit: beyblade.bit,
              }
            : {
                mode: 'custom',
                name: generateComboName(beyblade, catalog),
                lockChip: beyblade.lockChip,
                mainBlade: beyblade.mainBlade,
                assistBlade: beyblade.assistBlade,
                ratchet: beyblade.ratchet,
                bit: beyblade.bit,
              };
          
          console.log(`       Name: ${comboConfig.name}`);
          combosToAdd.push(comboConfig);
          
          // Create unique key for this combo configuration
          const comboKey = beyblade.type === 'standard'
            ? `standard:${beyblade.blade}:${beyblade.ratchet}:${beyblade.bit}`
            : `custom:${beyblade.lockChip}:${beyblade.mainBlade}:${beyblade.assistBlade}:${beyblade.ratchet}:${beyblade.bit}`;
          
          console.log(`       Key: ${comboKey}`);
          console.log(`       Points for position ${position}: ${pointsForPosition}`);
          
          // Add points (if combo appears multiple times in top 10, points accumulate)
          const currentPoints = comboPoints.get(comboKey) || 0;
          comboPoints.set(comboKey, currentPoints + pointsForPosition);
          
          // Track positions
          const currentPositions = comboPositions.get(comboKey) || [];
          currentPositions.push(position);
          comboPositions.set(comboKey, currentPositions);
        });
      } else if (player.deckId && player.userId) {
        // Fallback: Try to find deck in allDecks (old system)
        const playerDeck = allDecks.find(d => d.id === player.deckId);
        if (!playerDeck) {
          console.log(`⚠️ Deck ${player.deckId} not found for player ${player.name}`);
          return;
        }
        
        console.log(`✅ Found deck "${playerDeck.name}" for player ${player.name} (position ${position}) [Fallback]`);
        
        // Extract all beyblades from the deck
        playerDeck.beyblades.forEach((beyblade, beybladeIndex) => {
          const comboConfig: ComboConfig = beyblade.type === 'standard'
            ? {
                mode: 'standard',
                name: generateComboName(beyblade, catalog),
                blade: beyblade.blade,
                ratchet: beyblade.ratchet,
                bit: beyblade.bit,
              }
            : {
                mode: 'custom',
                name: generateComboName(beyblade, catalog),
                lockChip: beyblade.lockChip,
                mainBlade: beyblade.mainBlade,
                assistBlade: beyblade.assistBlade,
                ratchet: beyblade.ratchet,
                bit: beyblade.bit,
              };
          
          combosToAdd.push(comboConfig);
          
          // Create unique key for this combo configuration
          const comboKey = beyblade.type === 'standard'
            ? `standard:${beyblade.blade}:${beyblade.ratchet}:${beyblade.bit}`
            : `custom:${beyblade.lockChip}:${beyblade.mainBlade}:${beyblade.assistBlade}:${beyblade.ratchet}:${beyblade.bit}`;
          
          // Add points (if combo appears multiple times in top 10, points accumulate)
          const currentPoints = comboPoints.get(comboKey) || 0;
          comboPoints.set(comboKey, currentPoints + pointsForPosition);
          
          // Track positions
          const currentPositions = comboPositions.get(comboKey) || [];
          currentPositions.push(position);
          comboPositions.set(comboKey, currentPositions);
        });
      } else {
        console.log(`⚠️ Player ${player.name} has no deck assigned`);
      }
    });
    
    if (combosToAdd.length === 0) {
      console.warn(`⚠️ No combos extracted from tournament ${tournamentId} top 10`);
      return;
    }
    
    console.log(`📊 Total combos to process: ${combosToAdd.length}`);
    console.log(`📊 Unique combo keys: ${comboPoints.size}`);
    
    // Use existing combos from SyncContext
    let updatedCombos = [...existingCombos];
    
    // Create a set of processed combo keys to avoid duplicates
    const processedComboKeys = new Set<string>();
    
    // Process each UNIQUE combo from the tournament (not duplicates)
    for (const comboConfig of combosToAdd) {
      // Generate unique key
      const comboKey = comboConfig.mode === 'standard'
        ? `standard:${comboConfig.blade}:${comboConfig.ratchet}:${comboConfig.bit}`
        : `custom:${comboConfig.lockChip}:${comboConfig.mainBlade}:${comboConfig.assistBlade}:${comboConfig.ratchet}:${comboConfig.bit}`;
      
      // Skip if we already processed this combo
      if (processedComboKeys.has(comboKey)) {
        console.log(`⏭️ Skipping duplicate combo: ${comboConfig.name}`);
        continue;
      }
      
      processedComboKeys.add(comboKey);
      
      const pointsToAdd = comboPoints.get(comboKey) || 0;
      const positions = comboPositions.get(comboKey) || [];
      
      console.log(`🎯 Processing combo: ${comboConfig.name}`);
      console.log(`   Points to add: ${pointsToAdd}`);
      console.log(`   Positions: ${positions.join(', ')}`);
      
      // Check if combo already exists
      const existingCombo = updatedCombos.find(existing => areCombosEqual(existing, comboConfig));
      
      if (existingCombo) {
        // Combo exists - add points
        // Count how many players used this combo (based on positions array)
        const numberOfPlayersUsingCombo = positions.length;
        
        const updatedCombo: Combo = {
          ...existingCombo,
          totalPoints: existingCombo.totalPoints + pointsToAdd,
          appearances: existingCombo.appearances + numberOfPlayersUsingCombo, // Count all players who used it
          lastTournamentId: tournamentId,
          lastAppearanceDate: new Date().toISOString(),
        };
        
        // Actualizar historial semanal
        const weekNumber = getWeekNumber();
        const weekStartDate = getWeekStartDate(weekNumber);
        const existingWeeklyUse = updatedCombo.weeklyHistory?.find(w => w.weekNumber === weekNumber);
        
        if (existingWeeklyUse) {
          existingWeeklyUse.points += pointsToAdd;
          existingWeeklyUse.tournamentIds.push(tournamentId);
          existingWeeklyUse.positions.push(...positions);
        } else {
          updatedCombo.weeklyHistory = [
            ...(updatedCombo.weeklyHistory || []),
            {
              weekNumber,
              weekStartDate,
              points: pointsToAdd,
              tournamentIds: [tournamentId],
              positions: [...positions],
            }
          ];
        }
        
        // Calcular tendencia
        if (updatedCombo.previousPoints !== undefined) {
          if (updatedCombo.totalPoints > updatedCombo.previousPoints) {
            updatedCombo.trend = 'up';
          } else if (updatedCombo.totalPoints < updatedCombo.previousPoints) {
            updatedCombo.trend = 'down';
          } else {
            updatedCombo.trend = 'stable';
          }
        }
        
        updatedCombo.previousPoints = updatedCombo.totalPoints;
        
        await saveComboCallback(updatedCombo);
        console.log(`✅ Updated existing combo: ${updatedCombo.name} (+${pointsToAdd} pts, total: ${updatedCombo.totalPoints} pts)`);
      } else {
        // New combo - create it
        // Count how many players used this combo (based on positions array)
        const numberOfPlayersUsingCombo = positions.length;
        
        const newCombo: Combo = {
          ...comboConfig,
          id: Date.now().toString() + '-' + Math.random(),
          totalPoints: pointsToAdd,
          appearances: numberOfPlayersUsingCombo, // Count all players who used it
          lastTournamentId: tournamentId,
          lastAppearanceDate: new Date().toISOString(),
          weeklyHistory: [
            {
              weekNumber: getWeekNumber(),
              weekStartDate: getWeekStartDate(getWeekNumber()),
              points: pointsToAdd,
              tournamentIds: [tournamentId],
              positions: [...positions],
            }
          ],
          previousPoints: pointsToAdd,
          trend: 'up',
        };
        await saveComboCallback(newCombo);
        console.log(`✅ Created new combo: ${newCombo.name} (${pointsToAdd} pts, ${numberOfPlayersUsingCombo} appearances)`);
      }
    }
    
    console.log(`\n📊 ===== EXTRACTION SUMMARY =====`);
    console.log(`   Total combos collected: ${combosToAdd.length}`);
    console.log(`   Unique combos processed: ${processedComboKeys.size}`);
    console.log(`   Top 10 players analyzed: ${top10.length}`);
    console.log(`   Combo points distribution:`);
    comboPoints.forEach((points, key) => {
      const positions = comboPositions.get(key) || [];
      console.log(`      ${key}: ${points} pts (positions: ${positions.join(', ')})`);
    });
    console.log(`================================\n`);
    
    console.log(`✅ Extracted ${combosToAdd.length} combos from tournament top 10`);
  } catch (error) {
    console.error('❌ Error extracting top 10 combos:', error);
  }
}
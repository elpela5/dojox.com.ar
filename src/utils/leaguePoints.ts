// League points calculation system

export interface League {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
}

export interface LeaguePlayerStats {
  id: string;
  name: string;
  userId?: string;
  points: number;
  tournaments: number;
  position1: number; // Championships
  position2: number;
  position3: number;
  position4: number;
  position5to8: number;
}

// Calculate points for league rankings based on position
export function calculateLeaguePoints(position: number, swissWinnerBonus: boolean = false): number {
  let points = 0;
  
  switch (position) {
    case 1:
      points = 15;
      break;
    case 2:
      points = 12;
      break;
    case 3:
      points = 10;
      break;
    case 4:
      points = 7;
      break;
    case 5:
    case 6:
    case 7:
    case 8:
      points = 2;
      break;
    default:
      points = 0;
  }
  
  // Add swiss winner bonus for combined tournaments
  if (swissWinnerBonus) {
    points += 10;
  }
  
  return points;
}

// Calculate points for general ranking (existing system)
export function calculateGeneralPoints(position: number): number {
  if (position <= 0 || position > 10) return 0;
  return 11 - position;
}

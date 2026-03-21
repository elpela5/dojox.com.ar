import { useSync } from '../contexts/SyncContext';
import { SwissTournament } from './SwissTournament';
import { SingleEliminationTournament } from './SingleEliminationTournament';
import { CombinedTournament } from './CombinedTournament';

interface TournamentWrapperProps {
  tournamentId: string;
  onBack: () => void;
}

export function TournamentWrapper({ tournamentId, onBack }: TournamentWrapperProps) {
  const { tournaments } = useSync();
  
  const tournament = tournaments.find(t => t.id === tournamentId);
  
  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Torneo no encontrado</p>
        <button
          onClick={onBack}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Volver
        </button>
      </div>
    );
  }

  const format = tournament.format || 'swiss'; // Default to swiss for backward compatibility

  // Route to correct tournament component based on format
  if (format === 'single-elimination') {
    return <SingleEliminationTournament tournamentId={tournamentId} onBack={onBack} />;
  }

  if (format === 'combined') {
    return <CombinedTournament tournamentId={tournamentId} onBack={onBack} />;
  }

  // Default: Swiss format
  return <SwissTournament tournamentId={tournamentId} onBack={onBack} />;
}
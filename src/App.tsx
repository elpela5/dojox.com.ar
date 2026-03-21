import { useState } from 'react';
import { Trophy, Users, BarChart3, Swords, UserCircle, Settings, Menu, X, LogOut, Package, Heart, Shield } from 'lucide-react';
import { UserProvider, useUser } from './contexts/UserContext';
import { SyncProvider } from './contexts/SyncContext';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { UserManagement } from './components/UserManagement';
import { ComboRankings } from './components/ComboRankings';
import { TournamentWrapper } from './components/TournamentWrapper';
import { TournamentList } from './components/TournamentList';
import { Collection } from './components/Collection';
import { PlayerRankings } from './components/PlayerRankings';
import { Community } from './components/Community';
import { DatabaseStatus } from './components/DatabaseStatus';
import { DatabaseHealthCheck } from './components/DatabaseHealthCheck';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import dojoXLogo from 'figma:asset/a2750f5576f21540f363b8e030649a2b492d4bc3.png';

type Tab = 'combos' | 'tournament' | 'collection' | 'rankings' | 'community' | 'profile' | 'admin';

function AppContent() {
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('combos');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 overflow-x-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:flex-1">
            <div className="flex items-center justify-center mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                <ImageWithFallback
                  src={dojoXLogo}
                  alt="Dojo X"
                  className="w-32 h-32 sm:w-40 sm:h-40 object-contain relative z-10"
                />
              </div>
            </div>
            <p className="text-gray-400 text-sm sm:text-base">Gestiona tus torneos, colección y estadísticas</p>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 text-white px-3 sm:px-4 py-2 rounded-xl hover:border-blue-500/50 transition-all duration-300 text-sm shadow-lg"
            >
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              <span className="hidden sm:inline">{user.username}</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-500/80 backdrop-blur-md text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2 mb-6 shadow-2xl">
          <div className={`grid ${(user.role === 'developer' || user.role === 'admin') ? 'grid-cols-7' : 'grid-cols-6'} gap-2`}>
            <button
              onClick={() => setActiveTab('combos')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'combos'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="hidden sm:inline">Top Combos</span>
            </button>
            <button
              onClick={() => setActiveTab('tournament')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'tournament'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <Swords className="w-5 h-5" />
              <span className="hidden sm:inline">Torneos</span>
            </button>
            <button
              onClick={() => setActiveTab('collection')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'collection'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="hidden sm:inline">Colección</span>
            </button>
            <button
              onClick={() => setActiveTab('rankings')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'rankings'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Ranking</span>
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'community'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <Heart className="w-5 h-5" />
              <span className="hidden sm:inline">Comunidad</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <UserCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Perfil</span>
            </button>
            {(user.role === 'developer' || user.role === 'admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 p-6">
          {activeTab === 'combos' && <ComboRankings />}
          {activeTab === 'tournament' && (
            selectedTournamentId ? (
              <TournamentWrapper 
                tournamentId={selectedTournamentId} 
                onBack={() => setSelectedTournamentId(null)} 
              />
            ) : (
              <TournamentList onSelectTournament={setSelectedTournamentId} />
            )
          )}
          {activeTab === 'collection' && <Collection />}
          {activeTab === 'rankings' && <PlayerRankings />}
          {activeTab === 'community' && <Community />}
          {activeTab === 'profile' && <Profile />}
          {activeTab === 'admin' && <UserManagement />}
        </div>
      </div>
      
      {/* Database Status Indicator (visible to developer) */}
      <DatabaseStatus />
      <DatabaseHealthCheck />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <SyncProvider>
        <AppContent />
      </SyncProvider>
    </UserProvider>
  );
}
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '../utils/supabase/client';
import { useUser } from './UserContext';

const supabase = getSupabaseClient();

interface SyncContextType {
  // State
  syncing: boolean;
  lastSync: Date | null;
  serverAvailable: boolean;
  
  // Data state (direct access for reactivity)
  tournaments: any[];
  combos: any[];
  catalog: any[];
  decks: any[];
  collection: any[];
  leagues: any[]; // NEW: Leagues data
  
  // Data getters (legacy support)
  getTournaments: () => any[];
  getTournament: (id: string) => any | null;
  getCombos: () => any[];
  getCatalog: () => any[];
  getDecks: () => any[];
  getCollection: () => any[];
  getLeagues: () => any[]; // NEW: Get leagues
  
  // Data setters
  saveTournament: (tournament: any) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  saveCombo: (combo: any) => Promise<void>;
  deleteCombo: (id: string) => Promise<void>;
  saveCatalog: (catalog: any[]) => Promise<void>;
  saveDecks: (decks: any[]) => Promise<void>;
  saveCollection: (collection: any[]) => Promise<void>;
  saveLeague: (league: any) => Promise<void>; // NEW: Save league
  deleteLeague: (id: string) => Promise<void>; // NEW: Delete league
  
  // Manual loaders for specific data
  loadCatalogFromServer: () => Promise<void>;
  loadDecksFromServer: () => Promise<void>;
  loadCollectionFromServer: () => Promise<void>;
  
  // Manual sync
  syncNow: () => Promise<void>;
  
  // Pause auto-refresh
  setAutoRefreshEnabled: (enabled: boolean) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useUser();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [serverAvailable, setServerAvailable] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [databaseAvailable, setDatabaseAvailable] = useState(false);
  
  // Local state (cache)
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  const [collection, setCollection] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]); // NEW: Leagues data
  
  // Realtime channels
  const [kvChannel, setKvChannel] = useState<RealtimeChannel | null>(null);

  // Check if database tables exist
  const checkDatabaseAvailable = async () => {
    try {
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .select('key')
        .limit(1);

      const available = !error || error.code !== '42P01'; // 42P01 = table doesn't exist
      setDatabaseAvailable(available);
      setServerAvailable(available);
      console.log('🗄️ KV Store database available:', available);
      return available;
    } catch (error) {
      console.log('⚠️ Database not available, using localStorage fallback');
      setDatabaseAvailable(false);
      setServerAvailable(false);
      loadFromLocalStorage();
      return false;
    }
  };

  // Load from localStorage (fallback)
  const loadFromLocalStorage = () => {
    console.log('📂 Loading data from localStorage...');
    
    // Load tournaments
    const storedTournaments = localStorage.getItem('beyblade-tournaments');
    if (storedTournaments) {
      setTournaments(JSON.parse(storedTournaments));
    }

    // Load combos
    const storedCombos = localStorage.getItem('beyblade-combos');
    if (storedCombos) {
      setCombos(JSON.parse(storedCombos));
    }

    // Load catalog
    const storedCatalog = localStorage.getItem('beyblade-catalog');
    if (storedCatalog) {
      setCatalog(JSON.parse(storedCatalog));
    }

    // Load leagues
    const storedLeagues = localStorage.getItem('beyblade-leagues');
    if (storedLeagues) {
      setLeagues(JSON.parse(storedLeagues));
    }

    // Load user's decks
    if (user) {
      const storedDecks = localStorage.getItem(`user-decks-${user.id}`);
      if (storedDecks) {
        setDecks(JSON.parse(storedDecks));
      }

      // Load user's collection
      const storedCollection = localStorage.getItem(`user-collection-${user.id}`);
      if (storedCollection) {
        setCollection(JSON.parse(storedCollection));
      }
    }
    
    console.log('✅ Data loaded from localStorage');
  };

  // ============================================================================
  // LOAD DATA FROM DATABASE
  // ============================================================================

  const loadTournaments = async () => {
    const dbAvailable = await checkDatabaseAvailable();
    if (!dbAvailable) return;

    try {
      const { data, error } = await supabase
        .from('kv_store_e700bf19')
        .select('value')
        .like('key', 'tournament:%');

      if (error) {
        console.log('⚠️ Error loading tournaments from DB, using localStorage');
        return;
      }

      const tournamentsData = (data || []).map(row => row.value);
      setTournaments(tournamentsData);
      console.log('✅ Loaded tournaments from database:', tournamentsData.length);
      
      // Log tournaments with globalSequence
      const withSequence = tournamentsData.filter((t: any) => t.globalSequence);
      console.log('📊 Tournaments with globalSequence:', withSequence.length);
      if (withSequence.length > 0) {
        console.log('Sample tournament with globalSequence:', withSequence[0]);
      }
    } catch (error) {
      console.log('⚠️ Failed to fetch tournaments, using localStorage');
    }
  };

  const loadCombos = async () => {
    const dbAvailable = await checkDatabaseAvailable();
    if (!dbAvailable) return;

    try {
      const { data, error } = await supabase
        .from('kv_store_e700bf19')
        .select('value')
        .like('key', 'combo:%');

      if (error) {
        console.log('⚠️ Error loading combos from DB, using localStorage');
        return;
      }

      const combosData = (data || []).map(row => row.value);
      setCombos(combosData);
      console.log('✅ Loaded combos from database:', combosData.length);
    } catch (error) {
      console.log('⚠️ Failed to fetch combos, using localStorage');
    }
  };

  const loadCatalogFromServer = async () => {
    const dbAvailable = await checkDatabaseAvailable();
    if (!dbAvailable) return;

    try {
      const { data, error } = await supabase
        .from('kv_store_e700bf19')
        .select('value')
        .eq('key', 'catalog')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('⚠️ Error loading catalog from DB, using localStorage');
        return;
      }

      const catalogData = data?.value || [];
      setCatalog(catalogData);
      console.log('✅ Loaded catalog from database:', catalogData.length);
    } catch (error) {
      console.log('⚠️ Failed to fetch catalog, using localStorage');
    }
  };

  const loadDecksFromServer = async () => {
    if (!user) return;

    const dbAvailable = await checkDatabaseAvailable();
    if (!dbAvailable) return;

    try {
      const { data, error } = await supabase
        .from('kv_store_e700bf19')
        .select('value')
        .eq('key', `decks:${user.id}`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.log('⚠️ Error loading decks from DB, using localStorage');
        return;
      }

      const decksData = data?.value || [];
      setDecks(decksData);
      console.log('✅ Loaded decks from database:', decksData.length);
    } catch (error) {
      console.log('⚠️ Failed to fetch decks, using localStorage');
    }
  };

  const loadCollectionFromServer = async () => {
    if (!user) return;

    const dbAvailable = await checkDatabaseAvailable();
    if (!dbAvailable) return;

    try {
      const { data, error } = await supabase
        .from('kv_store_e700bf19')
        .select('value')
        .eq('key', `collection:${user.id}`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.log('⚠️ Error loading collection from DB, using localStorage');
        return;
      }

      const collectionData = data?.value || [];
      setCollection(collectionData);
      console.log('✅ Loaded collection from database:', collectionData.length);
    } catch (error) {
      console.log('⚠️ Failed to fetch collection, using localStorage');
    }
  };

  const loadLeaguesFromServer = async () => {
    const dbAvailable = await checkDatabaseAvailable();
    if (!dbAvailable) return;

    try {
      const { data, error } = await supabase
        .from('kv_store_e700bf19')
        .select('value')
        .like('key', 'league:%');

      if (error && error.code !== 'PGRST116') {
        console.log('⚠️ Error loading leagues from DB, using localStorage');
        return;
      }

      const leaguesData = (data || []).map(row => row.value);
      setLeagues(leaguesData);
      console.log('✅ Loaded leagues from database:', leaguesData.length);
    } catch (error) {
      console.log('⚠️ Failed to fetch leagues, using localStorage');
    }
  };

  // ============================================================================
  // LOAD ALL DATA
  // ============================================================================

  const loadFromServer = useCallback(async () => {
    if (!user || !accessToken) {
      console.log('ℹ️ Not logged in, skipping data load');
      return;
    }

    try {
      setSyncing(true);
      await Promise.all([
        loadTournaments(),
        loadCombos(),
        loadCatalogFromServer(),
        loadDecksFromServer(),
        loadCollectionFromServer(),
        loadLeaguesFromServer(),
      ]);
      setLastSync(new Date());
      setServerAvailable(true);
      console.log('✅ All data loaded from database');
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setServerAvailable(false);
    } finally {
      setSyncing(false);
    }
  }, [user, accessToken]);

  // ============================================================================
  // REALTIME SUBSCRIPTIONS
  // ============================================================================

  useEffect(() => {
    if (!user || !accessToken) {
      // Unsubscribe if logged out
      if (kvChannel) {
        try {
          kvChannel.unsubscribe();
        } catch (error) {
          console.log('⚠️ Error unsubscribing from Realtime (non-critical)');
        }
        setKvChannel(null);
      }
      return;
    }

    // Subscribe to kv_store changes
    console.log('🔄 Setting up Realtime subscription...');
    
    try {
      const channel = supabase
        .channel('kv_store_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kv_store_e700bf19'
          },
          (payload) => {
            console.log('🔄 Realtime change detected:', payload);
            
            // Reload specific data based on key
            const key = (payload.new as any)?.key || (payload.old as any)?.key;
            
            // For INSERT and UPDATE events, use the payload data directly to avoid race conditions
            // Only reload from DB on DELETE or if payload is missing
            if (key?.startsWith('tournament:')) {
              if (payload.eventType === 'DELETE') {
                // Reload from database on delete
                loadTournaments();
              } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                // Use the payload data directly to avoid race conditions
                const tournamentData = (payload.new as any)?.value;
                if (tournamentData) {
                  setTournaments(prev => {
                    const exists = prev.some(t => t.id === tournamentData.id);
                    if (exists) {
                      return prev.map(t => t.id === tournamentData.id ? tournamentData : t);
                    } else {
                      return [...prev, tournamentData];
                    }
                  });
                } else {
                  // Fallback to reload if payload is missing
                  loadTournaments();
                }
              }
            } else if (key?.startsWith('combo:')) {
              if (payload.eventType === 'DELETE') {
                // Reload from database on delete
                loadCombos();
              } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                // Use the payload data directly to avoid race conditions
                const comboData = (payload.new as any)?.value;
                if (comboData) {
                  setCombos(prev => {
                    const exists = prev.some(c => c.id === comboData.id);
                    if (exists) {
                      return prev.map(c => c.id === comboData.id ? comboData : c);
                    } else {
                      return [...prev, comboData];
                    }
                  });
                } else {
                  // Fallback to reload if payload is missing
                  loadCombos();
                }
              }
            } else if (key === 'catalog') {
              loadCatalogFromServer();
            } else if (key === `decks:${user.id}`) {
              loadDecksFromServer();
            } else if (key === `collection:${user.id}`) {
              loadCollectionFromServer();
            } else if (key === `leagues:${user.id}`) {
              loadLeaguesFromServer();
            }
          }
        )
        .subscribe((status) => {
          console.log('🔄 Realtime subscription status:', status);
        });

      setKvChannel(channel);
    } catch (error: any) {
      console.log('⚠️ Could not set up Realtime subscription (non-critical):', error.message || error);
    }

    return () => {
      console.log('🔄 Unsubscribing from Realtime...');
      if (kvChannel) {
        try {
          kvChannel.unsubscribe();
        } catch (error) {
          console.log('⚠️ Error unsubscribing from Realtime (non-critical)');
        }
      }
    };
  }, [user, accessToken]);

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  useEffect(() => {
    if (user && accessToken) {
      checkDatabaseAvailable().then(available => {
        if (available) {
          loadFromServer();
        } else {
          // Load from localStorage if database not available
          loadFromLocalStorage();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken, loadFromServer]);

  // ============================================================================
  // GETTERS
  // ============================================================================

  const getTournaments = () => tournaments;
  const getTournament = (id: string) => tournaments.find(t => t.id === id) || null;
  const getCombos = () => combos;
  const getCatalog = () => catalog;
  const getDecks = () => decks;
  const getCollection = () => collection;
  const getLeagues = () => leagues; // NEW: Get leagues

  // ============================================================================
  // SETTERS
  // ============================================================================

  const saveTournament = async (tournament: any) => {
    if (!user) {
      console.error('❌ Cannot save tournament: not logged in');
      return;
    }

    // Always save to localStorage first
    const updated = tournaments.some(t => t.id === tournament.id)
      ? tournaments.map(t => t.id === tournament.id ? tournament : t)
      : [...tournaments, tournament];
    
    setTournaments(updated);
    localStorage.setItem('beyblade-tournaments', JSON.stringify(updated));

    // Try to save to database if available
    if (!databaseAvailable) {
      console.log('💾 Tournament saved to localStorage (DB not available)');
      return;
    }

    try {
      console.log('💾 Attempting to save to database...');
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .upsert({
          key: `tournament:${tournament.id}`,
          value: tournament,
        });

      if (error) {
        console.log('⚠️ Error saving tournament to DB, using localStorage only', error);
        return;
      }

      console.log('✅ Tournament saved to database');
    } catch (error) {
      console.log('⚠️ Failed to save tournament to DB, using localStorage only', error);
    }
  };

  const deleteTournament = async (id: string) => {
    if (!user) {
      console.error('❌ Cannot delete tournament: not logged in');
      return;
    }

    // Always delete from localStorage first
    const updated = tournaments.filter(t => t.id !== id);
    setTournaments(updated);
    localStorage.setItem('beyblade-tournaments', JSON.stringify(updated));

    // Try to delete from database if available
    if (!databaseAvailable) {
      console.log('💾 Tournament deleted from localStorage (DB not available)');
      return;
    }

    try {
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .delete()
        .eq('key', `tournament:${id}`);

      if (error) {
        console.log('⚠️ Error deleting tournament from DB, using localStorage only');
        return;
      }

      console.log('✅ Tournament deleted from database');
    } catch (error) {
      console.log('⚠️ Failed to delete tournament from DB, using localStorage only');
    }
  };

  const saveCombo = async (combo: any) => {
    if (!user) {
      console.error('❌ Cannot save combo: not logged in');
      return;
    }

    // Always save to localStorage first
    const updated = combos.some(c => c.id === combo.id)
      ? combos.map(c => c.id === combo.id ? combo : c)
      : [...combos, combo];
    setCombos(updated);
    localStorage.setItem('beyblade-combos', JSON.stringify(updated));

    // Try to save to database if available
    if (!databaseAvailable) {
      console.log('💾 Combo saved to localStorage (DB not available)');
      return;
    }

    try {
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .upsert({
          key: `combo:${combo.id}`,
          value: combo,
        });

      if (error) {
        console.log('⚠️ Error saving combo to DB, using localStorage only:', error.message);
        return;
      }

      console.log('✅ Combo saved to database');
    } catch (error: any) {
      console.log('⚠️ Failed to save combo to DB, using localStorage only:', error.message || error);
      // Don't throw - allow operation to continue
    }
  };

  const deleteCombo = async (id: string) => {
    if (!user) {
      console.error('❌ Cannot delete combo: not logged in');
      return;
    }

    // Always delete from localStorage first
    const updated = combos.filter(c => c.id !== id);
    setCombos(updated);
    localStorage.setItem('beyblade-combos', JSON.stringify(updated));

    // Try to delete from database if available
    if (!databaseAvailable) {
      console.log('💾 Combo deleted from localStorage (DB not available)');
      return;
    }

    try {
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .delete()
        .eq('key', `combo:${id}`);

      if (error) {
        console.log('⚠️ Error deleting combo from DB, using localStorage only');
        return;
      }

      console.log('✅ Combo deleted from database');
    } catch (error) {
      console.log('⚠️ Failed to delete combo from DB, using localStorage only');
    }
  };

  const saveCatalog = async (newCatalog: any[]) => {
    if (!user) {
      console.error('❌ Cannot save catalog: not logged in');
      return;
    }

    // Always save to localStorage first
    setCatalog(newCatalog);
    localStorage.setItem('beyblade-catalog', JSON.stringify(newCatalog));

    // Try to save to database if available
    if (!databaseAvailable) {
      console.log('💾 Catalog saved to localStorage (DB not available)');
      return;
    }

    try {
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .upsert({
          key: 'catalog',
          value: newCatalog,
        });

      if (error) {
        console.log('⚠️ Error saving catalog to DB, using localStorage only');
        return;
      }

      console.log('✅ Catalog saved to database');
    } catch (error) {
      console.log('⚠️ Failed to save catalog to DB, using localStorage only');
    }
  };

  const saveDecks = async (newDecks: any[]) => {
    if (!user) {
      console.error('❌ Cannot save decks: not logged in');
      return;
    }

    // Always save to localStorage first
    setDecks(newDecks);
    localStorage.setItem(`user-decks-${user.id}`, JSON.stringify(newDecks));

    // Try to save to database if available
    if (!databaseAvailable) {
      console.log('💾 Decks saved to localStorage (DB not available)');
      return;
    }

    try {
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .upsert({
          key: `decks:${user.id}`,
          value: newDecks,
        });

      if (error) {
        console.log('⚠️ Error saving decks to DB, using localStorage only');
        return;
      }

      console.log('✅ Decks saved to database');
    } catch (error) {
      console.log('⚠️ Failed to save decks to DB, using localStorage only');
    }
  };

  const saveCollection = async (newCollection: any[]) => {
    if (!user) {
      console.error('❌ Cannot save collection: not logged in');
      return;
    }

    // Always save to localStorage first
    setCollection(newCollection);
    localStorage.setItem(`user-collection-${user.id}`, JSON.stringify(newCollection));

    // Try to save to database if available
    if (!databaseAvailable) {
      console.log('💾 Collection saved to localStorage (DB not available)');
      return;
    }

    try {
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .upsert({
          key: `collection:${user.id}`,
          value: newCollection,
        });

      if (error) {
        console.log('⚠️ Error saving collection to DB, using localStorage only');
        return;
      }

      console.log('✅ Collection saved to database');
    } catch (error) {
      console.log('⚠️ Failed to save collection to DB, using localStorage only');
    }
  };

  const saveLeague = async (league: any) => {
    if (!user) {
      console.error('❌ Cannot save league: not logged in');
      return;
    }

    // Always save to localStorage first
    const updated = leagues.some(l => l.id === league.id)
      ? leagues.map(l => l.id === league.id ? league : l)
      : [...leagues, league];
    setLeagues(updated);
    localStorage.setItem(`user-leagues-${user.id}`, JSON.stringify(updated));

    // Try to save to database if available
    if (!databaseAvailable) {
      console.log('💾 League saved to localStorage (DB not available)');
      return;
    }

    try {
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .upsert({
          key: `league:${league.id}`,
          value: league,
        });

      if (error) {
        console.log('⚠️ Error saving league to DB, using localStorage only:', error.message);
        return;
      }

      console.log('✅ League saved to database');
    } catch (error: any) {
      console.log('⚠️ Failed to save league to DB, using localStorage only:', error.message || error);
      // Don't throw - allow operation to continue
    }
  };

  const deleteLeague = async (id: string) => {
    if (!user) {
      console.error('❌ Cannot delete league: not logged in');
      return;
    }

    // Always delete from localStorage first
    const updated = leagues.filter(l => l.id !== id);
    setLeagues(updated);
    localStorage.setItem(`user-leagues-${user.id}`, JSON.stringify(updated));

    // Try to delete from database if available
    if (!databaseAvailable) {
      console.log('💾 League deleted from localStorage (DB not available)');
      return;
    }

    try {
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .delete()
        .eq('key', `league:${id}`);

      if (error) {
        console.log('⚠️ Error deleting league from DB, using localStorage only');
        return;
      }

      console.log('✅ League deleted from database');
    } catch (error) {
      console.log('⚠️ Failed to delete league from DB, using localStorage only');
    }
  };

  const syncNow = async () => {
    await loadFromServer();
  };

  return (
    <SyncContext.Provider value={{
      syncing,
      lastSync,
      serverAvailable,
      tournaments,
      combos,
      catalog,
      decks,
      collection,
      leagues, // NEW: Leagues data
      getTournaments,
      getTournament,
      getCombos,
      getCatalog,
      getDecks,
      getCollection,
      getLeagues, // NEW: Get leagues
      saveTournament,
      deleteTournament,
      saveCombo,
      deleteCombo,
      saveCatalog,
      saveDecks,
      saveCollection,
      saveLeague, // NEW: Save league
      deleteLeague, // NEW: Delete league
      loadCatalogFromServer,
      loadDecksFromServer,
      loadCollectionFromServer,
      syncNow,
      setAutoRefreshEnabled
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
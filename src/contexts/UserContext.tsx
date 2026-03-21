import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient, injectSupabaseSession } from '../utils/supabase/client';
import { publicAnonKey, projectId } from '../utils/supabase/info';

const supabase = getSupabaseClient();

interface User {
  id: string;
  username: string;
  email: string;
  profilePicture: string;
  role: 'developer' | 'admin' | 'judge' | 'user';
  createdAt: string;
  isAdmin?: boolean; // Computed property: true if role is 'admin' or 'developer'
}

interface UserContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfilePicture: (picture: string) => void;
  updateUserRole: (userId: string, role: 'admin' | 'judge' | 'user') => void;
  getAllUsers: () => User[];
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changeUsername: (newUsername: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  adminChangeUsername: (userId: string, newUsername: string) => Promise<{ success: boolean; error?: string }>;
  adminChangePassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  adminDeleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  forceRefreshSession: () => Promise<boolean>;
  forceLogoutAndClear: () => Promise<void>;
  allUsers: User[]; // Realtime list
  databaseAvailable: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper function to add computed properties to User object
const enrichUser = (user: Omit<User, 'isAdmin'> | User): User => ({
  ...user,
  isAdmin: user.role === 'admin' || user.role === 'developer',
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [databaseAvailable, setDatabaseAvailable] = useState(false);

  // Check if database tables exist
  const checkDatabaseAvailable = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles_e700bf19')
        .select('id')
        .limit(1);

      const available = !error || error.code !== '42P01'; // 42P01 = table doesn't exist
      setDatabaseAvailable(available);
      console.log('🗄️ Database available:', available);
      
      if (error && error.code !== '42P01') {
        console.log('⚠️ Database error (non-critical):', error.message);
      }
      
      return available;
    } catch (error: any) {
      console.log('⚠️ Database not available (network/connection issue):', error.message);
      setDatabaseAvailable(false);
      return false;
    }
  };

  // Helper function to load users from database (can be called independently)
  const loadUsersFromDatabase = async () => {
    try {
      const dbAvailable = await checkDatabaseAvailable();
      if (!dbAvailable) return;

      const { data, error } = await supabase
        .from('user_profiles_e700bf19')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('⚠️ Error loading users (non-critical):', error.message);
        return;
      }

      const users = (data || []).map(profile => enrichUser({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        profilePicture: profile.profile_picture || '',
        role: profile.role as 'developer' | 'admin' | 'judge' | 'user',
        createdAt: profile.created_at || new Date().toISOString(),
      }));

      setAllUsers(users);
      console.log('✅ Loaded users from database:', users.length);
    } catch (error: any) {
      console.log('⚠️ Failed to load users (network error):', error.message || error);
    }
  };

  // Load all users from database with Realtime
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const dbAvailable = await checkDatabaseAvailable();
        if (!dbAvailable) return;

        try {
          const { data, error } = await supabase
            .from('user_profiles_e700bf19')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.log('⚠️ Error loading users (non-critical):', error.message);
            return;
          }

          const users = (data || []).map(profile => enrichUser({
            id: profile.id,
            username: profile.username,
            email: profile.email,
            profilePicture: profile.profile_picture || '',
            role: profile.role as 'developer' | 'admin' | 'judge' | 'user',
            createdAt: profile.created_at || new Date().toISOString(),
          }));

          setAllUsers(users);
          console.log('✅ Loaded users from database:', users.length);
        } catch (error: any) {
          console.log('⚠️ Failed to load users (network error):', error.message || error);
        }
      } catch (error: any) {
        console.log('⚠️ Failed to check database availability:', error.message || error);
      }
    };

    loadUsers();

    // Subscribe to realtime changes (only if database available)
    let channel: any = null;
    
    checkDatabaseAvailable().then(available => {
      if (!available) return;

      try {
        channel = supabase
          .channel('user_profiles_realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_profiles_e700bf19'
            },
            (payload) => {
              console.log('🔄 Realtime user profile change:', payload);
              loadUsers(); // Reload all users on any change
            }
          )
          .subscribe();
      } catch (error: any) {
        console.log('⚠️ Could not subscribe to realtime updates (non-critical):', error.message || error);
      }
    }).catch(error => {
      console.log('⚠️ Failed to check database for realtime (non-critical)');
    });

    return () => {
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (error) {
          console.log('⚠️ Error unsubscribing from channel (non-critical)');
        }
      }
    };
  }, []);

  // Load user from session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const dbAvailable = await checkDatabaseAvailable();
        
        // Try to get session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('ℹ️ No session found:', error.message);
          return;
        }

        if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email);
          
          // Build user from auth metadata (no database dependency)
          const isDeveloper = session.user.email === 'ianlihuel97@gmail.com';
          const username = session.user.user_metadata?.username || 
                         session.user.email?.split('@')[0] || 
                         'Usuario';

          const userData = enrichUser({
            id: session.user.id,
            username,
            email: session.user.email || '',
            profilePicture: session.user.user_metadata?.profilePicture || '',
            role: isDeveloper ? 'developer' : ((session.user.user_metadata?.role as 'developer' | 'admin' | 'judge' | 'user') || 'user'),
            createdAt: session.user.created_at || new Date().toISOString(),
          });
          
          setUser(userData);
          setAccessToken(session.access_token);
          console.log('✅ User loaded from session');

          // Try to sync profile to database in background (non-blocking)
          if (dbAvailable) {
            supabase
              .from('user_profiles_e700bf19')
              .upsert({
                id: userData.id,
                username: userData.username,
                email: userData.email,
                profile_picture: userData.profilePicture,
                role: userData.role,
                created_at: userData.createdAt,
              })
              .then(({ error }) => {
                if (error) {
                  console.log('⚠️ Could not sync profile to DB (non-critical):', error.message);
                } else {
                  console.log('✅ Profile synced to database');
                }
              })
              .catch(error => {
                console.log('⚠️ Error syncing profile to DB (non-critical):', error.message || error);
              });
          }
        }
      } catch (error: any) {
        console.log('⚠️ Error loading session (non-critical):', error.message || error);
      }
    };
    
    loadSession();

    // Set up auth state change listener (with error protection)
    let subscription: any = null;
    
    try {
      const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session) {
              const dbAvailable = await checkDatabaseAvailable();
              
              let profileLoaded = false;

              if (dbAvailable) {
                // Try to load from database
                try {
                  const { data: profile, error: profileError } = await supabase
                    .from('user_profiles_e700bf19')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                  if (!profileError && profile) {
                    console.log('✅ Profile loaded from database:', profile);
                    
                    // Update user data with database info
                    const dbUserData: User = {
                      id: profile.id,
                      username: profile.username,
                      email: profile.email,
                      profilePicture: profile.profile_picture || '',
                      role: profile.role as 'developer' | 'admin' | 'judge' | 'user',
                      createdAt: profile.created_at || new Date().toISOString(),
                    };
                    
                    setUser(dbUserData);
                    setAccessToken(session.access_token);
                    console.log('✅ User data updated from database:', dbUserData);
                    console.log('✅ User role from DB:', dbUserData.role);
                    console.log('✅ AccessToken set from session');
                    
                    profileLoaded = true;
                    
                    // IMPORTANT: Don't sync back to database after loading - this would overwrite the correct role
                    // The database is the source of truth for roles
                  } else {
                    console.log('⚠️ Could not load profile from DB, using fallback auth data');
                    if (profileError) {
                      console.error('Profile load error:', profileError);
                    }
                  }
                } catch (error: any) {
                  console.log('⚠️ Error loading profile from DB (non-critical):', error.message || error);
                }
              }

              // Fallback - only if profile was not loaded from database
              if (!profileLoaded) {
                const isDeveloper = session.user.email === 'ianlihuel97@gmail.com';
                const username = session.user.user_metadata?.username || 
                               session.user.email?.split('@')[0] || 
                               'Usuario';

                const userData: User = {
                  id: session.user.id,
                  username,
                  email: session.user.email || '',
                  profilePicture: session.user.user_metadata?.profilePicture || '',
                  role: isDeveloper ? 'developer' : ((session.user.user_metadata?.role as 'developer' | 'admin' | 'judge' | 'user') || 'user'),
                  createdAt: session.user.created_at || new Date().toISOString(),
                };
                
                setUser(userData);
                setAccessToken(session.access_token);
                console.log('✅ User data set from fallback (auth metadata)');
                console.log('✅ AccessToken set from session (fallback)');
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setAccessToken(null);
          }
        } catch (error: any) {
          console.log('⚠️ Error in auth state change handler (non-critical):', error.message || error);
        }
      });
      
      subscription = authSub;
    } catch (error: any) {
      console.log('⚠️ Could not set up auth state listener (non-critical):', error.message || error);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.log('⚠️ Error unsubscribing from auth listener (non-critical)');
        }
      }
    };
  }, []);

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Por favor ingresa un email válido (ej: usuario@gmail.com)');
        return false;
      }

      console.log('📝 Creating user account via server...');
      
      // Use server endpoint which auto-confirms email
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e700bf19/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error registering user:', errorData);
        
        // Better error messages
        if (errorData.error?.includes('already registered') || errorData.error?.includes('already been registered')) {
          alert('❌ Este email ya está registrado.\n\n✅ Por favor usa el botón "INICIAR SESIÓN" (no registrarse).');
        } else if (errorData.error?.includes('row-level security')) {
          alert('⚠️ Error de permisos de base de datos.\n\nPor favor contacta al administrador para ejecutar el script de configuración SQL.');
        } else {
          alert(`Error al registrarse: ${errorData.error || 'Error desconocido'}`);
        }
        return false;
      }

      const data = await response.json();
      
      if (!data.success || !data.user) {
        alert('Error al crear la cuenta. Por favor intenta nuevamente.');
        return false;
      }

      console.log('✅ User created via server, now signing in...');

      // Now sign in with the new credentials
      const loginSuccess = await login(email, password);
      
      if (loginSuccess) {
        alert(`✅ ¡Bienvenido ${username}!\n\nTu cuenta ha sido creada exitosamente.`);
        return true;
      } else {
        alert('✅ Cuenta creada exitosamente.\n\n⚠️ Hubo un problema al iniciar sesión automáticamente. Por favor inicia sesión manualmente.');
        return false;
      }
    } catch (error: any) {
      console.error('Error during registration:', error);
      alert('Error al registrarse. Por favor intenta nuevamente.');
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login for:', email);

      // STEP 0: Diagnostic test - check if Supabase project is responding
      console.log('🔍 Testing Supabase project availability...');
      try {
        const testResponse = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': publicAnonKey,
          },
        });
        console.log('🔍 Supabase REST API test:', testResponse.status, testResponse.statusText);
      } catch (fetchError: any) {
        console.error('🔍 Supabase REST API not responding:', fetchError.message);
        alert('⚠️ El servidor de Supabase no responde.\n\nPosibles causas:\n1. El proyecto está pausado\n2. Problemas de conectividad\n3. El proyecto fue eliminado\n\nPor favor verifica tu proyecto en supabase.com');
        return false;
      }

      // STEP 1: Try direct REST API call to auth endpoint
      console.log('🔐 Trying direct REST API login...');
      try {
        const authResponse = await fetch(`https://${projectId}.supabase.co/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': publicAnonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        console.log('🔍 Auth API response status:', authResponse.status);

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          console.error('🔍 Auth API error:', errorData);
          alert('❌ Email o contraseña incorrectos.\n\nPor favor verifica tus credenciales o regístrate si es tu primera vez.');
          return false;
        }

        console.log('🔍 Parsing auth response JSON...');
        const authData = await authResponse.json();
        console.log('✅ Direct auth successful, got tokens');

        // Skip setSession - it's hanging. We'll manage the session manually.
        console.log('🔐 Extracting user info from token...');
        
        // The auth response includes user data
        if (!authData.user) {
          console.error('No user data in auth response');
          alert('❌ Error: No se recibió información del usuario');
          return false;
        }

        console.log('✅ User data received from auth API');

        // STEP 2: Build user data from auth
        console.log('🔐 Building user data...');
        const isDeveloper = email === 'ianlihuel97@gmail.com';
        const username = authData.user.user_metadata?.username || 
                       email.split('@')[0] || 
                       'Usuario';

        const userData: User = {
          id: authData.user.id,
          username,
          email,
          profilePicture: authData.user.user_metadata?.profilePicture || '',
          role: isDeveloper ? 'developer' : ((authData.user.user_metadata?.role as 'developer' | 'admin' | 'judge' | 'user') || 'user'),
          createdAt: authData.user.created_at || new Date().toISOString(),
        };

        console.log('✅ User data built:', userData);

        // STEP 3: Set user state IMMEDIATELY (login is successful!)
        console.log('🔐 Setting user state...');
        setUser(userData);
        console.log('🔐 User state set to:', userData);
        setAccessToken(authData.access_token);
        console.log('🔐 Access token set, length:', authData.access_token?.length);
        
        // CRITICAL: Inject session into Supabase client for realtime/database to work
        console.log('💉 Injecting session into Supabase client...');
        await injectSupabaseSession(authData.access_token, authData.refresh_token);
        console.log('✅ Session injected successfully');
        
        console.log('✅ Login successful!');
        
        // STEP 4: Load user from database with the new session
        console.log('🔍 Loading user profile from database...');
        const dbAvailable = await checkDatabaseAvailable();

        if (dbAvailable) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles_e700bf19')
              .select('*')
              .eq('id', userData.id)
              .maybeSingle();

            if (!profileError && profile) {
              console.log('✅ Profile loaded from database:', profile);
              
              // Update user data with database info
              const dbUserData: User = {
                id: profile.id,
                username: profile.username,
                email: profile.email,
                profilePicture: profile.profile_picture || '',
                role: profile.role as 'developer' | 'admin' | 'judge' | 'user',
                createdAt: profile.created_at || new Date().toISOString(),
              };
              
              setUser(dbUserData);
              console.log('✅ User data updated from database:', dbUserData);
              console.log('✅ User role from DB:', dbUserData.role);
              
              // IMPORTANT: Don't sync back to database after loading - this would overwrite the correct role
              // The database is the source of truth for roles
            } else {
              console.log('⚠️ Could not load profile from DB, using auth data');
              if (profileError) {
                console.error('Profile load error:', profileError);
              }
              
              // Only create profile if it doesn't exist (new user)
              // STEP 5: Try to sync with database in background (non-blocking, async)
              supabase
                .from('user_profiles_e700bf19')
                .upsert({
                  id: userData.id,
                  username: userData.username,
                  email: userData.email,
                  profile_picture: userData.profilePicture,
                  role: userData.role,
                  created_at: userData.createdAt,
                })
                .then(({ error }) => {
                  if (error) {
                    console.log('⚠️ Could not sync profile to DB (non-critical):', error.message);
                  } else {
                    console.log('✅ Profile synced to database');
                  }
                })
                .catch(error => {
                  console.log('⚠️ Error syncing profile to DB (non-critical):', error.message || error);
                });
            }
          } catch (error: any) {
            console.log('⚠️ Error loading profile from DB (non-critical):', error.message || error);
          }
        }
        
        return true;
      } catch (fetchError: any) {
        console.error('Direct auth fetch error:', fetchError);
        alert('❌ Error al conectar con el servidor de autenticación.\n\nError: ' + fetchError.message);
        return false;
      }
    } catch (error: any) {
      console.error('Login exception:', error);
      alert('❌ Error inesperado al iniciar sesión.\n\nError: ' + error.message);
      return false;
    }
  };

  const logout = () => {
    console.log('👋 Logging out...');
    supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    alert('✅ Sesión cerrada exitosamente.');
  };

  const updateProfilePicture = async (picture: string) => {
    if (!user) return;

    const dbAvailable = await checkDatabaseAvailable();

    if (dbAvailable) {
      try {
        const { error } = await supabase
          .from('user_profiles_e700bf19')
          .update({ profile_picture: picture })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating profile picture:', error);
          return;
        }

        setUser(enrichUser({ ...user, profilePicture: picture }));
        console.log('✅ Profile picture updated');
      } catch (error) {
        console.error('Error updating profile picture:', error);
      }
    } else {
      // Fallback: just update local state
      setUser(enrichUser({ ...user, profilePicture: picture }));
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'judge' | 'user') => {
    if (!user || (user.role !== 'developer' && user.role !== 'admin')) {
      console.error('Only developers and admins can update user roles');
      alert('⚠️ No tienes permisos para asignar roles');
      return;
    }

    // Prevent modifying developer's role
    const targetUser = allUsers.find(u => u.id === userId);
    if (targetUser?.role === 'developer') {
      console.error('Cannot modify developer role');
      alert('⚠️ No se puede modificar el rol del desarrollador');
      return;
    }

    // Admins can only assign 'judge' or 'user' roles (not 'admin')
    if (user.role === 'admin' && role === 'admin') {
      console.error('Admins cannot assign admin role');
      alert('⚠️ Los administradores no pueden asignar el rol de administrador');
      return;
    }

    console.log(`🔐 Attempting to update user ${userId} role to:`, role);
    console.log(`🔐 Target user found:`, targetUser);

    const dbAvailable = await checkDatabaseAvailable();

    if (dbAvailable) {
      try {
        console.log('🔐 Updating role in database...');
        const { data, error } = await supabase
          .from('user_profiles_e700bf19')
          .update({ role })
          .eq('id', userId)
          .select();

        if (error) {
          console.error('❌ Error updating user role:', error);
          alert('❌ Error al actualizar el rol del usuario');
          return;
        }

        console.log('✅ User role updated in database to:', role);
        console.log('✅ Updated data returned from database:', data);
        
        // Verify the update was successful by reading back
        const { data: verifyData, error: verifyError } = await supabase
          .from('user_profiles_e700bf19')
          .select('id, username, email, role')
          .eq('id', userId)
          .maybeSingle();
        
        if (!verifyError && verifyData) {
          console.log('✅ Verified role in database:', verifyData);
        } else {
          console.error('⚠️ Could not verify role update:', verifyError);
        }
        
        // Reload users from database to reflect changes
        console.log('🔄 Reloading users from database...');
        await loadUsersFromDatabase();
        
        alert('✅ Rol actualizado exitosamente');
      } catch (error) {
        console.error('❌ Error updating user role:', error);
        alert('❌ Error al actualizar el rol del usuario');
      }
    } else {
      console.error('❌ Database not available, cannot update user role');
      alert('❌ Base de datos no disponible');
    }
  };

  const getAllUsers = () => allUsers;

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Error changing password:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error changing password:', error);
      return { success: false, error: error.message };
    }
  };

  const changeUsername = async (newUsername: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    const dbAvailable = await checkDatabaseAvailable();

    if (dbAvailable) {
      try {
        const { error } = await supabase
          .from('user_profiles_e700bf19')
          .update({ username: newUsername })
          .eq('id', user.id);

        if (error) {
          console.error('Error changing username:', error);
          return { success: false, error: error.message };
        }

        setUser(enrichUser({ ...user, username: newUsername }));
        return { success: true };
      } catch (error: any) {
        console.error('Error changing username:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Fallback: just update local state
      setUser(enrichUser({ ...user, username: newUsername }));
      return { success: true };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        console.error('Error resetting password:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { success: false, error: error.message };
    }
  };

  const adminChangeUsername = async (userId: string, newUsername: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || (user.role !== 'developer' && user.role !== 'admin')) {
      return { success: false, error: 'No tienes permisos' };
    }

    // Prevent modifying developer's username
    const targetUser = allUsers.find(u => u.id === userId);
    if (targetUser?.role === 'developer') {
      return { success: false, error: 'No se puede modificar al desarrollador' };
    }

    const dbAvailable = await checkDatabaseAvailable();

    if (dbAvailable) {
      try {
        const { error } = await supabase
          .from('user_profiles_e700bf19')
          .update({ username: newUsername })
          .eq('id', userId);

        if (error) {
          console.error('Error changing username:', error);
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (error: any) {
        console.error('Error changing username:', error);
        return { success: false, error: error.message };
      }
    } else {
      return { success: false, error: 'Base de datos no disponible' };
    }
  };

  const adminChangePassword = async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || (user.role !== 'developer' && user.role !== 'admin')) {
      return { success: false, error: 'Solo desarrolladores y administradores pueden cambiar contraseñas' };
    }

    // Admins cannot change developer's password
    const targetUser = allUsers.find(u => u.id === userId);
    if (user.role === 'admin' && targetUser?.role === 'developer') {
      return { success: false, error: 'Los administradores no pueden cambiar la contraseña del desarrollador' };
    }

    // Password validation
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    const dbAvailable = await checkDatabaseAvailable();

    if (dbAvailable && accessToken) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e700bf19/admin-change-password`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, password: newPassword }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error('Error changing password:', data.error);
          return { success: false, error: data.error || 'Error al cambiar contraseña' };
        }

        console.log('✅ Password changed successfully');
        return { success: true };
      } catch (error: any) {
        console.error('Error changing password:', error);
        return { success: false, error: error.message };
      }
    } else {
      return { success: false, error: 'Base de datos no disponible' };
    }
  };

  const adminDeleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || user.role !== 'developer') {
      return { success: false, error: 'Solo developers pueden eliminar usuarios' };
    }

    // Prevent deleting developer
    const targetUser = allUsers.find(u => u.id === userId);
    if (targetUser?.role === 'developer') {
      return { success: false, error: 'No se puede eliminar al desarrollador' };
    }

    const dbAvailable = await checkDatabaseAvailable();

    if (dbAvailable) {
      try {
        // Delete user profile from database
        const { error: profileError } = await supabase
          .from('user_profiles_e700bf19')
          .delete()
          .eq('id', userId);

        if (profileError) {
          console.error('Error deleting user profile:', profileError);
          return { success: false, error: profileError.message };
        }

        // Note: Auth user deletion requires Service Role Key
        // The auth user will remain but without a profile
        console.log('✅ User profile deleted (auth user remains)');
        return { success: true };
      } catch (error: any) {
        console.error('Error deleting user:', error);
        return { success: false, error: error.message };
      }
    } else {
      return { success: false, error: 'Base de datos no disponible' };
    }
  };

  const forceRefreshSession = async (): Promise<boolean> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }

    const dbAvailable = await checkDatabaseAvailable();

    if (dbAvailable) {
      // Load user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles_e700bf19')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profile) {
        const userData: User = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          profilePicture: profile.profile_picture || '',
          role: profile.role as 'developer' | 'admin' | 'judge' | 'user',
          createdAt: profile.created_at || new Date().toISOString(),
        };
        
        setUser(userData);
        setAccessToken(session.access_token);
        return true;
      }
    }

    return false;
  };

  const forceLogoutAndClear = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <UserContext.Provider value={{
      user,
      accessToken,
      login,
      register,
      logout,
      updateProfilePicture,
      updateUserRole,
      getAllUsers,
      changePassword,
      changeUsername,
      resetPassword,
      adminChangeUsername,
      adminChangePassword,
      adminDeleteUser,
      forceRefreshSession,
      forceLogoutAndClear,
      allUsers,
      databaseAvailable,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
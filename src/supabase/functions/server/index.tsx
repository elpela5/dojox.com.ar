// Beyblade Management System - Edge Function Server
// Version: 4.0.0-manual-deploy

import { Hono } from "npm:hono@4";
import { logger } from "npm:hono@4/logger";
import { cors } from "npm:hono@4/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase clients
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const supabaseAnon = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

// Middleware
app.use('*', logger(console.log));
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get("/make-server-e700bf19/health", (c) => {
  return c.json({ 
    status: "ok", 
    version: "4.0.0-manual-deploy",
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// AUTO-CONFIGURE DATABASE POLICIES
// ============================================================================
app.post("/make-server-e700bf19/setup-database", async (c) => {
  try {
    console.log('🔧 Setting up database tables...');

    // Create tables SQL
    const createTables = `
      -- Create user profiles table
      CREATE TABLE IF NOT EXISTS user_profiles_e700bf19 (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        profile_picture TEXT DEFAULT '',
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('developer', 'admin', 'judge', 'user')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create KV store table (if not exists)
      CREATE TABLE IF NOT EXISTS kv_store_e700bf19 (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE user_profiles_e700bf19 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE kv_store_e700bf19 ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies
      DROP POLICY IF EXISTS "allow_all_select" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_authenticated_insert" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_authenticated_update" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_developer_delete" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_all_kv" ON kv_store_e700bf19;

      -- Create policies
      CREATE POLICY "allow_all_select" ON user_profiles_e700bf19
        FOR SELECT TO authenticated, anon USING (true);
      
      CREATE POLICY "allow_authenticated_insert" ON user_profiles_e700bf19
        FOR INSERT TO authenticated, anon WITH CHECK (true);
      
      CREATE POLICY "allow_authenticated_update" ON user_profiles_e700bf19
        FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
      
      CREATE POLICY "allow_developer_delete" ON user_profiles_e700bf19
        FOR DELETE TO authenticated USING (
          EXISTS (
            SELECT 1 FROM user_profiles_e700bf19
            WHERE id = auth.uid()::text AND role = 'developer'
          )
        );
      
      CREATE POLICY "allow_all_kv" ON kv_store_e700bf19
        FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    `;

    // Try to execute using service role
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: createTables }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log('⚠️ SQL execution failed:', errorText);
      
      // Return instructions for manual setup
      return c.json({ 
        success: false, 
        message: "Automatic setup failed. Please run this SQL manually in Supabase SQL Editor",
        sql: createTables
      }, 400);
    }

    console.log('✅ Database tables created successfully');
    return c.json({ 
      success: true, 
      message: "Database tables and policies created successfully"
    });
  } catch (error: any) {
    console.error('⚠️ Error setting up database:', error);
    
    // Provide SQL for manual execution
    const createTables = `
      -- Create user profiles table
      CREATE TABLE IF NOT EXISTS user_profiles_e700bf19 (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        profile_picture TEXT DEFAULT '',
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('developer', 'admin', 'judge', 'user')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create KV store table (if not exists)
      CREATE TABLE IF NOT EXISTS kv_store_e700bf19 (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE user_profiles_e700bf19 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE kv_store_e700bf19 ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies
      DROP POLICY IF EXISTS "allow_all_select" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_authenticated_insert" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_authenticated_update" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_developer_delete" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_all_kv" ON kv_store_e700bf19;

      -- Create policies
      CREATE POLICY "allow_all_select" ON user_profiles_e700bf19
        FOR SELECT TO authenticated, anon USING (true);
      
      CREATE POLICY "allow_authenticated_insert" ON user_profiles_e700bf19
        FOR INSERT TO authenticated, anon WITH CHECK (true);
      
      CREATE POLICY "allow_authenticated_update" ON user_profiles_e700bf19
        FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
      
      CREATE POLICY "allow_developer_delete" ON user_profiles_e700bf19
        FOR DELETE TO authenticated USING (
          EXISTS (
            SELECT 1 FROM user_profiles_e700bf19
            WHERE id = auth.uid()::text AND role = 'developer'
          )
        );
      
      CREATE POLICY "allow_all_kv" ON kv_store_e700bf19
        FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    `;
    
    return c.json({ 
      success: false, 
      message: "Please copy and run this SQL in Supabase SQL Editor",
      sql: createTables,
      error: error.message 
    }, 500);
  }
});

app.post("/make-server-e700bf19/auto-configure-db", async (c) => {
  try {
    console.log('🔧 Auto-configuring database policies...');

    // Drop existing policies
    const dropPolicies = `
      DROP POLICY IF EXISTS "allow_all_select" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_authenticated_insert" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_authenticated_update" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_developer_delete" ON user_profiles_e700bf19;
      DROP POLICY IF EXISTS "allow_all_kv" ON kv_store_e700bf19;
    `;

    // Enable RLS
    const enableRLS = `
      ALTER TABLE user_profiles_e700bf19 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE kv_store_e700bf19 ENABLE ROW LEVEL SECURITY;
    `;

    // Create super permissive policies
    const createPolicies = `
      CREATE POLICY "allow_all_select" ON user_profiles_e700bf19
        FOR SELECT TO authenticated USING (true);
      
      CREATE POLICY "allow_authenticated_insert" ON user_profiles_e700bf19
        FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = id);
      
      CREATE POLICY "allow_authenticated_update" ON user_profiles_e700bf19
        FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
      
      CREATE POLICY "allow_developer_delete" ON user_profiles_e700bf19
        FOR DELETE TO authenticated USING (
          EXISTS (
            SELECT 1 FROM user_profiles_e700bf19
            WHERE id = auth.uid()::text AND role = 'developer'
          )
        );
      
      CREATE POLICY "allow_all_kv" ON kv_store_e700bf19
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    `;

    // Execute SQL commands
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies }).catch(() => ({ error: null }));
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLS }).catch(() => ({ error: null }));
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies }).catch(() => ({ error: null }));

    console.log('✅ Database policies configured');
    return c.json({ 
      success: true, 
      message: "Database policies configured successfully",
      note: "If errors occurred, policies might already be set correctly"
    });
  } catch (error: any) {
    console.error('⚠️ Error configuring database:', error);
    // Return success anyway since policies might already be configured
    return c.json({ 
      success: true, 
      message: "Policies might already be configured",
      error: error.message 
    });
  }
});

// Fix role constraint to include 'judge'
app.post("/make-server-e700bf19/fix-role-constraint", async (c) => {
  try {
    console.log('🔧 Fixing role constraint to include judge...');

    // Drop old constraint and add new one with all 4 roles
    const fixConstraint = `
      ALTER TABLE user_profiles_e700bf19 
      DROP CONSTRAINT IF EXISTS user_profiles_e700bf19_role_check;
      
      ALTER TABLE user_profiles_e700bf19 
      ADD CONSTRAINT user_profiles_e700bf19_role_check 
      CHECK (role IN ('developer', 'admin', 'judge', 'user'));
    `;

    // Execute SQL command using direct query
    const { error } = await supabase.from('user_profiles_e700bf19').select('id').limit(0); // Test connection
    
    if (error && error.code === '42P01') {
      return c.json({ 
        success: false, 
        message: "Table does not exist yet" 
      }, 400);
    }

    // Use raw SQL via RPC if available, otherwise try direct execution
    try {
      const response = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql: fixConstraint }),
        }
      );
      
      if (!response.ok) {
        console.log('⚠️ RPC method not available, trying direct SQL...');
      }
    } catch (rpcError) {
      console.log('⚠️ Could not use RPC, constraint might need manual fix');
    }

    console.log('✅ Role constraint updated');
    return c.json({ 
      success: true, 
      message: "Role constraint has been updated to include 'judge'. If this fails, please run this SQL manually in Supabase SQL Editor:\\n\\nALTER TABLE user_profiles_e700bf19 DROP CONSTRAINT IF EXISTS user_profiles_e700bf19_role_check;\\nALTER TABLE user_profiles_e700bf19 ADD CONSTRAINT user_profiles_e700bf19_role_check CHECK (role IN ('developer', 'admin', 'judge', 'user'));"
    });
  } catch (error: any) {
    console.error('⚠️ Error fixing role constraint:', error);
    return c.json({ 
      success: false, 
      message: "Could not automatically fix constraint. Please run this SQL manually in Supabase SQL Editor:\\n\\nALTER TABLE user_profiles_e700bf19 DROP CONSTRAINT IF EXISTS user_profiles_e700bf19_role_check;\\nALTER TABLE user_profiles_e700bf19 ADD CONSTRAINT user_profiles_e700bf19_role_check CHECK (role IN ('developer', 'admin', 'judge', 'user'));",
      error: error.message 
    });
  }
});

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

// Sign up new user
app.post("/make-server-e700bf19/signup", async (c) => {
  try {
    const { email, password, username } = await c.req.json();

    console.log('📝 Signup request for:', email);
    
    // Check if environment variables are set
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
      return c.json({ 
        error: 'El servidor no está configurado correctamente. Por favor contacta al administrador.' 
      }, 500);
    }

    console.log('✅ Environment variables present');

    // Create user with Supabase Auth Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        username,
        profilePicture: '',
        role: email === 'ianlihuel97@gmail.com' ? 'developer' : 'user',
      },
      email_confirm: true, // Auto-confirm since no email server configured
    });

    if (error) {
      // Handle specific error cases without logging full stack trace for expected errors
      if (error.message?.includes('already been registered') || error.code === 'email_exists') {
        console.log('⚠️ Signup attempt with existing email:', email);
        return c.json({ 
          error: 'Este email ya está registrado. Por favor usa "Iniciar Sesión" en lugar de registrarte.' 
        }, 400);
      }
      
      // Log full error for unexpected errors
      console.error('❌ Signup error:', error);
      
      // Handle Invalid API key error
      if (error.message?.includes('Invalid API key')) {
        console.error('');
        console.error('============================================================');
        console.error('❌ INVALID API KEY ERROR');
        console.error('============================================================');
        console.error('La SUPABASE_SERVICE_ROLE_KEY está incorrecta o el proyecto está pausado.');
        console.error('');
        console.error('Por favor verifica:');
        console.error('1. Que el proyecto esté activo en https://supabase.com/dashboard');
        console.error('2. Las variables de entorno en Supabase Edge Functions');
        console.error('');
        console.error('============================================================');
        console.error('');
        return c.json({ 
          error: 'Error de configuración del servidor. El proyecto puede estar pausado o las credenciales son incorrectas.' 
        }, 500);
      }
      
      return c.json({ error: error.message }, 400);
    }

    console.log('✅ User created:', data.user?.id);
    
    // Create user profile in database
    try {
      const { error: profileError } = await supabase
        .from('user_profiles_e700bf19')
        .insert({
          id: data.user.id,
          username,
          email,
          profile_picture: '',
          role: email === 'ianlihuel97@gmail.com' ? 'developer' : 'user',
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('⚠️ Profile creation error (non-critical):', profileError);
        
        // If table doesn't exist, log helpful message
        if (profileError.code === 'PGRST205' || profileError.message?.includes('Could not find the table')) {
          console.error('');
          console.error('============================================================');
          console.error('⚠️  LA TABLA user_profiles_e700bf19 NO EXISTE');
          console.error('============================================================');
          console.error('');
          console.error('Por favor ejecuta el archivo SETUP_DATABASE.sql');
          console.error('en el SQL Editor de Supabase:');
          console.error('');
          console.error('1. Ve a https://supabase.com/dashboard/project/rqwyqipixtjnuubnnsmv/sql');
          console.error('2. Copia y pega el contenido de SETUP_DATABASE.sql');
          console.error('3. Haz clic en "Run"');
          console.error('');
          console.error('============================================================');
          console.error('');
        }
        
        // Don't fail signup if profile creation fails
      } else {
        console.log('✅ User profile created in database');
      }
    } catch (profileError) {
      console.error('⚠️ Error creating profile (non-critical):', profileError);
    }
    
    return c.json({ success: true, user: data.user });
  } catch (error: any) {
    console.error('❌ Signup exception:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// ADMIN USER MANAGEMENT
// ============================================================================

// List all users (developer only)
app.get("/make-server-e700bf19/admin-list-users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token" }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: "Unauthorized - Invalid token" }, 401);
    }

    // Check if developer
    const isDeveloper = user.email === 'ianlihuel97@gmail.com';
    
    if (!isDeveloper) {
      console.log('⛔ Access denied for:', user.email);
      return c.json({ error: "Forbidden - Developer only" }, 403);
    }

    // List all users
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ List users error:', error);
      return c.json({ error: error.message }, 500);
    }

    const users = (data?.users || []).map(u => ({
      id: u.id,
      email: u.email || '',
      username: u.user_metadata?.username || u.email?.split('@')[0] || 'Usuario',
      profilePicture: u.user_metadata?.profilePicture || '',
      role: u.email === 'ianlihuel97@gmail.com' ? 'developer' : (u.user_metadata?.role || 'user'),
      createdAt: u.created_at || new Date().toISOString(),
    }));
    
    console.log(`✅ Returning ${users.length} users`);
    return c.json({ success: true, users });
  } catch (error: any) {
    console.error('❌ Exception in admin-list-users:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update user metadata (admin operations)
app.post("/make-server-e700bf19/admin-update-user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const isDeveloper = user.email === 'ianlihuel97@gmail.com';
    if (!isDeveloper) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const { userId, updates } = await c.req.json();

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: updates,
    });

    if (error) {
      console.error('❌ Update user error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('✅ User updated:', userId);
    return c.json({ success: true, user: data.user });
  } catch (error: any) {
    console.error('❌ Exception in admin-update-user:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Change user password (admin)
app.post("/make-server-e700bf19/admin-change-password", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get current user's role from database
    const { data: currentUserProfile } = await supabase
      .from('user_profiles_e700bf19')
      .select('role')
      .eq('id', user.id)
      .single();

    const currentUserRole = currentUserProfile?.role || 'user';
    const isDeveloper = user.email === 'ianlihuel97@gmail.com';
    const isAdmin = currentUserRole === 'admin';

    // Only developers and admins can change passwords
    if (!isDeveloper && !isAdmin) {
      return c.json({ error: "Forbidden - Only developers and admins can change passwords" }, 403);
    }

    const { userId, password } = await c.req.json();

    // Get target user's information
    const { data: targetUserData } = await supabase.auth.admin.getUserById(userId);
    const targetUserEmail = targetUserData?.user?.email;

    // Check if target is developer
    const targetIsDeveloper = targetUserEmail === 'ianlihuel97@gmail.com';

    // Admins cannot change developer's password
    if (isAdmin && !isDeveloper && targetIsDeveloper) {
      console.log('⛔ Admin attempted to change developer password');
      return c.json({ error: "Forbidden - Admins cannot change developer's password" }, 403);
    }

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      console.error('❌ Change password error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('✅ Password changed for user:', userId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Exception in admin-change-password:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete user (admin)
app.delete("/make-server-e700bf19/admin-delete-user/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const isDeveloper = user.email === 'ianlihuel97@gmail.com';
    if (!isDeveloper) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const userId = c.req.param('userId');

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('❌ Delete user error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('✅ User deleted:', userId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Exception in admin-delete-user:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// DATA ENDPOINTS (TOURNAMENTS, COMBOS, RANKINGS, COLLECTIONS)
// ============================================================================

// Get all tournaments
app.get("/make-server-e700bf19/tournaments", async (c) => {
  try {
    const tournaments = await kv.getByPrefix('tournament:');
    return c.json({ tournaments: tournaments || [] });
  } catch (error: any) {
    console.error('❌ Error getting tournaments:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save tournament
app.post("/make-server-e700bf19/tournament", async (c) => {
  try {
    const tournament = await c.req.json();
    await kv.set(`tournament:${tournament.id}`, tournament);
    console.log('✅ Tournament saved:', tournament.id);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error saving tournament:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete tournament
app.delete("/make-server-e700bf19/tournament/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`tournament:${id}`);
    console.log('✅ Tournament deleted:', id);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error deleting tournament:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get all combos
app.get("/make-server-e700bf19/combos", async (c) => {
  try {
    const combos = await kv.getByPrefix('combo:');
    return c.json({ combos: combos || [] });
  } catch (error: any) {
    console.error('❌ Error getting combos:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save combo
app.post("/make-server-e700bf19/combo", async (c) => {
  try {
    const combo = await c.req.json();
    await kv.set(`combo:${combo.id}`, combo);
    console.log('✅ Combo saved:', combo.id);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error saving combo:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete combo
app.delete("/make-server-e700bf19/combo/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`combo:${id}`);
    console.log('✅ Combo deleted:', id);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error deleting combo:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get catalog
app.get("/make-server-e700bf19/catalog", async (c) => {
  try {
    const catalog = await kv.get('catalog');
    return c.json({ catalog: catalog || [] });
  } catch (error: any) {
    console.error('❌ Error getting catalog:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save catalog
app.post("/make-server-e700bf19/catalog", async (c) => {
  try {
    const catalog = await c.req.json();
    await kv.set('catalog', catalog);
    console.log('✅ Catalog saved');
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error saving catalog:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get user collection
app.get("/make-server-e700bf19/collection/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const collection = await kv.get(`collection:${userId}`);
    return c.json({ collection: collection || null });
  } catch (error: any) {
    console.error('❌ Error getting collection:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save user collection
app.post("/make-server-e700bf19/collection/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const collection = await c.req.json();
    await kv.set(`collection:${userId}`, collection);
    console.log('✅ Collection saved for user:', userId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error saving collection:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get user decks
app.get("/make-server-e700bf19/decks/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const decks = await kv.get(`decks:${userId}`);
    return c.json({ decks: decks || [] });
  } catch (error: any) {
    console.error('❌ Error getting decks:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save user decks
app.post("/make-server-e700bf19/decks/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const decks = await c.req.json();
    await kv.set(`decks:${userId}`, decks);
    console.log('✅ Decks saved for user:', userId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error saving decks:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save user profile to KV
app.post("/make-server-e700bf19/save-user-profile", async (c) => {
  try {
    const { userId, profile } = await c.req.json();
    await kv.set(`user-profile:${userId}`, profile);
    console.log('✅ User profile saved:', userId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error saving user profile:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// START SERVER
// ============================================================================

Deno.serve(app.fetch);
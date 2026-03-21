-- ============================================================================
-- BEYBLADE MANAGEMENT SYSTEM - DATABASE SETUP
-- ============================================================================
-- Execute este script completo en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)
-- ============================================================================

-- Paso 1: Crear tablas
-- ============================================================================

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles_e700bf19 (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  profile_picture TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('developer', 'admin', 'judge', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de almacenamiento clave-valor (si no existe)
CREATE TABLE IF NOT EXISTS kv_store_e700bf19 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paso 2: Habilitar Row Level Security (RLS)
-- ============================================================================

ALTER TABLE user_profiles_e700bf19 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_store_e700bf19 ENABLE ROW LEVEL SECURITY;

-- Paso 3: Eliminar políticas antiguas (si existen)
-- ============================================================================

DROP POLICY IF EXISTS "allow_all_select" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "allow_authenticated_update" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "allow_developer_delete" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "allow_all_kv" ON kv_store_e700bf19;

-- Paso 4: Crear políticas de seguridad
-- ============================================================================

-- Permitir a usuarios autenticados y anónimos ver todos los perfiles
CREATE POLICY "allow_all_select" ON user_profiles_e700bf19
  FOR SELECT TO authenticated, anon USING (true);

-- Permitir a usuarios autenticados y anónimos insertar perfiles
CREATE POLICY "allow_authenticated_insert" ON user_profiles_e700bf19
  FOR INSERT TO authenticated, anon WITH CHECK (true);

-- Permitir a usuarios autenticados y anónimos actualizar perfiles
CREATE POLICY "allow_authenticated_update" ON user_profiles_e700bf19
  FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

-- Solo el desarrollador puede eliminar usuarios
CREATE POLICY "allow_developer_delete" ON user_profiles_e700bf19
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles_e700bf19
      WHERE id = auth.uid()::text AND role = 'developer'
    )
  );

-- Permitir acceso completo al almacenamiento KV
CREATE POLICY "allow_all_kv" ON kv_store_e700bf19
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Verifica que las tablas se crearon correctamente:
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%e700bf19';

-- Verifica que las políticas se aplicaron:
SELECT tablename, policyname FROM pg_policies WHERE tablename LIKE '%e700bf19';

-- ============================================================================
-- ARREGLAR TODO - SCRIPT COMPLETO
-- ============================================================================
-- Este script arregla:
-- ✅ Permisos RLS de user_profiles
-- ✅ Permisos RLS de kv_store
-- ✅ Habilita Realtime en AMBAS tablas
-- ✅ Verifica que todo funcione
-- ============================================================================
-- Copia TODO este archivo y pégalo en Supabase SQL Editor
-- https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/sql
-- ============================================================================

-- ============================================================================
-- PASO 1: LIMPIAR POLÍTICAS VIEJAS
-- ============================================================================

-- Eliminar políticas de user_profiles
DROP POLICY IF EXISTS "allow_all_select" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "allow_authenticated_update" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "allow_developer_delete" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "allow_own_profile" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "allow_create_profile" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles_e700bf19;
DROP POLICY IF EXISTS "Developers can delete profiles" ON user_profiles_e700bf19;

-- Eliminar políticas de kv_store
DROP POLICY IF EXISTS "allow_all_kv" ON kv_store_e700bf19;
DROP POLICY IF EXISTS "Users can read all" ON kv_store_e700bf19;
DROP POLICY IF EXISTS "Users can insert" ON kv_store_e700bf19;
DROP POLICY IF EXISTS "Users can update" ON kv_store_e700bf19;
DROP POLICY IF EXISTS "Users can delete" ON kv_store_e700bf19;

-- ============================================================================
-- PASO 2: HABILITAR RLS
-- ============================================================================

ALTER TABLE user_profiles_e700bf19 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_store_e700bf19 ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 3: CREAR POLÍTICAS SUPER PERMISIVAS (para user_profiles)
-- ============================================================================

-- Todos pueden ver todos los perfiles
CREATE POLICY "allow_all_select" ON user_profiles_e700bf19
  FOR SELECT 
  TO authenticated
  USING (true);

-- Usuarios autenticados pueden insertar su propio perfil
CREATE POLICY "allow_authenticated_insert" ON user_profiles_e700bf19
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- Usuarios autenticados pueden actualizar cualquier perfil
CREATE POLICY "allow_authenticated_update" ON user_profiles_e700bf19
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Solo developers pueden eliminar
CREATE POLICY "allow_developer_delete" ON user_profiles_e700bf19
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles_e700bf19
      WHERE id = auth.uid()::text AND role = 'developer'
    )
  );

-- ============================================================================
-- PASO 4: CREAR POLÍTICAS SUPER PERMISIVAS (para kv_store)
-- ============================================================================

-- Todos pueden hacer TODO en kv_store (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "allow_all_kv" ON kv_store_e700bf19
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PASO 5: HABILITAR REALTIME EN AMBAS TABLAS
-- ============================================================================

-- Primero, eliminar las tablas de la publicación si ya existen (para evitar errores)
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE user_profiles_e700bf19';
  EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE kv_store_e700bf19';
  EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN OTHERS THEN NULL;
  END;
END $$;

-- Ahora agregar las tablas a Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles_e700bf19;
ALTER PUBLICATION supabase_realtime ADD TABLE kv_store_e700bf19;

-- ============================================================================
-- PASO 6: VERIFICAR QUE TODO FUNCIONÓ
-- ============================================================================

-- 6.1 Verificar políticas RLS
SELECT 
  tablename,
  policyname,
  cmd as operation,
  'Política activa ✅' as status
FROM pg_policies
WHERE tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
ORDER BY tablename, cmd;

-- 6.2 Verificar que Realtime esté habilitado
SELECT 
  schemaname,
  tablename,
  'Realtime habilitado ✅' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
ORDER BY tablename;

-- ============================================================================
-- ✅ RESULTADO ESPERADO
-- ============================================================================
-- QUERY 1 (Políticas RLS) - Deberías ver 5 políticas:
-- - user_profiles_e700bf19 | allow_all_select | SELECT | ✅
-- - user_profiles_e700bf19 | allow_authenticated_insert | INSERT | ✅
-- - user_profiles_e700bf19 | allow_authenticated_update | UPDATE | ✅
-- - user_profiles_e700bf19 | allow_developer_delete | DELETE | ✅
-- - kv_store_e700bf19 | allow_all_kv | ALL | ✅
--
-- QUERY 2 (Realtime) - Deberías ver 2 tablas:
-- - public | user_profiles_e700bf19 | Realtime habilitado ✅
-- - public | kv_store_e700bf19 | Realtime habilitado ✅
-- ============================================================================

-- Si ves esas 5 políticas Y las 2 tablas con Realtime, ¡FUNCIONÓ! 🎉
-- Ahora recarga la app (F5) e intenta:
-- 1. Login/Registro
-- 2. Crear un torneo
-- 3. Ver que se sincroniza en tiempo real

-- ============================================================================
-- ❌ SI ALGO FALLA
-- ============================================================================
-- Si ves un error como:
-- "relation 'supabase_realtime' does not exist"
-- 
-- Significa que necesitas ejecutar este comando PRIMERO:
-- CREATE PUBLICATION supabase_realtime;
--
-- Luego ejecuta este script completo nuevamente.
-- ============================================================================
-- ============================================================================
-- VERIFICAR Y ARREGLAR TODO - SCRIPT DEFINITIVO
-- ============================================================================
-- Este script hace lo siguiente:
-- 1. Muestra el estado actual de las políticas
-- 2. Las arregla si es necesario
-- 3. Verifica que Realtime esté habilitado
-- ============================================================================

-- ============================================================================
-- PARTE 1: VER ESTADO ACTUAL
-- ============================================================================

SELECT '🔍 VERIFICANDO ESTADO ACTUAL...' as status;

-- Ver políticas actuales
SELECT 
  '📋 Políticas actuales:' as info,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
ORDER BY tablename, cmd;

-- Ver Realtime
SELECT 
  '🔄 Realtime habilitado en:' as info,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
ORDER BY tablename;

-- ============================================================================
-- PARTE 2: ARREGLAR POLÍTICAS
-- ============================================================================

SELECT '🔧 ARREGLANDO POLÍTICAS...' as status;

-- Eliminar políticas existentes
DO $$
BEGIN
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
  
  DROP POLICY IF EXISTS "allow_all_kv" ON kv_store_e700bf19;
  DROP POLICY IF EXISTS "Users can read all" ON kv_store_e700bf19;
  DROP POLICY IF EXISTS "Users can insert" ON kv_store_e700bf19;
  DROP POLICY IF EXISTS "Users can update" ON kv_store_e700bf19;
  DROP POLICY IF EXISTS "Users can delete" ON kv_store_e700bf19;
END $$;

-- Habilitar RLS
ALTER TABLE user_profiles_e700bf19 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_store_e700bf19 ENABLE ROW LEVEL SECURITY;

-- Crear políticas super permisivas para user_profiles
CREATE POLICY "allow_all_select" ON user_profiles_e700bf19
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "allow_authenticated_insert" ON user_profiles_e700bf19
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "allow_authenticated_update" ON user_profiles_e700bf19
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_developer_delete" ON user_profiles_e700bf19
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles_e700bf19
      WHERE id = auth.uid()::text AND role = 'developer'
    )
  );

-- Crear política super permisiva para kv_store
CREATE POLICY "allow_all_kv" ON kv_store_e700bf19
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

SELECT '✅ Políticas creadas exitosamente' as status;

-- ============================================================================
-- PARTE 3: VERIFICAR RESULTADO FINAL
-- ============================================================================

SELECT '✅ RESULTADO FINAL:' as status;

-- Ver políticas finales
SELECT 
  '📋 Políticas configuradas:' as info,
  tablename,
  policyname,
  cmd as operation,
  '✅' as check
FROM pg_policies
WHERE tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
ORDER BY tablename, cmd;

-- Ver Realtime final
SELECT 
  '🔄 Realtime activo en:' as info,
  schemaname,
  tablename,
  '✅' as check
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
ORDER BY tablename;

-- ============================================================================
-- ✅ RESULTADO ESPERADO
-- ============================================================================
-- Deberías ver:
--
-- 1. Políticas configuradas (5 políticas):
--    - user_profiles_e700bf19 | allow_all_select | SELECT | ✅
--    - user_profiles_e700bf19 | allow_authenticated_insert | INSERT | ✅
--    - user_profiles_e700bf19 | allow_authenticated_update | UPDATE | ✅
--    - user_profiles_e700bf19 | allow_developer_delete | DELETE | ✅
--    - kv_store_e700bf19 | allow_all_kv | ALL | ✅
--
-- 2. Realtime activo en (2 tablas):
--    - public | user_profiles_e700bf19 | ✅
--    - public | kv_store_e700bf19 | ✅
--
-- Si ves esto, ¡TODO ESTÁ LISTO! 🎉
-- Recarga tu app (F5) e intenta login
-- ============================================================================

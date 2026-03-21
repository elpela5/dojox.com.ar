-- ============================================================================
-- ARREGLAR PERMISOS - SCRIPT SIMPLE
-- ============================================================================
-- Copia TODO este archivo y pégalo en Supabase SQL Editor
-- https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/sql
-- ============================================================================

-- 1. Eliminar todas las políticas existentes
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

-- 2. Asegurar que RLS esté habilitado
ALTER TABLE user_profiles_e700bf19 ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas SUPER PERMISIVAS
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

-- 4. Arreglar KV Store (super permisivo)
DROP POLICY IF EXISTS "allow_all_kv" ON kv_store_e700bf19;

ALTER TABLE kv_store_e700bf19 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_kv" ON kv_store_e700bf19
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Verificar que funcionó
SELECT 
  tablename,
  policyname,
  cmd as operation,
  'Política activa ✅' as status
FROM pg_policies
WHERE tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
ORDER BY tablename, cmd;

-- ============================================================================
-- ✅ RESULTADO ESPERADO
-- ============================================================================
-- Deberías ver 5 políticas:
-- - user_profiles_e700bf19 | allow_all_select | SELECT | ✅
-- - user_profiles_e700bf19 | allow_authenticated_insert | INSERT | ✅
-- - user_profiles_e700bf19 | allow_authenticated_update | UPDATE | ✅
-- - user_profiles_e700bf19 | allow_developer_delete | DELETE | ✅
-- - kv_store_e700bf19 | allow_all_kv | ALL | ✅
-- ============================================================================

-- Si ves esas 5 políticas, ¡FUNCIONÓ! 🎉
-- Ahora recarga la app (F5) e intenta login nuevamente.

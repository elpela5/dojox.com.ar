-- ============================================================================
-- FIX: Permitir que usuarios autenticados creen sus propios perfiles
-- ============================================================================
-- Ejecuta esto si no puedes hacer login después de configurar la DB
-- ============================================================================

-- 1. Eliminar política restrictiva de INSERT
DROP POLICY IF EXISTS "allow_insert_own_profile" ON user_profiles_e700bf19;

-- 2. Crear política más permisiva para INSERT
-- Permite que cualquier usuario autenticado cree un perfil con su propio ID
CREATE POLICY "allow_authenticated_insert_profile" ON user_profiles_e700bf19
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid()::text = id
  );

-- 3. Verificar que las políticas están correctas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles_e700bf19'
ORDER BY cmd, policyname;

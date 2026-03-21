-- ============================================================================
-- VERIFICAR NUEVA CONEXIÓN A SUPABASE
-- ============================================================================
-- Ejecuta este script DESPUÉS de crear tu nuevo proyecto para verificar
-- que puedes conectarte correctamente
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICAR QUE EL PROYECTO ESTÁ ACTIVO
-- ============================================================================

SELECT 
  '✅ Conexión exitosa a Supabase' as status,
  current_database() as database_name,
  version() as postgres_version;

-- ============================================================================
-- PASO 2: LISTAR TABLAS EXISTENTES
-- ============================================================================

SELECT 
  '📊 Tablas existentes en el proyecto:' as info,
  table_name,
  CASE 
    WHEN table_name IN ('kv_store_e700bf19', 'user_profiles_e700bf19') 
    THEN '✅ Tabla de la app'
    ELSE 'ℹ️ Tabla del sistema'
  END as tipo
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- PASO 3: VERIFICAR EXTENSIONES DISPONIBLES
-- ============================================================================

SELECT 
  '🔧 Extensiones de Postgres habilitadas:' as info,
  extname as extension_name,
  extversion as version
FROM pg_extension
ORDER BY extname;

-- ============================================================================
-- PASO 4: VERIFICAR REALTIME
-- ============================================================================

SELECT 
  '🔄 Publicación de Realtime:' as info,
  pubname as publication_name,
  '✅' as status
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- Si la publicación existe, listar tablas suscritas
SELECT 
  '📋 Tablas suscritas a Realtime:' as info,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================================================
-- RESULTADO ESPERADO (PROYECTO NUEVO)
-- ============================================================================
-- 
-- Si acabas de crear el proyecto, deberías ver:
-- 
-- 1. ✅ Conexión exitosa
-- 2. Algunas tablas del sistema (auth.users, storage.buckets, etc.)
-- 3. NO deberías ver kv_store_e700bf19 ni user_profiles_e700bf19 todavía
--    (esas se crean con /SETUP_SUPABASE_DESDE_CERO.sql)
-- 4. La publicación supabase_realtime existe pero no tiene tablas suscritas
-- 
-- ============================================================================

SELECT '👍 Si ves este mensaje, tu proyecto Supabase funciona correctamente.' as conclusion;
SELECT '👉 Siguiente paso: Ejecuta /SETUP_SUPABASE_DESDE_CERO.sql' as next_step;

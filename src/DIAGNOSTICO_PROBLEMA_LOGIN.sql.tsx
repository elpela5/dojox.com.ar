-- ============================================================================
-- DIAGNÓSTICO: ¿Por qué no puedo iniciar sesión?
-- ============================================================================
-- Copia y ejecuta este script en Supabase SQL Editor para diagnosticar el problema
-- https://rqwyqipixtjnuubnnsmv.supabase.co
-- SQL Editor → New Query → Pegar → Run
-- ============================================================================

SELECT '🔍 INICIANDO DIAGNÓSTICO...' as status;

-- ============================================================================
-- 1. ¿EXISTEN LAS TABLAS?
-- ============================================================================

SELECT 
  '1️⃣ TABLAS EN LA BASE DE DATOS:' as diagnostico,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO HAY TABLAS - Ejecuta SETUP_SUPABASE_DESDE_CERO.sql'
    WHEN COUNT(*) = 2 THEN '✅ Las 2 tablas existen correctamente'
    ELSE '⚠️ Faltan tablas (' || COUNT(*) || '/2 encontradas)'
  END as resultado,
  STRING_AGG(table_name, ', ') as tablas_encontradas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles_e700bf19', 'kv_store_e700bf19');

-- ============================================================================
-- 2. ¿HAY USUARIOS REGISTRADOS?
-- ============================================================================

DO $$
DECLARE
  user_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  -- Verificar si la tabla existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles_e700bf19'
  ) INTO table_exists;

  IF table_exists THEN
    -- Contar usuarios
    EXECUTE 'SELECT COUNT(*) FROM user_profiles_e700bf19' INTO user_count;
    
    RAISE NOTICE '2️⃣ USUARIOS REGISTRADOS EN user_profiles_e700bf19:';
    IF user_count = 0 THEN
      RAISE NOTICE '❌ NO HAY USUARIOS - La tabla está vacía';
    ELSE
      RAISE NOTICE '✅ Hay % usuario(s) registrado(s)', user_count;
    END IF;
  ELSE
    RAISE NOTICE '2️⃣ USUARIOS REGISTRADOS:';
    RAISE NOTICE '❌ La tabla user_profiles_e700bf19 NO EXISTE';
  END IF;
END $$;

-- Mostrar usuarios registrados (sin contraseñas)
SELECT 
  '👤 USUARIOS EN user_profiles_e700bf19:' as info,
  username,
  email,
  role,
  created_at
FROM user_profiles_e700bf19
ORDER BY created_at DESC;

-- ============================================================================
-- 3. ¿HAY USUARIOS EN auth.users (TABLA DE AUTENTICACIÓN)?
-- ============================================================================

SELECT 
  '3️⃣ USUARIOS EN auth.users (TABLA DE AUTENTICACIÓN):' as diagnostico,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO HAY USUARIOS en auth.users - No se completó el registro'
    ELSE '✅ Hay ' || COUNT(*) || ' usuario(s) en auth.users'
  END as resultado
FROM auth.users;

-- Mostrar usuarios en auth.users
SELECT 
  '🔐 USUARIOS EN auth.users:' as info,
  id,
  email,
  created_at,
  confirmed_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- 4. ¿ESTÁN HABILITADAS LAS POLÍTICAS RLS?
-- ============================================================================

SELECT 
  '4️⃣ ROW LEVEL SECURITY (RLS):' as diagnostico,
  tablename,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ Sin políticas - Ejecuta SETUP_SUPABASE_DESDE_CERO.sql'
    ELSE '✅ ' || COUNT(*) || ' política(s) configuradas'
  END as resultado
FROM pg_policies
WHERE tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 5. ¿ESTÁ HABILITADO REALTIME?
-- ============================================================================

SELECT 
  '5️⃣ REALTIME:' as diagnostico,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ Realtime NO habilitado - Ejecuta SETUP_SUPABASE_DESDE_CERO.sql'
    WHEN COUNT(*) = 2 THEN '✅ Realtime habilitado en 2 tablas'
    ELSE '⚠️ Realtime habilitado parcialmente (' || COUNT(*) || '/2)'
  END as resultado
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19');

-- ============================================================================
-- 6. RESUMEN DEL DIAGNÓSTICO
-- ============================================================================

SELECT '═══════════════════════════════════════' as separador;
SELECT '📊 RESUMEN DEL DIAGNÓSTICO' as titulo;
SELECT '═══════════════════════════════════════' as separador;

DO $$
DECLARE
  table_count INTEGER;
  user_profile_count INTEGER;
  auth_user_count INTEGER;
  policy_count INTEGER;
  realtime_count INTEGER;
  tables_exist BOOLEAN;
BEGIN
  -- Contar tablas
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('user_profiles_e700bf19', 'kv_store_e700bf19');

  -- Verificar si user_profiles existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles_e700bf19'
  ) INTO tables_exist;

  -- Contar usuarios en user_profiles
  IF tables_exist THEN
    EXECUTE 'SELECT COUNT(*) FROM user_profiles_e700bf19' INTO user_profile_count;
  ELSE
    user_profile_count := 0;
  END IF;

  -- Contar usuarios en auth.users
  SELECT COUNT(*) INTO auth_user_count FROM auth.users;

  -- Contar políticas
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19');

  -- Contar Realtime
  SELECT COUNT(*) INTO realtime_count
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
    AND tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19');

  RAISE NOTICE '';
  RAISE NOTICE '📋 CHECKLIST:';
  RAISE NOTICE '';
  
  -- Tablas
  IF table_count = 2 THEN
    RAISE NOTICE '✅ Tablas creadas: %/2', table_count;
  ELSE
    RAISE NOTICE '❌ Tablas creadas: %/2 (FALTA EJECUTAR SCRIPT)', table_count;
  END IF;

  -- Usuarios en user_profiles
  IF user_profile_count > 0 THEN
    RAISE NOTICE '✅ Usuarios en user_profiles: %', user_profile_count;
  ELSE
    RAISE NOTICE '❌ Usuarios en user_profiles: 0 (NO HAY USUARIOS)';
  END IF;

  -- Usuarios en auth.users
  IF auth_user_count > 0 THEN
    RAISE NOTICE '✅ Usuarios en auth.users: %', auth_user_count;
  ELSE
    RAISE NOTICE '❌ Usuarios en auth.users: 0 (NO SE COMPLETÓ REGISTRO)';
  END IF;

  -- Políticas RLS
  IF policy_count >= 6 THEN
    RAISE NOTICE '✅ Políticas RLS: %/6', policy_count;
  ELSE
    RAISE NOTICE '❌ Políticas RLS: %/6 (FALTA EJECUTAR SCRIPT)', policy_count;
  END IF;

  -- Realtime
  IF realtime_count = 2 THEN
    RAISE NOTICE '✅ Realtime habilitado: %/2', realtime_count;
  ELSE
    RAISE NOTICE '❌ Realtime habilitado: %/2 (FALTA EJECUTAR SCRIPT)', realtime_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';

  -- Diagnóstico final
  IF table_count < 2 THEN
    RAISE NOTICE '🔴 PROBLEMA IDENTIFICADO:';
    RAISE NOTICE '   Las tablas NO existen o están incompletas';
    RAISE NOTICE '';
    RAISE NOTICE '✅ SOLUCIÓN:';
    RAISE NOTICE '   1. Copia TODO el archivo /SETUP_SUPABASE_DESDE_CERO.sql';
    RAISE NOTICE '   2. Pégalo en Supabase SQL Editor';
    RAISE NOTICE '   3. Presiona "Run"';
    RAISE NOTICE '   4. Espera ver: 🎉 ¡CONFIGURACIÓN COMPLETA!';
    RAISE NOTICE '   5. Recarga la app (F5)';
    RAISE NOTICE '   6. Regístrate de nuevo';
  ELSIF auth_user_count = 0 THEN
    RAISE NOTICE '🟠 PROBLEMA IDENTIFICADO:';
    RAISE NOTICE '   NO hay usuarios en auth.users';
    RAISE NOTICE '   Esto significa que el registro NO se completó correctamente';
    RAISE NOTICE '';
    RAISE NOTICE '✅ SOLUCIÓN:';
    RAISE NOTICE '   1. Recarga la app (F5)';
    RAISE NOTICE '   2. Haz clic en "REGISTRARSE"';
    RAISE NOTICE '   3. Completa el formulario';
    RAISE NOTICE '   4. Presiona "Registrarse"';
    RAISE NOTICE '   5. Luego haz clic en "Iniciar Sesión"';
  ELSIF user_profile_count = 0 THEN
    RAISE NOTICE '🟠 PROBLEMA IDENTIFICADO:';
    RAISE NOTICE '   Hay usuarios en auth.users pero NO en user_profiles';
    RAISE NOTICE '   Esto es una inconsistencia en la base de datos';
    RAISE NOTICE '';
    RAISE NOTICE '✅ SOLUCIÓN:';
    RAISE NOTICE '   1. Ejecuta este comando:';
    RAISE NOTICE '      DELETE FROM auth.users;';
    RAISE NOTICE '   2. Recarga la app (F5)';
    RAISE NOTICE '   3. Regístrate de nuevo';
  ELSIF policy_count < 6 THEN
    RAISE NOTICE '🟠 PROBLEMA IDENTIFICADO:';
    RAISE NOTICE '   Faltan políticas RLS';
    RAISE NOTICE '';
    RAISE NOTICE '✅ SOLUCIÓN:';
    RAISE NOTICE '   Ejecuta /SETUP_SUPABASE_DESDE_CERO.sql nuevamente';
  ELSE
    RAISE NOTICE '🟢 TODO PARECE ESTAR BIEN';
    RAISE NOTICE '';
    RAISE NOTICE '   Si aún no puedes iniciar sesión:';
    RAISE NOTICE '   1. Verifica que estés usando el EMAIL correcto';
    RAISE NOTICE '   2. Verifica que estés usando la CONTRASEÑA correcta';
    RAISE NOTICE '   3. Recarga la app (F5) y vuelve a intentar';
    RAISE NOTICE '   4. Si persiste, limpia el caché del navegador (Ctrl+Shift+R)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;

-- ============================================================================
-- FIN DEL DIAGNÓSTICO
-- ============================================================================

SELECT '✅ Diagnóstico completado. Revisa los mensajes arriba.' as final_status;

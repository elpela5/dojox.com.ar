-- ============================================================================
-- CONFIGURACIÓN COMPLETA DE SUPABASE DESDE CERO
-- ============================================================================
-- Este script crea TODO lo necesario para la app de Beyblade:
-- 1. Tablas necesarias (kv_store, user_profiles)
-- 2. Índices para rendimiento
-- 3. Políticas RLS (Row Level Security)
-- 4. Realtime habilitado
-- ============================================================================
-- IMPORTANTE: Copia TODO este archivo y pégalo en Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================================

-- ============================================================================
-- PASO 1: LIMPIAR CONFIGURACIÓN ANTERIOR (por si acaso)
-- ============================================================================

-- Eliminar publicación de Realtime si existe (manejo seguro de errores)
DO $$
BEGIN
  -- Intentar eliminar tablas de la publicación si existen
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

-- Eliminar tablas si existen
DROP TABLE IF EXISTS user_profiles_e700bf19 CASCADE;
DROP TABLE IF EXISTS kv_store_e700bf19 CASCADE;

SELECT '✅ Limpieza completada' as status;

-- ============================================================================
-- PASO 2: CREAR TABLA kv_store_e700bf19
-- ============================================================================

CREATE TABLE kv_store_e700bf19 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por prefijo
CREATE INDEX idx_kv_store_key_prefix ON kv_store_e700bf19 (key text_pattern_ops);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_kv_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER kv_store_updated_at
  BEFORE UPDATE ON kv_store_e700bf19
  FOR EACH ROW
  EXECUTE FUNCTION update_kv_store_updated_at();

SELECT '✅ Tabla kv_store creada' as status;

-- ============================================================================
-- PASO 3: CREAR TABLA user_profiles_e700bf19
-- ============================================================================

CREATE TABLE user_profiles_e700bf19 (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  profile_picture TEXT DEFAULT '',
  role TEXT DEFAULT 'user' CHECK (role IN ('developer', 'admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas comunes
CREATE INDEX idx_user_profiles_email ON user_profiles_e700bf19 (email);
CREATE INDEX idx_user_profiles_role ON user_profiles_e700bf19 (role);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles_e700bf19
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

SELECT '✅ Tabla user_profiles creada' as status;

-- ============================================================================
-- PASO 4: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE kv_store_e700bf19 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles_e700bf19 ENABLE ROW LEVEL SECURITY;

SELECT '✅ RLS habilitado' as status;

-- ============================================================================
-- PASO 5: CREAR POLÍTICAS RLS PARA kv_store_e700bf19
-- ============================================================================

-- Usuarios autenticados pueden hacer TODO en kv_store
CREATE POLICY "allow_all_kv" ON kv_store_e700bf19
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Usuarios anónimos pueden leer (para casos de fallback)
CREATE POLICY "allow_anon_read_kv" ON kv_store_e700bf19
  FOR SELECT 
  TO anon
  USING (true);

SELECT '✅ Políticas RLS creadas para kv_store' as status;

-- ============================================================================
-- PASO 6: CREAR POLÍTICAS RLS PARA user_profiles_e700bf19
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
-- (esto permite que admins/developers editen usuarios)
CREATE POLICY "allow_authenticated_update" ON user_profiles_e700bf19
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Solo developers pueden eliminar perfiles
CREATE POLICY "allow_developer_delete" ON user_profiles_e700bf19
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles_e700bf19
      WHERE id = auth.uid()::text AND role = 'developer'
    )
  );

SELECT '✅ Políticas RLS creadas para user_profiles' as status;

-- ============================================================================
-- PASO 7: HABILITAR REALTIME
-- ============================================================================

-- Agregar tablas a la publicación de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE kv_store_e700bf19;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles_e700bf19;

SELECT '✅ Realtime habilitado en ambas tablas' as status;

-- ============================================================================
-- PASO 8: INSERTAR DATOS DE PRUEBA (OPCIONAL)
-- ============================================================================

-- Insertar catálogo inicial de piezas Beyblade (si no existe)
INSERT INTO kv_store_e700bf19 (key, value)
VALUES ('catalog', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

SELECT '✅ Datos iniciales insertados' as status;

-- ============================================================================
-- PASO 9: VERIFICAR CONFIGURACIÓN
-- ============================================================================

-- Verificar políticas
SELECT 
  '📋 POLÍTICAS RLS CONFIGURADAS:' as info,
  tablename,
  policyname,
  cmd as operation,
  '✅' as check
FROM pg_policies
WHERE tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
ORDER BY tablename, cmd;

-- Verificar Realtime
SELECT 
  '🔄 REALTIME HABILITADO EN:' as info,
  schemaname,
  tablename,
  '✅' as check
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
ORDER BY tablename;

-- Verificar tablas
SELECT 
  '📊 TABLAS CREADAS:' as info,
  table_name,
  '✅' as check
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles_e700bf19', 'kv_store_e700bf19')
ORDER BY table_name;

-- ============================================================================
-- ✅ RESULTADO ESPERADO
-- ============================================================================
-- Deberías ver:
--
-- 1. POLÍTICAS RLS (6 políticas):
--    ✅ kv_store_e700bf19 | allow_all_kv | ALL
--    ✅ kv_store_e700bf19 | allow_anon_read_kv | SELECT
--    ✅ user_profiles_e700bf19 | allow_all_select | SELECT
--    ✅ user_profiles_e700bf19 | allow_authenticated_insert | INSERT
--    ✅ user_profiles_e700bf19 | allow_authenticated_update | UPDATE
--    ✅ user_profiles_e700bf19 | allow_developer_delete | DELETE
--
-- 2. REALTIME (2 tablas):
--    ✅ public | kv_store_e700bf19
--    ✅ public | user_profiles_e700bf19
--
-- 3. TABLAS CREADAS (2 tablas):
--    ✅ kv_store_e700bf19
--    ✅ user_profiles_e700bf19
--
-- ============================================================================

SELECT '🎉 ¡CONFIGURACIÓN COMPLETA! Todo listo para usar.' as final_status;
SELECT '👉 Ahora recarga tu app (F5) y registra una cuenta nueva.' as next_step;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. NO necesitas ejecutar ningún otro script después de este
-- 2. Recarga la app de Beyblade (F5)
-- 3. Usa el botón "REGISTRARSE" para crear tu primera cuenta
-- 4. Si usas el email "ianlihuel97@gmail.com" serás developer automáticamente
-- 5. Los datos ahora se guardan en Supabase y se sincronizan en tiempo real
-- 
-- ¡Disfruta tu app! 🚀
-- ============================================================================
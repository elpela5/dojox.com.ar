-- ============================================================================
-- BEYBLADE APP - DATABASE SETUP (SAFE VERSION)
-- ============================================================================
-- Esta versión es 100% idempotente - puedes ejecutarla múltiples veces
-- ============================================================================

-- 1. Tabla de perfiles de usuario (públicos)
CREATE TABLE IF NOT EXISTS user_profiles_e700bf19 (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_picture TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla KV Store (para torneos, combos, etc)
CREATE TABLE IF NOT EXISTS kv_store_e700bf19 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles_e700bf19(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles_e700bf19(role);
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix ON kv_store_e700bf19(key text_pattern_ops);

-- 4. Row Level Security (RLS)
ALTER TABLE user_profiles_e700bf19 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_store_e700bf19 ENABLE ROW LEVEL SECURITY;

-- 5. Policies para user_profiles_e700bf19
DROP POLICY IF EXISTS "allow_read_profiles" ON user_profiles_e700bf19;
CREATE POLICY "allow_read_profiles" ON user_profiles_e700bf19
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_insert_own_profile" ON user_profiles_e700bf19;
CREATE POLICY "allow_insert_own_profile" ON user_profiles_e700bf19
  FOR INSERT WITH CHECK (auth.uid()::text = id);

DROP POLICY IF EXISTS "allow_update_own_profile" ON user_profiles_e700bf19;
CREATE POLICY "allow_update_own_profile" ON user_profiles_e700bf19
  FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "allow_developer_update_profiles" ON user_profiles_e700bf19;
CREATE POLICY "allow_developer_update_profiles" ON user_profiles_e700bf19
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles_e700bf19
      WHERE id = auth.uid()::text AND role = 'developer'
    )
  );

DROP POLICY IF EXISTS "allow_developer_delete_profiles" ON user_profiles_e700bf19;
CREATE POLICY "allow_developer_delete_profiles" ON user_profiles_e700bf19
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles_e700bf19
      WHERE id = auth.uid()::text AND role = 'developer'
    )
  );

-- 6. Policies para kv_store_e700bf19
DROP POLICY IF EXISTS "allow_read_kv" ON kv_store_e700bf19;
CREATE POLICY "allow_read_kv" ON kv_store_e700bf19
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "allow_insert_kv" ON kv_store_e700bf19;
CREATE POLICY "allow_insert_kv" ON kv_store_e700bf19
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "allow_update_kv" ON kv_store_e700bf19;
CREATE POLICY "allow_update_kv" ON kv_store_e700bf19
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "allow_delete_kv" ON kv_store_e700bf19;
CREATE POLICY "allow_delete_kv" ON kv_store_e700bf19
  FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Habilitar Realtime (SAFE - no falla si ya existe)
DO $$
BEGIN
  -- Agregar user_profiles_e700bf19 si no está
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'user_profiles_e700bf19'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles_e700bf19;
  END IF;

  -- Agregar kv_store_e700bf19 si no está
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'kv_store_e700bf19'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kv_store_e700bf19;
  END IF;
END $$;

-- 8. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Triggers para updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles_e700bf19;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles_e700bf19
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kv_store_updated_at ON kv_store_e700bf19;
CREATE TRIGGER update_kv_store_updated_at
BEFORE UPDATE ON kv_store_e700bf19
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ✅ LISTO! Ejecuta este SQL completo sin preocuparte por errores
-- ============================================================================

-- Verificar que todo se creó correctamente:
SELECT 
  'user_profiles_e700bf19' as table_name, 
  COUNT(*) as rows,
  'Perfiles de usuarios' as description
FROM user_profiles_e700bf19
UNION ALL
SELECT 
  'kv_store_e700bf19' as table_name, 
  COUNT(*) as rows,
  'Datos de la app (torneos, combos, etc)' as description
FROM kv_store_e700bf19
UNION ALL
SELECT 
  'realtime_user_profiles' as table_name,
  COUNT(*) as rows,
  'Realtime habilitado en user_profiles' as description
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'user_profiles_e700bf19'
UNION ALL
SELECT 
  'realtime_kv_store' as table_name,
  COUNT(*) as rows,
  'Realtime habilitado en kv_store' as description
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'kv_store_e700bf19';

# ⚡ Despliegue Rápido - 5 Minutos

## 🎯 Objetivo
Desplegar el Edge Function de Supabase para que la app funcione en tiempo real.

---

## ✅ Checklist Pre-Despliegue

- [ ] Tengo cuenta en Supabase
- [ ] Mi proyecto ID es: `hsgdmrpibkyicemaqbbk`
- [ ] Tengo la contraseña de la base de datos
- [ ] Tengo 10 minutos disponibles

---

## 🚀 Pasos Rápidos

### 1️⃣ Instalar Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows (PowerShell como admin):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux:**
```bash
curl -fsSL https://supabase.com/install.sh | sh
```

---

### 2️⃣ Autenticar

```bash
supabase login
```

🔑 Genera tu token aquí: https://supabase.com/dashboard/account/tokens

---

### 3️⃣ Crear carpeta y vincular proyecto

```bash
mkdir beyblade-deploy
cd beyblade-deploy
supabase init
supabase link --project-ref hsgdmrpibkyicemaqbbk
```

📝 **Necesitarás tu Database Password** de:  
Dashboard → Settings → Database → Database Password

---

### 4️⃣ Copiar archivos

Crea la estructura:
```bash
mkdir -p supabase/functions/server
```

**Opción A: Descargar desde Figma Make**

Descarga estos archivos de tu proyecto en Figma Make:
- `/supabase/functions/server/index.tsx` → `supabase/functions/server/index.tsx`

**Opción B: Copiar manualmente**

Copia el contenido de los archivos que están en Figma Make a tu carpeta local.

**IMPORTANTE:** También crea `supabase/functions/server/kv_store.tsx` con este contenido:

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const TABLE_NAME = 'kv_store_e700bf19';

export async function get(key: string): Promise<any> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('value')
    .eq('key', key)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data?.value || null;
}

export async function set(key: string, value: any): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

export async function del(key: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('key', key);
  if (error) throw error;
}

export async function mget(keys: string[]): Promise<any[]> {
  if (keys.length === 0) return [];
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('value')
    .in('key', keys);
  if (error) throw error;
  return (data || []).map(row => row.value);
}

export async function mset(entries: [string, any][]): Promise<void> {
  if (entries.length === 0) return;
  const rows = entries.map(([key, value]) => ({ key, value }));
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(rows, { onConflict: 'key' });
  if (error) throw error;
}

export async function mdel(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .in('key', keys);
  if (error) throw error;
}

export async function getByPrefix(prefix: string): Promise<any[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('value')
    .like('key', `${prefix}%`);
  if (error) throw error;
  return (data || []).map(row => row.value);
}
```

---

### 5️⃣ Desplegar

```bash
supabase functions deploy server
```

⏱️ Esto toma 1-2 minutos

---

### 6️⃣ Verificar

```bash
curl https://hsgdmrpibkyicemaqbbk.supabase.co/functions/v1/make-server-e700bf19/health
```

Deberías ver:
```json
{
  "status": "ok",
  "version": "4.0.0-manual-deploy",
  "timestamp": "..."
}
```

---

## 🎉 ¡Listo!

Ahora ve a tu app en Figma Make y:

1. **Haz clic en "🏥 Test de Conexión al Servidor"**
2. **Haz clic en "Reintentar Conexión"**
3. **¡Deberías ver la lista de usuarios!**

---

## 🐛 Si algo falla

### Error: "Table kv_store_e700bf19 does not exist"

Ve a: Dashboard → SQL Editor → New query

Ejecuta:
```sql
CREATE TABLE IF NOT EXISTS kv_store_e700bf19 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Realtime (opcional pero recomendado)
ALTER PUBLICATION supabase_realtime ADD TABLE kv_store_e700bf19;
```

### Error: "Failed to fetch"

Revisa los logs en:  
Dashboard → Edge Functions → server → Logs

### Otros problemas

Lee el archivo completo: `DEPLOYMENT_INSTRUCTIONS.md`

---

## 📞 Enlaces Útiles

- **Dashboard de Supabase:** https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk
- **Edge Functions:** https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/functions
- **SQL Editor:** https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/sql
- **Logs:** https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/logs/edge-functions

---

**Tiempo estimado total:** 5-10 minutos ⚡

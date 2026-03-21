# 🎯 Despliegue del Edge Function - Guía Completa

## 📋 Archivos Creados

He preparado todo lo necesario para el despliegue manual:

1. **`/QUICK_START.md`** - Guía rápida de 5 minutos ⚡
2. **`/DEPLOYMENT_INSTRUCTIONS.md`** - Instrucciones detalladas paso a paso 📖
3. **`/deploy-helper.sh`** - Script automatizado para Mac/Linux 🐧
4. **`/deploy-helper.ps1`** - Script automatizado para Windows 🪟
5. **`/supabase/functions/server/index.tsx`** - Código del Edge Function v4.0.0 ✅

---

## ⚠️ IMPORTANTE: La App Funciona Ahora Sin El Servidor

**La aplicación ahora funciona completamente con localStorage** y muestra los datos instantáneamente sin esperar timeouts. El servidor es OPCIONAL para sincronización en tiempo real entre dispositivos.

**Estado actual:**
- ✅ **Funciona SIN servidor**: Usa localStorage inmediatamente
- ✅ **Sin errores de timeout**: Carga instantánea
- ⏳ **Servidor opcional**: Solo para sincronización entre dispositivos
- 📱 **Experiencia local perfecta**: Todo funciona localmente

**Si despliegas el servidor, obtendrás:**
- 🌐 Sincronización automática entre dispositivos
- 👥 Ver usuarios de otros dispositivos
- ☁️ Backup automático en la nube

---

## 🚀 Inicio Rápido (5 minutos)

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

### 2️⃣ Autenticar y Preparar

```bash
# Autenticar (necesitarás un token de Supabase)
supabase login

# Crear carpeta del proyecto
mkdir beyblade-deploy
cd beyblade-deploy

# Inicializar Supabase
supabase init

# Vincular tu proyecto
supabase link --project-ref hsgdmrpibkyicemaqbbk
```

📝 **Necesitarás:**
- **Access Token**: https://supabase.com/dashboard/account/tokens
- **Database Password**: Dashboard → Settings → Database → Database Password

---

### 3️⃣ Copiar Archivos

Crea la estructura:
```bash
mkdir -p supabase/functions/server
```

**Necesitas copiar 2 archivos de Figma Make a tu carpeta local:**

#### Archivo 1: `supabase/functions/server/index.tsx`
Copia el contenido de `/supabase/functions/server/index.tsx` de Figma Make.

#### Archivo 2: `supabase/functions/server/kv_store.tsx`
Crea este archivo con el siguiente contenido:

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

### 4️⃣ Desplegar

```bash
supabase functions deploy server
```

⏱️ Esto toma 1-2 minutos

---

### 5️⃣ Verificar

```bash
curl https://hsgdmrpibkyicemaqbbk.supabase.co/functions/v1/make-server-e700bf19/health
```

Deberías ver:
```json
{
  "status": "ok",
  "version": "4.0.0-manual-deploy"
}
```

---

## ✅ Probar desde la Aplicación

1. Abre tu app en Figma Make
2. Haz clic en **"🏥 Test de Conexión al Servidor"**
3. Deberías ver: **✅ Servidor ONLINE v4.0.0-manual-deploy**
4. Haz clic en **"Reintentar Conexión"**
5. **¡La lista de usuarios debería cargarse correctamente!**

---

## 🔧 Si hay errores...

### Error: "Table kv_store_e700bf19 does not exist"

Ve a: **Dashboard → SQL Editor → New query**

Ejecuta:
```sql
CREATE TABLE IF NOT EXISTS kv_store_e700bf19 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Realtime (opcional)
ALTER PUBLICATION supabase_realtime ADD TABLE kv_store_e700bf19;
```

### Error: "Failed to fetch" (aún después de desplegar)

1. Revisa los logs: **Dashboard → Edge Functions → server → Logs**
2. Verifica que la función esté "Active"
3. Asegúrate de que la URL sea correcta: `https://hsgdmrpibkyicemaqbbk.supabase.co/functions/v1/make-server-e700bf19/health`

---

## 📂 Estructura Final

```
beyblade-deploy/
├── .supabase/
│   └── config.toml
└── supabase/
    └── functions/
        └── server/
            ├── index.tsx       ← Copiado de Figma Make
            └── kv_store.tsx    ← Creado manualmente
```

---

## 🎉 ¿Qué logras con esto?

✅ **Sincronización en tiempo real** entre dispositivos  
✅ **Gestión centralizada de usuarios** con Supabase Auth  
✅ **Lista de TODOS los usuarios registrados** (no solo locales)  
✅ **Operaciones admin funcionales** (editar, eliminar usuarios)  
✅ **Sin errores de "Failed to fetch"**  
✅ **Datos persistentes en Supabase Database**

---

## 📞 Enlaces Útiles

- **Tu Dashboard de Supabase:** https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk
- **Edge Functions:** https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/functions
- **SQL Editor:** https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/sql
- **Logs:** https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/logs/edge-functions
- **Generar Access Token:** https://supabase.com/dashboard/account/tokens

---

## 📚 Más Información

- Lee **`QUICK_START.md`** para una guía visual paso a paso
- Lee **`DEPLOYMENT_INSTRUCTIONS.md`** para detalles técnicos completos
- Usa **`deploy-helper.sh`** (Mac/Linux) o **`deploy-helper.ps1`** (Windows) para automatizar el proceso

---

**Versión:** 4.0.0-manual-deploy  
**Última actualización:** Diciembre 2024  
**Tiempo estimado:** 5-10 minutos ⚡
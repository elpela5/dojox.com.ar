# 🚀 Instrucciones para Desplegar el Edge Function en Supabase

## 📋 Requisitos Previos

1. Tener una cuenta en [Supabase](https://supabase.com)
2. Tener el proyecto de Supabase creado con ID: `hsgdmrpibkyicemaqbbk`
3. Tener instalado [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## 🛠️ Paso 1: Instalar Supabase CLI

### En macOS:
```bash
brew install supabase/tap/supabase
```

### En Windows:
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### En Linux:
```bash
curl -fsSL https://supabase.com/install.sh | sh
```

### Verificar instalación:
```bash
supabase --version
```

---

## 🔑 Paso 2: Autenticarse en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
2. Genera un **Access Token**
3. Ejecuta en tu terminal:

```bash
supabase login
```

4. Pega el Access Token cuando te lo pida

---

## 📁 Paso 3: Preparar los archivos

1. Crea una carpeta local para el proyecto:

```bash
mkdir beyblade-supabase
cd beyblade-supabase
```

2. Inicializa Supabase:

```bash
supabase init
```

3. Vincula tu proyecto de Supabase:

```bash
supabase link --project-ref hsgdmrpibkyicemaqbbk
```

Te pedirá la **Database Password** de tu proyecto. Encuéntrala en:
- Dashboard → Settings → Database → Database Password

4. Crea la estructura de carpetas:

```bash
mkdir -p supabase/functions/server
```

---

## 📝 Paso 4: Copiar los archivos del Edge Function

### Archivo 1: `supabase/functions/server/index.tsx`

Copia el contenido del archivo `/supabase/functions/server/index.tsx` de Figma Make a tu carpeta local `supabase/functions/server/index.tsx`

### Archivo 2: `supabase/functions/server/kv_store.tsx`

Este archivo debe estar protegido en Figma Make. Créalo manualmente:

```typescript
// supabase/functions/server/kv_store.tsx
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
    if (error.code === 'PGRST116') return null; // Not found
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

## 🚀 Paso 5: Desplegar el Edge Function

```bash
supabase functions deploy server
```

Esto debería mostrar algo como:

```
Deploying function server...
Function server deployed successfully!
URL: https://hsgdmrpibkyicemaqbbk.supabase.co/functions/v1/server
```

---

## ✅ Paso 6: Verificar el despliegue

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/functions)
2. Deberías ver la función `server` listada
3. Verifica que esté "Active"

### Probar el endpoint:

```bash
curl https://hsgdmrpibkyicemaqbbk.supabase.co/functions/v1/make-server-e700bf19/health
```

Deberías recibir:

```json
{
  "status": "ok",
  "version": "4.0.0-manual-deploy",
  "timestamp": "2024-12-08T..."
}
```

---

## 🔒 Paso 7: Verificar las variables de entorno

Las variables de entorno se configuran automáticamente:

- `SUPABASE_URL` ✅
- `SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

Estas ya están configuradas en tu proyecto de Supabase.

---

## 🧪 Paso 8: Probar desde la aplicación

1. Regresa a tu aplicación en Figma Make
2. Haz clic en **"🏥 Test de Conexión al Servidor"**
3. Deberías ver: **✅ Servidor ONLINE v4.0.0-manual-deploy**
4. Haz clic en **"Reintentar Conexión"** en la sección de usuarios
5. Deberías ver la lista de usuarios cargarse correctamente

---

## 🐛 Troubleshooting

### Error: "Function not found"

Asegúrate de que la ruta del endpoint incluya `/make-server-e700bf19/`:

```
https://hsgdmrpibkyicemaqbbk.supabase.co/functions/v1/make-server-e700bf19/health
```

### Error: "CORS policy"

El código ya incluye CORS configurado. Si aún tienes problemas, verifica que el middleware CORS esté activo.

### Error: "Database connection failed"

Verifica que la tabla `kv_store_e700bf19` exista en tu base de datos. Deberías crearla ejecutando:

```sql
CREATE TABLE IF NOT EXISTS kv_store_e700bf19 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

En: Dashboard → SQL Editor → New query

---

## 🎯 Endpoints Disponibles

Una vez desplegado, estos endpoints estarán disponibles:

### Auth
- `POST /make-server-e700bf19/signup` - Crear usuario
- `GET /make-server-e700bf19/admin-list-users` - Listar usuarios (developer)
- `POST /make-server-e700bf19/admin-update-user` - Actualizar usuario
- `POST /make-server-e700bf19/admin-change-password` - Cambiar contraseña
- `DELETE /make-server-e700bf19/admin-delete-user/:userId` - Eliminar usuario

### Data
- `GET /make-server-e700bf19/tournaments` - Obtener torneos
- `POST /make-server-e700bf19/tournaments` - Guardar torneo
- `DELETE /make-server-e700bf19/tournaments/:id` - Eliminar torneo
- `GET /make-server-e700bf19/combos` - Obtener combos
- `POST /make-server-e700bf19/combos` - Guardar combo
- `DELETE /make-server-e700bf19/combos/:id` - Eliminar combo
- `GET /make-server-e700bf19/collection/:userId` - Obtener colección
- `POST /make-server-e700bf19/collection/:userId` - Guardar colección
- `GET /make-server-e700bf19/decks/:userId` - Obtener decks
- `POST /make-server-e700bf19/decks/:userId` - Guardar decks

---

## ✨ ¡Listo!

Tu Edge Function está desplegado y funcionando. Ahora tu aplicación Beyblade tendrá:

✅ **Sincronización en tiempo real**
✅ **Gestión de usuarios centralizada**
✅ **Datos compartidos entre dispositivos**
✅ **Sin errores de "Failed to fetch"**

---

## 📞 Soporte

Si tienes problemas, verifica:
1. Los logs en: Dashboard → Edge Functions → server → Logs
2. La consola del navegador en tu app
3. Los errores en la terminal al desplegar

---

**Versión:** 4.0.0-manual-deploy
**Fecha:** Diciembre 2024

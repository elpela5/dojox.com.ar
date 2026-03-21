# 🔑 Cómo Cambiar las Credenciales de Supabase

## 📍 Estás Aquí
Has creado un **nuevo proyecto de Supabase** y necesitas actualizar las credenciales en Figma Make.

---

## Paso 1: Obtener Nuevas Credenciales de Supabase

### 1.1 Ir a tu Nuevo Proyecto
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu **nuevo proyecto** (el que acabas de crear)

### 1.2 Ir a Settings → API
1. Haz clic en ⚙️ **"Project Settings"** (esquina inferior izquierda)
2. Haz clic en **"API"**

### 1.3 Copiar las 3 Credenciales

Vas a copiar **3 cosas**. Ábrelas en un archivo de texto temporal:

#### A. Project URL
Busca **"Project URL"** (arriba del todo) y copia:
```
https://[tu-project-id].supabase.co
```

Por ejemplo:
```
https://xyzabc123.supabase.co
```

#### B. Project ID
Del URL anterior, extrae **solo el ID** (la parte entre `https://` y `.supabase.co`):
```
xyzabc123
```

#### C. Anon Key (public)
Busca **"Project API keys"** → **"anon" "public"** y copia la clave completa:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

#### D. Service Role Key (secret)
Busca **"service_role" "secret"** y haz clic en el 👁️ (ojo) para revelar la clave:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZ...
```

⚠️ **GUARDA ESTAS 4 COSAS** - las necesitarás en los siguientes pasos.

---

## Paso 2: Actualizar Credenciales en Figma Make

Ahora necesitas actualizar **3 variables de entorno** en Figma Make.

### Método: Supabase Secrets Manager (Recomendado)

Figma Make tiene un gestor de secretos de Supabase. Cuando cambies las credenciales:

1. En la interfaz de Figma Make, deberías ver una opción para **"Supabase Settings"** o **"Update Supabase Credentials"**
2. O puedes actualizar las variables de entorno directamente

---

### Variables a Actualizar

Necesitas actualizar estas **3 variables**:

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `SUPABASE_URL` | Tu Project URL completo | `https://xyzabc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Tu anon public key | `eyJhbGciOiJIUzI1NiIsInR5cCI...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service_role secret | `eyJhbGciOiJIUzI1NiIsInR5cCI...` |

---

## Paso 3: Actualizar `/utils/supabase/info.tsx`

**IMPORTANTE**: Figma Make tiene un archivo protegido que contiene las credenciales.

### Opción A: Déjame Actualizarlo (Recomendado)

Simplemente **dime**:
1. Tu nuevo **Project ID** (ej: `xyzabc123`)
2. Tu nuevo **Anon Key** (la clave pública completa)

Y yo actualizaré el archivo automáticamente.

### Opción B: El Sistema lo Actualiza Solo

Cuando recargues la app después de cambiar las variables de entorno, el sistema debería detectar el cambio y actualizar el archivo automáticamente.

---

## Paso 4: Verificar que las Credenciales Están Actualizadas

### 4.1 Recarga la App
1. Presiona **F5** para recargar la app de Beyblade
2. Abre la consola del navegador (F12 → Console)

### 4.2 Busca Mensajes de Conexión
Deberías ver algo como:
```
🔗 Connecting to Supabase: https://xyzabc123.supabase.co
✅ Supabase client initialized
```

Si ves tu **nuevo URL**, ¡las credenciales están actualizadas! ✅

Si ves el **URL viejo** (`hsgdmrpibkyicemaqbbk`), necesitas actualizar las variables de entorno.

---

## Paso 5: Ejecutar Script de Configuración

Ahora que las credenciales están actualizadas, necesitas crear las tablas:

1. Ve a tu **nuevo proyecto** en Supabase
2. Abre **SQL Editor** → **New Query**
3. Copia **TODO** el contenido de `/SETUP_SUPABASE_DESDE_CERO.sql`
4. Pega en el editor
5. Haz clic en **"Run"**

Deberías ver:
```
✅ Limpieza completada
✅ Tabla kv_store creada
✅ Tabla user_profiles creada
✅ RLS habilitado
✅ Políticas RLS creadas para kv_store
✅ Políticas RLS creadas para user_profiles
✅ Realtime habilitado en ambas tablas
✅ Datos iniciales insertados
🎉 ¡CONFIGURACIÓN COMPLETA! Todo listo para usar.
```

---

## Paso 6: Probar la App

1. **Recarga** la app (F5)
2. **Regístrate** con una cuenta nueva
   - Email: `ianlihuel97@gmail.com` (para ser developer)
   - Usuario: tu nombre
   - Contraseña: la que quieras
3. **Inicia sesión**
4. **Crea** un torneo de prueba
5. **Recarga** (F5)
6. **Verifica** que el torneo persiste ✅

---

## 🆘 Si Algo Sale Mal

### Error: "Invalid API key" o "Failed to fetch"

**Problema**: Las credenciales no se actualizaron correctamente.

**Solución**:
1. Verifica que copiaste las credenciales **completas** (sin espacios al inicio/final)
2. Verifica que actualizaste las **3 variables** en Figma Make
3. Recarga la app (F5)
4. Si persiste, compárteme tus nuevas credenciales (Project ID y Anon Key) y yo las actualizo

### Error: "relation does not exist"

**Problema**: No ejecutaste el script de configuración.

**Solución**:
1. Ve a tu nuevo proyecto en Supabase → SQL Editor
2. Ejecuta `/SETUP_SUPABASE_DESDE_CERO.sql`
3. Verifica que veas los mensajes de éxito
4. Recarga la app (F5)

### Los torneos aún se borran

**Problema**: Las políticas RLS no se crearon correctamente.

**Solución**:
1. Ejecuta `/SETUP_SUPABASE_DESDE_CERO.sql` nuevamente
2. Verifica que veas "✅ Políticas RLS creadas"
3. Recarga la app (F5)

---

## ✅ Checklist

- [ ] Creé nuevo proyecto en Supabase
- [ ] Copié Project URL completo
- [ ] Copié Project ID
- [ ] Copié Anon Key
- [ ] Copié Service Role Key
- [ ] Actualicé las 3 variables de entorno en Figma Make
- [ ] Recargué la app (F5)
- [ ] Veo mi nuevo URL en la consola
- [ ] Ejecuté `/SETUP_SUPABASE_DESDE_CERO.sql`
- [ ] Vi mensajes de éxito (✅)
- [ ] Me registré con una cuenta nueva
- [ ] La app funciona correctamente

---

## 🎯 Siguiente Paso

**Compárteme tus nuevas credenciales** para que pueda actualizar el archivo `/utils/supabase/info.tsx`:

```
Project ID: [tu-nuevo-id]
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Y yo haré el resto automáticamente. 🚀

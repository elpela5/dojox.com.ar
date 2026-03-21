# 🚀 Empezar de Cero con Supabase - Guía Rápida

## 🎯 Objetivo
Crear un **nuevo proyecto de Supabase** y configurar tu app de Beyblade para que funcione **perfectamente** desde el inicio.

---

## ⚡ Pasos Rápidos (10 Minutos Total)

### 1️⃣ Crear Nuevo Proyecto (3 min)
1. Ve a: https://supabase.com
2. Clic en **"New Project"**
3. Completa:
   - Name: `beyblade-app`
   - Password: [crea una contraseña fuerte]
   - Region: South America (o la más cercana)
4. Clic en **"Create new project"**
5. ⏱️ Espera 2-3 minutos

### 2️⃣ Copiar Credenciales (2 min)
1. En tu nuevo proyecto → ⚙️ **"Project Settings"** → **"API"**
2. Copia estas 3 cosas:

   **A. Project URL**
   ```
   https://[algo].supabase.co
   ```
   
   **B. Anon Key** (debajo de "Project API keys" → "anon public")
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   
   **C. Service Role Key** (debajo de "service_role secret", haz clic en 👁️)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3️⃣ Compárteme las Credenciales
**Escribe tu siguiente mensaje con**:
```
Project URL: https://[tu-url].supabase.co
Anon Key: eyJ...
Service Role Key: eyJ...
```

Y yo actualizaré todo automáticamente en el código. ✅

### 4️⃣ Ejecutar Script SQL (2 min)
Después de que yo actualice el código:
1. En Supabase → **SQL Editor** → **New Query**
2. Copia TODO de `/SETUP_SUPABASE_DESDE_CERO.sql`
3. Pega y clic en **"Run"**
4. Verifica que veas: `🎉 ¡CONFIGURACIÓN COMPLETA!`

### 5️⃣ Probar App (3 min)
1. Recarga app (F5)
2. Regístrate con cuenta nueva
3. Crea un torneo
4. Recarga (F5)
5. ¡Debería funcionar! ✅

---

## 📋 Lo Que Necesito de Ti

**Solo 3 cosas**:

1. **Project URL**: `https://[algo].supabase.co`
2. **Anon Key**: `eyJ...` (la clave pública)
3. **Service Role Key**: `eyJ...` (la clave secreta)

Cópialas de **Project Settings → API** en tu nuevo proyecto.

---

## ✅ Lo Que Yo Haré Automáticamente

Cuando me compartas las credenciales:

1. ✅ Actualizar `/utils/supabase/info.tsx` con tu nuevo Project ID
2. ✅ Crear variables de entorno para Supabase
3. ✅ Verificar que el cliente de Supabase se conecte correctamente
4. ✅ Actualizar cualquier referencia a las credenciales viejas

---

## 🎁 Lo Que Obtendrás

Después de configurar todo:

- ✅ **Login funcionando** al 100%
- ✅ **Torneos que se guardan** permanentemente
- ✅ **Sincronización en tiempo real** entre dispositivos
- ✅ **Sin errores de permisos**
- ✅ **Diagnóstico automático** (botón flotante verde)

---

## 🚀 ¡Empecemos!

**Tu siguiente paso**:

1. Ve a https://supabase.com
2. Crea nuevo proyecto
3. Copia las 3 credenciales
4. Compártelas en tu siguiente mensaje

**Yo me encargo del resto.** 💪

---

## 📚 Documentación Completa

Si quieres más detalles, consulta:
- `/CONFIGURACION_SUPABASE_NUEVO.md` - Guía completa paso a paso
- `/SETUP_SUPABASE_DESDE_CERO.sql` - Script SQL de configuración
- `/CAMBIAR_CREDENCIALES_SUPABASE.md` - Cómo actualizar credenciales

---

## ⏱️ Tiempo Estimado

| Paso | Tiempo |
|------|--------|
| Crear proyecto | 3 min |
| Copiar credenciales | 2 min |
| Yo actualizo código | 1 min |
| Ejecutar SQL | 2 min |
| Probar app | 2 min |
| **TOTAL** | **10 min** |

---

**¡Vamos a hacerlo!** 🎯

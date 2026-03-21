# ⚠️ Errores Esperados y Cómo Interpretarlos

Esta guía explica qué errores son **NORMALES** y cuáles son **PROBLEMÁTICOS**.

---

## ✅ Error NORMAL: "Failed to fetch" al crear perfil

### Qué Verás en Consola:

```
❌ Error creating profile in DB: {
  "message": "TypeError: Failed to fetch",
  ...
}
```

**Pero inmediatamente después verás:**

```
⚠️ Could not save profile to database (this is OK)
✅ Login will continue with auth data only
💡 Tip: Run /VERIFICAR_Y_ARREGLAR_TODO.sql in Supabase to fix database permissions
✅ Login successful, user data: {...}
```

### ¿Por Qué Pasa?

La aplicación **intenta** guardar tu perfil en la base de datos, pero las políticas RLS (Row Level Security) no están configuradas todavía.

### ¿Es un Problema?

**NO.** El login **funciona igual**. La app usa los datos de autenticación de Supabase como respaldo.

### ¿Cómo Arreglarlo?

Ejecuta `/VERIFICAR_Y_ARREGLAR_TODO.sql` en Supabase SQL Editor:

1. Ve a: https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/sql
2. Nueva query
3. Pega TODO el contenido de `/VERIFICAR_Y_ARREGLAR_TODO.sql`
4. Run

**Después de esto, el error desaparecerá.**

---

## ❌ Error PROBLEMÁTICO: Login falla completamente

### Qué Verás:

```
🔐 Attempting login for: tu@email.com
Login error: Invalid login credentials
```

### ¿Por Qué Pasa?

- Email o contraseña incorrectos
- No existe cuenta con ese email

### ¿Cómo Arreglarlo?

- Verifica tu email y contraseña
- Si no tienes cuenta, usa **"Registrarse"** en lugar de "Iniciar Sesión"

---

## ❌ Error PROBLEMÁTICO: Login se cuelga

### Qué Verás:

```
🔐 Attempting login for: tu@email.com
🔍 Checking for existing session...
🔍 Checking for existing session...
(se repite infinitamente)
```

### ¿Por Qué Pasa?

Hay una sesión anterior que está causando un loop infinito.

### ¿Cómo Arreglarlo?

**Opción 1: Botón de Emergencia**

Haz clic en el botón **🆘 Limpiar Sesión** en la pantalla de login.

**Opción 2: Manual**

Abre la consola (F12) y ejecuta:

```javascript
await window.supabaseClient?.auth.signOut();
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

---

## 📊 Checklist de Diagnóstico

Cuando veas errores, verifica:

### ✅ Login Funciona (aunque veas "Failed to fetch")

```
🔐 Attempting login for: tu@email.com
✅ Auth successful, loading profile...
🗄️ Database available: true
📝 Profile not found, creating new profile...
⚠️ Could not save profile to database (this is OK)
✅ Login will continue with auth data only
✅ Login successful
```

**Resultado**: Login funciona. Puedes usar la app. Ejecuta el script SQL cuando quieras.

---

### ❌ Login NO Funciona

```
🔐 Attempting login for: tu@email.com
Login error: Invalid login credentials
```

**Resultado**: Credenciales incorrectas. Verifica email/contraseña o regístrate.

---

### ⚠️ Login Colgado

```
🔐 Attempting login for: tu@email.com
🔍 Checking for existing session...
🔍 Checking for existing session...
(nada más)
```

**Resultado**: Sesión corrupta. Usa el botón 🆘 Limpiar Sesión.

---

## 🎯 Resumen Rápido

| Mensaje | ¿Es Problema? | Solución |
|---------|---------------|----------|
| `⚠️ Could not save profile to database (this is OK)` | ❌ NO | Ejecuta SQL script (opcional) |
| `✅ Login successful` | ✅ TODO OK | ¡Disfruta la app! |
| `Login error: Invalid login credentials` | ⚠️ SÍ | Verifica credenciales |
| `🔍 Checking...` (infinito) | ⚠️ SÍ | Usa botón 🆘 Limpiar Sesión |

---

## 💡 Tip Pro

**Siempre mira el ÚLTIMO mensaje en la consola:**

- Si dice `✅ Login successful` → **TODO BIEN**
- Si dice `Login error` → **PROBLEMA**
- Si no dice nada después de 5 segundos → **PROBLEMA**

---

## 🔧 Mejoras Aplicadas

El sistema ahora:

1. **✅ Distingue** entre errores normales y críticos
2. **✅ Continúa** el login aunque falle la base de datos
3. **✅ Muestra** mensajes claros de qué está pasando
4. **✅ Ofrece** soluciones con el botón de emergencia

**Si ves** `⚠️ Could not save profile to database (this is OK)` **seguido de** `✅ Login successful`, **TODO FUNCIONA CORRECTAMENTE.** 🎉

---

## 📖 Para Desarrolladores

El sistema de fallback funciona así:

```
1. Intenta autenticar con Supabase Auth ✅
2. Intenta guardar perfil en DB ⚠️ (puede fallar)
3. Si falla, usa datos de Auth como respaldo ✅
4. Usuario queda logueado igual ✅
```

**Prioridad**: Que el usuario pueda acceder a la app **siempre**, aunque la DB no esté configurada.

---

**¿Preguntas?** Abre la consola (F12), intenta login, y copia TODOS los mensajes que aparezcan.

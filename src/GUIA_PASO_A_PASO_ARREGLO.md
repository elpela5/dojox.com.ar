# 🔧 Guía Paso a Paso: Arreglar Login/Registro

## 📋 Resumen del Problema

Tienes 3 errores:
1. ❌ **RLS Policy bloqueando**: "new row violates row-level security policy"
2. ❌ **Email confirmation activada**: "Email not confirmed"
3. ❌ **Rate limit**: "For security purposes, you can only request this after 16 seconds"

---

## ✅ SOLUCIÓN COMPLETA (3 Pasos)

---

### **PASO 1: Ejecutar Script SQL de Arreglo** 🗄️

#### 1.1 Abrir Supabase SQL Editor
- Ve a: **https://rqwyqipixtjnuubnnsmv.supabase.co**
- Login si es necesario
- Menú lateral → **SQL Editor** (ícono de base de datos)
- Botón verde **"New query"** (arriba a la derecha)

#### 1.2 Copiar y Ejecutar Script
1. En **Figma Make**, abre el archivo: `/SOLUCION_COMPLETA_REGISTRO.sql`
2. Presiona **Ctrl+A** (seleccionar todo)
3. Presiona **Ctrl+C** (copiar)
4. Ve a **Supabase SQL Editor**
5. Pega con **Ctrl+V**
6. Presiona el botón verde **"Run"** (o F9)

#### 1.3 Verificar Resultado
Deberías ver al final:
```
🎉 ¡SOLUCIÓN COMPLETA APLICADA!

✅ CHECKLIST:
  ✅ Políticas RLS super permisivas configuradas
  ✅ Base de datos limpiada
  ✅ Usuarios antiguos eliminados

👉 SIGUIENTES PASOS: ...
```

---

### **PASO 2: Deshabilitar Email Confirmation** 📧

El script SQL ya arregló las políticas, pero **no puede deshabilitar email confirmation**.
Debes hacerlo manualmente en la UI de Supabase:

#### 2.1 Ir a Authentication Settings
En Supabase Dashboard:
1. Menú lateral → **Authentication** (ícono de escudo 🛡️)
2. Sub-menú → **Providers** (o **Settings**)

#### 2.2 Buscar "Email" Provider
- En la lista de providers, busca **"Email"**
- Haz clic en **"Email"** (o en el ícono de engranaje ⚙️ al lado)

#### 2.3 Deshabilitar Confirmación
Busca una de estas opciones:

**Opción A**: Checkbox **"Enable email confirmations"**
- **DESMARCA** este checkbox
- Presiona **"Save"**

**Opción B**: Toggle **"Confirm email"**
- **DESACTIVA** este toggle
- Presiona **"Update"** o **"Save"**

**Opción C**: Si no encuentras lo anterior
- Busca: **"Enable email autoconfirm"**
- **ACTIVA** este checkbox
- Presiona **"Save"**

#### 2.4 Verificar
Debería decir algo como:
```
Email
☐ Enable email confirmations  ← SIN CHECK
[Save]
```

---

### **PASO 3: Registrarse de Nuevo** 🎮

#### 3.1 Limpiar Caché del Navegador
- Presiona **Ctrl + Shift + R** (Windows/Linux)
- O **Cmd + Shift + R** (Mac)
- Esto recarga sin usar caché

#### 3.2 Registrar Nueva Cuenta
En la app de Beyblade:
1. Haz clic en **"REGISTRARSE"** (NO "Iniciar Sesión")
2. Completa el formulario:
   - **Usuario**: `Ian` (o el que quieras)
   - **Email**: `ianlihuel97@gmail.com` (para ser developer)
   - **Contraseña**: La que tú elijas (mínimo 6 caracteres)
3. Presiona **"Registrarse"**

#### 3.3 ¿Qué Debería Pasar?
- ✅ **SI TODO ESTÁ BIEN**: Entrarás automáticamente y verás un mensaje:
  ```
  ✅ ¡Bienvenido Ian!
  
  Tu cuenta ha sido creada exitosamente.
  ```

- ❌ **SI SIGUE FALLANDO**: Ve a "Problemas Comunes" abajo ⬇️

---

## 🆘 Problemas Comunes

### Problema 1: "Email not confirmed"

**Causa**: No deshabilitaste email confirmation en el Paso 2.

**Solución**:
1. Vuelve al **Paso 2** arriba
2. Asegúrate de **DESMARCAR** "Enable email confirmations"
3. Presiona **Save**
4. **Espera 30 segundos** (Supabase tarda en aplicar)
5. **Recarga la app** (F5)
6. **Registra con un email diferente** (ej: `test@gmail.com`)

---

### Problema 2: "For security purposes, you can only request this after X seconds"

**Causa**: Intentaste registrarte/login demasiadas veces seguidas.

**Solución**:
1. **Espera 60 segundos** (relájate, toma agua 💧)
2. **Recarga la app** (F5)
3. Intenta de nuevo

---

### Problema 3: "new row violates row-level security policy"

**Causa**: El script SQL del Paso 1 no se ejecutó correctamente.

**Solución**:
1. Ve a **Supabase SQL Editor**
2. Ejecuta este comando simple:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'user_profiles_e700bf19';
   ```
3. Presiona **Run**
4. **¿Qué dice?**
   - **Si hay 4 políticas con "allow_all" en el nombre**: ✅ Todo bien
   - **Si hay menos de 4 o dicen "allow_authenticated"**: ❌ Vuelve a ejecutar `/SOLUCION_COMPLETA_REGISTRO.sql`

---

### Problema 4: "Invalid login credentials" o "Email o contraseña incorrectos"

**Causa**: Estás intentando **iniciar sesión** con una cuenta que no existe.

**Solución**:
1. **NO uses "INICIAR SESIÓN"** todavía
2. Usa **"REGISTRARSE"** primero
3. **Después** de crear la cuenta, podrás iniciar sesión

---

## ✅ Checklist Final

Antes de intentar registrarte, verifica que hiciste TODO:

- [ ] ✅ Ejecuté `/SOLUCION_COMPLETA_REGISTRO.sql` en Supabase SQL Editor
- [ ] ✅ Vi el mensaje `🎉 ¡SOLUCIÓN COMPLETA APLICADA!`
- [ ] ✅ Fui a **Authentication → Providers → Email** en Supabase
- [ ] ✅ Desmarcé **"Enable email confirmations"**
- [ ] ✅ Presioné **Save**
- [ ] ✅ Esperé 30 segundos
- [ ] ✅ Recargué la app (Ctrl + Shift + R)
- [ ] ✅ Ahora voy a **REGISTRARME** (no iniciar sesión)

---

## 🎯 Flujo Visual Completo

```
┌─────────────────────────────────────────┐
│ 1. Supabase SQL Editor                  │
│    → New query                           │
│    → Pegar SOLUCION_COMPLETA...sql       │
│    → Run                                 │
│    → ✅ Ver "SOLUCIÓN COMPLETA"          │
├─────────────────────────────────────────┤
│ 2. Supabase Authentication              │
│    → Providers → Email                   │
│    → ☐ Enable email confirmations       │
│    → Save                                │
│    → ⏱️ Esperar 30 segundos              │
├─────────────────────────────────────────┤
│ 3. App Beyblade                          │
│    → Ctrl + Shift + R (limpiar caché)   │
│    → REGISTRARSE (no login)              │
│    → Usuario: Ian                        │
│    → Email: ianlihuel97@gmail.com        │
│    → Contraseña: [la que elijas]         │
│    → Registrarse                         │
│    → ✅ ¡Deberías entrar!                │
└─────────────────────────────────────────┘
```

---

## 📸 Capturas de Referencia

### Supabase SQL Editor
```
┌─────────────────────────────────────┐
│ SQL Editor                          │
├─────────────────────────────────────┤
│ [+ New query]  [Run ▶]              │
│                                     │
│ [Aquí pegas el script SQL]          │
│                                     │
│ SELECT '🎉 ¡SOLUCIÓN COMPLETA...    │
└─────────────────────────────────────┘
```

### Supabase Authentication → Email
```
┌─────────────────────────────────────┐
│ Email Provider Settings             │
├─────────────────────────────────────┤
│ ☐ Enable email confirmations        │ ← DESMARCA
│                                     │
│ ☐ Secure email change               │
│                                     │
│ [Save]                              │ ← PRESIONA
└─────────────────────────────────────┘
```

---

## 🆘 Si Nada Funciona

Ejecuta este comando en SQL Editor:

```sql
-- Diagnóstico rápido
SELECT 
  'Políticas RLS' as check_item,
  COUNT(*) as total
FROM pg_policies 
WHERE tablename = 'user_profiles_e700bf19'

UNION ALL

SELECT 
  'Usuarios en DB' as check_item,
  COUNT(*) as total
FROM user_profiles_e700bf19

UNION ALL

SELECT 
  'Usuarios en Auth' as check_item,
  COUNT(*) as total
FROM auth.users;
```

Copia el resultado y pégalo aquí para ayudarte.

---

## ✅ Resultado Esperado

Después de completar los 3 pasos y registrarte:

```
┌─────────────────────────────────────┐
│  BEYBLADE ARGENTINA                 │
│  [Logo BBA]                         │
│                                     │
│  📊 COMBOS   🏆 TORNEOS            │
│  📦 COLECCIÓN  👥 RANKING          │
│                                     │
│  Bienvenido: Ian (Developer) 🛡️    │
└─────────────────────────────────────┘
```

¡Listo! Tu app debería funcionar completamente. 🚀

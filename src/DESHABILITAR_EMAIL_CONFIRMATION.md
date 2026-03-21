# 📧 Deshabilitar Email Confirmation en Supabase

## ⚠️ Problema

El error **"Email not confirmed"** ocurre porque Supabase está configurado para requerir confirmación de email, pero no tienes un servidor de email configurado.

---

## ✅ Solución (En la UI de Supabase)

No se puede hacer desde SQL. Debes hacerlo manualmente:

### **Paso 1: Ir a Authentication Settings**

1. Abre: https://rqwyqipixtjnuubnnsmv.supabase.co
2. Menú lateral → **Authentication** (ícono de escudo)
3. Sub-menú → **Settings** (o **Providers**)

---

### **Paso 2: Deshabilitar Email Confirmation**

Busca la sección **"Email"** o **"Email Confirmation"**

Opciones (depende de la versión de Supabase):

#### Opción A: Si ves "Confirm email"
- **Desmarca** el checkbox **"Confirm email"**
- Haz clic en **"Save"**

#### Opción B: Si ves "Enable email confirmations"
- **Desmarca** el checkbox **"Enable email confirmations"**
- Haz clic en **"Save"**

#### Opción C: Si no encuentras esa opción
1. Ve a: **Authentication** → **Settings** → **Email Templates**
2. Busca: **"Confirm signup"**
3. **Deshabilita** la opción de confirmación

---

### **Paso 3 (Alternativa): Cambiar a "Autoconfirm"**

Si prefieres, puedes hacer que Supabase **autoconfirme** los emails:

1. **Authentication** → **Settings**
2. Busca: **"Enable email autoconfirm"** o similar
3. **Activa** esta opción
4. **Save**

---

## 🎯 Ruta Exacta (Supabase Dashboard 2024)

```
https://rqwyqipixtjnuubnnsmv.supabase.co
    ↓
[☰ Menú lateral]
    ↓
Authentication (🛡️)
    ↓
Settings (⚙️)
    ↓
[Scroll down]
    ↓
Email Auth
    ↓
☐ Enable email confirmations  ← DESMARCA ESTO
    ↓
[Save] ← PRESIONA ESTO
```

---

## 📸 Lo Que Deberías Ver

Busca algo similar a:

```
┌────────────────────────────────────┐
│ Email Auth                         │
├────────────────────────────────────┤
│ ☐ Enable email confirmations      │ ← DESMARCA
│                                    │
│ ☐ Secure email change             │
│                                    │
│ [Save]                             │
└────────────────────────────────────┘
```

O también puede decir:

```
┌────────────────────────────────────┐
│ Email Settings                     │
├────────────────────────────────────┤
│ ☐ Confirm email                    │ ← DESMARCA
│                                    │
│ [Update]                           │
└────────────────────────────────────┘
```

---

## 🆘 Si No Lo Encuentras

Prueba estas rutas alternativas:

### Ruta 1:
`Authentication` → `Providers` → `Email` → Settings (ícono engranaje)

### Ruta 2:
`Settings` → `Auth` → `Email`

### Ruta 3:
`Project Settings` → `Authentication` → `Email`

---

## ✅ Después de Deshabilitar

1. **Recarga la app** (F5)
2. **Regístrate de nuevo**
3. **NO** deberías ver más "Email not confirmed"

---

## 💡 Nota Importante

**NO puedes deshabilitar email confirmation desde SQL**. Supabase lo maneja desde la UI por seguridad.

---

## 🎯 Resumen

| Paso | Acción |
|------|--------|
| 1 | Ejecuta `/ARREGLAR_RLS_Y_EMAIL.sql` |
| 2 | Ve a Supabase Dashboard |
| 3 | Authentication → Settings |
| 4 | Desmarca "Enable email confirmations" |
| 5 | Save |
| 6 | Recarga app (F5) |
| 7 | Regístrate de nuevo |

---

**¿No encuentras la opción?** Toma un screenshot del menú de Authentication y te ayudo a ubicarla.

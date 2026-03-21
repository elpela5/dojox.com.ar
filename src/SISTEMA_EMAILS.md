# 📧 Sistema de Emails - Beyblade Manager

## 🔍 ¿Por Qué No Se Envían Emails?

Actualmente, **Supabase NO enviará emails** porque no tienes configurado un proveedor de email (SMTP). 

### Estado Actual

- ✅ **Registro:** Funciona perfectamente
- ✅ **Login:** Funciona perfectamente
- ✅ **Confirmación automática:** Activada (`email_confirm: true`)
- ❌ **Emails de confirmación:** NO se envían
- ❌ **Emails de recuperación:** NO se envían

### Solución Implementada

He agregado un **modal de confirmación** que aparece después de crear una cuenta, mostrando:
- ✅ Email registrado (copiable)
- ✅ Contraseña (copiable en texto plano)
- ✅ Advertencia de que no recibirán email
- ✅ Login automático después del registro

---

## 💡 Cómo Funciona Ahora

### Flujo de Registro

1. Usuario completa formulario de registro
2. Se crea cuenta en Supabase Auth con `email_confirm: true`
3. Usuario es automáticamente confirmado (sin necesidad de email)
4. Se inicia sesión automáticamente
5. **Aparece modal** con credenciales para que el usuario las guarde
6. Usuario continúa usando la app

### Flujo de Recuperación de Contraseña

Actualmente **NO funciona** porque requiere email. Opciones:

**Opción A:** Configurar SMTP (ver más abajo)
**Opción B:** Cambiar contraseña desde el perfil (implementado en `/components/UserProfile.tsx`)

---

## 🔧 Cómo Habilitar Emails (Opcional)

Si quieres que Supabase envíe emails, necesitas configurar un proveedor SMTP.

### Opción 1: Gmail SMTP (Gratis) ⭐

1. **Ir a Supabase Dashboard:**
   - https://supabase.com/dashboard/project/[tu-project-id]/settings/auth

2. **Scroll hasta "SMTP Settings"**

3. **Configurar Gmail:**
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP User: tu-email@gmail.com
   SMTP Password: [App Password de Gmail - NO tu contraseña normal]
   Sender Email: tu-email@gmail.com
   Sender Name: Beyblade Manager
   ```

4. **Crear App Password en Gmail:**
   - Ve a: https://myaccount.google.com/security
   - Habilita "Verificación en 2 pasos"
   - Ve a: https://myaccount.google.com/apppasswords
   - Crea una "App Password" para "Mail"
   - Copia el código de 16 caracteres
   - Úsalo en "SMTP Password"

5. **Guardar y probar**

**Limitaciones de Gmail:**
- ❌ Máximo 500 emails/día
- ❌ Puede marcar como spam
- ⚠️ No recomendado para producción

---

### Opción 2: SendGrid (Gratis hasta 100 emails/día) 🌟

1. **Crear cuenta en SendGrid:**
   - https://signup.sendgrid.com/

2. **Crear API Key:**
   - Settings → API Keys → Create API Key
   - Nombre: "Beyblade Manager"
   - Permisos: Full Access
   - Copiar API Key

3. **Verificar dominio (opcional pero recomendado):**
   - Settings → Sender Authentication
   - Verificar un dominio o email

4. **Configurar en Supabase:**
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Password: [Tu SendGrid API Key]
   Sender Email: noreply@tu-dominio.com (o email verificado)
   Sender Name: Beyblade Manager
   ```

**Ventajas de SendGrid:**
- ✅ 100 emails/día gratis
- ✅ Mejor deliverability
- ✅ Analytics de emails
- ✅ Recomendado para producción

---

### Opción 3: Resend (Moderno) 🚀

1. **Crear cuenta en Resend:**
   - https://resend.com/

2. **Crear API Key:**
   - API Keys → Create API Key
   - Copiar

3. **Configurar en Supabase:**
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Password: [Tu Resend API Key]
   Sender Email: onboarding@resend.dev (o dominio verificado)
   Sender Name: Beyblade Manager
   ```

**Ventajas de Resend:**
- ✅ 3,000 emails/mes gratis
- ✅ Interface moderna
- ✅ React Email compatible
- ✅ Excelente deliverability

---

### Opción 4: Mailgun (Para apps grandes)

**Plan gratuito:** 1,000 emails/mes durante 3 meses

```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [Tu Mailgun SMTP username]
SMTP Password: [Tu Mailgun SMTP password]
```

---

## 📝 Personalizar Templates de Email

Una vez configurado SMTP, puedes personalizar los emails en Supabase Dashboard:

### 1. Ir a Email Templates
https://supabase.com/dashboard/project/[project-id]/auth/templates

### 2. Editar Templates

**Confirm Signup:**
```html
<h2>¡Bienvenido a Beyblade Manager!</h2>
<p>Hola {{ .Name }},</p>
<p>Gracias por registrarte. Confirma tu email haciendo clic abajo:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
<p>¡Prepárate para gestionar tus torneos y colección de Beyblades!</p>
```

**Reset Password:**
```html
<h2>Recuperar Contraseña - Beyblade Manager</h2>
<p>Hola,</p>
<p>Recibimos una solicitud para restablecer tu contraseña.</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer Contraseña</a></p>
<p>Si no solicitaste esto, ignora este email.</p>
```

**Magic Link:**
```html
<h2>Acceso Rápido - Beyblade Manager</h2>
<p>Haz clic para iniciar sesión:</p>
<p><a href="{{ .ConfirmationURL }}">Iniciar Sesión</a></p>
```

---

## 🔄 Actualizar Código (Si Configuras SMTP)

Si configuras SMTP, debes cambiar `email_confirm: true` a `false`:

### En `/supabase/functions/server/index.tsx`:

**ANTES:**
```typescript
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  user_metadata: { username },
  email_confirm: true  // ← Auto-confirma sin email
});
```

**DESPUÉS:**
```typescript
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  user_metadata: { username },
  email_confirm: false  // ← Envía email de confirmación
});
```

### En `/contexts/UserContext.tsx`:

**Actualizar función de registro para NO hacer login automático:**

```typescript
// Después del registro exitoso, mostrar mensaje
alert('Cuenta creada. Revisa tu email para confirmar.');
return true; // Pero NO iniciar sesión automáticamente
```

---

## 🎯 Recomendación para Tu App

### Para Desarrollo/Testing (AHORA):
- ✅ **Mantener como está:** `email_confirm: true`
- ✅ Modal muestra credenciales
- ✅ Login automático
- ✅ Sin necesidad de SMTP
- ✅ $0 de costo

### Para Producción (CUANDO PUBLIQUES):
- ✅ **Configurar SendGrid o Resend**
- ✅ Cambiar `email_confirm: false`
- ✅ Enviar emails de confirmación
- ✅ Más profesional
- ✅ Costo: $0 (plan gratis)

---

## ✅ Checklist de Configuración SMTP

Si decides configurar emails:

- [ ] Crear cuenta en SendGrid/Resend
- [ ] Obtener API Key
- [ ] Configurar SMTP en Supabase Dashboard
- [ ] Verificar dominio/email (opcional pero recomendado)
- [ ] Probar enviando email de prueba
- [ ] Personalizar templates en Supabase
- [ ] Cambiar `email_confirm: true` → `false`
- [ ] Actualizar flujo de registro (quitar auto-login)
- [ ] Probar registro completo
- [ ] Probar recuperación de contraseña

---

## 🆘 Solución de Problemas

### Email no llega después de configurar SMTP

**1. Revisa spam/junk:**
- Emails de nuevos remitentes suelen ir a spam

**2. Verifica configuración SMTP:**
- Revisa que host, port, user y password sean correctos

**3. Revisa logs de Supabase:**
- Dashboard → Logs → Auth Logs
- Busca errores de SMTP

**4. Verifica límites:**
- Gmail: 500/día
- SendGrid Free: 100/día
- Resend Free: 100/día

**5. Verifica dominio:**
- Para mejor deliverability, verifica tu dominio
- Agrega SPF y DKIM records

---

## 💡 Alternativa: Magic Links

Si no quieres configurar SMTP pero quieres emails, puedes usar Magic Links de Supabase (requiere SMTP):

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@email.com'
});
```

Esto envía un link de inicio de sesión sin contraseña.

---

## 📊 Comparación de Proveedores

| Proveedor | Gratis | Límite | Deliverability | Dificultad |
|-----------|--------|--------|----------------|------------|
| **Gmail** | ✅ | 500/día | ⭐⭐ | Fácil |
| **SendGrid** | ✅ | 100/día | ⭐⭐⭐⭐ | Fácil |
| **Resend** | ✅ | 3K/mes | ⭐⭐⭐⭐⭐ | Fácil |
| **Mailgun** | ⏳ 3 meses | 1K/mes | ⭐⭐⭐⭐ | Media |
| **Amazon SES** | ❌ | Pay-as-go | ⭐⭐⭐⭐⭐ | Difícil |

**Recomendación:** Resend (mejor para apps modernas)

---

## 🎉 Conclusión

**Estado actual de tu app:**
- ✅ **Funciona perfectamente SIN emails**
- ✅ Modal muestra credenciales al registrarse
- ✅ Login automático después del registro
- ✅ Cambio de contraseña desde perfil (no requiere email)
- ✅ $0 de costo
- ✅ Perfecto para desarrollo y testing

**Cuando quieras emails:**
- Configurar SendGrid o Resend (15 minutos)
- Cambiar `email_confirm: false`
- Personalizar templates
- ¡Listo!

---

**Tu app está funcionando correctamente.** Los usuarios pueden:
1. Registrarse ✅
2. Ver sus credenciales ✅
3. Copiarlas ✅
4. Iniciar sesión ✅
5. Usar todas las funcionalidades ✅

**No necesitas emails urgentemente.** Configúralos cuando publiques a producción.

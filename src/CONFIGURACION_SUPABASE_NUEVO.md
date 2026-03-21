# 🚀 Configuración Completa - Nuevo Proyecto Supabase

## Paso 1: Crear Nuevo Proyecto Supabase (5 minutos)

### 1.1 Ir a Supabase
1. Abre: https://supabase.com
2. Haz clic en **"Start your project"** o **"New Project"**
3. Si no tienes cuenta, créala (es gratis)

### 1.2 Crear Proyecto
1. **Organization**: Selecciona tu organización (o crea una nueva)
2. **Name**: `beyblade-app` (o el nombre que prefieras)
3. **Database Password**: Crea una contraseña fuerte (⚠️ **GUÁRDALA**, la necesitarás)
4. **Region**: Selecciona la más cercana a ti (ej: South America - São Paulo)
5. **Pricing Plan**: Free (es suficiente)
6. Haz clic en **"Create new project"**

⏱️ **Espera 2-3 minutos** mientras Supabase crea el proyecto.

---

## Paso 2: Obtener Credenciales (2 minutos)

Cuando el proyecto esté listo:

### 2.1 Ir a Settings
1. En el menú lateral, haz clic en ⚙️ **"Project Settings"** (abajo del todo)
2. Haz clic en **"API"**

### 2.2 Copiar Credenciales

Necesitas copiar **3 cosas**:

#### A. Project URL
Busca **"Project URL"** y copia algo como:
```
https://abcdefghijklmnop.supabase.co
```

#### B. Anon Key (public)
Busca **"Project API keys"** → **"anon public"** y copia la clave larga:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi...
```

#### C. Service Role Key (secret)
Busca **"service_role secret"** y copia la clave (haz clic en el ojo para revelar):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi...
```

⚠️ **IMPORTANTE**: Guarda estas 3 cosas en un archivo temporal - las necesitarás en el siguiente paso.

---

## Paso 3: Actualizar Credenciales en Figma Make

### 3.1 Abrir Configuración de Supabase
En la barra lateral de Figma Make (donde estás ahora), busca:
- **Supabase Settings** o
- **Environment Variables** o
- **Secrets**

### 3.2 Actualizar Variables

Actualiza estas **3 variables de entorno**:

| Variable | Valor a Pegar |
|----------|---------------|
| `SUPABASE_URL` | Tu Project URL (ej: `https://abcdefgh.supabase.co`) |
| `SUPABASE_ANON_KEY` | Tu anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service_role secret |

⚠️ **NOTA**: Es posible que Figma Make necesite que recargues la app después de cambiar las variables.

---

## Paso 4: Ejecutar Script de Configuración Inicial

Ahora vamos a crear las tablas y políticas en tu nuevo proyecto.

### 4.1 Abrir SQL Editor
1. En tu nuevo proyecto Supabase, ve al menú lateral
2. Haz clic en **🔍 SQL Editor**
3. Haz clic en **"New query"**

### 4.2 Copiar y Ejecutar Script
1. **Copia** TODO el contenido de `/SETUP_SUPABASE_DESDE_CERO.sql` (lo crearé en el siguiente paso)
2. **Pega** en el SQL Editor
3. Haz clic en **"Run"** (botón verde, esquina inferior derecha)

### 4.3 Verificar Resultado
Deberías ver varios mensajes de éxito:
```
✅ Tabla kv_store creada
✅ Tabla user_profiles creada
✅ Políticas RLS configuradas
✅ Realtime habilitado
✅ Todo listo para usar
```

---

## Paso 5: Probar la App

1. **Recarga** la app de Beyblade (F5)
2. **Haz clic** en "REGISTRARSE"
3. **Crea** una cuenta nueva con:
   - Email: `ianlihuel97@gmail.com` (para ser developer)
   - Usuario: tu nombre
   - Contraseña: la que quieras
4. **Inicia sesión**
5. **Crea** un torneo de prueba
6. **Recarga** la página (F5)
7. **Verifica** que el torneo sigue ahí ✅

---

## Paso 6: Verificar que Todo Funcione

### 6.1 Verificar Tiempo Real
1. **Abre** la app en **2 ventanas** del navegador
2. **Inicia sesión** en ambas
3. **En ventana 1**: Crea un torneo
4. **En ventana 2**: Debería aparecer automáticamente ✅

### 6.2 Verificar Diagnóstico (Developers)
1. **Busca** el botón flotante en esquina inferior derecha
2. **Debe estar verde** 🟢
3. **Haz clic** para ver diagnóstico
4. **Todo debe estar en verde** ✅

---

## 🆘 Troubleshooting

### Error: "Invalid API key"
- Verifica que copiaste las credenciales correctamente
- Asegúrate de que actualizaste las 3 variables en Figma Make
- Recarga la app (F5)

### Error: "relation does not exist"
- Ejecutaste el script `/SETUP_SUPABASE_DESDE_CERO.sql`
- Ve a SQL Editor y verifica que las tablas existan:
  ```sql
  SELECT * FROM kv_store_e700bf19 LIMIT 1;
  SELECT * FROM user_profiles_e700bf19 LIMIT 1;
  ```

### No puedo iniciar sesión
- Primero debes **REGISTRARTE** (no iniciar sesión)
- Usa el botón "REGISTRARSE" para crear tu cuenta
- Luego podrás iniciar sesión

### Los torneos se borran
- Ejecuta nuevamente `/SETUP_SUPABASE_DESDE_CERO.sql`
- Verifica que veas "✅ Políticas RLS configuradas" en los resultados
- Recarga la app (F5)

---

## ✅ Checklist Final

- [ ] Creé nuevo proyecto en Supabase
- [ ] Copié las 3 credenciales (URL, ANON_KEY, SERVICE_ROLE_KEY)
- [ ] Actualicé las variables de entorno en Figma Make
- [ ] Ejecuté `/SETUP_SUPABASE_DESDE_CERO.sql` en SQL Editor
- [ ] Vi mensajes de éxito (✅)
- [ ] Recargué la app (F5)
- [ ] Me registré con una cuenta nueva
- [ ] Inicié sesión exitosamente
- [ ] Creé un torneo de prueba
- [ ] El torneo persiste al recargar (F5)
- [ ] El botón flotante está verde 🟢
- [ ] Probé tiempo real con 2 ventanas (opcional)

---

## 🎉 ¡Listo!

Tu nueva configuración de Supabase está lista. Todo debería funcionar perfectamente:
- ✅ Login y registro
- ✅ Guardar torneos, combos, colecciones
- ✅ Sincronización en tiempo real
- ✅ Sin errores de permisos

**¡Disfruta tu app de Beyblade!** 🚀

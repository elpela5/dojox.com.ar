# 🎯 ¿Qué Script SQL Debo Usar?

## 📊 Diagnóstico del Error

Viste este error:
```
ERROR: 42710: relation "user_profiles_e700bf19" is already member of publication "supabase_realtime"
```

---

## ✅ Esto es BUENO

Este error significa que **Realtime YA está habilitado** en tus tablas. ¡Genial!

El problema es **SOLO las políticas RLS**, no Realtime.

---

## 🎯 Usa Este Script

### **`/ARREGLAR_SOLO_POLITICAS.sql`** ⭐ **USA ESTE**

Este script:
- ✅ Arregla las políticas RLS
- ✅ NO toca Realtime (porque ya funciona)
- ✅ Es más simple y rápido
- ✅ No da errores

---

## 🚀 Pasos (3 Minutos)

### 1️⃣ Ejecutar Script
1. Abre: https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/sql
2. **Borra** todo lo que hayas pegado antes
3. Copia **TODO** el contenido de `/ARREGLAR_SOLO_POLITICAS.sql`
4. Pega en el editor SQL
5. Haz clic en **"Run"** (botón verde, esquina superior derecha)

### 2️⃣ Verificar Resultados

Deberías ver **DOS queries con resultados**:

#### Query 1: Políticas RLS ✅
Deberías ver **5 filas**:

| tablename | policyname | operation | status |
|-----------|-----------|-----------|---------|
| user_profiles_e700bf19 | allow_all_select | SELECT | Política activa ✅ |
| user_profiles_e700bf19 | allow_authenticated_insert | INSERT | Política activa ✅ |
| user_profiles_e700bf19 | allow_authenticated_update | UPDATE | Política activa ✅ |
| user_profiles_e700bf19 | allow_developer_delete | DELETE | Política activa ✅ |
| kv_store_e700bf19 | allow_all_kv | ALL | Política activa ✅ |

#### Query 2: Realtime ✅
Deberías ver **2 filas**:

| schemaname | tablename | status |
|------------|-----------|---------|
| public | user_profiles_e700bf19 | Realtime habilitado ✅ |
| public | kv_store_e700bf19 | Realtime habilitado ✅ |

### 3️⃣ Recarga la App
1. Vuelve a tu app
2. Presiona **F5** para recargar
3. Inicia sesión si no lo estás

### 4️⃣ Probar
1. **Crea** un torneo de prueba
2. **Recarga** la página (F5)
3. **Verifica** que el torneo sigue ahí

---

## ✅ Resultado Esperado

Si ves las **5 políticas** y las **2 tablas con Realtime**:

✅ **Los torneos se guardarán** permanentemente
✅ **Sincronización en tiempo real** funcionará
✅ **No habrá warnings** de permisos

---

## 🆘 Si Aún Ves Errores

### Error: "policy already exists"

Esto es normal si ya ejecutaste el script antes. Para arreglarlo:

1. Ejecuta **SOLO la parte de DROP POLICY** del script
2. Luego ejecuta **TODO el script** nuevamente

### Error: Los torneos TODAVÍA se borran

1. **Abre consola** (F12 → Console)
2. **Crea un torneo**
3. **Busca** este mensaje:
   ```
   ✅ Tournament saved to database
   ```

**Si NO lo ves:**
- Las políticas no se aplicaron correctamente
- Re-ejecuta `/ARREGLAR_SOLO_POLITICAS.sql`
- Asegúrate de ver las 5 políticas en los resultados

**Si lo ves pero el torneo desaparece al recargar:**
- Hay un problema diferente
- Haz clic en el **botón flotante de Base de Datos** (esquina inferior derecha)
- Comparte qué items están en rojo

---

## 📋 Checklist

- [ ] Ejecuté `/ARREGLAR_SOLO_POLITICAS.sql`
- [ ] Vi **5 políticas** en los resultados
- [ ] Vi **2 tablas con Realtime** en los resultados
- [ ] Recargué la app (F5)
- [ ] Creé un torneo de prueba
- [ ] El torneo persiste al recargar (F5)
- [ ] El botón flotante muestra todo verde

---

## 🎯 Resumen

| Script | Cuándo Usarlo |
|--------|---------------|
| `/ARREGLAR_SOLO_POLITICAS.sql` | ⭐ **USA ESTE** - Cuando ves el error "already member of publication" |
| `/ARREGLAR_TODO_AHORA.sql` | Si Realtime NO está habilitado (versión actualizada) |
| `/ARREGLAR_PERMISOS_AHORA.sql` | ❌ Obsoleto, usa los otros |

---

**¡Ejecuta `/ARREGLAR_SOLO_POLITICAS.sql` AHORA y recarga la app!** 🚀

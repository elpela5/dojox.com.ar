# 🚀 Instrucciones Rápidas - Configurar Base de Datos

## ✅ Paso 1: Ir al SQL Editor

Abre este link:
https://supabase.com/dashboard/project/hsgdmrpibkyicemaqbbk/sql

---

## ✅ Paso 2: Crear Nueva Query

Haz clic en el botón **"+ New query"**

---

## ✅ Paso 3: Copiar el SQL Correcto

Copia **TODO** el contenido del archivo:

📄 **`/SETUP_DATABASE_SAFE.sql`**

**IMPORTANTE**: Usa este archivo, NO el anterior. Este es 100% seguro y no dará errores.

---

## ✅ Paso 4: Pegar y Ejecutar

1. Pega el SQL en el editor
2. Haz clic en **"Run"** (o presiona `Ctrl + Enter`)
3. Espera unos segundos

---

## ✅ Paso 5: Verificar Resultados

Deberías ver al final:

```
table_name              | rows | description
------------------------|------|----------------------------------
user_profiles_e700bf19  | 0-X  | Perfiles de usuarios
kv_store_e700bf19       | 0-X  | Datos de la app (torneos, combos)
realtime_user_profiles  | 1    | Realtime habilitado en user_profiles
realtime_kv_store       | 1    | Realtime habilitado en kv_store
```

Si ves 4 filas = **✅ TODO CORRECTO**

---

## ✅ Paso 6: Recargar la App

1. Vuelve a tu app
2. Recarga la página (F5)
3. Verás en la esquina: **"✅ Base de Datos Activa"**

---

## 🎉 ¡LISTO!

Tu app ahora tiene:
- ✅ Base de datos configurada
- ✅ Realtime activado
- ✅ Sincronización entre dispositivos
- ✅ Todos los usuarios visibles

---

## ❓ ¿Todavía Tienes Errores?

Si ves algún error al ejecutar el SQL, **copia el mensaje completo** y avísame.

El nuevo archivo `/SETUP_DATABASE_SAFE.sql` está diseñado para:
- ✅ Ejecutarse múltiples veces sin errores
- ✅ No fallar si las tablas ya existen
- ✅ No fallar si Realtime ya está habilitado
- ✅ Crear todo lo necesario automáticamente

---

**Tiempo estimado**: 1 minuto ⚡

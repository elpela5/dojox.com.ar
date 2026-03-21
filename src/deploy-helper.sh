#!/bin/bash

# 🚀 Beyblade Edge Function - Deploy Helper Script
# Este script te ayuda a desplegar el Edge Function en Supabase paso a paso

echo "═══════════════════════════════════════════════════════════════"
echo "🎯 BEYBLADE - Edge Function Deployment Helper"
echo "═══════════════════════════════════════════════════════════════"
echo ""

PROJECT_REF="hsgdmrpibkyicemaqbbk"

# Verificar si Supabase CLI está instalado
echo "🔍 Verificando Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado."
    echo ""
    echo "📥 Instala Supabase CLI:"
    echo "   macOS:   brew install supabase/tap/supabase"
    echo "   Windows: scoop install supabase"
    echo "   Linux:   curl -fsSL https://supabase.com/install.sh | sh"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI instalado: $(supabase --version)"
echo ""

# Verificar si está autenticado
echo "🔐 Verificando autenticación..."
if ! supabase projects list &> /dev/null; then
    echo "❌ No estás autenticado en Supabase."
    echo ""
    echo "🔑 Pasos para autenticarte:"
    echo "   1. Ve a: https://supabase.com/dashboard/account/tokens"
    echo "   2. Genera un Access Token"
    echo "   3. Ejecuta: supabase login"
    echo "   4. Pega el token"
    echo ""
    read -p "Presiona Enter después de autenticarte..." 
    
    if ! supabase projects list &> /dev/null; then
        echo "❌ Autenticación fallida. Por favor intenta de nuevo."
        exit 1
    fi
fi

echo "✅ Autenticado correctamente"
echo ""

# Verificar si el proyecto está vinculado
echo "🔗 Verificando vinculación del proyecto..."
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️ Proyecto no vinculado. Vinculando..."
    echo ""
    echo "Se te pedirá la contraseña de la base de datos."
    echo "Encuéntrala en: Dashboard → Settings → Database → Database Password"
    echo ""
    
    supabase link --project-ref $PROJECT_REF
    
    if [ $? -ne 0 ]; then
        echo "❌ Error al vincular el proyecto."
        exit 1
    fi
fi

echo "✅ Proyecto vinculado correctamente"
echo ""

# Verificar estructura de carpetas
echo "📁 Verificando estructura de archivos..."
if [ ! -d "supabase/functions/server" ]; then
    echo "❌ No se encuentra la carpeta supabase/functions/server"
    echo "   Por favor crea la estructura de carpetas correcta."
    exit 1
fi

if [ ! -f "supabase/functions/server/index.tsx" ]; then
    echo "❌ No se encuentra supabase/functions/server/index.tsx"
    echo "   Por favor copia el archivo del proyecto de Figma Make."
    exit 1
fi

if [ ! -f "supabase/functions/server/kv_store.tsx" ]; then
    echo "❌ No se encuentra supabase/functions/server/kv_store.tsx"
    echo "   Por favor copia el archivo kv_store.tsx según las instrucciones."
    exit 1
fi

echo "✅ Estructura de archivos correcta"
echo ""

# Preguntar si desea continuar
echo "═══════════════════════════════════════════════════════════════"
echo "📋 Resumen del despliegue:"
echo "   • Proyecto: $PROJECT_REF"
echo "   • Función: server"
echo "   • Archivos: index.tsx, kv_store.tsx"
echo "═══════════════════════════════════════════════════════════════"
echo ""

read -p "¿Deseas continuar con el despliegue? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo "❌ Despliegue cancelado."
    exit 0
fi

# Desplegar
echo ""
echo "🚀 Desplegando Edge Function..."
echo ""

supabase functions deploy server

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "✅ ¡DESPLIEGUE EXITOSO!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "🌐 URL del servidor:"
    echo "   https://$PROJECT_REF.supabase.co/functions/v1/make-server-e700bf19"
    echo ""
    echo "🧪 Prueba el health check:"
    echo "   curl https://$PROJECT_REF.supabase.co/functions/v1/make-server-e700bf19/health"
    echo ""
    echo "📱 Próximos pasos:"
    echo "   1. Ve a tu aplicación en Figma Make"
    echo "   2. Haz clic en '🏥 Test de Conexión al Servidor'"
    echo "   3. Haz clic en 'Reintentar Conexión'"
    echo "   4. ¡Disfruta de la sincronización en tiempo real!"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
else
    echo ""
    echo "❌ Error en el despliegue."
    echo "   Revisa los logs arriba para más detalles."
    echo ""
    echo "💡 Consejos:"
    echo "   • Verifica que los archivos index.tsx y kv_store.tsx existan"
    echo "   • Revisa la sintaxis de los archivos TypeScript"
    echo "   • Consulta: https://supabase.com/docs/guides/functions"
    echo ""
fi

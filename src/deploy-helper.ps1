# 🚀 Beyblade Edge Function - Deploy Helper Script (PowerShell)
# Este script te ayuda a desplegar el Edge Function en Supabase paso a paso

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎯 BEYBLADE - Edge Function Deployment Helper" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$PROJECT_REF = "hsgdmrpibkyicemaqbbk"

# Verificar si Supabase CLI está instalado
Write-Host "🔍 Verificando Supabase CLI..." -ForegroundColor Yellow
try {
    $version = supabase --version 2>&1
    Write-Host "✅ Supabase CLI instalado: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI no está instalado." -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Instala Supabase CLI con Scoop:" -ForegroundColor Yellow
    Write-Host "   1. Instala Scoop: https://scoop.sh" -ForegroundColor White
    Write-Host "   2. Ejecuta: scoop bucket add supabase https://github.com/supabase/scoop-bucket.git" -ForegroundColor White
    Write-Host "   3. Ejecuta: scoop install supabase" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# Verificar si está autenticado
Write-Host "🔐 Verificando autenticación..." -ForegroundColor Yellow
try {
    $null = supabase projects list 2>&1
    Write-Host "✅ Autenticado correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ No estás autenticado en Supabase." -ForegroundColor Red
    Write-Host ""
    Write-Host "🔑 Pasos para autenticarte:" -ForegroundColor Yellow
    Write-Host "   1. Ve a: https://supabase.com/dashboard/account/tokens" -ForegroundColor White
    Write-Host "   2. Genera un Access Token" -ForegroundColor White
    Write-Host "   3. Ejecuta: supabase login" -ForegroundColor White
    Write-Host "   4. Pega el token" -ForegroundColor White
    Write-Host ""
    
    Read-Host "Presiona Enter después de autenticarte..."
    
    try {
        $null = supabase projects list 2>&1
    } catch {
        Write-Host "❌ Autenticación fallida. Por favor intenta de nuevo." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Autenticado correctamente" -ForegroundColor Green
}

Write-Host ""

# Verificar si el proyecto está vinculado
Write-Host "🔗 Verificando vinculación del proyecto..." -ForegroundColor Yellow
if (-not (Test-Path ".supabase/config.toml")) {
    Write-Host "⚠️ Proyecto no vinculado. Vinculando..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Se te pedirá la contraseña de la base de datos." -ForegroundColor Cyan
    Write-Host "Encuéntrala en: Dashboard → Settings → Database → Database Password" -ForegroundColor Cyan
    Write-Host ""
    
    supabase link --project-ref $PROJECT_REF
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al vincular el proyecto." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Proyecto vinculado correctamente" -ForegroundColor Green
Write-Host ""

# Verificar estructura de carpetas
Write-Host "📁 Verificando estructura de archivos..." -ForegroundColor Yellow

if (-not (Test-Path "supabase/functions/server")) {
    Write-Host "❌ No se encuentra la carpeta supabase/functions/server" -ForegroundColor Red
    Write-Host "   Por favor crea la estructura de carpetas correcta." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "supabase/functions/server/index.tsx")) {
    Write-Host "❌ No se encuentra supabase/functions/server/index.tsx" -ForegroundColor Red
    Write-Host "   Por favor copia el archivo del proyecto de Figma Make." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "supabase/functions/server/kv_store.tsx")) {
    Write-Host "❌ No se encuentra supabase/functions/server/kv_store.tsx" -ForegroundColor Red
    Write-Host "   Por favor copia el archivo kv_store.tsx según las instrucciones." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Estructura de archivos correcta" -ForegroundColor Green
Write-Host ""

# Preguntar si desea continuar
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 Resumen del despliegue:" -ForegroundColor Cyan
Write-Host "   • Proyecto: $PROJECT_REF" -ForegroundColor White
Write-Host "   • Función: server" -ForegroundColor White
Write-Host "   • Archivos: index.tsx, kv_store.tsx" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "¿Deseas continuar con el despliegue? (s/n)"

if ($response -notmatch "^[SsYy]$") {
    Write-Host "❌ Despliegue cancelado." -ForegroundColor Red
    exit 0
}

# Desplegar
Write-Host ""
Write-Host "🚀 Desplegando Edge Function..." -ForegroundColor Cyan
Write-Host ""

supabase functions deploy server

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ ¡DESPLIEGUE EXITOSO!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 URL del servidor:" -ForegroundColor Cyan
    Write-Host "   https://$PROJECT_REF.supabase.co/functions/v1/make-server-e700bf19" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Prueba el health check:" -ForegroundColor Cyan
    Write-Host "   curl https://$PROJECT_REF.supabase.co/functions/v1/make-server-e700bf19/health" -ForegroundColor White
    Write-Host ""
    Write-Host "📱 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Ve a tu aplicación en Figma Make" -ForegroundColor White
    Write-Host "   2. Haz clic en '🏥 Test de Conexión al Servidor'" -ForegroundColor White
    Write-Host "   3. Haz clic en 'Reintentar Conexión'" -ForegroundColor White
    Write-Host "   4. ¡Disfruta de la sincronización en tiempo real!" -ForegroundColor White
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Error en el despliegue." -ForegroundColor Red
    Write-Host "   Revisa los logs arriba para más detalles." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Consejos:" -ForegroundColor Cyan
    Write-Host "   • Verifica que los archivos index.tsx y kv_store.tsx existan" -ForegroundColor White
    Write-Host "   • Revisa la sintaxis de los archivos TypeScript" -ForegroundColor White
    Write-Host "   • Consulta: https://supabase.com/docs/guides/functions" -ForegroundColor White
    Write-Host ""
}

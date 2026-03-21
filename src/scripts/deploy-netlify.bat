@echo off
REM Script para deploy en Netlify (Windows)
REM Uso: scripts\deploy-netlify.bat

echo.
echo ============================================
echo   Deploying Beyblade Manager a Netlify
echo ============================================
echo.

REM Paso 1: Build
echo [1/3] Building app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build fallo
    pause
    exit /b %errorlevel%
)
echo ✓ Build completado
echo.

REM Paso 2: Deploy
echo [2/3] Deploying a Netlify...
call netlify deploy --prod --dir=dist
if %errorlevel% neq 0 (
    echo ERROR: Deploy fallo
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================
echo   ✓ Deploy completado exitosamente!
echo ============================================
echo.
echo Tu app esta publicada!
echo.
echo Proximos pasos:
echo   1. Visita la URL que aparecio arriba
echo   2. Prueba instalarlo en tu movil
echo   3. Comparte el link con tus usuarios
echo.
pause

@echo off
REM Script para hacer build de Beyblade Manager para Android (Windows)
REM Uso: scripts\build-android.bat

echo.
echo ============================================
echo   Beyblade Manager - Build para Android
echo ============================================
echo.

REM Paso 1: Build de la app web
echo [1/4] Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: npm run build fallo
    pause
    exit /b %errorlevel%
)
echo ✓ Web app build completado
echo.

REM Paso 2: Copiar archivos a Android
echo [2/4] Copiando archivos a Android...
call npx cap copy android
if %errorlevel% neq 0 (
    echo ERROR: cap copy fallo
    pause
    exit /b %errorlevel%
)
echo ✓ Archivos copiados
echo.

REM Paso 3: Sincronizar
echo [3/4] Sincronizando con Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: cap sync fallo
    pause
    exit /b %errorlevel%
)
echo ✓ Sincronizacion completada
echo.

REM Paso 4: Abrir Android Studio
echo [4/4] Abriendo Android Studio...
call npx cap open android
echo.

echo ============================================
echo   ✓ Build completado exitosamente!
echo ============================================
echo.
echo Proximos pasos:
echo   1. En Android Studio: Build ^> Generate Signed Bundle / APK
echo   2. Selecciona APK o AAB
echo   3. Firma con tu keystore
echo   4. Listo para instalar o publicar!
echo.
pause

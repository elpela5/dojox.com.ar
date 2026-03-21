#!/bin/bash

# Script para hacer build de Beyblade Manager para Android
# Uso: ./scripts/build-android.sh

echo "🚀 Iniciando build de Beyblade Manager para Android..."
echo ""

# Paso 1: Build de la app web
echo "📦 Paso 1/4: Building web app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en npm run build"
    exit 1
fi
echo "✅ Web app build completado"
echo ""

# Paso 2: Copiar archivos a Android
echo "📋 Paso 2/4: Copiando archivos a Android..."
npx cap copy android
if [ $? -ne 0 ]; then
    echo "❌ Error al copiar archivos"
    exit 1
fi
echo "✅ Archivos copiados"
echo ""

# Paso 3: Sincronizar
echo "🔄 Paso 3/4: Sincronizando con Android..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Error al sincronizar"
    exit 1
fi
echo "✅ Sincronización completada"
echo ""

# Paso 4: Abrir Android Studio (opcional)
echo "📱 Paso 4/4: ¿Deseas abrir Android Studio? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "🔨 Abriendo Android Studio..."
    npx cap open android
else
    echo "⏭️  Saltando Android Studio"
fi

echo ""
echo "✅ ¡Build completado exitosamente!"
echo ""
echo "📌 Próximos pasos:"
echo "   1. Abre Android Studio con: npx cap open android"
echo "   2. Build → Generate Signed Bundle / APK"
echo "   3. Selecciona APK o AAB"
echo "   4. Firma con tu keystore"
echo "   5. ¡Listo para instalar o publicar!"
echo ""

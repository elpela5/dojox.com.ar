#!/bin/bash

# Script para deploy en Vercel
# Uso: ./scripts/deploy-vercel.sh

echo "🚀 Deploying Beyblade Manager a Vercel..."
echo ""

# Paso 1: Build
echo "📦 [1/2] Building app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en build"
    exit 1
fi
echo "✅ Build completado"
echo ""

# Paso 2: Instalar Vercel CLI (si no está instalado)
if ! command -v vercel &> /dev/null; then
    echo "📥 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Paso 3: Deploy
echo "🌐 [2/2] Deploying a Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Error en deploy"
    exit 1
fi

echo ""
echo "✅ ¡Deploy completado exitosamente!"
echo ""
echo "🎉 Tu app está publicada en Vercel!"
echo ""
echo "📌 Próximos pasos:"
echo "   1. Visita la URL que apareció arriba"
echo "   2. Prueba instalarlo en tu móvil"
echo "   3. Comparte el link con tus usuarios"
echo ""

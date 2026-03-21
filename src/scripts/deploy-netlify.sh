#!/bin/bash

# Script para deploy en Netlify
# Uso: ./scripts/deploy-netlify.sh

echo "🚀 Deploying Beyblade Manager a Netlify..."
echo ""

# Paso 1: Build
echo "📦 [1/3] Building app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en build"
    exit 1
fi
echo "✅ Build completado"
echo ""

# Paso 2: Instalar Netlify CLI (si no está instalado)
if ! command -v netlify &> /dev/null; then
    echo "📥 Instalando Netlify CLI..."
    npm install -g netlify-cli
fi

# Paso 3: Deploy
echo "🌐 [2/3] Deploying a Netlify..."
netlify deploy --prod --dir=dist

if [ $? -ne 0 ]; then
    echo "❌ Error en deploy"
    exit 1
fi

echo ""
echo "✅ ¡Deploy completado exitosamente!"
echo ""
echo "🎉 Tu app está publicada!"
echo ""
echo "📌 Próximos pasos:"
echo "   1. Visita la URL que apareció arriba"
echo "   2. Prueba instalarlo en tu móvil"
echo "   3. Comparte el link con tus usuarios"
echo ""

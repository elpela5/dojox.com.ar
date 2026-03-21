# 📱 Guía Rápida: 5 Pasos para Android

## ⚡ Versión Express (15 minutos)

### 1️⃣ Instalar Dependencias (5 min)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/splash-screen
```

### 2️⃣ Inicializar Capacitor (2 min)

```bash
npx cap init
```

Responde:
- **App name:** Beyblade Manager
- **App ID:** com.ianlihuel.beyblademanager
- **Web dir:** dist

### 3️⃣ Agregar Android (3 min)

```bash
npx cap add android
```

### 4️⃣ Build y Sync (3 min)

```bash
npm run android:run
```

O manualmente:
```bash
npm run build
npx cap sync android
npx cap open android
```

### 5️⃣ Generar APK (2 min)

En Android Studio:
1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Espera
3. Click "**locate**"
4. APK listo en: `android/app/build/outputs/apk/debug/`

---

## 📲 Instalar en Tu Teléfono

### Opción A: USB
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Opción B: Compartir APK
1. Copia el APK a tu teléfono
2. Abre el archivo
3. Permite "Instalar desde fuentes desconocidas"
4. ¡Listo!

---

## 🔄 Actualizar la App

Cada vez que hagas cambios:

```bash
npm run android:run
```

Esto automáticamente:
1. ✅ Hace build de la web
2. ✅ Sincroniza con Android
3. ✅ Abre Android Studio

---

## 🐛 Problemas Comunes

### "JAVA_HOME not set"
```bash
# Instala JDK 11+
# Descarga: https://adoptium.net/
```

### "Android SDK not found"
```bash
# Instala Android Studio
# Descarga: https://developer.android.com/studio
```

### La app no carga
```bash
# Limpia y reconstruye
rm -rf android/
npx cap add android
npm run android:run
```

---

## 🎯 Comandos Útiles

```bash
# Build completo
npm run android:run

# Solo sync
npm run android:sync

# Abrir Android Studio
npm run android:open

# Ver logs
adb logcat | grep Capacitor
```

---

## 📦 Scripts Automáticos

### Linux/Mac:
```bash
chmod +x scripts/build-android.sh
./scripts/build-android.sh
```

### Windows:
```batch
scripts\build-android.bat
```

---

## ✅ Checklist Rápido

- [ ] Node.js instalado
- [ ] JDK 11+ instalado
- [ ] Android Studio instalado
- [ ] Capacitor inicializado
- [ ] Android agregado
- [ ] Build exitoso
- [ ] APK generado
- [ ] App instalada en teléfono

---

## 🚀 Publicar en Google Play

1. **Crear cuenta:** https://play.google.com/console ($25)
2. **Generar AAB firmado** en Android Studio
3. **Subir** a Play Console
4. **Completar información** de la app
5. **Enviar** para revisión
6. **Esperar** 1-3 días
7. **¡Publicado!** 🎉

---

## 💡 Tips Rápidos

1. ✅ Siempre usa `npm run android:run` para actualizar
2. ✅ Incrementa `versionCode` en cada update
3. ✅ Prueba en varios dispositivos Android
4. ✅ Usa AAB para Play Store, APK para testing
5. ✅ Guarda tu keystore de forma segura

---

## 📚 Documentación Completa

Para más detalles, lee `GUIA_ANDROID.md` 📖

---

**¡Tu app está lista en 15 minutos!** 🎉📱

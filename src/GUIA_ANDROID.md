# 📱 Guía Completa: Convertir Beyblade Manager a App Android

## 🎯 Método Recomendado: Capacitor

Capacitor es la solución moderna de Ionic para convertir web apps en apps nativas.

---

## 📋 **Requisitos Previos**

1. ✅ Node.js 16+ instalado
2. ✅ npm o yarn instalado
3. ✅ Java JDK 11+ instalado
4. ✅ Android Studio instalado
5. ✅ 8GB+ de RAM recomendados

---

## 🚀 **Paso 1: Instalar Capacitor**

Abre la terminal en la carpeta de tu proyecto y ejecuta:

```bash
# Instalar Capacitor
npm install @capacitor/core @capacitor/cli

# Inicializar Capacitor
npx cap init
```

**Responde las preguntas:**
- **App name:** `Beyblade Manager`
- **App ID:** `com.ianlihuel.beyblademanager` (usa tu dominio inverso)
- **Web asset directory:** `dist` (donde se genera el build)

Esto creará un archivo `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ianlihuel.beyblademanager',
  appName: 'Beyblade Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

---

## 📱 **Paso 2: Agregar Plataforma Android**

```bash
# Instalar plugin de Android
npm install @capacitor/android

# Agregar plataforma Android
npx cap add android
```

Esto creará una carpeta `android/` con el proyecto de Android Studio.

---

## 🔧 **Paso 3: Configurar LocalStorage Persistente**

Como tu app usa `localStorage` intensivamente, necesitas asegurar que persista:

**Crear archivo:** `android/app/src/main/assets/capacitor.config.json`

```json
{
  "appId": "com.ianlihuel.beyblademanager",
  "appName": "Beyblade Manager",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": true
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": true
  }
}
```

---

## 🎨 **Paso 4: Crear Iconos de App**

### Opción A: Usar herramienta online

1. Ve a: https://icon.kitchen/
2. Sube un logo de Beyblade (512x512 px)
3. Descarga el paquete de iconos
4. Reemplaza los iconos en: `android/app/src/main/res/`

### Opción B: Manual

Crea iconos en estos tamaños:
- `mipmap-mdpi/ic_launcher.png` - 48x48px
- `mipmap-hdpi/ic_launcher.png` - 72x72px
- `mipmap-xhdpi/ic_launcher.png` - 96x96px
- `mipmap-xxhdpi/ic_launcher.png` - 144x144px
- `mipmap-xxxhdpi/ic_launcher.png` - 192x192px

---

## 🏗️ **Paso 5: Build de la App Web**

Cada vez que hagas cambios, necesitas:

```bash
# 1. Hacer build de la app web
npm run build

# 2. Copiar archivos a Android
npx cap copy android

# 3. Sincronizar todo
npx cap sync android
```

---

## 🔨 **Paso 6: Abrir Android Studio**

```bash
npx cap open android
```

Esto abrirá Android Studio. La primera vez puede tardar en cargar dependencias.

---

## 📦 **Paso 7: Generar APK de Prueba (Debug)**

En Android Studio:

1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Espera a que compile
3. Click en **locate** cuando termine
4. El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

**Instalar en tu teléfono:**
```bash
# Conecta tu teléfono por USB con depuración USB activada
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔐 **Paso 8: Generar APK de Producción (Release)**

### Crear Keystore

En Android Studio, ve a **Build → Generate Signed Bundle / APK**:

1. Selecciona **APK**
2. Click **Create new...** para el keystore
3. Completa:
   ```
   Key store path: /ruta/segura/beyblade-release-key.jks
   Password: [TU_PASSWORD_SEGURA]
   Alias: beyblademanager
   Password (alias): [TU_PASSWORD_SEGURA]
   Validity: 25 years
   
   Certificate:
   First and Last Name: Ian Lihuel
   Organizational Unit: Beyblade Manager
   Organization: Beyblade Manager
   City: [Tu Ciudad]
   State: [Tu Estado]
   Country Code: AR
   ```
4. Click **OK → Next**
5. Selecciona **release**
6. Firma V1 y V2: ambas marcadas
7. Click **Finish**

**⚠️ IMPORTANTE:** Guarda el archivo `.jks` y las contraseñas en un lugar seguro. Sin ellas no podrás actualizar la app en Google Play.

---

## 🎯 **Paso 9: Optimizar para Android**

### A. Agregar Splash Screen

```bash
npm install @capacitor/splash-screen
```

En `capacitor.config.ts`:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ... config anterior
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#8B5CF6",
      showSpinner: false,
      androidSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
```

### B. Configurar Permisos

En `android/app/src/main/AndroidManifest.xml`, asegúrate de tener:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.ianlihuel.beyblademanager">

    <!-- Permisos necesarios -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Beyblade Manager"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <!-- ... resto de la configuración -->
    </application>
</manifest>
```

---

## 📤 **Paso 10: Publicar en Google Play Store**

1. **Crear cuenta de desarrollador** en Google Play Console ($25 único pago)
2. **Crear nueva aplicación**
3. **Subir APK** o mejor aún, **AAB (Android App Bundle)**:

```bash
# En Android Studio: Build → Generate Signed Bundle / APK
# Selecciona "Android App Bundle" en lugar de APK
```

4. **Completar información:**
   - Título: Beyblade Manager
   - Descripción corta
   - Descripción completa
   - Screenshots (5 mínimo)
   - Icono de app (512x512)
   - Feature graphic (1024x500)
   - Categoría: Herramientas / Deportes
   - Clasificación de contenido
   - Política de privacidad

5. **Enviar para revisión**

---

## 🔄 **Flujo de Trabajo para Actualizaciones**

Cada vez que hagas cambios:

```bash
# 1. Hacer cambios en el código
# 2. Build
npm run build

# 3. Sync con Android
npx cap sync android

# 4. Incrementar versionCode en android/app/build.gradle
# Cambiar:
#   versionCode 1  →  versionCode 2
#   versionName "1.0"  →  versionName "1.1"

# 5. Generar nuevo APK/AAB firmado
# 6. Subir a Google Play
```

---

## 🐛 **Solución de Problemas Comunes**

### Error: "JAVA_HOME not set"
```bash
# Windows
setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.x"

# Mac/Linux
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-11.0.x.jdk/Contents/Home
```

### Error: "SDK location not found"
Crea archivo `android/local.properties`:
```
sdk.dir=/Users/TU_USUARIO/Library/Android/sdk
```

### LocalStorage no persiste
Verifica que `android/app/src/main/AndroidManifest.xml` tenga:
```xml
android:usesCleartextTraffic="true"
```

### La app se ve pequeña en tablets
En `capacitor.config.ts`:
```typescript
android: {
  webContentsDebuggingEnabled: true,
  allowMixedContent: true,
  captureInput: true
}
```

---

## 📊 **Comparación: APK vs AAB**

| Característica | APK | AAB (Recomendado) |
|----------------|-----|-------------------|
| Tamaño | Más grande | ~15% más pequeño |
| Play Store | Opcional | Obligatorio desde 2021 |
| Instalación directa | ✅ Sí | ❌ No |
| Optimización | Manual | Automática |

**Recomendación:** Usa AAB para Google Play, APK para distribución directa.

---

## 🎉 **Checklist Final**

Antes de publicar:

- [ ] La app funciona en modo release (no solo debug)
- [ ] Todos los features funcionan offline
- [ ] LocalStorage persiste después de cerrar app
- [ ] El icono se ve bien en todos los tamaños
- [ ] La splash screen funciona
- [ ] No hay logs de console.log en producción
- [ ] versionCode incrementado
- [ ] Probado en diferentes resoluciones
- [ ] Probado en Android 8+
- [ ] Screenshots listos para Play Store
- [ ] Descripción y textos revisados

---

## 🚀 **Comandos Rápidos**

```bash
# Desarrollo
npm run build && npx cap sync android && npx cap open android

# Build debug
cd android && ./gradlew assembleDebug

# Build release
cd android && ./gradlew assembleRelease

# Instalar en dispositivo
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Ver logs del dispositivo
adb logcat | grep Capacitor
```

---

## 📚 **Recursos Adicionales**

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Android Studio:** https://developer.android.com/studio
- **Google Play Console:** https://play.google.com/console
- **Icon Generator:** https://icon.kitchen/
- **Screenshot Generator:** https://mockuphone.com/

---

## 💡 **Tips Pro**

1. **Usa Gradle Version Catalog** para gestionar dependencias
2. **Habilita ProGuard** para ofuscar código en release
3. **Implementa Firebase** para analytics y crash reporting
4. **Usa App Signing by Google Play** para mayor seguridad
5. **Implementa actualizaciones in-app** con Capacitor Live Updates

---

¡Tu app Beyblade Manager está lista para Android! 🎉🚀

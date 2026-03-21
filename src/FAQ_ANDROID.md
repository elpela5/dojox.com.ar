# ❓ Preguntas Frecuentes - App Android

## 📱 General

### ¿Cuánto cuesta convertir mi app a Android?
- **Desarrollo:** GRATIS con Capacitor
- **Publicar en Play Store:** $25 USD (pago único de por vida)

### ¿Necesito saber Java/Kotlin?
No. Capacitor convierte tu app React automáticamente.

### ¿La app funcionará offline?
Sí, como usa `localStorage`, todo funciona offline.

### ¿Cuánto pesa la app?
- **APK Debug:** ~10-15 MB
- **APK Release:** ~5-8 MB
- **AAB Release:** ~4-6 MB

---

## 🔧 Instalación

### ¿Qué versión de Java necesito?
**JDK 11 o superior**. Recomendado: JDK 17
- Descargar: https://adoptium.net/

### ¿Necesito instalar Android Studio completo?
Sí, necesitas:
- Android Studio
- Android SDK
- Android SDK Build-Tools
- Android Emulator (opcional)

### Error: "Gradle sync failed"
```bash
# Solución 1: Limpiar cache
cd android
./gradlew clean

# Solución 2: Borrar y recrear
cd ..
rm -rf android/
npx cap add android
```

---

## 💾 LocalStorage y Datos

### ¿Los datos se pierden al cerrar la app?
No, `localStorage` persiste en Android.

### ¿Puedo importar/exportar datos?
Sí, tu app ya tiene la funcionalidad de import/export en los componentes.

### ¿Cómo hacer backup de los datos del usuario?
Los datos están en:
```
Android: /data/data/com.ianlihuel.beyblademanager/files/
```

Puedes implementar:
1. Export a JSON (ya implementado)
2. Backup a la nube (Firebase/Supabase)
3. Compartir por WhatsApp/Email

---

## 🎨 Diseño y UI

### La app se ve pequeña en mi tablet
Agrega a `capacitor.config.ts`:
```typescript
android: {
  webContentsDebuggingEnabled: true,
  captureInput: true,
  overrideUserAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
}
```

### ¿Puedo cambiar el color de la barra de estado?
Sí, instala el plugin:
```bash
npm install @capacitor/status-bar
```

Luego en tu App.tsx:
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

StatusBar.setBackgroundColor({ color: '#8B5CF6' });
StatusBar.setStyle({ style: Style.Dark });
```

### ¿Cómo agregar un splash screen personalizado?
1. Crea imagen 1080x1920px
2. Guárdala en: `android/app/src/main/res/drawable/splash.png`
3. Configura en `capacitor.config.ts`

---

## 📦 Build y APK

### ¿Cuál es la diferencia entre APK y AAB?
| Característica | APK | AAB |
|----------------|-----|-----|
| Tamaño | 10 MB | 6 MB |
| Play Store | ❌ Obsoleto | ✅ Requerido |
| Instalación directa | ✅ Sí | ❌ No |
| Optimización | Manual | Automática |

**Recomendación:** APK para testing, AAB para Play Store.

### Error: "App not installed"
```bash
# Desinstala la versión anterior primero
adb uninstall com.ianlihuel.beyblademanager

# Instala la nueva
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### ¿Cómo reducir el tamaño del APK?
1. **Habilitar ProGuard** (ofuscación):
   En `android/app/build.gradle`:
   ```gradle
   buildTypes {
       release {
           minifyEnabled true
           shrinkResources true
           proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
       }
   }
   ```

2. **Usar AAB** en lugar de APK (reducción automática)

3. **Remover dependencias no usadas**

---

## 🚀 Publicación

### ¿Cuánto tarda la revisión de Google Play?
- Primera publicación: **1-7 días**
- Actualizaciones: **1-3 días**

### ¿Qué necesito para publicar?
1. ✅ Cuenta de Google Play Developer ($25)
2. ✅ AAB firmado
3. ✅ Descripción de la app
4. ✅ 2 screenshots mínimo (recomendado 8)
5. ✅ Icono 512x512px
6. ✅ Feature graphic 1024x500px
7. ✅ Política de privacidad (URL pública)

### ¿Necesito política de privacidad?
Sí, es obligatorio. Puedes usar:
- **Termly:** https://termly.io/
- **PrivacyPolicies:** https://www.privacypolicies.com/
- **Crear propia** (sencilla si no recolectas datos sensibles)

Ejemplo básico:
```markdown
# Política de Privacidad - Beyblade Manager

Esta app NO recolecta información personal.
Todos los datos se almacenan localmente en tu dispositivo.
No compartimos información con terceros.
```

### ¿Puedo monetizar la app?
Sí, opciones:
1. **Gratis con ads** (AdMob)
2. **Pago único** ($0.99 - $9.99)
3. **Freemium** (compras in-app)
4. **Suscripción**

---

## 🔄 Actualizaciones

### ¿Cómo actualizar la app después de publicar?
1. Haz cambios en el código
2. Incrementa `versionCode` y `versionName` en `android/app/build.gradle`:
   ```gradle
   defaultConfig {
       versionCode 2  // era 1
       versionName "1.1"  // era "1.0"
   }
   ```
3. Build nueva AAB firmada
4. Sube a Play Console
5. Usuarios recibirán actualización automática

### ¿Puedo forzar actualizaciones?
Sí, con Firebase Remote Config o Capacitor Live Updates.

---

## 🔐 Seguridad

### ¿Cómo proteger mi keystore?
1. **NUNCA** subir a GitHub
2. Guardar en lugar seguro (USB, cloud encriptado)
3. Usar contraseña fuerte
4. Hacer backups

**Si pierdes el keystore, NO podrás actualizar la app en Play Store.**

### ¿Puedo ofuscar el código?
Sí, habilita ProGuard en release builds.

### ¿La app es segura sin backend?
Sí, como todo es local. Pero ten en cuenta:
- ❌ No hay autenticación real (cualquiera puede usar la app)
- ❌ No hay sincronización entre dispositivos
- ✅ Los datos son privados del usuario
- ✅ No hay riesgo de hackeo de servidor

---

## 📊 Analytics y Métricas

### ¿Cómo saber cuántos usuarios tengo?
**Opción 1: Google Play Console** (gratis)
- Instalaciones
- Desinstalaciones
- Crashes
- Calificaciones

**Opción 2: Firebase Analytics** (gratis)
```bash
npm install @capacitor-firebase/analytics
```

**Opción 3: Mixpanel/Amplitude** (freemium)

---

## 🐛 Debugging

### ¿Cómo ver los logs de la app?
```bash
# Ver todos los logs
adb logcat

# Filtrar por Capacitor
adb logcat | grep Capacitor

# Filtrar por tu app
adb logcat | grep BeybladeManager
```

### ¿Cómo debuggear en Chrome?
1. Conecta dispositivo por USB
2. Habilita "Depuración USB"
3. Abre Chrome: `chrome://inspect`
4. Selecciona tu app
5. Abre DevTools

### La app crashea al abrir
```bash
# Ver crash log
adb logcat *:E

# Limpiar y reconstruir
rm -rf android/app/build
cd android && ./gradlew clean
npm run android:run
```

---

## 🌐 Supabase y Backend

### ¿Supabase funciona en Android?
Sí, perfectamente. Ya está configurado en tu app.

### ¿Necesito configuración especial?
No, las llamadas HTTP funcionan igual que en web.

### ¿Cómo manejar timeouts en móvil?
Agrega timeouts a tus fetch calls:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(url, {
    signal: controller.signal
  });
} finally {
  clearTimeout(timeout);
}
```

---

## 📸 Permisos

### ¿Qué permisos necesita mi app?
Por defecto:
- `INTERNET` - Para Supabase
- `ACCESS_NETWORK_STATE` - Para detectar conexión

Si agregas features:
- `CAMERA` - Para tomar fotos de Beyblades
- `READ_EXTERNAL_STORAGE` - Para cargar imágenes
- `WRITE_EXTERNAL_STORAGE` - Para guardar backups

### ¿Cómo solicitar permisos?
```bash
npm install @capacitor/camera
```

```typescript
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });
};
```

---

## 💰 Costos

### Resumen de costos para publicar:
- Google Play Developer Account: **$25 USD** (único pago)
- Certificados/Keystore: **GRATIS** (generas tú mismo)
- Capacitor: **GRATIS** (open source)
- Android Studio: **GRATIS**
- Hosting de web version: **$0-5/mes** (opcional)

**Total para empezar: $25 USD** 🎉

---

## 🎓 Recursos de Aprendizaje

### Documentación Oficial
- Capacitor: https://capacitorjs.com/docs
- Android Developers: https://developer.android.com/
- Play Console: https://support.google.com/googleplay/android-developer

### Tutoriales en Video
- **Capacitor Crash Course** (YouTube)
- **Publishing to Google Play** (Google)
- **Android Development for Web Developers** (Udemy)

### Comunidades
- Reddit: r/Capacitor
- Discord: Ionic Framework
- Stack Overflow: [capacitor] tag

---

## 🆘 Obtener Ayuda

### Orden de búsqueda:
1. Esta FAQ
2. `GUIA_ANDROID.md`
3. Documentación de Capacitor
4. Stack Overflow
5. GitHub Issues de Capacitor
6. Discord de Ionic

### Reportar un bug:
1. Reproduce el error
2. Captura los logs: `adb logcat > error.log`
3. Anota pasos para reproducir
4. Crea issue en GitHub

---

**¿Más preguntas?** Consulta la documentación completa en `GUIA_ANDROID.md` 📖

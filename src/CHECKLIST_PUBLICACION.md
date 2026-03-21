# ✅ Checklist de Publicación en Google Play

## 📋 Antes de Empezar

- [ ] Cuenta de Google Play Developer creada ($25 USD)
- [ ] Política de privacidad publicada en URL pública
- [ ] Keystore generado y guardado de forma segura
- [ ] App probada en al menos 2 dispositivos diferentes
- [ ] Todos los features funcionan correctamente

---

## 🏗️ Preparación del Build

### Actualizar Versiones
- [ ] Abrir `android/app/build.gradle`
- [ ] Incrementar `versionCode` (ej: 1 → 2)
- [ ] Actualizar `versionName` (ej: "1.0" → "1.1")

```gradle
defaultConfig {
    applicationId "com.ianlihuel.beyblademanager"
    versionCode 1  // ← Cambiar esto
    versionName "1.0"  // ← Y esto
}
```

### Build Final
- [ ] `npm run build` exitoso
- [ ] `npx cap sync android` exitoso
- [ ] Probar en emulador
- [ ] Probar en dispositivo físico

### Generar AAB Firmado
- [ ] Android Studio → Build → Generate Signed Bundle / APK
- [ ] Seleccionar "Android App Bundle"
- [ ] Usar keystore de release
- [ ] Build variant: **release**
- [ ] Firmar con V1 y V2
- [ ] AAB generado exitosamente

---

## 🎨 Assets Gráficos

### Iconos de App
- [ ] ic_launcher.png (todos los tamaños)
  - [ ] mdpi: 48x48px
  - [ ] hdpi: 72x72px
  - [ ] xhdpi: 96x96px
  - [ ] xxhdpi: 144x144px
  - [ ] xxxhdpi: 192x192px

### Google Play Assets
- [ ] **Icono de alta resolución** (512x512px, PNG)
- [ ] **Feature Graphic** (1024x500px, PNG o JPG)
- [ ] **Screenshots de teléfono** (mínimo 2, recomendado 8)
  - Tamaño: 1080x1920px a 1920x1080px
  - Formato: PNG o JPG
  - Sin alpha channel
  
- [ ] **Screenshots de tablet 7"** (opcional)
  - Tamaño: 1024x600px a 600x1024px
  
- [ ] **Screenshots de tablet 10"** (opcional)
  - Tamaño: 1920x1200px a 1200x1920px

### Video Promocional (Opcional)
- [ ] URL de YouTube
- [ ] Duración: 30 segundos - 2 minutos
- [ ] Muestra features principales

---

## 📝 Información de la App

### Detalles Básicos
- [ ] **Título de la app:** "Beyblade Manager"
  - Máximo 50 caracteres
  
- [ ] **Descripción corta:** 
  ```
  Gestiona torneos, colección y estadísticas de Beyblade X
  ```
  - Máximo 80 caracteres
  
- [ ] **Descripción completa:**
  ```
  Beyblade Manager es la app definitiva para fanáticos de Beyblade X.
  
  🏆 TORNEOS SUIZOS
  • Sistema completo de torneos con emparejamientos automáticos
  • Tracking de victorias, derrotas y empates
  • Clasificación con Buchholz y tiebreakers
  • Soporte para múltiples rondas
  
  ⚡ TOP COMBOS GANADORES
  • Ranking automático de combos más exitosos
  • Sistema de puntos basado en resultados de torneos
  • Soporte para modo Standard y Custom
  • Tracking de apariciones en top 10
  
  📦 GESTIÓN DE COLECCIÓN
  • Catálogo completo de piezas con imágenes
  • Inventario personal de Beyblades
  • Creación de hasta 10 decks diferentes
  • Configuración Standard (3 partes) y Custom (5 partes)
  
  👥 RANKING DE JUGADORES
  • Sistema de tiers (Bronce a Master)
  • Ventana deslizante de 45 torneos
  • Estadísticas detalladas por jugador
  • Perfiles con foto personalizable
  
  🔐 MULTI-USUARIO
  • Sistema completo de autenticación
  • Roles de administrador y usuario
  • Datos guardados localmente
  • Funciona 100% offline
  
  ¡Descarga ahora y lleva tu experiencia Beyblade X al siguiente nivel!
  ```
  - Máximo 4000 caracteres

### Categorización
- [ ] **Categoría:** Deportes (o Herramientas)
- [ ] **Tags:**
  - beyblade
  - torneos
  - colección
  - gestión
  - juego de trompos

### Información de Contacto
- [ ] **Email:** ianlihuel97@gmail.com
- [ ] **Sitio web:** (opcional)
- [ ] **Política de privacidad:** URL pública

---

## 🎯 Clasificación de Contenido

Completar cuestionario:
- [ ] ¿Contiene violencia? **No**
- [ ] ¿Contiene contenido sexual? **No**
- [ ] ¿Contiene lenguaje soez? **No**
- [ ] ¿Permite comunicación entre usuarios? **No**
- [ ] ¿Comparte ubicación? **No**
- [ ] ¿Permite compras? **No**

Clasificación esperada: **PEGI 3** / **Everyone**

---

## 🌍 Países y Regiones

- [ ] **Países disponibles:**
  - [ ] Todos los países (recomendado)
  - [ ] O seleccionar manualmente
  
- [ ] **Restricciones regionales:** Ninguna

---

## 💰 Precios y Distribución

- [ ] **Tipo:** Gratis (recomendado para empezar)
- [ ] **Contiene anuncios:** No (por ahora)
- [ ] **Compras in-app:** No (por ahora)
- [ ] **Destinatarios:**
  - [ ] Consumidores
  - [ ] No es principalmente para niños

---

## 🔒 Privacidad y Seguridad

### Política de Privacidad
- [ ] URL de política de privacidad agregada
- [ ] Política cubre:
  - [ ] Qué datos se recolectan (ninguno)
  - [ ] Cómo se usan (N/A)
  - [ ] Cómo se comparten (N/A)
  - [ ] Derechos del usuario

### Declaración de Seguridad de Datos
- [ ] **¿Recolectas datos?** No
- [ ] **¿Compartes datos?** No
- [ ] **¿Datos encriptados en tránsito?** Sí (HTTPS)
- [ ] **¿Usuarios pueden solicitar eliminación?** N/A

---

## 🧪 Pruebas

### Pruebas en Dispositivos
- [ ] Android 8.0 (Oreo)
- [ ] Android 9.0 (Pie)
- [ ] Android 10
- [ ] Android 11
- [ ] Android 12+
- [ ] Diferentes resoluciones
- [ ] Diferentes fabricantes (Samsung, Xiaomi, etc.)

### Funcionalidad
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Crear torneo funciona
- [ ] Inscribirse funciona
- [ ] Seleccionar deck funciona
- [ ] Jugar torneo funciona
- [ ] Ver rankings funciona
- [ ] Crear combo funciona
- [ ] Gestionar colección funciona
- [ ] Crear deck funciona
- [ ] LocalStorage persiste datos
- [ ] App funciona offline
- [ ] No hay crashes

### Performance
- [ ] App abre en menos de 3 segundos
- [ ] Navegación es fluida
- [ ] No hay lag en listas largas
- [ ] Imágenes cargan rápido

---

## 📱 Testing Beta (Opcional)

- [ ] Crear track de pruebas cerradas
- [ ] Invitar a 10-20 testers
- [ ] Recolectar feedback
- [ ] Corregir bugs reportados
- [ ] Actualizar antes del lanzamiento

---

## 🚀 Lanzamiento

### Pre-lanzamiento
- [ ] Revisar todos los datos ingresados
- [ ] Verificar screenshots
- [ ] Verificar descripciones (sin errores de ortografía)
- [ ] AAB subido correctamente
- [ ] Versión correcta

### Enviar para Revisión
- [ ] Click en "Enviar para revisión"
- [ ] Confirmar todos los warnings (si los hay)
- [ ] Recibir confirmación de envío

### Durante Revisión (1-7 días)
- [ ] No hacer cambios en la ficha
- [ ] Revisar email para notificaciones
- [ ] Responder preguntas de Google si las hay

### Post-Aprobación
- [ ] Verificar que está publicada
- [ ] Buscar en Play Store
- [ ] Descargar e instalar
- [ ] Verificar que todo funciona
- [ ] Compartir link con usuarios

---

## 📊 Post-Lanzamiento

### Primeros 7 Días
- [ ] Monitorear crashes en Play Console
- [ ] Revisar calificaciones y reseñas
- [ ] Responder a comentarios negativos
- [ ] Agradecer comentarios positivos
- [ ] Compartir en redes sociales

### Primeros 30 Días
- [ ] Analizar estadísticas de instalación
- [ ] Revisar retención de usuarios
- [ ] Planear primera actualización
- [ ] Recolectar feedback de usuarios
- [ ] Crear roadmap de features

---

## 🎉 Tu App Está Publicada!

### Link de tu App
```
https://play.google.com/store/apps/details?id=com.ianlihuel.beyblademanager
```

### Promoción
- [ ] Compartir en redes sociales
- [ ] Crear posts en Reddit
- [ ] Compartir en grupos de Beyblade
- [ ] Pedir a amigos que califiquen
- [ ] Crear video demo para YouTube

---

## 📈 Métricas a Monitorear

- **Instalaciones:** Meta inicial 100+
- **Calificación:** Mantener 4.0+ estrellas
- **Crashes:** Mantener <1%
- **Desinstalaciones:** Analizar si es >30%
- **Retención:** Usuarios activos después de 7 días

---

## 🔄 Plan de Actualizaciones

### Versión 1.1 (1 mes después)
- [ ] Corregir bugs reportados
- [ ] Agregar features solicitadas
- [ ] Mejorar UI/UX
- [ ] Optimizar performance

### Versión 1.2 (2 meses después)
- [ ] Nuevas funcionalidades
- [ ] Sincronización en la nube (Firebase)
- [ ] Modo oscuro
- [ ] Notificaciones

---

**¡Éxito con tu publicación! 🚀📱**

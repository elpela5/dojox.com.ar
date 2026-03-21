import { Heart, MapPin, Calendar, Users, Upload, X, ImageIcon } from 'lucide-react';
import { CafecitoButton } from './CafecitoButton';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useUser } from '../contexts/UserContext';
import { useSync } from '../contexts/SyncContext';
import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import dojoXCircularLogo from 'figma:asset/3a8cd93ecf79e9491c12c1e7df6ec4c73b6bc5e7.png';
import instagramQR from 'figma:asset/59a2dac9b9eca9c9350b9569edb18fd163f29320.png';
import tiktokQR from 'figma:asset/fa924b4b55aaed6b03e94f92712720d29130958c.png';
import yomotsuLogo from 'figma:asset/0088971e10c35e90725578737c83dfca7fc36fae.png';
import whatsappQR from 'figma:asset/3335b5ed59e6a747a7f6e5f37c49104efaea7874.png';

const supabase = getSupabaseClient();
const BUCKET_NAME = 'make-e700bf19-promo-images';

export function Community() {
  const { user } = useUser();
  const [promoImageUrl, setPromoImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingPromoImage, setLoadingPromoImage] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  // Load promo image from Supabase
  useEffect(() => {
    loadPromoImage();
  }, []);

  const loadPromoImage = async () => {
    try {
      setLoadingPromoImage(true);
      
      // Get the promo image URL from KV store
      const { data, error } = await supabase
        .from('kv_store_e700bf19')
        .select('value')
        .eq('key', 'promo-image-url')
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error is OK
          console.error('Error loading promo image:', error);
        }
        setPromoImageUrl(null);
      } else if (data?.value) {
        setPromoImageUrl(data.value as string);
      }
    } catch (error) {
      console.error('Error loading promo image:', error);
    } finally {
      setLoadingPromoImage(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }

    setUploading(true);

    try {
      console.log('📤 Starting image upload...');
      console.log('📦 File details:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });
      
      // Convert file to base64 for storage in KV
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Image = await base64Promise;
      console.log('✅ Image converted to base64');
      console.log('📏 Base64 size:', `${(base64Image.length / 1024).toFixed(2)} KB`);

      // Check if table exists first
      console.log('🔍 Checking if KV table exists...');
      const { error: checkError } = await supabase
        .from('kv_store_e700bf19')
        .select('key')
        .limit(1);

      if (checkError) {
        console.error('❌ KV Store table access error:', checkError);
        if (checkError.code === '42P01') {
          alert('❌ Error: La tabla de almacenamiento no existe.\n\nPor favor contacta al administrador para configurar la base de datos.');
        } else if (checkError.code === '42501') {
          alert('❌ Error de permisos: No tienes acceso para guardar imágenes.\n\nPor favor contacta al administrador para configurar los permisos (RLS).');
        } else {
          alert(`❌ Error de base de datos: ${checkError.message}\n\nCódigo: ${checkError.code}`);
        }
        return;
      }

      console.log('✅ KV table is accessible');

      // Save base64 image to KV store
      console.log('💾 Saving image to KV store...');
      const { error: kvError } = await supabase
        .from('kv_store_e700bf19')
        .upsert({
          key: 'promo-image-url',
          value: base64Image,
        });

      if (kvError) {
        console.error('❌ KV Store upsert error:', kvError);
        console.error('Error details:', JSON.stringify(kvError, null, 2));
        
        if (kvError.code === '42501') {
          alert('❌ Error de permisos: No puedes actualizar la imagen promocional.\n\nSolo administradores pueden hacer esto.');
        } else {
          alert(`❌ Error al guardar la imagen: ${kvError.message}\n\nCódigo: ${kvError.code || 'desconocido'}`);
        }
        return;
      }

      console.log('✅ Image saved to KV store');
      setPromoImageUrl(base64Image);
      alert('✅ Imagen promocional cargada exitosamente');
    } catch (error: any) {
      console.error('❌ Error uploading promo image:', error);
      console.error('Error stack:', error.stack);
      alert(`❌ Error al cargar la imagen: ${error.message || 'Error desconocido'}\n\nRevisa la consola para más detalles.`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePromoImage = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar la imagen promocional?')) {
      return;
    }

    setUploading(true);

    try {
      console.log('🗑️ Removing promo image...');
      
      // Delete from KV store
      const { error } = await supabase
        .from('kv_store_e700bf19')
        .delete()
        .eq('key', 'promo-image-url');

      if (error) {
        console.error('❌ Error deleting from KV:', error);
        throw error;
      }

      console.log('✅ Image removed from KV store');
      setPromoImageUrl(null);
      alert('✅ Imagen promocional eliminada');
    } catch (error) {
      console.error('❌ Error removing promo image:', error);
      alert('❌ Error al eliminar la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-blue-500" />
        <h2>Comunidad</h2>
      </div>

      {/* Logo Section */}
      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-48 rounded-full overflow-hidden bg-transparent">
          <ImageWithFallback 
            src={dojoXCircularLogo} 
            alt="Yomotsu Dojo X" 
            className="w-full h-full object-cover scale-100"
          />
        </div>
      </div>

      {/* Promo Image Section */}
      {!loadingPromoImage && (promoImageUrl || isAdmin) && (
        <div className="mb-6">
          {promoImageUrl ? (
            <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-4 shadow-lg">
              <div className="flex justify-center mb-2">
                <img 
                  src={promoImageUrl} 
                  alt="Próximo Torneo" 
                  className="max-w-full h-auto rounded-xl shadow-md"
                  style={{ maxHeight: '400px' }}
                />
              </div>
              {isAdmin && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Cambiar Imagen
                  </button>
                  <button
                    onClick={handleRemovePromoImage}
                    disabled={uploading}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ) : isAdmin ? (
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-gray-700 mb-2">Imagen Promocional del Próximo Torneo</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Carga una imagen para promocionar el próximo evento
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Subiendo...' : 'Cargar Imagen'}
                </button>
              </div>
            </div>
          ) : null}
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Main Banner */}
      <div className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-8 shadow-lg">
        <div className="flex items-start gap-4 mb-6">
          <Heart className="w-10 h-10 text-red-500 flex-shrink-0" />
          <div>
            <h3 className="text-blue-900 mb-4 text-xl">Dojo X - Beyblade X Community</h3>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Bienvenidos a Dojo X, la comunidad dedicada a Beyblade X que reúne a bladers de todos los niveles con una misma pasión: competir, aprender y disfrutar del juego.
              </p>
              <p>
                Cada domingo nos encontramos en Parque Chacabuco, Buenos Aires, un espacio abierto donde los beyblades giran, las estrategias se ponen a prueba y la comunidad crece batalla tras batalla. Ya seas principiante, jugador experimentado o simplemente alguien con curiosidad por el mundo Beyblade X, acá vas a encontrar un ambiente amistoso, competitivo y respetuoso.
              </p>
              <p>
                En Dojo X promovemos el juego limpio, la mejora constante y el espíritu de comunidad. Organizamos partidas casuales, torneos, rankings y espacios para compartir conocimientos sobre combos, piezas y estrategias.
              </p>
              <p className="text-blue-900">
                Traé tu beyblade, tus ganas de girar y sumate.
                <br />
                <strong>El estadio nos espera.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Location Card */}
        <div className="bg-white border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-6 h-6 text-green-600" />
            <h3 className="text-green-900">Ubicación</h3>
          </div>
          <p className="text-gray-700 mb-2">
            <strong>Parque Chacabuco</strong>
          </p>
          <p className="text-gray-600 text-sm">
            Buenos Aires, Argentina
          </p>
        </div>

        {/* Schedule Card */}
        <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h3 className="text-purple-900">Días de Encuentro</h3>
          </div>
          <p className="text-gray-700 mb-2">
            <strong>Todos los Domingos</strong>
          </p>
          <p className="text-gray-600 text-sm">
            Partidas casuales y torneos organizados
          </p>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
        <h3 className="text-purple-900 mb-4">Nuestros Valores</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🤝</div>
            <p className="text-gray-700">Juego Limpio</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-gray-700">Mejora Constante</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">❤️</div>
            <p className="text-gray-700">Espíritu de Comunidad</p>
          </div>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 mb-6">
        <div className="text-center mb-4">
          <h3 className="text-white mb-2">¡Seguinos en Instagram!</h3>
          <p className="text-blue-100 text-sm">
            Escaneá el código QR para estar al día con novedades, torneos y la comunidad
          </p>
        </div>
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-2xl">
            <ImageWithFallback 
              src={instagramQR} 
              alt="Instagram QR - Dojo X" 
              className="w-64 h-64 object-contain"
            />
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="text-white">
            <strong>@DOJOX.ARG</strong>
          </p>
        </div>
      </div>

      {/* TikTok Section */}
      <div className="bg-gradient-to-br from-gray-900 via-pink-900 to-cyan-900 rounded-xl p-6 mb-6">
        <div className="text-center mb-4">
          <h3 className="text-white mb-2">¡Mirá nuestros videos en TikTok!</h3>
          <p className="text-pink-100 text-sm">
            Escaneá el código QR para ver batallas, torneos y contenido exclusivo
          </p>
        </div>
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-2xl">
            <ImageWithFallback 
              src={tiktokQR} 
              alt="TikTok QR - Yomotsu Dojo X" 
              className="w-64 h-64 object-contain"
            />
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="text-white">
            <strong>@yomotsu.dojox</strong>
          </p>
        </div>
      </div>

      {/* Sponsors Section */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-400 rounded-2xl p-8 mb-6">
        <div className="text-center mb-6">
          <h3 className="text-yellow-400 mb-2">Nuestros Sponsors</h3>
          <p className="text-gray-300 text-sm">
            Gracias por hacer posible nuestra comunidad
          </p>
        </div>

        {/* Yomotsu Beystore Sponsor */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <div className="flex justify-center mb-4">
            <ImageWithFallback 
              src={yomotsuLogo} 
              alt="Yomotsu Beystore Logo" 
              className="h-32 object-contain"
            />
          </div>
          <div className="text-center">
            <h4 className="text-gray-900 mb-2">Yomotsu Beystore</h4>
            <p className="text-gray-600 text-sm mb-4">
              Tu tienda de confianza para conseguir los mejores Beyblades
            </p>
          </div>
        </div>

        {/* Yomotsu WhatsApp QR */}
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-6">
          <div className="text-center mb-4">
            <h4 className="text-white mb-2">¡Contactá a Yomotsu por WhatsApp!</h4>
            <p className="text-white/90 text-sm">
              Escaneá el código QR para ver productos y hacer pedidos
            </p>
          </div>
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-2xl">
              <ImageWithFallback 
                src={whatsappQR} 
                alt="Yomotsu Beystore WhatsApp QR" 
                className="w-64 h-64 object-contain"
              />
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-white">
              <strong>YOMOTSU BEYSTORE</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-blue-500 text-white rounded-xl p-6 text-center">
        <p className="text-xl mb-2">¡Te esperamos en el estadio! 🎯</p>
        <p className="text-blue-100">
          Comunicate con nosotros o simplemente aparecé un domingo con tu beyblade
        </p>
      </div>

      <div className="mt-8 text-center">
        <CafecitoButton />
      </div>
    </div>
  );
}
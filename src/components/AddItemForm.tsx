import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type ItemType = 'blade' | 'ratchet' | 'bit' | 'lock-chip' | 'main-blade' | 'assist-blade';

interface AddItemFormProps {
  onSubmit: (item: {
    id: string;
    name: string;
    type: ItemType;
    imageUrl?: string;
  }) => void;
  onCancel: () => void;
}

export function AddItemForm({ onSubmit, onCancel }: AddItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'blade' as ItemType,
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageDataUrl = formData.imageUrl;

    // If user uploaded a file, convert to base64
    if (imageFile) {
      const reader = new FileReader();
      imageDataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }

    const newItem = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      type: formData.type,
      imageUrl: imageDataUrl,
    };

    onSubmit(newItem);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-green-50 p-6 rounded-xl mb-6">
      <h3 className="mb-4">Agregar Pieza al Catálogo Global</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Nombre de la pieza"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
          autoFocus
        />
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as ItemType })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="blade">Blade</option>
          <option value="ratchet">Ratchet</option>
          <option value="bit">Bit</option>
          <option value="lock-chip">Lock Chip</option>
          <option value="main-blade">Main Blade</option>
          <option value="assist-blade">Assist Blade</option>
        </select>
      </div>
      
      {/* Image Upload */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm mb-2">Imagen de la pieza (opcional):</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-4">
          <p className="text-gray-700 text-sm mb-2">Vista previa:</p>
          <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            <ImageWithFallback
              src={imagePreview}
              alt="Vista previa"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

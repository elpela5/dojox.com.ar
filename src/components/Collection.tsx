import { useState, useEffect, memo } from 'react';
import { Package, Plus, Search, Trash2, Edit2, Save, X, Image as ImageIcon, Layers, Upload } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useSync } from '../contexts/SyncContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DeckManager } from './DeckManager';
import { AddItemForm } from './AddItemForm';
import { CafecitoButton } from './CafecitoButton';

type ItemType = 'blade' | 'ratchet' | 'bit' | 'lock-chip' | 'main-blade' | 'assist-blade';

interface MasterItem {
  id: string;
  name: string;
  type: ItemType;
  imageUrl?: string;
}

interface UserItem {
  itemId: string;
  quantity: number;
}

// Beyblade can be one of two configurations
type BeybladeConfig = 
  | {
      type: 'standard';
      blade: string;
      ratchet: string;
      bit: string;
    }
  | {
      type: 'custom';
      lockChip: string;
      mainBlade: string;
      assistBlade: string;
      ratchet: string;
      bit: string;
    };

interface Deck {
  id: string;
  name: string;
  beyblades: BeybladeConfig[]; // 1-3 beyblades
}

type SubTab = 'collection' | 'deck';

function CollectionComponent() {
  const { user } = useUser();
  const { catalog, collection, decks, saveCatalog, saveCollection, saveDecks, loadDecksFromServer, loadCollectionFromServer, setAutoRefreshEnabled } = useSync();
  const [subTab, setSubTab] = useState<SubTab>('collection');
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadType, setBulkUploadType] = useState<ItemType>('blade');
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'blade' as ItemType,
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  // DISABLE auto-refresh when this component mounts
  useEffect(() => {
    setAutoRefreshEnabled(false);
    return () => {
      setAutoRefreshEnabled(true); // Re-enable when unmounting
    };
  }, [setAutoRefreshEnabled]);

  // Initialize state from context on mount (one-time only)
  useEffect(() => {
    setMasterItems(catalog || []);
    setUserItems(collection || []);
    setUserDecks(decks || []);
  }, [catalog, collection, decks]); // Update when context changes

  // Load collection and decks on mount (manual load, not real-time)
  useEffect(() => {
    if (user) {
      loadCollectionFromServer();
      loadDecksFromServer();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save user collection
  const saveUserCollection = async (items: UserItem[]) => {
    if (!user) return;
    setUserItems(items);
    await saveCollection(items);
  };

  // Save master items (admin only)
  const saveMasterItems = async (items: MasterItem[]) => {
    setMasterItems(items);
    await saveCatalog(items);
  };

  // Add new item to master catalog (admin only)
  const addMasterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    let imageDataUrl = formData.imageUrl;

    // If user uploaded a file, convert to base64
    if (imageFile) {
      const reader = new FileReader();
      imageDataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }

    const newItem: MasterItem = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      type: formData.type,
      imageUrl: imageDataUrl,
    };

    const updated = [...masterItems, newItem];
    saveMasterItems(updated);
    setFormData({ name: '', type: 'blade', imageUrl: '' });
    setImageFile(null);
    setImagePreview('');
    setShowAddForm(false);
  };

  // Delete item from master catalog (admin only)
  const deleteMasterItem = (id: string) => {
    if (!isAdmin) return;
    if (!confirm('¿Eliminar esta pieza del catálogo? Se eliminará de todas las colecciones de usuarios.')) return;

    const updated = masterItems.filter(item => item.id !== id);
    saveMasterItems(updated);

    // Also remove from all users' collections
    // For now, just remove from current user
    const updatedUserItems = userItems.filter(ui => ui.itemId !== id);
    saveUserCollection(updatedUserItems);
  };

  // Update quantity in user's collection
  const updateQuantity = (itemId: string, quantity: number) => {
    if (!user) return;
    
    const qty = Math.max(0, quantity);
    
    if (qty === 0) {
      // Remove item if quantity is 0
      const updated = userItems.filter(ui => ui.itemId !== itemId);
      saveUserCollection(updated);
    } else {
      // Update or add item
      const existingIndex = userItems.findIndex(ui => ui.itemId === itemId);
      if (existingIndex >= 0) {
        const updated = [...userItems];
        updated[existingIndex] = { itemId, quantity: qty };
        saveUserCollection(updated);
      } else {
        const updated = [...userItems, { itemId, quantity: qty }];
        saveUserCollection(updated);
      }
    }
  };

  // Quick add/subtract
  const addOne = (itemId: string) => {
    const current = userItems.find(ui => ui.itemId === itemId);
    updateQuantity(itemId, (current?.quantity || 0) + 1);
  };

  const subtractOne = (itemId: string) => {
    const current = userItems.find(ui => ui.itemId === itemId);
    if (current && current.quantity > 0) {
      updateQuantity(itemId, current.quantity - 1);
    }
  };

  // Start editing
  const startEdit = (itemId: string) => {
    const current = userItems.find(ui => ui.itemId === itemId);
    setEditingItem(itemId);
    setEditQuantity((current?.quantity || 0).toString());
  };

  // Save edit
  const saveEdit = () => {
    if (!editingItem) return;
    const qty = parseInt(editQuantity) || 0;
    updateQuantity(editingItem, qty);
    setEditingItem(null);
    setEditQuantity('');
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingItem(null);
    setEditQuantity('');
  };

  // Get user quantity for an item
  const getUserQuantity = (itemId: string): number => {
    const userItem = userItems.find(ui => ui.itemId === itemId);
    return userItem?.quantity || 0;
  };

  // Handle bulk upload (admin only)
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || bulkFiles.length === 0) return;

    setIsUploading(true);

    try {
      const newItems: MasterItem[] = [];

      // Process each file
      for (const file of bulkFiles) {
        // Get file name without extension
        const fileName = file.name.replace(/\.[^/.]+$/, '');

        // Convert image to base64
        const reader = new FileReader();
        const imageDataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Create new item
        const newItem: MasterItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: fileName,
          type: bulkUploadType,
          imageUrl: imageDataUrl,
        };

        newItems.push(newItem);
      }

      // Save all new items at once
      const updated = [...masterItems, ...newItems];
      await saveMasterItems(updated);

      // Reset form
      setBulkFiles([]);
      setBulkUploadType('blade');
      setShowBulkUpload(false);
      setIsUploading(false);

      alert(`✅ Se agregaron ${newItems.length} piezas al catálogo exitosamente.`);
    } catch (error) {
      console.error('Error uploading items:', error);
      alert('❌ Error al cargar las piezas. Intenta de nuevo.');
      setIsUploading(false);
    }
  };

  // Handle file selection for bulk upload
  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBulkFiles(Array.from(e.target.files));
    }
  };

  // Filter items
  const filteredItems = masterItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  // Sort items by type and name
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.type !== b.type) {
      const typeOrder: ItemType[] = ['blade', 'ratchet', 'bit', 'lock-chip', 'main-blade', 'assist-blade'];
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    }
    return a.name.localeCompare(b.name);
  });

  // Calculate stats
  const stats = {
    totalItems: masterItems.length,
    ownedItems: userItems.filter(ui => ui.quantity > 0).length,
    totalQuantity: userItems.reduce((sum, ui) => sum + ui.quantity, 0),
    blades: masterItems.filter(i => i.type === 'blade').length,
    ratchets: masterItems.filter(i => i.type === 'ratchet').length,
    bits: masterItems.filter(i => i.type === 'bit').length,
    lockChips: masterItems.filter(i => i.type === 'lock-chip').length,
    mainBlades: masterItems.filter(i => i.type === 'main-blade').length,
    assistBlades: masterItems.filter(i => i.type === 'assist-blade').length,
  };

  const typeIcons: Record<ItemType, string> = {
    'blade': '⚔️',
    'ratchet': '⚙️',
    'bit': '🔩',
    'lock-chip': '🔒',
    'main-blade': '⭐',
    'assist-blade': '✨',
  };

  const typeNames: Record<ItemType, string> = {
    'blade': 'Blade',
    'ratchet': 'Ratchet',
    'bit': 'Bit',
    'lock-chip': 'Lock Chip',
    'main-blade': 'Main Blade',
    'assist-blade': 'Assist Blade',
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Inicia sesión para ver tu colección</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSubTab('collection')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
            subTab === 'collection'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Package className="w-5 h-5" />
          Colección
        </button>
        <button
          onClick={() => setSubTab('deck')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
            subTab === 'deck'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Layers className="w-5 h-5" />
          Decks
        </button>
      </div>

      {/* Render content based on sub-tab */}
      {subTab === 'collection' ? (
        <div>
          {/* Stats, Forms, and Collection List */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-green-500" />
              <div>
                <h2>Mi Colección</h2>
                <p className="text-gray-600">
                  {stats.ownedItems} tipos diferentes • {stats.totalQuantity} unidades totales
                </p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Agregar al Catálogo</span>
                </button>
                <button
                  onClick={() => setShowBulkUpload(!showBulkUpload)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="hidden sm:inline">Carga Masiva</span>
                </button>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-green-900 mb-1">Colección Personal</h3>
                <p className="text-green-800 text-sm">
                  Esta es tu colección individual. {isAdmin ? 'Como administrador, puedes agregar nuevas piezas al catálogo global.' : 'Rastrea cuántas unidades tienes de cada pieza.'}
                </p>
                {isAdmin && (
                  <p className="text-green-700 text-xs mt-2">
                    ⚠️ El catálogo está vacío. Agrega las piezas que desees trackear.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl text-center">
              <p className="text-gray-600 text-sm">Catálogo</p>
              <p className="text-blue-900">{stats.totalItems}</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl text-center">
              <p className="text-gray-600 text-sm">Obtenidos</p>
              <p className="text-green-900">{stats.ownedItems}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-xl text-center">
              <p className="text-gray-600 text-sm">Blades</p>
              <p className="text-purple-900">{stats.blades}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-xl text-center">
              <p className="text-gray-600 text-sm">Ratchets</p>
              <p className="text-orange-900">{stats.ratchets}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-100 to-pink-200 p-4 rounded-xl text-center">
              <p className="text-gray-600 text-sm">Bits</p>
              <p className="text-pink-900">{stats.bits}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-4 rounded-xl text-center">
              <p className="text-gray-600 text-sm">Lock Chips</p>
              <p className="text-yellow-900">{stats.lockChips}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 p-4 rounded-xl text-center">
              <p className="text-gray-600 text-sm">Main Blades</p>
              <p className="text-indigo-900">{stats.mainBlades}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-100 to-cyan-200 p-4 rounded-xl text-center">
              <p className="text-gray-600 text-sm">Assist Blades</p>
              <p className="text-cyan-900">{stats.assistBlades}</p>
            </div>
          </div>

          {/* Add Form (Admin Only) */}
          {showAddForm && isAdmin && (
            <AddItemForm
              onSubmit={(newItem) => {
                const updated = [...masterItems, newItem];
                saveMasterItems(updated);
                setShowAddForm(false);
              }}
              onCancel={() => {
                setShowAddForm(false);
              }}
            />
          )}

          {/* Bulk Upload Form (Admin Only) */}
          {showBulkUpload && isAdmin && (
            <form onSubmit={handleBulkUpload} className="bg-blue-50 p-6 rounded-xl mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
                <h3 className="text-blue-900">Carga Masiva de Piezas</h3>
              </div>
              
              <p className="text-blue-800 text-sm mb-4">
                Selecciona múltiples imágenes y el tipo de pieza. Los nombres se generarán automáticamente desde los nombres de archivo.
              </p>

              {/* File Input */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Selecciona imágenes:</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBulkFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {bulkFiles.length > 0 && (
                  <p className="text-sm text-blue-700 mt-2">
                    ✓ {bulkFiles.length} archivo(s) seleccionado(s)
                  </p>
                )}
              </div>

              {/* Type Selector */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Tipo de pieza:</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkUploadType('blade')}
                    className={`px-4 py-3 rounded-lg transition-colors ${
                      bulkUploadType === 'blade'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    ⚔️ Blade
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkUploadType('ratchet')}
                    className={`px-4 py-3 rounded-lg transition-colors ${
                      bulkUploadType === 'ratchet'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    ⚙️ Ratchet
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkUploadType('bit')}
                    className={`px-4 py-3 rounded-lg transition-colors ${
                      bulkUploadType === 'bit'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    🔩 Bit
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkUploadType('lock-chip')}
                    className={`px-4 py-3 rounded-lg transition-colors ${
                      bulkUploadType === 'lock-chip'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    🔒 Lock Chip
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkUploadType('main-blade')}
                    className={`px-4 py-3 rounded-lg transition-colors ${
                      bulkUploadType === 'main-blade'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    ⭐ Main Blade
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkUploadType('assist-blade')}
                    className={`px-4 py-3 rounded-lg transition-colors ${
                      bulkUploadType === 'assist-blade'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    ✨ Assist Blade
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isUploading || bulkFiles.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? '⏳ Cargando...' : `✓ Cargar ${bulkFiles.length} Pieza(s)`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkUpload(false);
                    setBulkFiles([]);
                    setBulkUploadType('blade');
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Filters */}
          <CollectionFiltersAndGrid
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            sortedItems={sortedItems}
            getUserQuantity={getUserQuantity}
            editingItem={editingItem}
            editQuantity={editQuantity}
            setEditQuantity={setEditQuantity}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            addOne={addOne}
            subtractOne={subtractOne}
            deleteMasterItem={deleteMasterItem}
            isAdmin={isAdmin}
            typeIcons={typeIcons}
            typeNames={typeNames}
            masterItems={masterItems}
          />
        </div>
      ) : (
        <DeckManager />
      )}

      <div className="mt-8 text-center">
        <CafecitoButton />
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const Collection = memo(CollectionComponent);

// Helper component for filters and grid
function CollectionFiltersAndGrid({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  sortedItems,
  getUserQuantity,
  editingItem,
  editQuantity,
  setEditQuantity,
  startEdit,
  saveEdit,
  cancelEdit,
  addOne,
  subtractOne,
  deleteMasterItem,
  isAdmin,
  typeIcons,
  typeNames,
  masterItems,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  sortedItems: MasterItem[];
  getUserQuantity: (itemId: string) => number;
  editingItem: string | null;
  editQuantity: string;
  setEditQuantity: (quantity: string) => void;
  startEdit: (itemId: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  addOne: (itemId: string) => void;
  subtractOne: (itemId: string) => void;
  deleteMasterItem: (id: string) => void;
  isAdmin: boolean;
  typeIcons: Record<ItemType, string>;
  typeNames: Record<ItemType, string>;
  masterItems: MasterItem[];
}) {
  return (
    <>
      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar piezas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterType('blade')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'blade'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ⚔️ Blades
          </button>
          <button
            onClick={() => setFilterType('ratchet')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'ratchet'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ⚙️ Ratchets
          </button>
          <button
            onClick={() => setFilterType('bit')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'bit'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔩 Bits
          </button>
          <button
            onClick={() => setFilterType('lock-chip')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'lock-chip'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔒 Lock Chips
          </button>
          <button
            onClick={() => setFilterType('main-blade')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'main-blade'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ⭐ Main Blades
          </button>
          <button
            onClick={() => setFilterType('assist-blade')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'assist-blade'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ✨ Assist Blades
          </button>
        </div>
      </div>

      {/* Collection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedItems.map((item) => {
          const quantity = getUserQuantity(item.id);
          const isEditing = editingItem === item.id;

          return (
            <div
              key={item.id}
              className={`relative rounded-xl border-2 transition-all overflow-hidden ${
                quantity > 0
                  ? 'bg-white border-green-400'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              {/* Image Section */}
              <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                {item.imageUrl ? (
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Sin imagen</p>
                  </div>
                )}
                {/* Quantity Badge */}
                {quantity > 0 && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full shadow-lg">
                    <p className="text-sm">×{quantity}</p>
                  </div>
                )}
                {/* Admin Delete Button */}
                {isAdmin && (
                  <button
                    onClick={() => deleteMasterItem(item.id)}
                    className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    title="Eliminar del catálogo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Info Section */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{typeIcons[item.type]}</span>
                  <div className="flex-1">
                    <p className="text-gray-900">{item.name}</p>
                    <p className="text-gray-600 text-sm">{typeNames[item.type]}</p>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
                        title="Guardar"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-400"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => subtractOne(item.id)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity === 0}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <p className="text-2xl text-gray-900">{quantity}</p>
                        <p className="text-gray-600 text-xs">unidades</p>
                      </div>
                      <button
                        onClick={() => addOne(item.id)}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => startEdit(item.id)}
                        className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                        title="Editar cantidad"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
          {masterItems.length === 0 ? (
            <div>
              <p className="mb-2">El catálogo está vacío.</p>
              {isAdmin && (
                <p className="text-sm">Usa el botón "Agregar al Catálogo" para empezar.</p>
              )}
            </div>
          ) : (
            <p>No se encontraron piezas con estos filtros</p>
          )}
        </div>
      )}
    </>
  );
}
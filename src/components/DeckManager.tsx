import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useSync } from '../contexts/SyncContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

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

export function DeckManager() {
  const { user } = useUser();
  const { getCatalog, getCollection, getDecks, saveDecks } = useSync();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeck, setEditingDeck] = useState<string | null>(null);
  const [deckForm, setDeckForm] = useState({
    name: '',
    beyblades: [] as BeybladeConfig[],
  });

  // Load master items
  useEffect(() => {
    const catalog = getCatalog();
    if (catalog) {
      setMasterItems(catalog);
    } else {
      const saved = localStorage.getItem('beyblade-master-items');
      if (saved) {
        setMasterItems(JSON.parse(saved));
      }
    }
  }, [getCatalog]);

  // Auto-refresh catalog every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const catalog = getCatalog();
      if (catalog) {
        setMasterItems(catalog);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [getCatalog]);

  // Load user's collection
  useEffect(() => {
    if (!user) return;
    const collection = getCollection();
    if (collection) {
      setUserItems(collection);
    } else {
      const saved = localStorage.getItem(`user-collection-${user.id}`);
      if (saved) {
        setUserItems(JSON.parse(saved));
      }
    }
  }, [user, getCollection]);

  // Auto-refresh collection every 2 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const collection = getCollection();
      if (collection) {
        setUserItems(collection);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user, getCollection]);

  // Load user's decks
  useEffect(() => {
    if (!user) return;
    const userDecks = getDecks();
    if (userDecks) {
      setDecks(userDecks);
    } else {
      const saved = localStorage.getItem(`user-decks-${user.id}`);
      if (saved) {
        setDecks(JSON.parse(saved));
      }
    }
  }, [user, getDecks]);

  // Auto-refresh decks every 2 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const userDecks = getDecks();
      if (userDecks) {
        setDecks(userDecks);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user, getDecks]);

  const getItem = (itemId: string): MasterItem | undefined => {
    return masterItems.find(item => item.id === itemId);
  };

  const getUserQuantity = (itemId: string): number => {
    const userItem = userItems.find(ui => ui.itemId === itemId);
    return userItem?.quantity || 0;
  };

  const getAvailableItems = (type: ItemType): MasterItem[] => {
    return masterItems.filter(item => item.type === type && getUserQuantity(item.id) > 0);
  };

  const addBeyblade = () => {
    if (deckForm.beyblades.length >= 3) {
      alert('Un deck puede tener máximo 3 Beyblades');
      return;
    }
    const newBeyblade: BeybladeConfig = {
      type: 'standard',
      blade: '',
      ratchet: '',
      bit: '',
    };
    setDeckForm({
      ...deckForm,
      beyblades: [...deckForm.beyblades, newBeyblade],
    });
  };

  const removeBeyblade = (index: number) => {
    const updated = deckForm.beyblades.filter((_, i) => i !== index);
    setDeckForm({ ...deckForm, beyblades: updated });
  };

  const updateBeyblade = (index: number, updated: BeybladeConfig) => {
    const newBeyblades = [...deckForm.beyblades];
    newBeyblades[index] = updated;
    setDeckForm({ ...deckForm, beyblades: newBeyblades });
  };

  const toggleBeybladeType = (index: number) => {
    const current = deckForm.beyblades[index];
    if (current.type === 'standard') {
      const advanced: BeybladeConfig = {
        type: 'custom',
        lockChip: '',
        mainBlade: '',
        assistBlade: '',
        ratchet: '',
        bit: '',
      };
      updateBeyblade(index, advanced);
    } else {
      const standard: BeybladeConfig = {
        type: 'standard',
        blade: '',
        ratchet: '',
        bit: '',
      };
      updateBeyblade(index, standard);
    }
  };

  const saveDeck = () => {
    if (!deckForm.name.trim()) {
      alert('El deck necesita un nombre');
      return;
    }
    if (deckForm.beyblades.length === 0) {
      alert('El deck debe tener al menos 1 Beyblade');
      return;
    }

    // Validate all beyblades have at least one piece selected
    for (const beyblade of deckForm.beyblades) {
      if (beyblade.type === 'standard') {
        // At least one piece must be selected
        if (!beyblade.blade && !beyblade.ratchet && !beyblade.bit) {
          alert('Cada Beyblade debe tener al menos una pieza seleccionada');
          return;
        }
      } else {
        // At least one piece must be selected
        if (!beyblade.lockChip && !beyblade.mainBlade && !beyblade.assistBlade && !beyblade.ratchet && !beyblade.bit) {
          alert('Cada Beyblade debe tener al menos una pieza seleccionada');
          return;
        }
      }
    }

    if (editingDeck) {
      // Update existing deck
      const updated = decks.map(d => d.id === editingDeck ? { ...deckForm, id: editingDeck } : d);
      saveDecks(updated);
      setEditingDeck(null);
    } else {
      // Create new deck
      if (decks.length >= 10) {
        alert('Solo puedes tener hasta 10 decks guardados');
        return;
      }
      const newDeck: Deck = {
        id: Date.now().toString(),
        name: deckForm.name,
        beyblades: deckForm.beyblades,
      };
      saveDecks([...decks, newDeck]);
    }

    setDeckForm({ name: '', beyblades: [] });
    setShowAddForm(false);
  };

  const startEdit = (deck: Deck) => {
    setEditingDeck(deck.id);
    setDeckForm({
      name: deck.name,
      beyblades: deck.beyblades,
    });
    setShowAddForm(true);
  };

  const deleteDeck = (id: string) => {
    if (!confirm('¿Eliminar este deck?')) return;
    saveDecks(decks.filter(d => d.id !== id));
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingDeck(null);
    setDeckForm({ name: '', beyblades: [] });
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Layers className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Inicia sesión para gestionar tus decks</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Layers className="w-8 h-8 text-purple-500" />
          <div>
            <h2>Mis Decks</h2>
            <p className="text-gray-600">
              {decks.length} de 10 decks • Cada deck puede tener 1-3 Beyblades
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={decks.length >= 10}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nuevo Deck</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-purple-900 mb-1">Organiza tus Decks de Competencia</h3>
            <p className="text-purple-800 text-sm mb-2">
              Crea hasta 10 decks diferentes. Cada deck puede tener entre 1 y 3 Beyblades.
            </p>
            <p className="text-purple-700 text-xs">
              <strong>Configuración Standard:</strong> Blade, Ratchet y/o Bit (al menos una pieza)<br />
              <strong>Configuración Custom:</strong> Lock Chip, Main Blade, Assist Blade, Ratchet y/o Bit (al menos una pieza)<br />
              <strong>💡 Nota:</strong> Puedes armar Beyblades parciales (ej: solo Blade + Ratchet) para piezas que ocupan múltiples slots
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-purple-50 p-6 rounded-xl mb-6 border-2 border-purple-200">
          <h3 className="mb-4">{editingDeck ? 'Editar Deck' : 'Nuevo Deck'}</h3>
          
          {/* Deck Name */}
          <input
            type="text"
            placeholder="Nombre del deck"
            value={deckForm.name}
            onChange={(e) => setDeckForm({ ...deckForm, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
          />

          {/* Beyblades */}
          <div className="space-y-4 mb-4">
            {deckForm.beyblades.map((beyblade, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border-2 border-purple-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-purple-900">Beyblade {index + 1}</h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBeybladeType(index)}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      {beyblade.type === 'standard' ? 'Cambiar a Custom' : 'Cambiar a Standard'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBeyblade(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {beyblade.type === 'standard' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      value={beyblade.blade}
                      onChange={(e) => updateBeyblade(index, { ...beyblade, blade: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Seleccionar Blade</option>
                      {getAvailableItems('blade').map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <select
                      value={beyblade.ratchet}
                      onChange={(e) => updateBeyblade(index, { ...beyblade, ratchet: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Seleccionar Ratchet</option>
                      {getAvailableItems('ratchet').map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <select
                      value={beyblade.bit}
                      onChange={(e) => updateBeyblade(index, { ...beyblade, bit: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Seleccionar Bit</option>
                      {getAvailableItems('bit').map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <select
                      value={beyblade.lockChip}
                      onChange={(e) => updateBeyblade(index, { ...beyblade, lockChip: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Lock Chip</option>
                      {getAvailableItems('lock-chip').map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <select
                      value={beyblade.mainBlade}
                      onChange={(e) => updateBeyblade(index, { ...beyblade, mainBlade: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Main Blade</option>
                      {getAvailableItems('main-blade').map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <select
                      value={beyblade.assistBlade}
                      onChange={(e) => updateBeyblade(index, { ...beyblade, assistBlade: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Assist Blade</option>
                      {getAvailableItems('assist-blade').map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <select
                      value={beyblade.ratchet}
                      onChange={(e) => updateBeyblade(index, { ...beyblade, ratchet: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Ratchet</option>
                      {getAvailableItems('ratchet').map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <select
                      value={beyblade.bit}
                      onChange={(e) => updateBeyblade(index, { ...beyblade, bit: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Bit</option>
                      {getAvailableItems('bit').map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addBeyblade}
            disabled={deckForm.beyblades.length >= 3}
            className="w-full mb-4 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Agregar Beyblade ({deckForm.beyblades.length}/3)
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveDeck}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              {editingDeck ? 'Actualizar' : 'Guardar'} Deck
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Decks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decks.map((deck) => (
          <div key={deck.id} className="bg-white border-2 border-purple-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-purple-900">{deck.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(deck)}
                  className="text-blue-500 hover:text-blue-700 p-2"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteDeck(deck.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {deck.beyblades.map((beyblade, index) => (
                <div key={index} className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-purple-900 mb-2">
                    <strong>Beyblade {index + 1}</strong> ({beyblade.type === 'standard' ? 'Standard' : 'Custom'})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {beyblade.type === 'standard' ? (
                      <>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Blade</p>
                          {beyblade.blade && getItem(beyblade.blade)?.imageUrl ? (
                            <div className="relative w-full h-16 bg-gray-200 rounded overflow-hidden">
                              <ImageWithFallback
                                src={getItem(beyblade.blade)!.imageUrl!}
                                alt={getItem(beyblade.blade)!.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center">
                              <p className="text-xs text-gray-500">⚔️</p>
                            </div>
                          )}
                          <p className="text-xs mt-1">{getItem(beyblade.blade)?.name}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Ratchet</p>
                          {beyblade.ratchet && getItem(beyblade.ratchet)?.imageUrl ? (
                            <div className="relative w-full h-16 bg-gray-200 rounded overflow-hidden">
                              <ImageWithFallback
                                src={getItem(beyblade.ratchet)!.imageUrl!}
                                alt={getItem(beyblade.ratchet)!.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center">
                              <p className="text-xs text-gray-500">⚙️</p>
                            </div>
                          )}
                          <p className="text-xs mt-1">{getItem(beyblade.ratchet)?.name}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Bit</p>
                          {beyblade.bit && getItem(beyblade.bit)?.imageUrl ? (
                            <div className="relative w-full h-16 bg-gray-200 rounded overflow-hidden">
                              <ImageWithFallback
                                src={getItem(beyblade.bit)!.imageUrl!}
                                alt={getItem(beyblade.bit)!.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center">
                              <p className="text-xs text-gray-500">🔩</p>
                            </div>
                          )}
                          <p className="text-xs mt-1">{getItem(beyblade.bit)?.name}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center col-span-3 grid grid-cols-5 gap-2">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Lock Chip</p>
                            {beyblade.lockChip && getItem(beyblade.lockChip)?.imageUrl ? (
                              <div className="relative w-full h-16 bg-gray-200 rounded overflow-hidden">
                                <ImageWithFallback
                                  src={getItem(beyblade.lockChip)!.imageUrl!}
                                  alt={getItem(beyblade.lockChip)!.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center">
                                <p className="text-xs text-gray-500">🔒</p>
                              </div>
                            )}
                            <p className="text-xs mt-1">{getItem(beyblade.lockChip)?.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Main</p>
                            {beyblade.mainBlade && getItem(beyblade.mainBlade)?.imageUrl ? (
                              <div className="relative w-full h-16 bg-gray-200 rounded overflow-hidden">
                                <ImageWithFallback
                                  src={getItem(beyblade.mainBlade)!.imageUrl!}
                                  alt={getItem(beyblade.mainBlade)!.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center">
                                <p className="text-xs text-gray-500">⭐</p>
                              </div>
                            )}
                            <p className="text-xs mt-1">{getItem(beyblade.mainBlade)?.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Assist</p>
                            {beyblade.assistBlade && getItem(beyblade.assistBlade)?.imageUrl ? (
                              <div className="relative w-full h-16 bg-gray-200 rounded overflow-hidden">
                                <ImageWithFallback
                                  src={getItem(beyblade.assistBlade)!.imageUrl!}
                                  alt={getItem(beyblade.assistBlade)!.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center">
                                <p className="text-xs text-gray-500">✨</p>
                              </div>
                            )}
                            <p className="text-xs mt-1">{getItem(beyblade.assistBlade)?.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Ratchet</p>
                            {beyblade.ratchet && getItem(beyblade.ratchet)?.imageUrl ? (
                              <div className="relative w-full h-16 bg-gray-200 rounded overflow-hidden">
                                <ImageWithFallback
                                  src={getItem(beyblade.ratchet)!.imageUrl!}
                                  alt={getItem(beyblade.ratchet)!.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center">
                                <p className="text-xs text-gray-500">⚙️</p>
                              </div>
                            )}
                            <p className="text-xs mt-1">{getItem(beyblade.ratchet)?.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Bit</p>
                            {beyblade.bit && getItem(beyblade.bit)?.imageUrl ? (
                              <div className="relative w-full h-16 bg-gray-200 rounded overflow-hidden">
                                <ImageWithFallback
                                  src={getItem(beyblade.bit)!.imageUrl!}
                                  alt={getItem(beyblade.bit)!.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center">
                                <p className="text-xs text-gray-500">🔩</p>
                              </div>
                            )}
                            <p className="text-xs mt-1">{getItem(beyblade.bit)?.name}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {decks.length === 0 && !showAddForm && (
        <div className="text-center py-12 text-gray-500">
          <Layers className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="mb-2">No tienes decks creados</p>
          <p className="text-sm">Haz clic en "Nuevo Deck" para empezar</p>
        </div>
      )}
    </div>
  );
}
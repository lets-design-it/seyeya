import React, { useState } from 'react';
import { useRestaurant, MenuItem } from '../../hooks/useRestaurant';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Plus, Edit2, Trash2, X, ChefHat, DollarSign } from 'lucide-react';

export const MenuEditor: React.FC = () => {
  const { menu, addMenuItem, updateMenuItem, deleteMenuItem } = useRestaurant();

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuItem['category']>('Local Food');
  const [priceUGX, setPriceUGX] = useState<number>(10000);
  const [priceUSD, setPriceUSD] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Active Category tab
  const [activeCategory, setActiveCategory] = useState<MenuItem['category']>('Local Food');

  // Selected item state for details drawer
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const openAddModal = () => {
    setEditItem(null);
    setName('');
    setCategory(activeCategory);
    setPriceUGX(15000);
    setPriceUSD(4);
    setDescription('');
    setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'); // generic food placeholder
    setIsOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditItem(item);
    setName(item.name);
    setCategory(item.category);
    setPriceUGX(item.priceUGX);
    setPriceUSD(item.priceUSD);
    setDescription(item.description);
    setImage(item.image);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const itemData = {
      name: name.trim(),
      category,
      priceUGX: Number(priceUGX),
      priceUSD: Number(priceUSD),
      description: description.trim(),
      image: image.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'
    };

    if (editItem) {
      updateMenuItem({
        ...itemData,
        id: editItem.id
      });
    } else {
      addMenuItem(itemData);
    }

    setActiveCategory(category);
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteMenuItem(id);
    setDeleteConfirmId(null);
    setSelectedItem(null);
  };

  const categories: MenuItem['category'][] = ['Local Food', 'Continental', 'Drinks', 'Desserts'];



  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-dark tracking-tight">Restaurant Menu Manager</h3>
          <p className="text-xs text-zinc-550">Create, adjust, and archive food or drink listings on the Nile Eatery checkout app.</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-zinc-800 text-white rounded-full px-5 py-2.5 text-xs font-bold shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Menu Item
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-zinc-100/60 rounded-2xl p-1.5 w-fit">
        {categories.map((cat) => {
          const itemsInCat = menu.filter((item) => item.category === cat);
          const count = itemsInCat.length;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#212121] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-foreground hover:bg-zinc-200/50'
              }`}
            >
              <span>{cat}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200/80 text-zinc-650'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of menu items for the active category */}
      <div>
        {(() => {
          const itemsInActiveCat = menu.filter((item) => item.category === activeCategory);

          if (itemsInActiveCat.length === 0) {
            return (
              <div className="text-center py-16 bg-white rounded-[24px] shadow-sm">
                <ChefHat className="h-8 w-8 mx-auto text-zinc-400 mb-2.5 animate-pulse" />
                <h5 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">No menu items found</h5>
                <p className="text-xs text-zinc-550 mt-1 max-w-xs mx-auto">
                  There are no dishes or drinks registered under "{activeCategory}" yet.
                </p>
                <Button 
                  onClick={openAddModal}
                  className="mt-4 flex items-center gap-1.5 mx-auto bg-primary hover:bg-zinc-850 text-white rounded-full px-4.5 py-2 text-xs font-bold shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First Item
                </Button>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {itemsInActiveCat.map((item) => (
                <Card 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className="p-3 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 bg-white"
                >
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="h-10 w-10 rounded-xl object-cover shrink-0 bg-zinc-100" 
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-foreground truncate leading-tight">{item.name}</h5>
                    <p className="text-[11px] font-bold text-violet-500 mt-1">
                      UGX {item.priceUGX.toLocaleString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Add / Edit Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 animate-fade-in backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md bg-card rounded-[24px] p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-zinc-100/60">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                {editItem ? 'Edit Menu Item' : 'New Menu Listing'}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-foreground rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Goat Stew"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MenuItem['category'])}
                    className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Image URL</label>
                  <input
                    type="url"
                    placeholder="Unsplash image URL..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Price (UGX)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    placeholder="e.g. 15000"
                    value={priceUGX}
                    onChange={(e) => setPriceUGX(Number(e.target.value))}
                    className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Price (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    required
                    placeholder="e.g. 4"
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(Number(e.target.value))}
                    className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Description</label>
                <textarea
                  placeholder="Describe ingredients, portion sizes, preparation styles..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="bg-transparent hover:bg-zinc-100 text-zinc-500 font-semibold px-4.5 py-2.5"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-zinc-800 text-white font-bold px-6 py-2.5 shadow-sm"
                >
                  {editItem ? 'Save Updates' : 'Add Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sliding Details Drawer Backdrop Overlay */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-30 bg-zinc-950/15 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSelectedItem(null)}
        />
      )}

      {/* Sliding Details Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-full sm:max-w-md bg-card shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          selectedItem ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedItem && (
          <div className="flex flex-col h-full font-sans">
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-6 bg-zinc-50 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Menu Item Details</span>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-zinc-500 hover:text-foreground rounded-lg p-1.5 transition-colors focus:outline-none cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="h-32 w-32 rounded-[24px] object-cover bg-zinc-100 shadow-md"
                />
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-full bg-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {selectedItem.category}
                  </span>
                  <h4 className="text-base font-bold text-foreground mt-2 leading-tight">
                    {selectedItem.name}
                  </h4>
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-100/60 pt-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Description</span>
                  <p className="text-xs text-zinc-650 mt-1.5 leading-relaxed bg-zinc-50/50 p-4 rounded-[18px]">
                    {selectedItem.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-[18px] text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Price (UGX)</span>
                    <span className="font-bold text-foreground block">
                      UGX {selectedItem.priceUGX.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Price (USD)</span>
                    <span className="font-bold text-foreground block">
                      ${selectedItem.priceUSD}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 bg-zinc-50/50 border-t border-zinc-100/60 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setDeleteConfirmId(selectedItem.id)}
                className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-full text-xs font-bold text-red-500 hover:bg-red-550 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <Button
                onClick={() => {
                  openEditModal(selectedItem);
                  setSelectedItem(null);
                }}
                className="flex items-center justify-center gap-1.5 bg-primary hover:bg-zinc-800 text-white rounded-full px-5 py-2.5 text-xs font-bold shadow-sm"
              >
                <Edit2 className="h-4 w-4" />
                Edit Item
              </Button>
            </div>
          </div>
        )}
      </div>


      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 animate-fade-in backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm bg-card rounded-[24px] p-6 text-center shadow-2xl">
            <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Delete Menu Item?</h4>
            <p className="text-xs text-zinc-550 mb-6">
              Are you sure you want to remove this dish? It will be archived and removed immediately from the client eatery checkout screen.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setDeleteConfirmId(null)}
                className="bg-transparent hover:bg-zinc-100 text-zinc-500 font-semibold px-4.5"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-red-500 hover:bg-red-650 text-white font-bold px-6"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MenuEditor;

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

  const openAddModal = () => {
    setEditItem(null);
    setName('');
    setCategory('Local Food');
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

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteMenuItem(id);
    setDeleteConfirmId(null);
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

      {/* Grid of menu items grouped by categories */}
      <div className="space-y-8">
        {categories.map((cat) => {
          const itemsInCat = menu.filter((item) => item.category === cat);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat} className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2 pl-1">
                <ChefHat className="h-4 w-4 text-primary" />
                {cat} ({itemsInCat.length})
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemsInCat.map((item) => (
                  <Card key={item.id} className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-16 w-16 rounded-[16px] object-cover shrink-0 bg-zinc-100" 
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-bold text-foreground truncate leading-tight">{item.name}</h5>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        <p className="text-xs font-bold text-violet-500 mt-2">
                          UGX {item.priceUGX.toLocaleString()} / ${item.priceUSD}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-zinc-100/50">
                      <button
                        onClick={() => openEditModal(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-650 hover:bg-zinc-100 transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-500 hover:bg-red-50/50 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
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

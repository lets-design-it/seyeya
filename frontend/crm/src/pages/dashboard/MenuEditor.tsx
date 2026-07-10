import React, { useState } from 'react';
import { useRestaurant, MenuItem } from '../../hooks/useRestaurant';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from '../../components/Button';
import { Button as ShadcnButton } from "@/components/ui/button";
import { Plus, Edit2, Trash2, X, ChefHat, DollarSign } from 'lucide-react';

export const MenuEditor: React.FC = () => {
  const { 
    menu, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem,
    categories,
    addCategory,
    updateCategory,
    deleteCategory 
  } = useRestaurant();

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Local Food');
  const [priceUGX, setPriceUGX] = useState<number>(10000);
  const [priceUSD, setPriceUSD] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [quantity, setQuantity] = useState<number>(100);
  const [allergenInfo, setAllergenInfo] = useState('');
  const [prepTime, setPrepTime] = useState<number>(15);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Category management form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryDesc, setEditingCategoryDesc] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Active Category tab
  const [activeCategory, setActiveCategory] = useState<string>('Local Food');

  // Selected item state for details drawer
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Fallback default active category if categories list changes
  React.useEffect(() => {
    if (categories.length > 0 && !categories.some(c => c.category_name === activeCategory)) {
      setActiveCategory(categories[0].category_name);
    }
  }, [categories, activeCategory]);

  const openAddModal = () => {
    setEditItem(null);
    setName('');
    setCategory(activeCategory);
    setPriceUGX(15000);
    setPriceUSD(4);
    setDescription('');
    setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'); // generic food placeholder
    setQuantity(100);
    setAllergenInfo('');
    setPrepTime(15);
    setIsAvailable(true);
    setIsActive(true);
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
    setQuantity(item.quantity ?? 100);
    setAllergenInfo(item.allergen_info ?? '');
    setPrepTime(item.preparation_time ?? 15);
    setIsAvailable(item.is_available ?? true);
    setIsActive(item.is_active ?? true);
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
      image: image.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
      quantity: Number(quantity),
      allergen_info: allergenInfo.trim(),
      preparation_time: Number(prepTime),
      is_available: isAvailable,
      is_active: isActive
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

  const categoryList = categories.map((c: any) => c.category_name);



  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-dark tracking-tight">Restaurant Menu Manager</h3>
          <p className="text-xs text-zinc-550">Create, adjust, and archive food or drink listings on the Nile Eatery checkout app.</p>
        </div>
        <div className="flex items-center gap-2">
          <ShadcnButton 
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer h-10 shadow-sm"
          >
            Manage Categories
          </ShadcnButton>
          <ShadcnButton 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-black! text-white! hover:bg-black/90! rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none"
          >
            <Plus className="h-4 w-4" />
            Add Menu Item
          </ShadcnButton>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-zinc-100/60 rounded-2xl p-1.5 w-fit">
        {categoryList.map((cat) => {
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
                <ShadcnButton 
                  onClick={openAddModal}
                  className="mt-4 flex items-center gap-1.5 mx-auto bg-black! text-white! hover:bg-black/90! rounded-xl px-4.5 py-2 text-xs font-bold cursor-pointer h-9 shadow-sm border-none"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First Item
                </ShadcnButton>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {itemsInActiveCat.map((item) => (
                <Card 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className="overflow-hidden hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 bg-white border border-zinc-150 flex flex-col justify-between"
                >
                  <div>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="h-44 w-full object-cover bg-zinc-100" 
                    />
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold text-zinc-900 line-clamp-1">{item.name}</CardTitle>
                      <CardDescription className="text-xs text-zinc-450 line-clamp-2 mt-1 leading-normal">
                        {item.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                  </div>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
                      <div className="text-xs font-extrabold text-zinc-900">
                        UGX {item.priceUGX.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-450 font-bold">
                        ${item.priceUSD.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Add / Edit Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
        <DrawerContent className="h-full overflow-y-auto w-full sm:max-w-lg">
          <DrawerHeader className="border-b border-zinc-150 pb-4">
            <DrawerTitle className="text-base font-bold">
              {editItem ? 'Edit Menu Item' : 'New Menu Listing'}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-zinc-500">
              Set ingredients, price categories, and stock numbers.
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 mb-1.5">Item Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Traditional Goat Stew"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955 cursor-pointer"
              >
                {categoryList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 mb-1.5">Image URL</label>
              <input
                type="url"
                placeholder="Unsplash image URL..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
              <p className="mt-1 text-[10px] text-zinc-400 leading-normal">
                Recommended: Landscape 1.6:1 ratio (e.g. 1200×750px). Ensure the food subject is centered so it isn't cropped.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 mb-1.5">Price (UGX) *</label>
              <input
                type="number"
                min={0}
                required
                placeholder="e.g. 15000"
                value={priceUGX}
                onChange={(e) => setPriceUGX(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 mb-1.5">Price (USD) *</label>
              <input
                type="number"
                min={0}
                step="0.1"
                required
                placeholder="e.g. 4"
                value={priceUSD}
                onChange={(e) => setPriceUSD(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 mb-1.5">Stock Quantity *</label>
              <input
                type="number"
                min={0}
                required
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 mb-1.5">Prep Time (mins)</label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 20"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 mb-1.5">Allergen Info</label>
              <input
                type="text"
                placeholder="e.g. Gluten, Nuts, Dairy"
                value={allergenInfo}
                onChange={(e) => setAllergenInfo(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 mb-1.5">Description</label>
              <textarea
                placeholder="Describe ingredients, portion sizes, preparation styles..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955 resize-none"
              />
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-650 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="rounded border-zinc-300 text-black focus:ring-black cursor-pointer h-4 w-4"
                />
                <span>Available for Order</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-650 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-300 text-black focus:ring-black cursor-pointer h-4 w-4"
                />
                <span>Active in Catalog</span>
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-2.5 border-t border-zinc-100">
              <ShadcnButton 
                type="button" 
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="font-semibold px-4.5 py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </ShadcnButton>
              <ShadcnButton 
                type="submit"
                className="bg-black! text-white! hover:bg-black/90! font-bold px-6 py-2.5 rounded-xl shadow-sm border-none cursor-pointer"
              >
                {editItem ? 'Save Updates' : 'Add Item'}
              </ShadcnButton>
            </div>
          </form>
        </DrawerContent>
      </Drawer>

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

                <div className="grid grid-cols-3 gap-4 bg-zinc-50/50 p-4 rounded-[18px] text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Stock</span>
                    <span className="font-bold text-foreground block">
                      {selectedItem.quantity ?? 0} units
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Prep Time</span>
                    <span className="font-bold text-foreground block">
                      {selectedItem.preparation_time ?? 0} mins
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Status</span>
                    <span className={`font-bold block ${selectedItem.is_available ? 'text-green-600' : 'text-red-500'}`}>
                      {selectedItem.is_available ? 'Available' : 'Sold Out'}
                    </span>
                  </div>
                </div>

                {selectedItem.allergen_info && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Allergen Info</span>
                    <div className="text-xs text-amber-700 bg-amber-50/60 border border-amber-100/50 p-3.5 rounded-[18px] mt-1.5 leading-relaxed font-semibold">
                      ⚠️ {selectedItem.allergen_info}
                    </div>
                  </div>
                )}
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
      {/* Category Manager Drawer */}
      <Drawer open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen} direction="right">
        <DrawerContent className="h-full overflow-y-auto w-full sm:max-w-lg">
          <DrawerHeader className="border-b border-zinc-150 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-base font-bold">Manage Menu Categories</DrawerTitle>
                <DrawerDescription className="text-xs text-zinc-500">Create, adjust, and archive menu groupings.</DrawerDescription>
              </div>
              <button 
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryError(null);
                  setEditingCategoryId(null);
                }}
                className="text-zinc-400 hover:text-zinc-700 rounded-lg p-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </DrawerHeader>

          <div className="p-5 space-y-6">
            {categoryError && (
              <div className="text-xs font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-150 flex items-center gap-2">
                ⚠️ {categoryError}
              </div>
            )}

            {/* Add Category Section */}
            <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100/50 space-y-3.5">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Add New Category</h4>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Local Desserts)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-foreground outline-hidden focus:border-zinc-955"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-foreground outline-hidden focus:border-zinc-955"
                />
              </div>
              <div className="flex justify-end">
                <ShadcnButton
                  onClick={async () => {
                    if (!newCategoryName.trim()) return;
                    setCategoryError(null);
                    try {
                      await addCategory(newCategoryName.trim(), newCategoryDesc.trim());
                      setNewCategoryName('');
                      setNewCategoryDesc('');
                    } catch (err: any) {
                      setCategoryError(err.message || 'Failed to create category');
                    }
                  }}
                  className="bg-black! text-white! hover:bg-black/90! font-bold px-4 py-2 rounded-xl text-xs shadow-sm border-none cursor-pointer"
                >
                  Add Category
                </ShadcnButton>
              </div>
            </div>

            {/* Categories List Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Existing Categories</h4>
              <div className="divide-y divide-zinc-100/80">
                {categories.map((cat: any) => {
                  const isEditing = editingCategoryId === cat.category_id;
                  const itemsInCat = menu.filter((item) => Number(item.category_id) === cat.category_id || item.category === cat.category_name);
                  const itemCount = itemsInCat.length;

                  return (
                    <div key={cat.category_id} className="py-3.5 flex flex-col gap-3 first:pt-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="w-full rounded-xl bg-white border border-zinc-200 px-3 py-2 text-xs text-foreground outline-hidden focus:border-zinc-955 font-semibold"
                          />
                          <input
                            type="text"
                            value={editingCategoryDesc}
                            onChange={(e) => setEditingCategoryDesc(e.target.value)}
                            className="w-full rounded-xl bg-white border border-zinc-200 px-3 py-2 text-xs text-foreground outline-hidden focus:border-zinc-955"
                          />
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{cat.category_name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 text-zinc-500">
                              {itemCount} items
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-zinc-450 mt-1 leading-relaxed">{cat.description}</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 justify-end">
                        {isEditing ? (
                          <>
                            <ShadcnButton
                              variant="outline"
                              onClick={() => setEditingCategoryId(null)}
                              className="text-zinc-500 hover:bg-zinc-50 text-xs px-3 py-1.5 font-semibold rounded-xl cursor-pointer"
                            >
                              Cancel
                            </ShadcnButton>
                            <ShadcnButton
                              onClick={async () => {
                                if (!editingCategoryName.trim()) return;
                                setCategoryError(null);
                                try {
                                  await updateCategory(cat.category_id, editingCategoryName.trim(), editingCategoryDesc.trim());
                                  setEditingCategoryId(null);
                                } catch (err: any) {
                                  setCategoryError(err.message || 'Failed to update category');
                                }
                              }}
                              className="bg-black! text-white! hover:bg-black/90! text-xs px-4 py-1.5 font-bold rounded-xl border-none cursor-pointer"
                            >
                              Save
                            </ShadcnButton>
                          </>
                        ) : (
                          <>
                            <ShadcnButton
                              variant="outline"
                              onClick={() => {
                                setEditingCategoryId(cat.category_id);
                                setEditingCategoryName(cat.category_name);
                                setEditingCategoryDesc(cat.description || '');
                                setCategoryError(null);
                              }}
                              className="text-zinc-700 hover:bg-zinc-50 text-xs px-3.5 py-1.5 font-bold rounded-xl cursor-pointer border border-zinc-200"
                            >
                              Edit
                            </ShadcnButton>
                            <ShadcnButton
                              onClick={async () => {
                                setCategoryError(null);
                                if (itemCount > 0) {
                                  setCategoryError(`Cannot delete category "${cat.category_name}" because it contains active menu items. Please delete or move the items first.`);
                                  return;
                                }
                                try {
                                  await deleteCategory(cat.category_id);
                                } catch (err: any) {
                                  setCategoryError(err.message || 'Failed to delete category');
                                }
                              }}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs px-3.5 py-1.5 font-bold rounded-xl cursor-pointer border border-red-500/20"
                            >
                              Delete
                            </ShadcnButton>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
export default MenuEditor;

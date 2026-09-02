import React, { useState, useMemo } from 'react';
import { useRoomAssets, RoomAmenity, autoDetectAmenityIcon, renderAssetIcon } from '@/hooks/useRoomAssets.tsx';
import { Card } from '@/components/ui/card';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input as ShadcnInput } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from '@/components/ui/drawer';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Sparkles, 
  X, 
  CheckCircle2, 
  RotateCcw,
  SlidersHorizontal,
  Layers
} from 'lucide-react';

const CATEGORIES: RoomAmenity['category'][] = [
  'Connectivity',
  'Comfort',
  'Wellness',
  'Food & Drink',
  'Views',
  'Entertainment',
  'Services',
  'General'
];

export const AmenitiesView: React.FC = () => {
  const { amenities, addAmenity, updateAmenity, deleteAmenity } = useRoomAssets();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<RoomAmenity | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RoomAmenity['category']>('Comfort');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Deletion confirm modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const detectedIcon = autoDetectAmenityIcon(name);

  const filteredAmenities = useMemo(() => {
    return amenities.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [amenities, searchTerm, filterCategory]);

  const openAddDrawer = () => {
    setEditingAmenity(null);
    setName('');
    setCategory('Comfort');
    setDescription('');
    setIsActive(true);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: RoomAmenity) => {
    setEditingAmenity(item);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description || '');
    setIsActive(item.isActive);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingAmenity) {
      updateAmenity(editingAmenity.id, {
        name: name.trim(),
        category,
        description: description.trim(),
        isActive
      });
    } else {
      addAmenity({
        name: name.trim(),
        category,
        description: description.trim(),
        isActive
      });
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteAmenity(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>Room & Cottage Amenities</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Configure catalog amenities with auto-assigned smart icons for room category assignment.
          </p>
        </div>

        <ShadcnButton
          onClick={openAddDrawer}
          className="flex items-center gap-2 bg-black! text-white! hover:bg-black/90! dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700! rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none"
        >
          <Plus className="h-4 w-4" />
          Add Amenity
        </ShadcnButton>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <ShadcnInput
                type="text"
                placeholder="Search amenities by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 pl-10 pr-4 text-xs text-foreground placeholder-zinc-500 outline-hidden"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'ALL'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                All ({amenities.length})
              </button>
              {CATEGORIES.map(cat => {
                const count = amenities.filter(a => a.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {(searchTerm || filterCategory !== 'ALL') && (
            <ShadcnButton
              onClick={() => { setSearchTerm(''); setFilterCategory('ALL'); }}
              variant="ghost"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </ShadcnButton>
          )}
        </div>
      </Card>

      {/* Amenity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAmenities.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl">
            <Sparkles className="h-8 w-8 mx-auto text-zinc-400 mb-2 animate-pulse" />
            <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No amenities found</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Try adjusting your search terms or add a new amenity.</p>
          </div>
        ) : (
          filteredAmenities.map(item => (
            <Card 
              key={item.id}
              className="p-5 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                      {renderAssetIcon(item.iconName, "h-5 w-5")}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                        {item.name}
                      </h4>
                      <Badge variant="outline" className="mt-1 text-[10px] font-bold px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700">
                        {item.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditDrawer(item)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      title="Edit Amenity"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      title="Delete Amenity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {item.description || 'No detailed description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px]">
                  Icon: <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{item.iconName}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  item.isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                }`}>
                  {item.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Right-Side Drawer Layout for Creating/Editing Amenity */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsDrawerOpen(false)} 
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl h-full flex flex-col z-10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {editingAmenity ? 'Update Room Amenity' : 'Add New Room Amenity'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Icons are automatically detected from the amenity title.
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 my-auto py-6">
              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Amenity Name *
                </label>
                <ShadcnInput
                  type="text"
                  required
                  placeholder="e.g. Free High-Speed Wi-Fi, Private Jacuzzi, Swimming Pool"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-10 px-3.5 text-xs text-foreground font-semibold"
                />
              </div>

              {/* Auto Icon Live Preview Box */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                    {renderAssetIcon(detectedIcon, "h-5 w-5")}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                      Auto-Assigned Icon
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-100">
                      {detectedIcon}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold italic">
                  Smart Match
                </span>
              </div>

              {/* Category Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RoomAmenity['category'])}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-10 px-3 py-2 text-xs text-foreground font-semibold cursor-pointer outline-hidden"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the amenity feature, usage rules, or guest benefits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-xs text-foreground font-medium outline-hidden"
                />
              </div>

              {/* Is Active Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Active in Catalog</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center gap-3">
                <ShadcnButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 rounded-xl h-10 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  className="flex-1 rounded-xl h-10 text-xs font-bold bg-black text-white dark:bg-zinc-800 dark:text-white cursor-pointer"
                >
                  {editingAmenity ? 'Save Changes' : 'Create Amenity'}
                </ShadcnButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <Card className="w-full max-w-sm p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Delete Amenity?</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Are you sure you want to remove this amenity from the managed room catalog?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <ShadcnButton
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </ShadcnButton>
              <ShadcnButton
                size="sm"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Delete
              </ShadcnButton>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default AmenitiesView;

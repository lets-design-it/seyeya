import React, { useState, useMemo } from 'react';
import { useRoomAssets, RoomPolicy, autoDetectPolicyIcon, renderAssetIcon } from '@/hooks/useRoomAssets.tsx';
import { Card } from '@/components/ui/card';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input as ShadcnInput } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  FileText, 
  X, 
  RotateCcw, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

const CATEGORIES: RoomPolicy['category'][] = [
  'Check-in/out',
  'Cancellation',
  'Smoking',
  'Pets',
  'Children & Beds',
  'Noise',
  'Deposit',
  'General'
];

export const PoliciesView: React.FC = () => {
  const { policies, addPolicy, updatePolicy, deletePolicy } = useRoomAssets();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RoomPolicy | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RoomPolicy['category']>('Check-in/out');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Deletion confirm modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const detectedIcon = autoDetectPolicyIcon(title);

  const getCategoryName = (cat: any): string => {
    if (typeof cat === 'string') return cat;
    if (typeof cat === 'object' && cat !== null && cat.name) return String(cat.name);
    return 'General';
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'ALL' || getCategoryName(item.category) === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [policies, searchTerm, filterCategory]);

  const openAddDrawer = () => {
    setEditingPolicy(null);
    setTitle('');
    setCategory('Check-in/out');
    setDescription('');
    setIsActive(true);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: RoomPolicy) => {
    setEditingPolicy(item);
    setTitle(item.title);
    setCategory(getCategoryName(item.category) as RoomPolicy['category']);
    setDescription(item.description);
    setIsActive(item.isActive);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (editingPolicy) {
      updatePolicy(editingPolicy.id, {
        title: title.trim(),
        category,
        description: description.trim(),
        isActive
      });
    } else {
      addPolicy({
        title: title.trim(),
        category,
        description: description.trim(),
        isActive
      });
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deletePolicy(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            <span>Room & Stay Policies</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Define guest house rules, cancellation terms, and stay regulations for room category disclosures.
          </p>
        </div>

        <ShadcnButton
          onClick={openAddDrawer}
          className="flex items-center gap-2 bg-[#0A2540]! text-[#D4AF37]! hover:bg-[#07192C]! border border-[#D4AF37]/30 dark:bg-[#D4AF37]! dark:text-[#0A192F]! dark:hover:bg-[#B89320]! rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Policy
        </ShadcnButton>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Search className="h-4 w-4" />
            </span>
            <ShadcnInput
              type="text"
              placeholder="Search policies by title or terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 pl-10 pr-4 text-xs text-foreground placeholder-zinc-500 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Select value={filterCategory} onValueChange={(val: string) => setFilterCategory(val)}>
              <SelectTrigger className="!flex !items-center !justify-between !h-10 !px-4 !rounded-xl !border-zinc-200 dark:!border-zinc-800 !bg-white dark:!bg-zinc-900 !text-xs !font-bold !w-44 sm:!w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 z-50">
                <SelectItem value="ALL" className="text-xs font-semibold">All Categories ({policies.length})</SelectItem>
                {CATEGORIES.map(cat => {
                  const count = policies.filter(p => getCategoryName(p.category) === cat).length;
                  return (
                    <SelectItem key={cat} value={cat} className="text-xs font-semibold">
                      {cat} {count > 0 ? `(${count})` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {(searchTerm || filterCategory !== 'ALL') && (
              <ShadcnButton
                onClick={() => { setSearchTerm(''); setFilterCategory('ALL'); }}
                variant="ghost"
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer h-10 px-3"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </ShadcnButton>
            )}
          </div>
        </div>
      </Card>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPolicies.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl">
            <FileText className="h-8 w-8 mx-auto text-zinc-400 mb-2 animate-pulse" />
            <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No policies found</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Try adjusting your search terms or add a new policy.</p>
          </div>
        ) : (
          filteredPolicies.map(item => (
            <Card 
              key={item.id}
              className="p-5 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                      {renderAssetIcon(item.iconName, "h-5 w-5")}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                        {item.title}
                      </h4>
                      <Badge variant="outline" className="mt-1 text-[10px] font-bold px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700">
                        {getCategoryName(item.category)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditDrawer(item)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      title="Edit Policy"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      title="Delete Policy"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed font-medium">
                  {item.description}
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
                  {item.isActive ? 'Active Rule' : 'Disabled'}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Right-Side Drawer Layout for Creating/Editing Policy */}
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
                  {editingPolicy ? 'Update Stay Policy' : 'Add New Stay Policy'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Icons are automatically assigned from the policy title.
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
              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Policy Title *
                </label>
                <ShadcnInput
                  type="text"
                  required
                  placeholder="e.g. Check-in & Check-out Hours, Cancellation Policy, Non-Smoking Policy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-10 px-3.5 text-xs text-foreground font-semibold"
                />
              </div>

              {/* Auto Icon Live Preview Box */}
              <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    {renderAssetIcon(detectedIcon, "h-5 w-5")}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
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
                  onChange={(e) => setCategory(e.target.value as RoomPolicy['category'])}
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
                  Policy Terms & Rules *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the policy rules, timelines, fees, and requirements for guests..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-xs text-foreground font-medium outline-hidden"
                />
              </div>

              {/* Is Active Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Active Rule</span>
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
                  {editingPolicy ? 'Save Changes' : 'Create Policy'}
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
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Delete Policy?</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this stay policy rule?
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
export default PoliciesView;

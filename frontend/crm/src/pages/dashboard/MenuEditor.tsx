import React, { useState } from 'react';
import { useRestaurant, MenuItem } from '../../hooks/useRestaurant';
import { useCurrency } from '../../context/CurrencyContext';
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
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  VisibilityState,
  SortingState
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChefHat,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

export const MenuEditor: React.FC = () => {
  const { formatPrice, currency } = useCurrency();
  const {
    menu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    isLoading
  } = useRestaurant();

  // Modal/Drawer states
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

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

  // Local state for options editing inside drawer
  const [extras, setExtras] = useState<any[]>([]);
  const [choices, setChoices] = useState<any[]>([]);
  const [accompaniments, setAccompaniments] = useState<any[]>([]);

  // Category management form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryDesc, setEditingCategoryDesc] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Table State & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterAvailability, setFilterAvailability] = useState<string>('ALL');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    image: true,
    name: true,
    category: true,
    priceUGX: true,
    priceUSD: true,
    quantity: true,
    preparation_time: true,
    is_available: true,
    is_active: true,
  });

  const openAddModal = () => {
    setEditItem(null);
    setName('');
    setCategory(categories[0]?.category_name || 'Local Food');
    setPriceUGX(15000);
    setPriceUSD(4);
    setDescription('');
    setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'); // generic food placeholder
    setQuantity(100);
    setAllergenInfo('');
    setPrepTime(15);
    setIsAvailable(true);
    setIsActive(true);
    setExtras([]);
    setChoices([]);
    setAccompaniments([]);
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
    setExtras(item.extras ? [...item.extras] : []);
    setChoices(item.choices ? [...item.choices] : []);
    setAccompaniments(item.accompaniments ? [...item.accompaniments] : []);
    setIsOpen(true);
  };

  const handleAddChoice = () => {
    setChoices([...choices, { choice_name: '', price: null, is_available: true }]);
  };

  const handleChoiceChange = (index: number, field: string, value: any) => {
    const updated = [...choices];
    updated[index] = { ...updated[index], [field]: value };
    setChoices(updated);
  };

  const handleRemoveChoice = (index: number) => {
    setChoices(choices.filter((_, i) => i !== index));
  };

  const handleAddAccompaniment = () => {
    setAccompaniments([...accompaniments, { accompaniment_name: '', price: 0, is_available: true }]);
  };

  const handleAccompanimentChange = (index: number, field: string, value: any) => {
    const updated = [...accompaniments];
    updated[index] = { ...updated[index], [field]: value };
    setAccompaniments(updated);
  };

  const handleRemoveAccompaniment = (index: number) => {
    setAccompaniments(accompaniments.filter((_, i) => i !== index));
  };

  const handleAddExtra = () => {
    setExtras([...extras, { extra_name: '', price: 0, is_available: true, image_url: null }]);
  };

  const handleExtraChange = (index: number, field: string, value: any) => {
    const updated = [...extras];
    updated[index] = { ...updated[index], [field]: value };
    setExtras(updated);
  };

  const handleRemoveExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      is_active: isActive,
      extras,
      choices,
      accompaniments
    };

    try {
      if (editItem) {
        await updateMenuItem({
          ...itemData,
          id: editItem.id
        });
      } else {
        await addMenuItem(itemData);
      }
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (id: string) => {
    deleteMenuItem(id);
    setDeleteConfirmId(null);
    setSelectedItem(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('ALL');
    setFilterAvailability('ALL');
  };

  const categoryList = categories.map((c: any) => c.category_name);

  // Filtering Logic
  const filteredMenu = React.useMemo(() => {
    return menu.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === 'ALL' || item.category === filterCategory;
      const matchAvailability = filterAvailability === 'ALL' ||
        (filterAvailability === 'AVAILABLE' && item.is_available) ||
        (filterAvailability === 'OUT_OF_STOCK' && !item.is_available);

      return matchSearch && matchCategory && matchAvailability;
    });
  }, [menu, searchTerm, filterCategory, filterAvailability]);

  // TanStack columns
  const columns = React.useMemo<ColumnDef<MenuItem>[]>(() => [
    {
      accessorKey: 'image',
      header: 'Image',
      cell: ({ row }) => (
        <img
          src={row.original.image}
          alt={row.original.name}
          className="h-10 w-10 rounded-lg object-cover bg-zinc-100 border border-zinc-100"
        />
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
          {row.original.name}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold uppercase py-0.5 px-2 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300">
          {row.original.category}
        </Badge>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'priceUGX',
      header: `Price (${currency})`,
      cell: ({ row }) => (
        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
          {formatPrice(row.original.priceUGX)}
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'quantity',
      header: 'Stock',
      cell: ({ row }) => (
        <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">
          {row.original.quantity ?? 0} pcs
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'preparation_time',
      header: 'Prep Time',
      cell: ({ row }) => (
        <span className="text-zinc-650 dark:text-zinc-350 font-medium text-xs">
          {row.original.preparation_time ?? 15} mins
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'is_available',
      header: 'Availability',
      cell: ({ row }) => (
        <Badge
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.original.is_available
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
            : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50'
            }`}
        >
          {row.original.is_available ? 'Available' : 'Sold Out'}
        </Badge>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'is_active',
      header: 'Catalog Status',
      cell: ({ row }) => (
        <Badge
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.original.is_active
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-900/50'
            }`}
        >
          {row.original.is_active ? 'Active' : 'Archived'}
        </Badge>
      ),
      enableHiding: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <ShadcnButton
            variant="ghost"
            size="icon"
            onClick={() => openEditModal(row.original)}
            className="h-7 w-7 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </ShadcnButton>
          <ShadcnButton
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirmId(row.original.id)}
            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-lg cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </ShadcnButton>
        </div>
      ),
      enableHiding: false,
    }
  ], [categories]);

  const table = useReactTable({
    data: filteredMenu,
    columns,
    state: {
      columnVisibility,
      sorting,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      }
    }
  });

  return (
    <div className="space-y-6 animate-fade-in relative h-full text-foreground">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Menu</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Create, adjust, and archive food or drink listings on the Seyeya Courts Mobile app.</p>
        </div>
        <div className="flex items-center gap-2">
          <ShadcnButton
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer h-10 shadow-sm dark:bg-white! dark:text-black! dark:hover:bg-white/90! dark:border-transparent!"
          >
            Manage Categories
          </ShadcnButton>
          <ShadcnButton
            onClick={openAddModal}
            className="flex items-center gap-2 bg-black! text-white! hover:bg-black/90! rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
          >
            <Plus className="h-4 w-4" />
            Add Menu Item
          </ShadcnButton>
        </div>
      </div>

      {/* Advanced Filter Section */}
      <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search filter */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                <Search className="h-4 w-4" />
              </span>
              <ShadcnInput
                type="text"
                placeholder="Search menu items by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 h-10 pl-10 pr-4 text-xs focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 focus-visible:border-zinc-955 dark:focus-visible:border-zinc-700 outline-hidden transition-all"
              />
            </div>

            {/* Category Select Filter using Radix/Shadcnui select */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 px-3.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 z-50 shadow-md">
                <SelectItem value="ALL" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 outline-hidden text-zinc-700 dark:text-zinc-300">
                  All Categories
                </SelectItem>
                {categoryList.map(catName => (
                  <SelectItem key={catName} value={catName} className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 outline-hidden text-zinc-700 dark:text-zinc-300">
                    {catName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Availability Select Filter */}
            <Select value={filterAvailability} onValueChange={setFilterAvailability}>
              <SelectTrigger className="w-full sm:w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 px-3.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer">
                <SelectValue placeholder="All Availability" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 z-50 shadow-md">
                <SelectItem value="ALL" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 outline-hidden text-zinc-700 dark:text-zinc-300">
                  All Availability
                </SelectItem>
                <SelectItem value="AVAILABLE" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 outline-hidden text-zinc-700 dark:text-zinc-300">
                  Available
                </SelectItem>
                <SelectItem value="OUT_OF_STOCK" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 outline-hidden text-zinc-700 dark:text-zinc-300">
                  Out of Stock (Sold Out)
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Button */}
            {(searchTerm || filterCategory !== 'ALL' || filterAvailability !== 'ALL') && (
              <ShadcnButton
                onClick={resetFilters}
                variant="ghost"
                className="flex items-center gap-1 text-xs text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl h-10 px-3 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </ShadcnButton>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* Columns selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ShadcnButton variant="outline" className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-750 cursor-pointer text-xs font-bold shadow-xs dark:bg-white! dark:text-black! dark:hover:bg-white/90! dark:border-transparent!">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Columns
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                </ShadcnButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[170px] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-md p-1.5 mt-1 z-50">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 outline-hidden flex items-center gap-2 text-zinc-700 dark:text-zinc-300"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id === 'priceUGX'
                          ? 'Price (UGX)'
                          : column.id === 'priceUSD'
                            ? 'Price (USD)'
                            : column.id === 'preparation_time'
                              ? 'Prep Time'
                              : column.id === 'is_available'
                                ? 'Availability'
                                : column.id === 'is_active'
                                  ? 'Active Status'
                                  : column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* DataTable Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-[20px] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-955 dark:border-zinc-200 border-t-transparent" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider uppercase">Loading Catalog...</p>
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="h-9 w-9 mx-auto text-zinc-400 mb-3 animate-pulse" />
            <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">No catalog items found</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
              We couldn't find any dishes or drinks matching the active filter parameters.
            </p>
            <ShadcnButton
              onClick={openAddModal}
              className="mt-4 flex items-center gap-1.5 mx-auto bg-black! text-white! hover:bg-black/90! rounded-xl px-4.5 py-2 text-xs font-bold cursor-pointer h-9 shadow-sm border-none dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Menu Item
            </ShadcnButton>
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader className="bg-zinc-50/60 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider py-3.5 px-4 text-left">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => setSelectedItem(row.original)}
                    className="cursor-pointer hover:bg-zinc-50/40 dark:hover:bg-zinc-850/40 transition-colors border-zinc-100 dark:border-zinc-800"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4 text-xs font-medium text-zinc-750 dark:text-zinc-300">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex-1 text-zinc-500 dark:text-zinc-400 font-bold">
                Showing {table.getRowModel().rows.length} of {filteredMenu.length} items
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Page</span>
                  <strong className="text-zinc-900 dark:text-zinc-100 font-extrabold">
                    {table.getState().pagination.pageIndex + 1} of{' '}
                    {table.getPageCount()}
                  </strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShadcnButton
                    variant="outline"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 cursor-pointer bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </ShadcnButton>
                  <ShadcnButton
                    variant="outline"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 cursor-pointer bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </ShadcnButton>
                </div>
              </div>
            </div>
          </div>
        )}
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
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Item Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Traditional Goat Stew"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955 cursor-pointer"
              >
                {categoryList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Image URL</label>
              <input
                type="url"
                placeholder="Unsplash image URL..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
              <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                Recommended: Landscape 1.6:1 ratio (e.g. 1200×750px). Ensure the subject is centered.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Price (UGX) *</label>
              <input
                type="number"
                min={0}
                required
                placeholder="e.g. 15000"
                value={priceUGX}
                onChange={(e) => setPriceUGX(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Price (USD) *</label>
              <input
                type="number"
                min={0}
                step="0.1"
                required
                placeholder="e.g. 4"
                value={priceUSD}
                onChange={(e) => setPriceUSD(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Stock Quantity *</label>
              <input
                type="number"
                min={0}
                required
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Prep Time (mins)</label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 20"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Allergen Info</label>
              <input
                type="text"
                placeholder="e.g. Gluten, Nuts, Dairy"
                value={allergenInfo}
                onChange={(e) => setAllergenInfo(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Description</label>
              <textarea
                placeholder="Describe ingredients, portion sizes, preparation styles..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground outline-hidden focus:border-zinc-955 resize-none"
              />
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-800 text-black cursor-pointer h-4 w-4"
                />
                <span>Available for Order</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-800 text-black cursor-pointer h-4 w-4"
                />
                <span>Active in Catalog</span>
              </label>
            </div>

            {/* Customizations Section */}
            <div className="space-y-4 border-t border-zinc-150 dark:border-zinc-800 pt-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Item Customizations</h4>
              </div>

              {/* Choices / Options */}
              <div className="space-y-3 p-3 bg-zinc-50/70 dark:bg-zinc-950/40 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Choices / Options</span>
                  <ShadcnButton
                    type="button"
                    variant="ghost"
                    onClick={handleAddChoice}
                    className="text-[10px] font-bold text-zinc-955 hover:bg-zinc-200 h-7 px-2.5 rounded-xl cursor-pointer flex items-center gap-1 border border-zinc-200 bg-white shadow-2xs dark:bg-white! dark:text-black! dark:hover:bg-white/90! dark:border-transparent!"
                  >
                    <Plus className="h-3 w-3" /> Add Choice
                  </ShadcnButton>
                </div>
                {choices.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic p-1">No custom choices defined (e.g. Size, Spice Level).</p>
                ) : (
                  <div className="space-y-2.5">
                    {choices.map((choice, idx) => (
                      <div key={idx} className="space-y-2 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Medium Rare"
                            value={choice.choice_name}
                            onChange={(e) => handleChoiceChange(idx, 'choice_name', e.target.value)}
                            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-xs text-foreground outline-hidden focus:border-zinc-950 dark:focus:border-zinc-700 font-medium"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveChoice(idx)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold shrink-0">Price UGX</span>
                            <input
                              type="number"
                              min={0}
                              placeholder="Free"
                              value={choice.price ?? ''}
                              onChange={(e) => handleChoiceChange(idx, 'price', e.target.value ? Number(e.target.value) : null)}
                              className="w-24 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-0.5 text-[10px] text-foreground outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700"
                            />
                          </div>
                          <label className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={choice.is_available}
                              onChange={(e) => handleChoiceChange(idx, 'is_available', e.target.checked)}
                              className="rounded border-zinc-300 dark:border-zinc-800 text-black cursor-pointer h-3.5 w-3.5"
                            />
                            Available
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accompaniments */}
              <div className="space-y-3 p-3 bg-zinc-50/70 dark:bg-zinc-950/40 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Accompaniments (Sides)</span>
                  <ShadcnButton
                    type="button"
                    variant="ghost"
                    onClick={handleAddAccompaniment}
                    className="text-[10px] font-bold text-zinc-955 hover:bg-zinc-200 h-7 px-2.5 rounded-xl cursor-pointer flex items-center gap-1 border border-zinc-200 bg-white shadow-2xs dark:bg-white! dark:text-black! dark:hover:bg-white/90! dark:border-transparent!"
                  >
                    <Plus className="h-3 w-3" /> Add Side
                  </ShadcnButton>
                </div>
                {accompaniments.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic p-1">No accompaniments defined (e.g. Rice, Chips).</p>
                ) : (
                  <div className="space-y-2.5">
                    {accompaniments.map((acc, idx) => (
                      <div key={idx} className="space-y-2 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Steamed Rice"
                            value={acc.accompaniment_name}
                            onChange={(e) => handleAccompanimentChange(idx, 'accompaniment_name', e.target.value)}
                            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-xs text-foreground outline-hidden focus:border-zinc-950 dark:focus:border-zinc-700 font-medium"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAccompaniment(idx)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold shrink-0">Price UGX</span>
                            <input
                              type="number"
                              min={0}
                              placeholder="Free"
                              value={acc.price ?? ''}
                              onChange={(e) => handleAccompanimentChange(idx, 'price', e.target.value ? Number(e.target.value) : null)}
                              className="w-24 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 px-2 py-0.5 text-[10px] text-foreground outline-hidden focus:border-zinc-950 dark:focus:border-zinc-700"
                            />
                          </div>
                          <label className="flex items-center gap-1 text-[10px] text-zinc-550 dark:text-zinc-400 font-bold select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={acc.is_available}
                              onChange={(e) => handleAccompanimentChange(idx, 'is_available', e.target.checked)}
                              className="rounded border-zinc-300 dark:border-zinc-800 text-black cursor-pointer h-3.5 w-3.5"
                            />
                            Available
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Extras */}
              <div className="space-y-3 p-3 bg-zinc-50/70 dark:bg-zinc-950/40 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Extras / Add-ons</span>
                  <ShadcnButton
                    type="button"
                    variant="ghost"
                    onClick={handleAddExtra}
                    className="text-[10px] font-bold text-zinc-955 hover:bg-zinc-200 h-7 px-2.5 rounded-xl cursor-pointer flex items-center gap-1 border border-zinc-200 bg-white shadow-2xs dark:bg-white! dark:text-black! dark:hover:bg-white/90! dark:border-transparent!"
                  >
                    <Plus className="h-3 w-3" /> Add Extra
                  </ShadcnButton>
                </div>
                {extras.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic p-1">No extras defined (e.g. Extra Cheese, Gravy).</p>
                ) : (
                  <div className="space-y-2.5">
                    {extras.map((ext, idx) => (
                      <div key={idx} className="space-y-2 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Extra Cheese"
                            value={ext.extra_name}
                            onChange={(e) => handleExtraChange(idx, 'extra_name', e.target.value)}
                            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-xs text-foreground outline-hidden focus:border-zinc-950 dark:focus:border-zinc-700 font-medium"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExtra(idx)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold shrink-0">Price UGX</span>
                            <input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={ext.price}
                              onChange={(e) => handleExtraChange(idx, 'price', Number(e.target.value))}
                              className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 px-2 py-0.5 text-[10px] text-foreground outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                              required
                            />
                          </div>
                          <label className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ext.is_available}
                              onChange={(e) => handleExtraChange(idx, 'is_available', e.target.checked)}
                              className="rounded border-zinc-300 dark:border-zinc-800 text-black cursor-pointer h-3.5 w-3.5"
                            />
                            Available
                          </label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold shrink-0">Image URL</span>
                          <input
                            type="text"
                            placeholder="Optional extra photo URL..."
                            value={ext.image_url || ''}
                            onChange={(e) => handleExtraChange(idx, 'image_url', e.target.value || null)}
                            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-0.5 text-[9px] text-foreground outline-hidden focus:border-zinc-950 dark:focus:border-zinc-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2.5 border-t border-zinc-150 dark:border-zinc-800">
              <ShadcnButton
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="font-semibold px-4.5 py-2.5 rounded-xl cursor-pointer dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </ShadcnButton>
              <ShadcnButton
                type="submit"
                className="bg-black! text-white! hover:bg-black/90! font-bold px-6 py-2.5 rounded-xl shadow-sm border-none cursor-pointer dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
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
        className={`fixed inset-y-0 right-0 z-40 w-full sm:max-w-md bg-card shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-l border-zinc-100 dark:border-zinc-800 ${selectedItem ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {selectedItem && (
          <div className="flex flex-col h-full font-sans">
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-6 bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
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
                  className="h-32 w-32 rounded-[24px] object-cover bg-zinc-100 dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-800"
                />
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {selectedItem.category}
                  </span>
                  <h4 className="text-base font-bold text-foreground mt-2 leading-tight">
                    {selectedItem.name}
                  </h4>
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-100/60 dark:border-zinc-800 pt-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Description</span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1.5 leading-relaxed bg-zinc-50/50 dark:bg-zinc-950/30 p-4 rounded-[18px]">
                    {selectedItem.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-zinc-50/50 dark:bg-zinc-950/30 p-4 rounded-[18px] text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Price (UGX)</span>
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-55 block">
                      UGX {selectedItem.priceUGX.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Price (USD)</span>
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-55 block">
                      ${selectedItem.priceUSD.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-zinc-50/50 dark:bg-zinc-950/30 p-4 rounded-[18px] text-xs">
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
                    <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-955/20 border border-amber-100/50 dark:border-amber-900/50 p-3.5 rounded-[18px] mt-1.5 leading-relaxed font-semibold">
                      ⚠️ {selectedItem.allergen_info}
                    </div>
                  </div>
                )}

                {/* Sub-options section inside details drawer */}
                {selectedItem.choices && selectedItem.choices.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Choices / Variations</span>
                    <div className="mt-1.5 space-y-1.5">
                      {selectedItem.choices.map((c, i) => (
                        <div key={i} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 text-xs shadow-2xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{c.choice_name}</span>
                            {c.price ? (
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">+UGX {c.price.toLocaleString()}</span>
                            ) : (
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">Free option</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold ${c.is_available ? 'text-emerald-600' : 'text-red-500'}`}>
                            {c.is_available ? 'Available' : 'Sold Out'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.accompaniments && selectedItem.accompaniments.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Accompaniments (Sides)</span>
                    <div className="mt-1.5 space-y-1.5">
                      {selectedItem.accompaniments.map((a, i) => (
                        <div key={i} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 text-xs shadow-2xs">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{a.accompaniment_name}</span>
                          <div className="flex items-center gap-3">
                            {a.price ? (
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">+UGX {a.price.toLocaleString()}</span>
                            ) : (
                              <span className="text-zinc-400 dark:text-zinc-500 font-medium">Free</span>
                            )}
                            <span className={`text-[10px] font-bold ${a.is_available ? 'text-emerald-600' : 'text-red-500'}`}>
                              {a.is_available ? 'Available' : 'Sold Out'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.extras && selectedItem.extras.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Extras & Add-ons</span>
                    <div className="mt-1.5 space-y-1.5">
                      {selectedItem.extras.map((e, i) => (
                        <div key={i} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 text-xs shadow-2xs">
                          <div className="flex items-center gap-2">
                            {e.image_url && (
                              <img src={e.image_url} alt={e.extra_name} className="h-6 w-6 rounded-md object-cover bg-zinc-200 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800" />
                            )}
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{e.extra_name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">+UGX {e.price.toLocaleString()}</span>
                            <span className={`text-[10px] font-bold ${e.is_available ? 'text-emerald-600' : 'text-red-500'}`}>
                              {e.is_available ? 'Available' : 'Sold Out'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 bg-zinc-50/50 dark:bg-zinc-950/20 border-t border-zinc-100/60 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setDeleteConfirmId(selectedItem.id)}
                className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-full text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 transition-colors cursor-pointer animate-fade-in"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <Button
                onClick={() => {
                  openEditModal(selectedItem);
                  setSelectedItem(null);
                }}
                className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 py-2.5 text-xs font-bold shadow-sm dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
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
          <div className="glass-panel w-full max-w-sm bg-card rounded-[24px] p-6 text-center shadow-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-primary dark:text-white uppercase tracking-wider mb-2">Delete Menu Item?</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              Are you sure you want to remove this dish? It will be archived and removed immediately from the client eatery checkout screen.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setDeleteConfirmId(null)}
                className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold px-4.5 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-red-500 hover:bg-red-650 text-white font-bold px-6 rounded-xl cursor-pointer shadow-sm"
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
              <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-150 dark:border-red-900/55 flex items-center gap-2">
                ⚠️ {categoryError}
              </div>
            )}

            {/* Add Category Section */}
            <div className="bg-zinc-50/50 dark:bg-zinc-950/30 p-4 rounded-2xl border border-zinc-100/50 dark:border-zinc-800 space-y-3.5">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-350 uppercase tracking-wider">Add New Category</h4>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Local Desserts)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-foreground outline-hidden focus:border-zinc-955"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-foreground outline-hidden focus:border-zinc-955"
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
                  className="bg-black! text-white! hover:bg-black/90! font-bold px-4 py-2 rounded-xl text-xs shadow-sm border-none cursor-pointer dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
                >
                  Add Category
                </ShadcnButton>
              </div>
            </div>

            {/* Categories List Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-350 uppercase tracking-wider">Existing Categories</h4>
              <div className="divide-y divide-zinc-100/80 dark:divide-zinc-800">
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
                            className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground outline-hidden focus:border-zinc-955 font-semibold"
                          />
                          <input
                            type="text"
                            value={editingCategoryDesc}
                            onChange={(e) => setEditingCategoryDesc(e.target.value)}
                            className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground outline-hidden focus:border-zinc-955"
                          />
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{cat.category_name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                              {itemCount} items
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{cat.description}</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 justify-end">
                        {isEditing ? (
                          <>
                            <ShadcnButton
                              variant="outline"
                              onClick={() => setEditingCategoryId(null)}
                              className="text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs px-3 py-1.5 font-semibold rounded-xl cursor-pointer"
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
                              className="bg-black! text-white! hover:bg-black/90! text-xs px-4 py-1.5 font-bold rounded-xl border-none cursor-pointer dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
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
                              className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs px-3.5 py-1.5 font-bold rounded-xl cursor-pointer border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
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
                              className="bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 text-red-600 text-xs px-3.5 py-1.5 font-bold rounded-xl cursor-pointer border border-red-500/20 dark:border-red-900/50"
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

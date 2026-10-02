import React, { useState } from 'react';
import { useConference, ConferenceQuote, EventHall, ConferenceEventItem, ConferenceFacilityItem } from '../../hooks/useConference';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../services/api';
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
  Card,
} from "@/components/ui/card";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Check,
  X,
  Users,
  Coffee,
  Volume2,
  Video,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  CalendarRange,
  Plus,
  Building,
  Building2,
  Sparkles,
  Ticket,
  Tag,
  Calendar,
  MapPin,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Utensils,
  Wifi,
  Mic,
  Zap,
  CheckSquare,
  Layers,
  Folder,
  FolderPlus,
  Box,
  Upload,
  Star,
  Crown
} from 'lucide-react';
import { ConferenceFacilityCategoryItem } from '../../hooks/useConference';

interface ConferencesProps {
  activeTab?: 'quotes' | 'halls' | 'events' | 'facilities' | 'categories';
  setActiveTab?: (tab: 'quotes' | 'halls' | 'events' | 'facilities' | 'categories') => void;
}

export const Conferences: React.FC<ConferencesProps> = ({
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab
}) => {
  const { formatPrice, currency } = useCurrency();
  const {
    quotes,
    halls,
    events,
    facilities,
    facilityCategories,
    isLoading,
    updateQuoteStatus,
    addConferenceHall,
    updateConferenceHall,
    addEvent,
    updateEvent,
    deleteEvent,
    addFacility,
    updateFacility,
    deleteFacility,
    addFacilityCategory,
    updateFacilityCategory,
    deleteFacilityCategory,
    assignSingleFacilityToCategory,
    removeFacilityFromCategory,
    customers,
    createReservation
  } = useConference();

  const [localActiveTab, localSetActiveTab] = useState<'quotes' | 'halls' | 'events' | 'facilities' | 'categories'>('quotes');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || localSetActiveTab;

  // Selected Hall state for centered Hall page
  const [selectedHallId, setSelectedHallId] = useState<string>('');
  const [isEditHallDrawerOpen, setIsEditHallDrawerOpen] = useState(false);
  const [editingHallId, setEditingHallId] = useState<string | number | null>(null);
  const [editHallName, setEditHallName] = useState('');
  const [editHallCapacity, setEditHallCapacity] = useState<number>(100);
  const [editHallStandardPrice, setEditHallStandardPrice] = useState<string>('');
  const [editHallDescription, setEditHallDescription] = useState('');
  const [editHallAmenities, setEditHallAmenities] = useState('');

  // Hall Photos & Main Thumbnail state
  const [editHallPhotos, setEditHallPhotos] = useState<string[]>([]);
  const [editHallMainPhotoIndex, setEditHallMainPhotoIndex] = useState<number>(0);
  const [isUploadingHallPhoto, setIsUploadingHallPhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  const openEditHallDrawer = (hall: EventHall) => {
    setEditingHallId(hall.id || hall.hall_id);
    setEditHallName(hall.name);
    setEditHallCapacity(hall.capacity);
    setEditHallStandardPrice(String(hall.basePriceUGX || hall.full_day_rate || hall.standard_price || '800000'));
    setEditHallDescription(hall.description || '');
    setEditHallAmenities(hall.amenities || '');

    const existingPhotos = hall.photos && hall.photos.length > 0
      ? hall.photos
      : [hall.image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200'];
    setEditHallPhotos(existingPhotos);
    setEditHallMainPhotoIndex(hall.main_photo_index || 0);
    setPhotoUrlInput('');
    setIsEditHallDrawerOpen(true);
  };

  const handleAddPhotoUrl = () => {
    if (!photoUrlInput.trim()) return;
    if (editHallPhotos.length >= 5) {
      alert("You can add up to 5 photos maximum.");
      return;
    }
    setEditHallPhotos(prev => [...prev, photoUrlInput.trim()]);
    setPhotoUrlInput('');
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setEditHallPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (editHallMainPhotoIndex === indexToRemove) {
      setEditHallMainPhotoIndex(0);
    } else if (editHallMainPhotoIndex > indexToRemove) {
      setEditHallMainPhotoIndex(prev => prev - 1);
    }
  };

  const handleHallPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (editHallPhotos.length >= 5) {
      alert("Maximum limit of 5 photos reached.");
      return;
    }

    setIsUploadingHallPhoto(true);
    const newUrls: string[] = [];

    for (let i = 0; i < Math.min(files.length, 5 - editHallPhotos.length); i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/uploads/image?subfolder=conference', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data && res.data.url) {
          newUrls.push(res.data.url);
        }
      } catch (uploadErr) {
        console.error("API Upload failed, reading file locally", uploadErr);
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newUrls.push(dataUrl);
      }
    }

    if (newUrls.length > 0) {
      setEditHallPhotos(prev => [...prev, ...newUrls].slice(0, 5));
    }
    setIsUploadingHallPhoto(false);
    e.target.value = '';
  };

  const handleEditHallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHallId) return;
    const selectedMainImage = editHallPhotos[editHallMainPhotoIndex] || editHallPhotos[0];
    await updateConferenceHall(editingHallId, {
      hall_name: editHallName,
      capacity: Number(editHallCapacity),
      standard_price: Number(editHallStandardPrice || 0),
      description: editHallDescription,
      amenities: editHallAmenities,
      image: selectedMainImage,
      photos: editHallPhotos,
      main_photo_index: editHallMainPhotoIndex
    });
    setIsEditHallDrawerOpen(false);
  };

  // Selected facilities in Book Event Drawer
  const [selectedFacilityNames, setSelectedFacilityNames] = useState<string[]>(['Public Address System', 'HD Projector & Screen']);

  // Facilities State & Drawer
  const [facilitySearchTerm, setFacilitySearchTerm] = useState('');
  const [facilityCategoryFilter, setFacilityCategoryFilter] = useState('All');
  const [isFacilityDrawerOpen, setIsFacilityDrawerOpen] = useState(false);
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [facilityFormName, setFacilityFormName] = useState('');
  const [facilityFormCategoryId, setFacilityFormCategoryId] = useState<number | null>(null);
  const [facilityFormCategory, setFacilityFormCategory] = useState('General Services');
  const [facilityFormDescription, setFacilityFormDescription] = useState('');
  const [facilityFormIcon, setFacilityFormIcon] = useState('Sparkles');
  const [facilityFormPriceUGX, setFacilityFormPriceUGX] = useState<number | string>('');
  const [facilityFormPricingType, setFacilityFormPricingType] = useState('FIXED');
  const [facilityFormIsActive, setFacilityFormIsActive] = useState(true);

  // Facility Category Drawer State & Search
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryFormName, setCategoryFormName] = useState('');
  const [categoryFormDescription, setCategoryFormDescription] = useState('');
  const [categoryFormIcon, setCategoryFormIcon] = useState('Folder');
  const [categoryFormIsActive, setCategoryFormIsActive] = useState(true);
  const [categoryFormFacilityIds, setCategoryFormFacilityIds] = useState<number[]>([]);

  // Events Drawer & State
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [eventFilterStatus, setEventFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventFormName, setEventFormName] = useState('');
  const [eventFormDescription, setEventFormDescription] = useState('');
  const [eventFormPhoto, setEventFormPhoto] = useState('');
  const [eventFormPriceUGX, setEventFormPriceUGX] = useState<number | string>('');
  const [eventFormDiscountUGX, setEventFormDiscountUGX] = useState<number | string>('');
  const [eventFormDate, setEventFormDate] = useState('');
  const [eventFormLocation, setEventFormLocation] = useState('');
  const [eventFormCapacity, setEventFormCapacity] = useState<number | string>('');
  const [eventFormIsActive, setEventFormIsActive] = useState(true);

  // Quotes filters state
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Declined'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    date: true,
    companyName: true,
    clientName: true,
    hallName: true,
    cateringOption: true,
    avOverlay: true,
    totalCostUGX: true,
    status: true,
  });

  // Halls filters state
  const [hallSearchTerm, setHallSearchTerm] = useState('');
  const [hallSorting, setHallSorting] = useState<SortingState>([]);
  const [hallColumnVisibility, setHallColumnVisibility] = useState<VisibilityState>({
    name: true,
    capacity: true,
    hourly_rate: true,
    half_day_rate: true,
    full_day_rate: true,
    amenities: true,
    description: true
  });

  // Add Hall Drawer State
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [newHallName, setNewHallName] = useState('');
  const [newHallCapacity, setNewHallCapacity] = useState<number>(100);
  const [newHallHourly, setNewHallHourly] = useState<string>('');
  const [newHallHalfDay, setNewHallHalfDay] = useState<string>('');
  const [newHallFullDay, setNewHallFullDay] = useState<string>('');
  const [newHallIncludesVat, setNewHallIncludesVat] = useState<boolean>(true);
  const [newHallDescription, setNewHallDescription] = useState('');
  const [newHallAmenities, setNewHallAmenities] = useState('');

  // Add Reservation Drawer State
  const [isResDrawerOpen, setIsResDrawerOpen] = useState(false);
  const [resCustomerId, setResCustomerId] = useState('new');
  const [resClientName, setResClientName] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resHallId, setResHallId] = useState('');
  const [resEventName, setResEventName] = useState('');
  const [resCompanyName, setResCompanyName] = useState('');
  const [resEventDate, setResEventDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [resStartTime, setResStartTime] = useState('08:00');
  const [resEndTime, setResEndTime] = useState('17:00');
  const [resGuests, setResGuests] = useState<number>(50);
  const [resBookingType, setResBookingType] = useState('FullDay');
  const [resSpecialRequests, setResSpecialRequests] = useState('');
  const [resSoundSystem, setResSoundSystem] = useState(false);
  const [resProjector, setResProjector] = useState(false);
  const [resCateringOption, setResCateringOption] = useState<'None' | 'Standard Breakfast' | 'Executive Full Day'>('None');
  const [resIncludeTeaLunch, setResIncludeTeaLunch] = useState(false);
  const [resIncludeEveningTea, setResIncludeEveningTea] = useState(false);
  const [resPaymentMethod, setResPaymentMethod] = useState<'cash' | 'contract_invoice' | 'bank_transfer' | 'card'>('contract_invoice');
  const [resPaymentStatus, setResPaymentStatus] = useState<'Pending' | 'Paid' | 'PartiallyPaid'>('Pending');
  const [resInitialPaid, setResInitialPaid] = useState<number>(0);

  // Reservation Selected Facilities, Pricing & Types State
  const [resSelectedFacilityIds, setResSelectedFacilityIds] = useState<string[]>([]);
  const [resFacilityPrices, setResFacilityPrices] = useState<Record<string, number>>({});
  const [resFacilityPricingTypes, setResFacilityPricingTypes] = useState<Record<string, 'FIXED' | 'PER_HEAD'>>({});

  const handleFacilityPriceChange = (facId: string, price: number) => {
    setResFacilityPrices(prev => ({
      ...prev,
      [facId]: price
    }));
  };

  const handleFacilityPricingTypeChange = (facId: string, type: 'FIXED' | 'PER_HEAD') => {
    setResFacilityPricingTypes(prev => ({
      ...prev,
      [facId]: type
    }));
  };

  const toggleFacilitySelection = (facId: string, defaultPrice: number = 0, defaultType: string = 'FIXED') => {
    setResSelectedFacilityIds(prev => {
      if (prev.includes(facId)) {
        return prev.filter(id => id !== facId);
      } else {
        if (resFacilityPrices[facId] === undefined) {
          setResFacilityPrices(p => ({ ...p, [facId]: defaultPrice }));
        }
        if (resFacilityPricingTypes[facId] === undefined) {
          const isPerHead = defaultType === 'PER_HEAD' || defaultType === 'PER_PERSON' || defaultType === 'HEADCOUNT';
          setResFacilityPricingTypes(p => ({ ...p, [facId]: isPerHead ? 'PER_HEAD' : 'FIXED' }));
        }
        return [...prev, facId];
      }
    });
  };

  const calculateLiveReservationTotal = () => {
    const selectedHall = halls.find(h => String(h.id) === String(resHallId) || String(h.hall_id) === String(resHallId));
    let hallPrice = 0;
    if (selectedHall) {
      hallPrice = selectedHall.basePriceUGX || selectedHall.standard_price || selectedHall.full_day_rate || 0;
    }

    const headcount = Number(resGuests) || 0;
    const teaLunchCost = 0;
    const eveningTeaCost = 0;
    const paSystemCost = resSoundSystem ? (resFacilityPrices['pa_system'] ?? 100000) : 0;
    const projectorCost = resProjector ? (resFacilityPrices['projector'] ?? 150000) : 0;

    let dynamicFacilitiesCost = 0;
    const selectedFacilityBreakdown: { id: string; name: string; unitPrice: number; price: number; isPerHead: boolean }[] = [];

    facilities.forEach(fac => {
      const facIdStr = String(fac.id);
      if (resSelectedFacilityIds.includes(facIdStr)) {
        const unitPrice = resFacilityPrices[facIdStr] !== undefined ? resFacilityPrices[facIdStr] : (fac.price || 100000);
        const typeSetting = resFacilityPricingTypes[facIdStr];
        const isPerHead = typeSetting ? typeSetting === 'PER_HEAD' : (
          fac.pricing_type === 'PER_HEAD' || fac.pricing_type === 'PER_PERSON' || fac.pricing_type === 'HEADCOUNT'
        );
        const calcPrice = isPerHead ? unitPrice * headcount : unitPrice;

        dynamicFacilitiesCost += calcPrice;
        selectedFacilityBreakdown.push({
          id: facIdStr,
          name: fac.name,
          unitPrice,
          price: calcPrice,
          isPerHead
        });
      }
    });

    const totalAmount = hallPrice + paSystemCost + projectorCost + dynamicFacilitiesCost;
    const vatAmount = Math.round(totalAmount * (18 / 118));
    const netAmount = totalAmount - vatAmount;

    return {
      selectedHall,
      hallPrice,
      headcount,
      teaLunchCost,
      eveningTeaCost,
      paSystemCost,
      projectorCost,
      dynamicFacilitiesCost,
      selectedFacilityBreakdown,
      netAmount,
      vatAmount,
      totalAmount
    };
  };

  // Selected Reservation detail drawer state
  const [selectedQuote, setSelectedQuote] = useState<ConferenceQuote | null>(null);
  const [editStatus, setEditStatus] = useState<ConferenceQuote['status']>('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'Pending' | 'Paid' | 'PartiallyPaid'>('Pending');
  const [editAmountPaid, setEditAmountPaid] = useState<number>(0);

  React.useEffect(() => {
    if (selectedQuote) {
      setEditStatus(selectedQuote.status);
      setEditPaymentStatus(selectedQuote.paymentStatus || 'Pending');
      setEditAmountPaid(selectedQuote.amountPaid || 0);
    }
  }, [selectedQuote]);

  const getStatusBadge = (status: ConferenceQuote['status']) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
      case 'Approved': return 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50';
      case 'Declined': return 'bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-350 border-red-200 dark:border-red-900/50';
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilter('All');
    setHallSearchTerm('');
  };

  // Filtered quotes based on status filter and search term
  const filteredQuotes = React.useMemo(() => {
    return quotes.filter(q => {
      const matchStatus = filter === 'All' || q.status === filter;
      const matchSearch = q.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.hallName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [quotes, filter, searchTerm]);

  // Filtered halls based on search term
  const filteredHalls = React.useMemo(() => {
    return halls.filter(h => {
      return h.name.toLowerCase().includes(hallSearchTerm.toLowerCase()) ||
        h.description.toLowerCase().includes(hallSearchTerm.toLowerCase()) ||
        h.amenities.toLowerCase().includes(hallSearchTerm.toLowerCase());
    });
  }, [halls, hallSearchTerm]);

  // Columns definition for TanStack Quotes table
  const columns = React.useMemo<ColumnDef<ConferenceQuote>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-zinc-750 dark:text-zinc-300">
          {row.original.date}
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'companyName',
      header: 'Company',
      cell: ({ row }) => (
        <div className="font-bold text-xs text-zinc-950 dark:text-zinc-100 leading-tight">
          {row.original.companyName}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'clientName',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-none">
            {row.original.clientName}
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-450 font-semibold leading-none mt-1">
            {row.original.email}
          </span>
        </div>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'hallName',
      header: 'Hall Name',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-350">
          {row.original.hallName}
        </Badge>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'cateringOption',
      header: 'Catering',
      cell: ({ row }) => (
        <span className="text-zinc-750 dark:text-zinc-200 font-medium text-xs flex items-center gap-1.5">
          <Coffee className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          {row.original.cateringOption}
        </span>
      ),
      enableHiding: true,
    },
    {
      id: 'avOverlay',
      header: 'A/V Overlay',
      cell: ({ row }) => {
        const q = row.original;
        return (
          <div className="flex gap-2 text-zinc-550 dark:text-zinc-400">
            {q.soundSystem && (
              <span title="Sound System">
                <Volume2 className="h-3.5 w-3.5 text-violet-500" />
              </span>
            )}
            {q.projector && (
              <span title="Screen Projector">
                <Video className="h-3.5 w-3.5 text-indigo-500" />
              </span>
            )}
            {!q.soundSystem && !q.projector && <span className="text-[10px] text-zinc-450">None</span>}
          </div>
        );
      },
      enableHiding: true,
    },
    {
      accessorKey: 'totalCostUGX',
      header: 'Agreed Pricing',
      cell: ({ row }) => (
        <span className="font-extrabold text-xs text-zinc-950 dark:text-zinc-100">
          {formatPrice(row.original.totalCostUGX)}
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(row.original.status)
            }`}
        >
          {row.original.status}
        </Badge>
      ),
      enableHiding: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const quote = row.original;
        if (quote.status === 'Pending') {
          return (
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <ShadcnButton
                onClick={() => updateQuoteStatus(quote.id, 'Declined')}
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 cursor-pointer flex items-center justify-center shadow-xs"
                title="Decline Request"
              >
                <X className="h-3.5 w-3.5" />
              </ShadcnButton>
              <ShadcnButton
                onClick={() => updateQuoteStatus(quote.id, 'Approved')}
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 cursor-pointer flex items-center justify-center shadow-xs"
                title="Approve Request"
              >
                <Check className="h-3.5 w-3.5" />
              </ShadcnButton>
            </div>
          );
        }
        return (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold italic pl-2">Verified</span>
        );
      },
      enableHiding: false,
    }
  ], [quotes]);

  // Columns definition for TanStack Halls table
  const hallColumns = React.useMemo<ColumnDef<EventHall>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Hall Name',
      cell: ({ row }) => (
        <div className="font-bold text-xs text-zinc-950 dark:text-zinc-100 leading-tight flex items-center gap-2.5">
          <img src={row.original.image} alt={row.original.name} className="h-7 w-9 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-800" />
          <span>{row.original.name}</span>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'capacity',
      header: 'Max Capacity',
      cell: ({ row }) => (
        <span className="text-zinc-750 dark:text-zinc-200 font-medium text-xs flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          {row.original.capacity} Guests
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'hourly_rate',
      header: 'Hourly Rate',
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-zinc-750 dark:text-zinc-350">
          {row.original.hourly_rate ? formatPrice(row.original.hourly_rate) : 'Free'}
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'half_day_rate',
      header: 'Half Day Rate',
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-zinc-750 dark:text-zinc-350">
          {row.original.half_day_rate ? formatPrice(row.original.half_day_rate) : 'Free'}
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'full_day_rate',
      header: 'Full Day Rate',
      cell: ({ row }) => (
        <span className="font-extrabold text-xs text-zinc-950 dark:text-zinc-100">
          {row.original.full_day_rate ? formatPrice(row.original.full_day_rate) : 'Free'}
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'amenities',
      header: 'Amenities',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.amenities ? (
            row.original.amenities.split(',').map((am, i) => (
              <Badge key={i} variant="outline" className="text-[9px] font-bold py-0 px-1.5 bg-zinc-50 dark:bg-zinc-805 border-zinc-150 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-md">
                {am.trim()}
              </Badge>
            ))
          ) : (
            <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold">None</span>
          )}
        </div>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium line-clamp-2 max-w-xs leading-normal">
          {row.original.description || 'No description provided.'}
        </span>
      ),
      enableHiding: true,
    }
  ], []);

  // Quotes table instance
  const table = useReactTable({
    data: filteredQuotes,
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

  // Halls table instance
  const hallsTable = useReactTable({
    data: filteredHalls,
    columns: hallColumns,
    state: {
      columnVisibility: hallColumnVisibility,
      sorting: hallSorting,
    },
    onColumnVisibilityChange: setHallColumnVisibility,
    onSortingChange: setHallSorting,
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

  // Form Submit Handlers
  const handleAddHallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHallName.trim() || !newHallCapacity) return;

    try {
      const hourlyRateVal = Number(newHallHourly || 0);
      const halfDayRateVal = Number(newHallHalfDay || 0);
      const fullDayRateVal = Number(newHallFullDay || 0);

      await addConferenceHall({
        hall_name: newHallName.trim(),
        capacity: Number(newHallCapacity),
        hourly_rate: newHallIncludesVat ? Math.round(hourlyRateVal * 1.18) : hourlyRateVal,
        half_day_rate: newHallIncludesVat ? Math.round(halfDayRateVal * 1.18) : halfDayRateVal,
        full_day_rate: newHallIncludesVat ? Math.round(fullDayRateVal * 1.18) : fullDayRateVal,
        description: newHallDescription.trim(),
        amenities: newHallAmenities.trim(),
        is_vat_inclusive: newHallIncludesVat
      });

      // Clear form
      setNewHallName('');
      setNewHallCapacity(100);
      setNewHallHourly('');
      setNewHallHalfDay('');
      setNewHallFullDay('');
      setNewHallDescription('');
      setNewHallAmenities('');
      setIsAddDrawerOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resHallId || !resEventName.trim() || !resEventDate) return;

    try {
      const liveTotals = calculateLiveReservationTotal();
      const facilitySummary = liveTotals.selectedFacilityBreakdown
        .map(f => `${f.name} (UGX ${f.price.toLocaleString()})`)
        .join(', ');

      const facilityList = liveTotals.selectedFacilityBreakdown
        .map(f => {
          const fid = parseInt(f.id, 10);
          return isNaN(fid) ? null : {
            facility_id: fid,
            quantity: 1,
            unit_price: f.unitPrice || f.price,
            total_price: f.price
          };
        })
        .filter((item): item is { facility_id: number; quantity: number; unit_price: number; total_price: number } => item !== null);

      const totalAmt = liveTotals.totalAmount;
      const initialPaid = Number(resInitialPaid || 0);
      const balDue = Math.max(0, totalAmt - initialPaid);

      const extrasSummary = [
        resCompanyName.trim() ? `Organisation/Company: ${resCompanyName.trim()}` : '',
        `Billing Method: ${resPaymentMethod === 'contract_invoice' ? 'Organisation Contract-Invoice' : resPaymentMethod.toUpperCase()}`,
        `Payment Status: ${resPaymentStatus}`,
        resIncludeTeaLunch ? 'Water, Break Tea & Lunch (UGX 30k/head)' : '',
        resIncludeEveningTea ? 'Evening Tea (UGX 16k/head)' : '',
        resSoundSystem ? `Public Address PA System (UGX ${(resFacilityPrices['pa_system'] ?? 100000).toLocaleString()})` : '',
        resProjector ? `Projector Hire (UGX ${(resFacilityPrices['projector'] ?? 150000).toLocaleString()})` : '',
        facilitySummary ? `Facilities Included: ${facilitySummary}` : '',
        resSpecialRequests.trim() ? `Notes: ${resSpecialRequests.trim()}` : ''
      ].filter(Boolean).join(' | ');

      const effectiveEventName = resCompanyName.trim()
        ? `${resEventName.trim()} (${resCompanyName.trim()})`
        : resEventName.trim();

      await createReservation({
        customer_id: resCustomerId !== 'new' ? Number(resCustomerId) : undefined,
        clientName: resClientName.trim() || undefined,
        email: resEmail.trim() || undefined,
        hall_id: Number(resHallId),
        event_name: effectiveEventName,
        event_date: resEventDate,
        start_time: resStartTime,
        end_time: resEndTime,
        num_participants: resGuests,
        booking_type: resBookingType,
        special_requests: extrasSummary,
        soundSystem: resSoundSystem,
        projector: resProjector,
        cateringOption: resIncludeTeaLunch ? 'Executive Full Day' : (resIncludeEveningTea ? 'Standard Breakfast' : 'None'),
        hall_standard_price: liveTotals.hallPrice,
        subtotal: liveTotals.netAmount || liveTotals.totalAmount,
        total_amount: totalAmt,
        amount_paid: initialPaid,
        balance_due: balDue,
        payment_responsibility: resPaymentMethod === 'contract_invoice' ? 'Corporate' : 'Individual',
        facilities: facilityList
      });

      // Clear form
      setResCustomerId('new');
      setResClientName('');
      setResEmail('');
      setResCompanyName('');
      setResHallId('');
      setResEventName('');
      setResEventDate(new Date().toISOString().split('T')[0]);
      setResStartTime('08:00');
      setResEndTime('17:00');
      setResGuests(50);
      setResBookingType('FullDay');
      setResSpecialRequests('');
      setResSoundSystem(false);
      setResProjector(false);
      setResIncludeTeaLunch(true);
      setResIncludeEveningTea(false);
      setResPaymentMethod('contract_invoice');
      setResPaymentStatus('Pending');
      setResInitialPaid(0);
      setIsResDrawerOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;

    try {
      await updateQuoteStatus(
        selectedQuote.id,
        editStatus,
        editPaymentStatus,
        editAmountPaid
      );
      setSelectedQuote(null);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateEventDrawer = () => {
    setEditingEventId(null);
    setEventFormName('');
    setEventFormDescription('');
    setEventFormPhoto('https://images.unsplash.com/photo-1511578314322-379afb476865?w=600');
    setEventFormPriceUGX('');
    setEventFormDiscountUGX('');
    setEventFormDate('');
    setEventFormLocation('Seyeya Main River Lawn');
    setEventFormCapacity(100);
    setEventFormIsActive(true);
    setIsEventDrawerOpen(true);
  };

  const openEditEventDrawer = (ev: ConferenceEventItem) => {
    setEditingEventId(ev.id);
    setEventFormName(ev.event_name);
    setEventFormDescription(ev.description || '');
    setEventFormPhoto(ev.photo_url || '');
    setEventFormPriceUGX(ev.price);
    setEventFormDiscountUGX(ev.discount);
    setEventFormDate(ev.event_date || '');
    setEventFormLocation(ev.location || '');
    setEventFormCapacity(ev.capacity || '');
    setEventFormIsActive(ev.is_active);
    setIsEventDrawerOpen(true);
  };

  const handleEventFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormName.trim() || !eventFormPriceUGX) return;

    const payload = {
      event_name: eventFormName.trim(),
      description: eventFormDescription.trim(),
      photo_url: eventFormPhoto.trim() || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600',
      price: Number(eventFormPriceUGX),
      discount: Number(eventFormDiscountUGX || 0),
      event_date: eventFormDate || undefined,
      location: eventFormLocation.trim() || undefined,
      capacity: eventFormCapacity ? Number(eventFormCapacity) : undefined,
      is_active: eventFormIsActive
    };

    if (editingEventId) {
      await updateEvent(editingEventId, payload);
    } else {
      await addEvent(payload);
    }
    setIsEventDrawerOpen(false);
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.event_name.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(eventSearchTerm.toLowerCase())) ||
      (ev.location && ev.location.toLowerCase().includes(eventSearchTerm.toLowerCase()));
    const matchesFilter = eventFilterStatus === 'All'
      ? true
      : eventFilterStatus === 'Active'
        ? ev.is_active
        : !ev.is_active;
    return matchesSearch && matchesFilter;
  });

  const openCreateCategoryDrawer = () => {
    setEditingCategoryId(null);
    setCategoryFormName('');
    setCategoryFormDescription('');
    setCategoryFormIcon('Folder');
    setCategoryFormIsActive(true);
    setCategoryFormFacilityIds([]);
    setIsCategoryDrawerOpen(true);
  };

  const openEditCategoryDrawer = (cat: ConferenceFacilityCategoryItem) => {
    setEditingCategoryId(cat.id);
    setCategoryFormName(cat.name);
    setCategoryFormDescription(cat.description || '');
    setCategoryFormIcon(cat.icon_name || 'Folder');
    setCategoryFormIsActive(cat.is_active !== false);

    const assignedIds = facilities
      .filter(f => f.category_id === cat.id || (cat.facilities && cat.facilities.some(cf => cf.facility_id === f.facility_id)))
      .map(f => f.facility_id);
    setCategoryFormFacilityIds(assignedIds);
    setIsCategoryDrawerOpen(true);
  };

  const toggleCategoryFormFacilityId = (facilityId: number) => {
    setCategoryFormFacilityIds(prev =>
      prev.includes(facilityId) ? prev.filter(id => id !== facilityId) : [...prev, facilityId]
    );
  };

  const handleCategoryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormName.trim()) return;

    const payload = {
      name: categoryFormName.trim(),
      description: categoryFormDescription.trim(),
      icon_name: categoryFormIcon,
      is_active: categoryFormIsActive,
      facility_ids: categoryFormFacilityIds
    };

    if (editingCategoryId) {
      await updateFacilityCategory(editingCategoryId, payload);
    } else {
      await addFacilityCategory(payload);
    }
    setIsCategoryDrawerOpen(false);
  };

  const openCreateFacilityDrawer = () => {
    setEditingFacilityId(null);
    setFacilityFormName('');
    const defaultCatId = facilityCategories[0]?.id || null;
    setFacilityFormCategoryId(defaultCatId);
    setFacilityFormCategory(facilityCategories[0]?.name || 'General Services');
    setFacilityFormDescription('');
    setFacilityFormIcon('Sparkles');
    setFacilityFormPriceUGX('');
    setFacilityFormPricingType('FIXED');
    setFacilityFormIsActive(true);
    setIsFacilityDrawerOpen(true);
  };

  const openEditFacilityDrawer = (fac: ConferenceFacilityItem) => {
    setEditingFacilityId(fac.id);
    setFacilityFormName(fac.name);
    setFacilityFormCategoryId(fac.category_id || null);
    setFacilityFormCategory(fac.category || 'General Services');
    setFacilityFormDescription(fac.description || '');
    setFacilityFormIcon(fac.icon_name || 'Sparkles');
    setFacilityFormPriceUGX(fac.price || '');
    setFacilityFormPricingType(fac.pricing_type || 'FIXED');
    setFacilityFormIsActive(fac.is_active);
    setIsFacilityDrawerOpen(true);
  };

  const handleFacilityFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityFormName.trim()) return;

    const selectedCat = facilityCategories.find(c => c.id === facilityFormCategoryId);
    const catName = selectedCat ? selectedCat.name : facilityFormCategory;

    const payload = {
      name: facilityFormName.trim(),
      category_id: facilityFormCategoryId || undefined,
      category: catName,
      description: facilityFormDescription.trim(),
      icon_name: facilityFormIcon,
      price: Number(facilityFormPriceUGX || 0),
      pricing_type: facilityFormPricingType,
      is_active: facilityFormIsActive
    };

    if (editingFacilityId) {
      await updateFacility(editingFacilityId, payload);
    } else {
      await addFacility(payload);
    }
    setIsFacilityDrawerOpen(false);
  };

  const filteredFacilities = facilities.filter((fac) => {
    const matchesSearch = fac.name.toLowerCase().includes(facilitySearchTerm.toLowerCase()) ||
      (fac.description && fac.description.toLowerCase().includes(facilitySearchTerm.toLowerCase()));

    let matchesCategory = true;
    if (facilityCategoryFilter !== 'All') {
      const targetCat = facilityCategories.find(c => String(c.id) === facilityCategoryFilter || c.name === facilityCategoryFilter);
      if (targetCat) {
        matchesCategory = fac.category_id === targetCat.id || fac.category === targetCat.name;
      } else {
        matchesCategory = fac.category === facilityCategoryFilter;
      }
    }
    return matchesSearch && matchesCategory;
  });

  const filteredCategories = facilityCategories.filter((cat) => {
    return cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(categorySearchTerm.toLowerCase()));
  });

  const getCategoryIconComponent = (iconName?: string, nameStr?: string) => {
    const key = ((iconName || '') + ' ' + (nameStr || '')).toLowerCase();
    if (key.includes('utensil') || key.includes('food') || key.includes('dining')) return Utensils;
    if (key.includes('volume') || key.includes('audio') || key.includes('sound')) return Volume2;
    if (key.includes('video') || key.includes('projector') || key.includes('display')) return Video;
    if (key.includes('wifi') || key.includes('connect')) return Wifi;
    if (key.includes('mic') || key.includes('seat') || key.includes('chair') || key.includes('table') || key.includes('user')) return Users;
    if (key.includes('zap') || key.includes('utilit') || key.includes('power')) return Zap;
    if (key.includes('coffee') || key.includes('cater') || key.includes('tea') || key.includes('refresh')) return Coffee;
    if (key.includes('layers')) return Layers;
    if (key.includes('tag')) return Tag;
    if (key.includes('box')) return Box;
    return Folder;
  };

  const getFacilityIconComponent = (iconName?: string, nameStr?: string, catStr?: string) => {
    const key = (iconName || '').toLowerCase();
    if (key === 'utensils') return Utensils;
    if (key === 'volume2' || key === 'volume') return Volume2;
    if (key === 'projector' || key === 'video') return Video;
    if (key === 'wifi') return Wifi;
    if (key === 'mic') return Mic;
    if (key === 'zap') return Zap;
    if (key === 'coffee') return Coffee;

    const n = ((nameStr || '') + ' ' + (catStr || '')).toLowerCase();
    if (n.includes('catering') || n.includes('food') || n.includes('buffet') || n.includes('dining')) return Utensils;
    if (n.includes('coffee') || n.includes('refresh') || n.includes('tea') || n.includes('drink')) return Coffee;
    if (n.includes('pa') || n.includes('sound') || n.includes('audio') || n.includes('speaker') || n.includes('mic')) return Volume2;
    if (n.includes('projector') || n.includes('screen') || n.includes('display') || n.includes('tv')) return Video;
    if (n.includes('wi-fi') || n.includes('wifi') || n.includes('internet') || n.includes('net')) return Wifi;
    if (n.includes('stage') || n.includes('podium') || n.includes('lectern')) return Mic;
    if (n.includes('light') || n.includes('power') || n.includes('electric')) return Zap;
    return Sparkles;
  };

  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {activeTab === 'categories'
              ? 'Facility Categories Catalog'
              : activeTab === 'facilities'
                ? 'Conference Facilities & Inclusions'
                : activeTab === 'events'
                  ? 'Events & Gala Packages'
                  : activeTab === 'halls'
                    ? 'Conference Halls'
                    : 'Conferences & Reservations'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {activeTab === 'categories'
              ? 'Organize and group conference equipment, catering, and inclusions into manageable categories.'
              : activeTab === 'facilities'
                ? 'Manage equipment, PA sound systems, catering, A/V setups, and inclusions for event bookings.'
                : activeTab === 'events'
                  ? 'Manage special events, gala packages, pricing options, discounts, and event schedules.'
                  : 'Review quotes, configure seating specifications, manage venue halls, and approve facility bookings.'
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action Button */}
          {activeTab === 'quotes' ? (
            <ShadcnButton
              onClick={() => setIsResDrawerOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-xs border-none select-none shrink-0 dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
            >
              <Plus className="h-4 w-4" />
              Book Reservation
            </ShadcnButton>
          ) : activeTab === 'halls' ? null : activeTab === 'events' ? (
            <ShadcnButton
              onClick={openCreateEventDrawer}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-xs border-none select-none shrink-0 dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </ShadcnButton>
          ) : activeTab === 'categories' ? (
            <ShadcnButton
              onClick={openCreateCategoryDrawer}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-xs border-none select-none shrink-0 dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
            >
              <FolderPlus className="h-4 w-4" />
              Add Category
            </ShadcnButton>
          ) : (
            <ShadcnButton
              onClick={openCreateFacilityDrawer}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-xs border-none select-none shrink-0 dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
            >
              <Plus className="h-4 w-4" />
              Add Facility
            </ShadcnButton>
          )}
        </div>
      </div>

      {activeTab === 'categories' ? (
        /* Dedicated Categories Page Layout */
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Categories</p>
                  <h4 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">{facilityCategories.length}</h4>
                </div>
                <div className="p-2.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl">
                  <Folder className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Assigned Facilities</p>
                  <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {facilities.filter(f => f.category_id).length}
                  </h4>
                </div>
                <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckSquare className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Categories</p>
                  <h4 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                    {facilityCategories.filter(c => c.is_active !== false).length}
                  </h4>
                </div>
                <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search Bar */}
          <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                  <Search className="h-4 w-4" />
                </span>
                <ShadcnInput
                  type="text"
                  placeholder="Search categories by name or description..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 pl-10 pr-4 text-xs text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>

              <ShadcnButton
                onClick={openCreateCategoryDrawer}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-xs border-none select-none dark:bg-zinc-800! dark:text-white!"
              >
                <FolderPlus className="h-4 w-4" />
                Add Category
              </ShadcnButton>
            </div>
          </Card>

          {/* Categories Grid Cards */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border dark:border-zinc-800 rounded-2xl">
              <Folder className="h-9 w-9 mx-auto text-zinc-400 mb-3 animate-pulse" />
              <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-350 uppercase tracking-wider">No facility categories found</h5>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                Click "+ Add Category" to create your first facility category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => {
                const CatIcon = getCategoryIconComponent(cat.icon_name);
                const assignedFacs = facilities.filter(f => f.category_id === cat.id || (cat.facilities && cat.facilities.some(cf => cf.facility_id === f.facility_id)));

                return (
                  <Card key={cat.id} className="p-5 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary/10 text-primary dark:bg-primary/20 rounded-xl group-hover:scale-105 transition-transform">
                            <CatIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
                              {cat.name}
                            </h4>
                            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                              {assignedFacs.length} assigned facility{assignedFacs.length !== 1 ? 'ies' : ''}
                            </span>
                          </div>
                        </div>

                        <Badge className={`font-bold text-[10px] px-2 py-0.5 rounded-lg border-none ${cat.is_active !== false ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'}`}>
                          {cat.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      )}

                      {/* Assigned Facilities List */}
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                          Assigned Facilities
                        </span>
                        {assignedFacs.length === 0 ? (
                          <span className="text-xs text-zinc-400 italic">No facilities assigned to this category.</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                            {assignedFacs.map(f => (
                              <Badge key={f.id} variant="secondary" className="text-[10px] font-semibold flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 py-1 px-2.5 rounded-lg">
                                <span>{f.name}</span>
                                <button
                                  onClick={() => removeFacilityFromCategory(cat.id, f.facility_id)}
                                  title="Unassign facility"
                                  className="hover:text-red-500 cursor-pointer ml-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                      <ShadcnButton
                        variant="outline"
                        size="sm"
                        onClick={() => openEditCategoryDrawer(cat)}
                        className="h-8 rounded-xl px-3 text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </ShadcnButton>
                      <ShadcnButton
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFacilityCategory(cat.id)}
                        className="h-8 rounded-xl px-3 text-xs font-semibold border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </ShadcnButton>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'facilities' ? (
        /* Dedicated Facilities Dashboard Layout */
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Facilities</p>
                  <h4 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">{facilities.length}</h4>
                </div>
                <div className="p-2.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Offerings</p>
                  <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {facilities.filter(f => f.is_active).length}
                  </h4>
                </div>
                <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckSquare className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Categories</p>
                  <h4 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                    {facilityCategories.length > 0 ? facilityCategories.length : Array.from(new Set(facilities.map(f => f.category))).length}
                  </h4>
                </div>
                <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search & Category Filter Bar */}
          <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                  <Search className="h-4 w-4" />
                </span>
                <ShadcnInput
                  type="text"
                  placeholder="Search facilities by name, description..."
                  value={facilitySearchTerm}
                  onChange={(e) => setFacilitySearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 pl-10 pr-4 text-xs text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Select value={facilityCategoryFilter} onValueChange={(val: any) => setFacilityCategoryFilter(val)}>
                  <SelectTrigger className="!flex !items-center !justify-between !h-10 !px-4 !rounded-xl !border-zinc-200 dark:!border-zinc-800 !bg-white dark:!bg-zinc-900 !text-xs !font-bold !w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 z-50">
                    <SelectItem value="All" className="text-xs">All Categories</SelectItem>
                    {facilityCategories.map(cat => (
                      <SelectItem key={cat.id} value={String(cat.id)} className="text-xs">{cat.name}</SelectItem>
                    ))}
                    {facilityCategories.length === 0 && (
                      <>
                        <SelectItem value="Audio/Visual" className="text-xs">Audio/Visual</SelectItem>
                        <SelectItem value="Catering & Dining" className="text-xs">Catering & Dining</SelectItem>
                        <SelectItem value="Staging & Hall" className="text-xs">Staging & Hall</SelectItem>
                        <SelectItem value="Connectivity" className="text-xs">Connectivity</SelectItem>
                        <SelectItem value="General Services" className="text-xs">General Services</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                <ShadcnButton
                  onClick={openCreateFacilityDrawer}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-xs border-none select-none dark:bg-zinc-800! dark:text-white!"
                >
                  <Plus className="h-4 w-4" />
                  Add Facility
                </ShadcnButton>
              </div>
            </div>
          </Card>

          {/* Facilities Cards Grid */}
          {filteredFacilities.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border dark:border-zinc-800 rounded-2xl">
              <Sparkles className="h-9 w-9 mx-auto text-zinc-400 mb-3 animate-pulse" />
              <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-350 uppercase tracking-wider">No facility options found</h5>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                Click "+ Add Facility" to configure your first catering or technical inclusion.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFacilities.map((fac) => {
                const FacIcon = getFacilityIconComponent(fac.icon_name, fac.name, fac.category);
                return (
                  <Card key={fac.id} className="p-5 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl group-hover:scale-105 transition-transform">
                            <FacIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
                              {fac.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800">
                                {fac.category}
                              </Badge>
                              {fac.price ? (
                                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                                  UGX {fac.price.toLocaleString()}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <Badge className={`font-bold text-[10px] px-2 py-0.5 rounded-lg border-none ${fac.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'
                          }`}>
                          {fac.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {fac.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
                      <ShadcnButton
                        variant="outline"
                        size="sm"
                        onClick={() => openEditFacilityDrawer(fac)}
                        className="h-8 rounded-xl px-3 text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </ShadcnButton>
                      <ShadcnButton
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFacility(fac.id)}
                        className="h-8 rounded-xl px-3 text-xs font-semibold border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </ShadcnButton>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'events' ? (
        /* Dedicated Events Dashboard Layout */
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Events</p>
                  <h4 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">{events.length}</h4>
                </div>
                <div className="p-2.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl">
                  <Ticket className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Offers</p>
                  <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {events.filter(e => e.is_active).length}
                  </h4>
                </div>
                <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Average Base Price</p>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                    {formatPrice(
                      events.length > 0
                        ? events.reduce((acc, curr) => acc + curr.price, 0) / events.length
                        : 0
                    )}
                  </h4>
                </div>
                <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Tag className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Average Discount</p>
                  <h4 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {formatPrice(
                      events.length > 0
                        ? events.reduce((acc, curr) => acc + curr.discount, 0) / events.length
                        : 0
                    )}
                  </h4>
                </div>
                <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Tag className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                  <Search className="h-4 w-4" />
                </span>
                <ShadcnInput
                  type="text"
                  placeholder="Search events by title, location or description..."
                  value={eventSearchTerm}
                  onChange={(e) => setEventSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 pl-10 pr-4 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Select value={eventFilterStatus} onValueChange={(val: any) => setEventFilterStatus(val)}>
                  <SelectTrigger className="!flex !items-center !justify-between !h-10 !px-4 !rounded-xl !border-zinc-200 dark:!border-zinc-800 !bg-white dark:!bg-zinc-900 !text-xs !font-bold !w-36">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 z-50">
                    <SelectItem value="All" className="text-xs">All Statuses</SelectItem>
                    <SelectItem value="Active" className="text-xs">Active Only</SelectItem>
                    <SelectItem value="Inactive" className="text-xs">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>

                <ShadcnButton
                  onClick={openCreateEventDrawer}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-xs border-none select-none dark:bg-zinc-800! dark:text-white!"
                >
                  <Plus className="h-4 w-4" />
                  Create Event
                </ShadcnButton>
              </div>
            </div>
          </Card>

          {/* Events Cards Grid */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border dark:border-zinc-800 rounded-2xl">
              <Ticket className="h-9 w-9 mx-auto text-zinc-400 mb-3 animate-pulse" />
              <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-350 uppercase tracking-wider">No events found</h5>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                No events match your search. Click "+ Create Event" to add a new event package.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((ev) => {
                const netPrice = Math.max(0, ev.price - ev.discount);
                return (
                  <Card key={ev.id} className="overflow-hidden border border-border dark:border-zinc-800 bg-card rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                      {/* Event Photo & Badges */}
                      <div className="relative h-48 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <img
                          src={ev.photo_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600'}
                          alt={ev.event_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          {ev.discount > 0 && (
                            <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-lg shadow-xs border-none">
                              SAVE {formatPrice(ev.discount)}
                            </Badge>
                          )}
                          <Badge className={`font-bold text-[10px] px-2.5 py-0.5 rounded-lg shadow-xs border-none ${ev.is_active
                            ? 'bg-emerald-500 text-white'
                            : 'bg-zinc-500 text-white'
                            }`}>
                            {ev.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
                            {ev.event_name}
                          </h4>
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {ev.description || 'No description provided for this event.'}
                        </p>

                        {/* Location & Capacity */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                          {ev.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{ev.location}</span>
                            </div>
                          )}
                          {ev.capacity && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-zinc-400" />
                              <span>Up to {ev.capacity} Guests</span>
                            </div>
                          )}
                          {ev.event_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{ev.event_date}</span>
                            </div>
                          )}
                        </div>

                        {/* Price Section */}
                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-baseline justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Original Price</span>
                            {ev.discount > 0 ? (
                              <span className="text-xs text-zinc-400 line-through font-semibold">
                                {formatPrice(ev.price)}
                              </span>
                            ) : (
                              <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                                {formatPrice(ev.price)}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">Net Event Rate</span>
                            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatPrice(netPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                      <ShadcnButton
                        variant="outline"
                        size="sm"
                        onClick={() => openEditEventDrawer(ev)}
                        className="h-8 rounded-xl px-3 text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </ShadcnButton>
                      <ShadcnButton
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEvent(ev.id)}
                        className="h-8 rounded-xl px-3 text-xs font-semibold border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </ShadcnButton>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'halls' ? (
        /* Dedicated Centered Singular Hall & Categorized Facilities Showcase Page */
        (() => {
          const activeHall = selectedHallId
            ? halls.find(h => String(h.id) === String(selectedHallId) || String(h.hall_id) === String(selectedHallId)) || halls[0]
            : halls[0];

          if (!activeHall) {
            return (
              <Card className="p-12 text-center bg-card border border-border dark:border-zinc-800 rounded-3xl shadow-xs max-w-2xl mx-auto">
                <Building className="h-12 w-12 mx-auto text-primary mb-4 animate-bounce" />
                <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No Halls Configured</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
                  Add your primary venue hall to manage room capacities, booking rates, and categorized facility inclusions.
                </p>
                <ShadcnButton
                  onClick={() => setIsAddDrawerOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Venue Hall
                </ShadcnButton>
              </Card>
            );
          }

          return (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
              {/* Primary Hall Showcase Hero Card */}
              <Card className="bg-card border border-border dark:border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
                {/* Photo & Title Banner Header */}
                <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={activeHall.image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200'}
                    alt={activeHall.name}
                    className="w-full h-full object-cover opacity-85 transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                  {/* Top Right Hall Switcher / Active Tag */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    {halls.length > 1 && (
                      <Select value={String(activeHall.id)} onValueChange={(val) => setSelectedHallId(val)}>
                        <SelectTrigger className="h-9 px-3 bg-zinc-900/80 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-semibold shadow-xs">
                          <SelectValue placeholder="Select Hall" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 text-white border-zinc-800 rounded-xl">
                          {halls.map(h => (
                            <SelectItem key={h.id} value={String(h.id)} className="text-xs font-medium cursor-pointer">
                              {h.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Badge className="bg-emerald-500/90 text-white font-bold text-xs px-3 py-1 rounded-full shadow-xs border-none backdrop-blur-md">
                      Primary Hall
                    </Badge>
                  </div>

                  {/* Bottom Overlay Title & Specifications */}
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/80 backdrop-blur-xs text-white">
                        Featured Venue
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 backdrop-blur-xs text-white flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Max {activeHall.capacity} Guests
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-xs">
                      {activeHall.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-200 flex items-center gap-1.5 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      Seyeya Courts & Executive Conference Center • Kagadi
                    </p>
                  </div>
                </div>

                {/* Hall Body Specs */}
                <div className="p-6 sm:p-8 space-y-6 bg-card">
                  {/* Overview Text */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Venue Description</h5>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed font-medium">
                      {activeHall.description || 'A state-of-the-art indoor conference hall with floor-to-ceiling glass overlooking the river rapids, fully equipped with high-speed fiber internet and multi-channel audio visuals.'}
                    </p>
                  </div>

                  {/* Standard Rental Rate Display */}
                  <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Standard Hall Rental Price</span>
                      <h4 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatPrice(activeHall.basePriceUGX || activeHall.full_day_rate || activeHall.standard_price || 800000)}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">Official venue daily rental rate</p>
                    </div>
                    <Badge className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs">
                      Standard Rate
                    </Badge>
                  </div>

                  {/* Amenities Badges */}
                  {activeHall.amenities && (
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">Venue Features & Amenities</h5>
                      <div className="flex flex-wrap gap-2">
                        {activeHall.amenities.split(',').map((am, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            {am.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <ShadcnButton
                        onClick={() => {
                          setResHallId(String(activeHall.id || activeHall.hall_id));
                          setIsResDrawerOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <CalendarRange className="h-4 w-4" />
                        Book Reservation
                      </ShadcnButton>
                      <ShadcnButton
                        variant="outline"
                        onClick={() => openEditHallDrawer(activeHall)}
                        className="rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4 text-zinc-500" />
                        Edit Hall Details
                      </ShadcnButton>
                    </div>

                    <ShadcnButton
                      variant="outline"
                      onClick={openCreateFacilityDrawer}
                      className="rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 border border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Attach Facility
                    </ShadcnButton>
                  </div>
                </div>
              </Card>

              {/* Facilities Section Header */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                      Attached Facilities & Inclusions
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Breakdown of equipment, catering, AV setups, and services grouped in order of facility categories.
                    </p>
                  </div>
                  <ShadcnButton
                    onClick={openCreateCategoryDrawer}
                    variant="outline"
                    className="rounded-xl px-3.5 py-2 text-xs font-bold flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
                  >
                    <FolderPlus className="h-4 w-4" />
                    Add Category
                  </ShadcnButton>
                </div>

                {/* Categorized Facilities Grouped in Order of Categories Added */}
                {facilityCategories.length === 0 ? (
                  <Card className="p-8 text-center bg-card border border-border dark:border-zinc-800 rounded-2xl">
                    <Folder className="h-8 w-8 mx-auto text-zinc-400 mb-2 animate-pulse" />
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">No facility categories added yet.</p>
                    <ShadcnButton
                      onClick={openCreateCategoryDrawer}
                      className="mt-4 bg-primary text-primary-foreground text-xs font-bold rounded-xl px-4 py-2"
                    >
                      Add First Category
                    </ShadcnButton>
                  </Card>
                ) : (
                  facilityCategories.map((category) => {
                    const CategoryIcon = getCategoryIconComponent(category.icon_name, category.name);
                    const catFacilities = facilities.filter(f =>
                      f.category_id === category.id ||
                      (f.category && f.category.toLowerCase() === category.name.toLowerCase())
                    );

                    return (
                      <Card key={category.id} className="bg-card border border-border dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
                        {/* Category Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground shrink-0">
                              <CategoryIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                                  {category.name}
                                </h4>
                                <Badge variant="outline" className="text-[10px] font-bold border-zinc-200 dark:border-zinc-700">
                                  {catFacilities.length} {catFacilities.length === 1 ? 'Facility' : 'Facilities'}
                                </Badge>
                              </div>
                              {category.description && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <ShadcnButton
                            onClick={() => {
                              setEditingFacilityId(null);
                              setFacilityFormName('');
                              setFacilityFormCategoryId(category.id);
                              setFacilityFormCategory(category.name);
                              setFacilityFormDescription('');
                              setFacilityFormIcon('Sparkles');
                              setFacilityFormPriceUGX('');
                              setFacilityFormPricingType('FIXED');
                              setFacilityFormIsActive(true);
                              setIsFacilityDrawerOpen(true);
                            }}
                            variant="ghost"
                            className="text-xs font-bold text-primary hover:bg-primary/10 rounded-xl px-3 py-1.5 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Facility
                          </ShadcnButton>
                        </div>

                        {/* Category Facilities Grid */}
                        {catFacilities.length === 0 ? (
                          <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center bg-zinc-50/50 dark:bg-zinc-950/30">
                            <p className="text-xs text-zinc-400 font-medium">No facilities attached to {category.name} yet.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {catFacilities.map((fac) => {
                              const FacIcon = getFacilityIconComponent(fac.icon_name, fac.name, fac.category);
                              return (
                                <div
                                  key={fac.id}
                                  className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-primary/50 transition-all shadow-2xs group"
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-primary shadow-2xs">
                                          <FacIcon className="h-4 w-4" />
                                        </div>
                                        <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1">
                                          {fac.name}
                                        </h5>
                                      </div>
                                      <Badge
                                        className={`text-[9px] font-bold border-none px-2 py-0.5 ${fac.is_active !== false
                                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                                          }`}
                                      >
                                        {fac.is_active !== false ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>

                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                                      {fac.description || 'No detailed description provided.'}
                                    </p>
                                  </div>

                                  <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                                    <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50">
                                      {fac.price ? formatPrice(fac.price) : 'Included'}
                                      {fac.pricing_type && fac.price ? (
                                        <span className="text-[10px] text-zinc-400 font-normal ml-1">
                                          / {fac.pricing_type.toLowerCase()}
                                        </span>
                                      ) : null}
                                    </span>

                                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => openEditFacilityDrawer(fac)}
                                        className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                        title="Edit Facility"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => deleteFacility(fac.id)}
                                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Facility"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}

                {/* Uncategorized Facilities Section */}
                {(() => {
                  const categorizedIds = new Set(facilityCategories.map(c => c.id));
                  const categorizedNames = new Set(facilityCategories.map(c => c.name.toLowerCase()));
                  const uncategorized = facilities.filter(f =>
                    (!f.category_id || !categorizedIds.has(f.category_id)) &&
                    (!f.category || !categorizedNames.has(f.category.toLowerCase()))
                  );

                  if (uncategorized.length === 0) return null;

                  return (
                    <Card className="bg-card border border-border dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            <Box className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                                Additional & General Facilities
                              </h4>
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {uncategorized.length} Unassigned
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Facilities not assigned to a specific category group.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {uncategorized.map((fac) => {
                          const FacIcon = getFacilityIconComponent(fac.icon_name, fac.name, fac.category);
                          return (
                            <div
                              key={fac.id}
                              className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-primary/50 transition-all shadow-2xs group"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-primary">
                                      <FacIcon className="h-4 w-4" />
                                    </div>
                                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1">
                                      {fac.name}
                                    </h5>
                                  </div>
                                  <Badge
                                    className={`text-[9px] font-bold border-none px-2 py-0.5 ${fac.is_active !== false
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                                      }`}
                                  >
                                    {fac.is_active !== false ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>

                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                                  {fac.description || 'No detailed description provided.'}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                                <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50">
                                  {fac.price ? formatPrice(fac.price) : 'Included'}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditFacilityDrawer(fac)}
                                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteFacility(fac.id)}
                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })()}
              </div>
            </div>
          );
        })()
      ) : (
        <>
          {/* Quotes Filter Section */}
          <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                {/* Search filter */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <ShadcnInput
                    type="text"
                    placeholder="Search event quotes by client, company or hall..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 pl-10 pr-4 text-xs text-foreground placeholder-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 focus-visible:border-zinc-955 outline-hidden transition-all"
                  />
                </div>

                {/* Reset Button */}
                {(searchTerm || filter !== 'All') && (
                  <ShadcnButton
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('All');
                    }}
                    variant="ghost"
                    className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl h-10 px-3 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Filters
                  </ShadcnButton>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end">
                {/* Status Selector Dropdown */}
                <Select value={filter} onValueChange={(val: any) => setFilter(val)}>
                  <SelectTrigger className="!flex !items-center !justify-between !h-10 !px-4 !rounded-xl !border-zinc-200 dark:!border-zinc-800 !bg-white dark:!bg-zinc-900 hover:!bg-zinc-50 dark:hover:!bg-zinc-800/50 !text-zinc-750 dark:!text-zinc-300 !cursor-pointer !text-xs !font-bold !shadow-xs !w-36 [&_svg]:!text-zinc-500 dark:[&_svg]:!text-zinc-400 [&_svg]:!h-4 [&_svg]:!w-4">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 z-50 shadow-md">
                    <SelectItem value="All" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">
                      All Statuses
                    </SelectItem>
                    <SelectItem value="Pending" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">
                      Pending
                    </SelectItem>
                    <SelectItem value="Approved" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">
                      Approved
                    </SelectItem>
                    <SelectItem value="Declined" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">
                      Declined
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Quotes Columns Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ShadcnButton variant="outline" className="flex items-center justify-between h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-755 dark:text-zinc-300 cursor-pointer text-xs font-bold shadow-xs w-36 transition-all">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Columns
                      </span>
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    </ShadcnButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[170px] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-md p-1.5 mt-1 z-50">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize text-xs font-semibold cursor-pointer rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id === 'date'
                            ? 'Date'
                            : column.id === 'companyName'
                              ? 'Event'
                              : column.id === 'clientName'
                                ? 'Contact'
                                : column.id === 'hallName'
                                  ? 'Hall Name'
                                  : column.id === 'cateringOption'
                                    ? 'Catering'
                                    : column.id === 'avOverlay'
                                      ? 'A/V Overlay'
                                      : column.id === 'totalCostUGX'
                                        ? 'Pricing'
                                        : column.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>

          {/* Table Container */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-[20px] shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <p className="text-xs font-semibold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider animate-pulse">Syncing Database...</p>
              </div>
            ) : (
              filteredQuotes.length === 0 ? (
                <div className="text-center py-20">
                  <CalendarRange className="h-9 w-9 mx-auto text-zinc-400 mb-3 animate-pulse" />
                  <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-350 uppercase tracking-wider">No event quotes found</h5>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                    We couldn't find any event quotes matching the active filters or search queries.
                  </p>
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader className="bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-800">
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
                          onClick={() => setSelectedQuote(row.original)}
                          className="hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors border-zinc-100 dark:border-zinc-800"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-3 px-4 text-xs font-medium text-zinc-755 dark:text-zinc-300">
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
                  {table.getPageCount() > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex-1 text-zinc-450 dark:text-zinc-400 font-bold">
                        Showing {table.getRowModel().rows.length} of {filteredQuotes.length} items
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">Page</span>
                          <strong className="text-zinc-900 dark:text-zinc-200 font-extrabold">
                            {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount()}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShadcnButton
                            variant="outline"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </ShadcnButton>
                          <ShadcnButton
                            variant="outline"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </ShadcnButton>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Edit Hall Sliding Drawer */}
      {isEditHallDrawerOpen && (
        <>
          <div
            onClick={() => setIsEditHallDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-zinc-955/25 dark:bg-zinc-955/50 backdrop-blur-xs transition-opacity duration-300"
          />

          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card text-card-foreground dark:bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-zinc-150 dark:border-zinc-800 animate-slide-in">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Edit Hall Details</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold mt-1">Configure room capacities, booking rate schemas, and venue specs.</p>
              </div>
              <button
                onClick={() => setIsEditHallDrawerOpen(false)}
                className="text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditHallSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-zinc-900">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Hall Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nile View Grand Hall"
                  value={editHallName}
                  onChange={(e) => setEditHallName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Max Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 250"
                    value={editHallCapacity}
                    onChange={(e) => setEditHallCapacity(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Standard Price (UGX)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 800000"
                    value={editHallStandardPrice}
                    onChange={(e) => setEditHallStandardPrice(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                  />
                </div>
              </div>

              {/* Hall Photos Upload & Main Thumbnail Selection */}
              <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      Hall Photos & Official Thumbnail
                    </label>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                      Add up to 5 photos. Select one photo as the official main thumbnail.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-zinc-300 dark:border-zinc-700">
                    {editHallPhotos.length}/5 Photos
                  </Badge>
                </div>

                {/* Photos Thumbnails Grid */}
                {editHallPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {editHallPhotos.map((photoUrl, index) => {
                      const isMain = index === editHallMainPhotoIndex;
                      return (
                        <div
                          key={index}
                          className={`relative rounded-xl overflow-hidden border-2 group aspect-4/3 bg-zinc-900 transition-all ${isMain ? 'border-emerald-500 shadow-sm ring-2 ring-emerald-500/20' : 'border-zinc-200 dark:border-zinc-800'
                            }`}
                        >
                          <img
                            src={photoUrl}
                            alt={`Hall photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Main Badge */}
                          {isMain && (
                            <div className="absolute top-1 left-1 bg-emerald-600 text-white px-1.5 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-0.5 shadow-xs">
                              <Crown className="h-2.5 w-2.5 fill-current" />
                              Main
                            </div>
                          )}

                          {/* Overlay Controls */}
                          <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 backdrop-blur-2xs">
                            {!isMain && (
                              <button
                                type="button"
                                onClick={() => setEditHallMainPhotoIndex(index)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer w-full justify-center transition-colors"
                              >
                                <Crown className="h-2.5 w-2.5" />
                                Set Main
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              className="px-2 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer w-full justify-center transition-colors"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload & Add Photo Controls */}
                {editHallPhotos.length < 5 && (
                  <div className="space-y-2 pt-1">
                    {/* File Upload Dropzone */}
                    <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleHallPhotoUpload}
                        className="hidden"
                      />
                      <Upload className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {isUploadingHallPhoto ? 'Uploading Photo...' : `Upload Photo (Max ${5 - editHallPhotos.length} remaining)`}
                      </span>
                    </label>

                    {/* Quick Add Photo via URL */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Or paste photo URL..."
                        value={photoUrlInput}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-foreground dark:text-zinc-50 outline-hidden font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleAddPhotoUrl}
                        className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Hall Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe hall location, features, and setup capabilities..."
                  value={editHallDescription}
                  onChange={(e) => setEditHallDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditHallDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <ShadcnButton
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl px-5 py-2.5 cursor-pointer shadow-xs"
                >
                  Save Changes
                </ShadcnButton>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Add Hall Sliding Drawer */}
      {isAddDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsAddDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-zinc-955/25 dark:bg-zinc-955/50 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Slide-out Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card text-card-foreground dark:bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-zinc-150 dark:border-zinc-800 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Add Facility Hall</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold mt-1">Configure room capacities, booking rate schemas, and venue specs.</p>
              </div>
              <button
                onClick={() => setIsAddDrawerOpen(false)}
                className="text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddHallSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-zinc-900">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Hall Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nile View Grand Hall"
                  value={newHallName}
                  onChange={(e) => setNewHallName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Max Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 250"
                    value={newHallCapacity}
                    onChange={(e) => setNewHallCapacity(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Hourly Rate (UGX)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 200000"
                    value={newHallHourly}
                    onChange={(e) => setNewHallHourly(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Half Day Rate (UGX)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 1000000"
                    value={newHallHalfDay}
                    onChange={(e) => setNewHallHalfDay(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Full Day Rate (UGX)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 1800000"
                    value={newHallFullDay}
                    onChange={(e) => setNewHallFullDay(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newHallIncludesVat}
                    onChange={(e) => setNewHallIncludesVat(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 accent-[#D4AF37] h-4 w-4 cursor-pointer"
                  />
                  <span>Add VAT (18%)</span>
                </label>
                {(Number(newHallFullDay) > 0 || Number(newHallHalfDay) > 0 || Number(newHallHourly) > 0) && (
                  <div className="mt-1.5 text-xs font-semibold">
                    {newHallIncludesVat ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex flex-col gap-1.5">
                        {Number(newHallHourly) > 0 && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Hourly (Base UGX {Number(newHallHourly).toLocaleString()} + 18% VAT):</span>
                            <span className="font-extrabold text-foreground dark:text-zinc-50 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-amber-500/30">
                              New Total: UGX {Math.round(Number(newHallHourly) * 1.18).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {Number(newHallHalfDay) > 0 && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Half Day (Base UGX {Number(newHallHalfDay).toLocaleString()} + 18% VAT):</span>
                            <span className="font-extrabold text-foreground dark:text-zinc-50 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-amber-500/30">
                              New Total: UGX {Math.round(Number(newHallHalfDay) * 1.18).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {Number(newHallFullDay) > 0 && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Full Day (Base UGX {Number(newHallFullDay).toLocaleString()} + 18% VAT):</span>
                            <span className="font-extrabold text-foreground dark:text-zinc-50 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-amber-500/30">
                              New Total: UGX {Math.round(Number(newHallFullDay) * 1.18).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-zinc-500 dark:text-zinc-400 pl-1">
                        New Total Rates <span className="text-[11px] font-normal">(No VAT added)</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 mb-1.5">Facilities (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Projector, Sound System, AC, WiFi"
                  value={newHallAmenities}
                  onChange={(e) => setNewHallAmenities(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 mb-1.5">Description</label>
                <textarea
                  placeholder="A brief summary about the facility hall specs..."
                  rows={3}
                  value={newHallDescription}
                  onChange={(e) => setNewHallDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-100 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 leading-normal font-medium resize-none"
                />
              </div>

              {/* Drawer Footer Buttons */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-white dark:bg-zinc-900">
                <ShadcnButton
                  type="button"
                  onClick={() => setIsAddDrawerOpen(false)}
                  variant="outline"
                  className="rounded-xl px-4.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 cursor-pointer h-10"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  className="rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer h-10 shadow-xs dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
                >
                  Create Hall
                </ShadcnButton>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Add Reservation Sliding Drawer */}
      {isResDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsResDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-md transition-opacity duration-300"
          />

          {/* Wide Slide-out Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl md:max-w-3xl lg:max-w-4xl bg-card text-card-foreground dark:bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-zinc-200 dark:border-zinc-800 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/60">
              <div>
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#D4AF37]" />
                  Book Venue Hall & Conference Reservation
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                  Configure hall rental, participant headcount, catering packages, technical hire, and contract-invoice billing.
                </p>
              </div>
              <button
                onClick={() => setIsResDrawerOpen(false)}
                className="text-zinc-450 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddReservationSubmit} className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-900 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* LEFT COLUMN: Client, Venue & Timing */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-955/30 border border-zinc-200 dark:border-zinc-800/80 space-y-3.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                      Client & Organisation Profile
                    </h5>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Select Client Profile *</label>
                      <select
                        value={resCustomerId}
                        onChange={(e) => {
                          setResCustomerId(e.target.value);
                          if (e.target.value !== 'new') {
                            const selected = customers.find(c => String(c.customer_id) === e.target.value);
                            if (selected) {
                              setResClientName(selected.full_name);
                              setResEmail(selected.email || '');
                            }
                          } else {
                            setResClientName('');
                            setResEmail('');
                          }
                        }}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold cursor-pointer"
                      >
                        <option value="new" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">+ Create New Client Profile</option>
                        {customers.map(c => (
                          <option key={c.customer_id} value={String(c.customer_id)} className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">
                            {c.full_name} ({c.email || 'No email'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {resCustomerId === 'new' && (
                      <div className="grid grid-cols-2 gap-3 animate-fade-in">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Contact Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sarah Jenkins"
                            value={resClientName}
                            onChange={(e) => setResClientName(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="sarah@apex.com"
                            value={resEmail}
                            onChange={(e) => setResEmail(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Company / Organisation Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Group Ltd / Ministry of Health"
                        value={resCompanyName}
                        onChange={(e) => setResCompanyName(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-955/30 border border-zinc-200 dark:border-zinc-800/80 space-y-3.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                      Venue & Event Schedule
                    </h5>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Select Venue Hall *</label>
                      <select
                        required
                        value={resHallId}
                        onChange={(e) => setResHallId(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold cursor-pointer mb-2"
                      >
                        <option value="" disabled className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Select Venue...</option>
                        {halls.map(h => (
                          <option key={h.id} value={h.id} className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">
                            {h.name} (Max: {h.capacity} guests • Full Day: UGX {h.full_day_rate?.toLocaleString() || h.basePriceUGX?.toLocaleString() || h.standard_price?.toLocaleString()})
                          </option>
                        ))}
                      </select>

                      {/* Selected Hall Details & Capacity Summary Card */}
                      {(() => {
                        const selHall = halls.find(h => String(h.id) === String(resHallId) || String(h.hall_id) === String(resHallId));
                        if (!selHall) return null;

                        const isExceeded = resGuests > selHall.capacity;

                        return (
                          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-2xs mt-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={selHall.image || (selHall.photos && selHall.photos[0]) || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400'}
                                alt={selHall.name}
                                className="h-14 w-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50 truncate">{selHall.name}</h5>
                                  <Badge variant="outline" className={`text-[9px] font-bold shrink-0 ${isExceeded ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10' : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'}`}>
                                    Max {selHall.capacity} Guests
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5 font-medium">
                                  {selHall.description || 'Primary venue hall for conferences & executive meetings.'}
                                </p>
                              </div>
                            </div>

                            {/* Headcount Warning Alert */}
                            {isExceeded && (
                              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                                <span className="text-amber-500 text-sm shrink-0">⚠️</span>
                                <span>
                                  Headcount ({resGuests} people) exceeds this hall's maximum capacity of {selHall.capacity} guests.
                                </span>
                              </div>
                            )}

                            {/* Standard Rate Badge */}
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs mt-1">
                              <span className="font-bold text-zinc-700 dark:text-zinc-300">Standard Hall Rate:</span>
                              <span className="font-extrabold text-[#D4AF37] dark:text-amber-400">
                                {formatPrice(selHall.basePriceUGX || selHall.standard_price || selHall.full_day_rate || 0)} / day
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Event Title / Purpose *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Annual General Meeting"
                        value={resEventName}
                        onChange={(e) => setResEventName(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Event Date *</label>
                        <input
                          type="date"
                          required
                          value={resEventDate}
                          onChange={(e) => setResEventDate(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Start Time *</label>
                        <input
                          type="time"
                          required
                          value={resStartTime}
                          onChange={(e) => setResStartTime(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">End Time *</label>
                        <input
                          type="time"
                          required
                          value={resEndTime}
                          onChange={(e) => setResEndTime(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Headcount, Equipment & Billing */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-955/30 border border-zinc-200 dark:border-zinc-800/80 space-y-3.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                      Participants Headcount
                    </h5>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Participants Headcount (Number of People) *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={resGuests}
                        onChange={(e) => setResGuests(Number(e.target.value))}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-955/30 border border-zinc-200 dark:border-zinc-800/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        Conference Facilities & Equipment
                      </h5>
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">Categorized inclusions & pricing rules</span>
                    </div>

                    {/* Catalog Facilities Grouped by Category */}
                    {facilityCategories.length > 0 && (
                      <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                            Facilities & Equipment by Category
                          </span>
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                            Fixed Fee vs Per Head (× {resGuests} guests)
                          </span>
                        </div>

                        {facilityCategories.map(cat => {
                          const CatIcon = getCategoryIconComponent(cat.icon_name);
                          const catFacilities = facilities.filter(f => f.category_id === cat.id || (f.category && f.category.toLowerCase() === cat.name.toLowerCase()) || (cat.facilities && cat.facilities.some(cf => cf.facility_id === f.facility_id)));

                          if (catFacilities.length === 0) return null;

                          return (
                            <div key={cat.id} className="space-y-2 p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-955/40 border border-zinc-200/80 dark:border-zinc-800">
                              <div className="flex items-center gap-2 pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                                  <CatIcon className="h-3.5 w-3.5" />
                                </div>
                                <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{cat.name}</h6>
                                <Badge variant="outline" className="text-[9px] font-bold text-zinc-400 ml-auto border-zinc-300 dark:border-zinc-700">
                                  {catFacilities.length} Item{catFacilities.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 gap-2 pt-1">
                                {catFacilities.map(fac => {
                                  const facIdStr = String(fac.id);
                                  const isSelected = resSelectedFacilityIds.includes(facIdStr);
                                  const unitPrice = resFacilityPrices[facIdStr] !== undefined ? resFacilityPrices[facIdStr] : (fac.price || 100000);
                                  const currentPricingType = resFacilityPricingTypes[facIdStr] || (
                                    fac.pricing_type === 'PER_HEAD' || fac.pricing_type === 'PER_PERSON' || fac.pricing_type === 'HEADCOUNT' ? 'PER_HEAD' : 'FIXED'
                                  );
                                  const isPerHead = currentPricingType === 'PER_HEAD';
                                  const calculatedTotal = isPerHead ? unitPrice * (resGuests || 1) : unitPrice;
                                  const FacIcon = getFacilityIconComponent(fac.icon_name, fac.name, fac.category);

                                  return (
                                    <div
                                      key={fac.id}
                                      className={`p-3 rounded-xl border transition-all ${isSelected
                                        ? 'border-[#D4AF37] bg-amber-500/5 dark:bg-amber-550/10 shadow-2xs'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                                      }`}
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-zinc-900 dark:text-zinc-100 flex-1 min-w-0">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleFacilitySelection(facIdStr, fac.price || 100000, fac.pricing_type || 'FIXED')}
                                            className="rounded border-zinc-300 dark:border-zinc-700 accent-[#D4AF37] h-4 w-4 cursor-pointer shrink-0 mt-0.5"
                                          />
                                          <FacIcon className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                          <div className="truncate">
                                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                              <span>{fac.name}</span>
                                              {isSelected && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                                  Total: UGX {calculatedTotal.toLocaleString()}
                                                </span>
                                              )}
                                            </div>
                                            {fac.description && (
                                              <div className="text-[10px] font-normal text-zinc-450 dark:text-zinc-500 truncate mt-0.5">{fac.description}</div>
                                            )}
                                          </div>
                                        </label>

                                        <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                                          {/* Fixed vs Per Head Switcher */}
                                          <button
                                            type="button"
                                            disabled={!isSelected}
                                            onClick={() => handleFacilityPricingTypeChange(facIdStr, isPerHead ? 'FIXED' : 'PER_HEAD')}
                                            className={`text-[9px] font-extrabold px-2 py-1 rounded-lg border uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-40 ${
                                              isPerHead
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                                            }`}
                                            title={isPerHead ? `Unit Price UGX ${unitPrice.toLocaleString()} × ${resGuests} guests` : 'Flat Fixed Fee'}
                                          >
                                            {isPerHead ? `Per Head (×${resGuests})` : 'Fixed Fee'}
                                          </button>

                                          {/* Price input */}
                                          <div className="flex items-center gap-1 w-28">
                                            <span className="text-[10px] font-bold text-zinc-450">UGX</span>
                                            <input
                                              type="number"
                                              min={0}
                                              disabled={!isSelected}
                                              value={unitPrice}
                                              onChange={(e) => handleFacilityPriceChange(facIdStr, Number(e.target.value))}
                                              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-955 px-2 py-1 text-xs font-bold text-zinc-900 dark:text-zinc-50 disabled:opacity-40 focus:border-[#D4AF37]"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Uncategorized Facilities Section */}
                        {(() => {
                          const categorizedIds = new Set(facilityCategories.map(c => c.id));
                          const categorizedNames = new Set(facilityCategories.map(c => c.name.toLowerCase()));
                          const uncategorized = facilities.filter(f =>
                            (!f.category_id || !categorizedIds.has(f.category_id)) &&
                            (!f.category || !categorizedNames.has(f.category.toLowerCase()))
                          );

                          if (uncategorized.length === 0) return null;

                          return (
                            <div className="space-y-2 p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-955/40 border border-zinc-200/80 dark:border-zinc-800">
                              <div className="flex items-center gap-2 pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
                                <div className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                  <Box className="h-3.5 w-3.5" />
                                </div>
                                <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">General Facilities</h6>
                                <Badge variant="outline" className="text-[9px] font-bold text-zinc-400 ml-auto border-zinc-300 dark:border-zinc-700">
                                  {uncategorized.length} Item{uncategorized.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 gap-2 pt-1">
                                {uncategorized.map(fac => {
                                  const facIdStr = String(fac.id);
                                  const isSelected = resSelectedFacilityIds.includes(facIdStr);
                                  const unitPrice = resFacilityPrices[facIdStr] !== undefined ? resFacilityPrices[facIdStr] : (fac.price || 100000);
                                  const currentPricingType = resFacilityPricingTypes[facIdStr] || (
                                    fac.pricing_type === 'PER_HEAD' || fac.pricing_type === 'PER_PERSON' || fac.pricing_type === 'HEADCOUNT' ? 'PER_HEAD' : 'FIXED'
                                  );
                                  const isPerHead = currentPricingType === 'PER_HEAD';
                                  const calculatedTotal = isPerHead ? unitPrice * (resGuests || 1) : unitPrice;
                                  const FacIcon = getFacilityIconComponent(fac.icon_name, fac.name, fac.category);

                                  return (
                                    <div
                                      key={fac.id}
                                      className={`p-3 rounded-xl border transition-all ${isSelected
                                        ? 'border-[#D4AF37] bg-amber-500/5 dark:bg-amber-550/10 shadow-2xs'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                                      }`}
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-zinc-900 dark:text-zinc-100 flex-1 min-w-0">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleFacilitySelection(facIdStr, fac.price || 100000, fac.pricing_type || 'FIXED')}
                                            className="rounded border-zinc-300 dark:border-zinc-700 accent-[#D4AF37] h-4 w-4 cursor-pointer shrink-0 mt-0.5"
                                          />
                                          <FacIcon className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                          <div className="truncate">
                                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                              <span>{fac.name}</span>
                                              {isSelected && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                                  Total: UGX {calculatedTotal.toLocaleString()}
                                                </span>
                                              )}
                                            </div>
                                            {fac.description && (
                                              <div className="text-[10px] font-normal text-zinc-450 dark:text-zinc-500 truncate mt-0.5">{fac.description}</div>
                                            )}
                                          </div>
                                        </label>

                                        <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                                          <button
                                            type="button"
                                            disabled={!isSelected}
                                            onClick={() => handleFacilityPricingTypeChange(facIdStr, isPerHead ? 'FIXED' : 'PER_HEAD')}
                                            className={`text-[9px] font-extrabold px-2 py-1 rounded-lg border uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-40 ${
                                              isPerHead
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                                            }`}
                                            title={isPerHead ? `Unit Price UGX ${unitPrice.toLocaleString()} × ${resGuests} guests` : 'Flat Fixed Fee'}
                                          >
                                            {isPerHead ? `Per Head (×${resGuests})` : 'Fixed Fee'}
                                          </button>

                                          <div className="flex items-center gap-1 w-28">
                                            <span className="text-[10px] font-bold text-zinc-450">UGX</span>
                                            <input
                                              type="number"
                                              min={0}
                                              disabled={!isSelected}
                                              value={unitPrice}
                                              onChange={(e) => handleFacilityPriceChange(facIdStr, Number(e.target.value))}
                                              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-955 px-2 py-1 text-xs font-bold text-zinc-900 dark:text-zinc-50 disabled:opacity-40 focus:border-[#D4AF37]"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Payment Method *</label>
                        <select
                          value={resPaymentMethod}
                          onChange={(e) => setResPaymentMethod(e.target.value as any)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold cursor-pointer"
                        >
                          <option value="contract_invoice" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Organisation Contract-Invoice</option>
                          <option value="cash" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Cash / Self Payment</option>
                          <option value="bank_transfer" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Bank Transfer</option>
                          <option value="card" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Card</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Payment Status *</label>
                        <select
                          value={resPaymentStatus}
                          onChange={(e) => setResPaymentStatus(e.target.value as any)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold cursor-pointer"
                        >
                          <option value="Pending" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Pending Invoice</option>
                          <option value="Paid" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Paid Full</option>
                          <option value="PartiallyPaid" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Partially Paid</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE PRICING CALCULATION SUMMARY CARD */}
              {(() => {
                const totals = calculateLiveReservationTotal();
                return (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Live Package Price Breakdown</span>
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {totals.selectedHall ? `${totals.selectedHall.name} • ` : ''}Headcount: {totals.headcount} people
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 pt-1">
                      <div>Hall Rental: <span className="font-bold text-foreground dark:text-zinc-100">UGX {totals.hallPrice.toLocaleString()}</span></div>
                      {totals.teaLunchCost > 0 && (
                        <div>Tea & Lunch: <span className="font-bold text-foreground dark:text-zinc-100">UGX {totals.teaLunchCost.toLocaleString()}</span></div>
                      )}
                      {totals.eveningTeaCost > 0 && (
                        <div>Evening Tea: <span className="font-bold text-foreground dark:text-zinc-100">UGX {totals.eveningTeaCost.toLocaleString()}</span></div>
                      )}
                      {totals.paSystemCost > 0 && (
                        <div>PA System: <span className="font-bold text-foreground dark:text-zinc-100">UGX {totals.paSystemCost.toLocaleString()}</span></div>
                      )}
                      {totals.projectorCost > 0 && (
                        <div>Projector: <span className="font-bold text-foreground dark:text-zinc-100">UGX {totals.projectorCost.toLocaleString()}</span></div>
                      )}
                      {totals.selectedFacilityBreakdown.map(f => (
                        <div key={f.id}>
                          {f.name}: <span className="font-bold text-foreground dark:text-zinc-100">UGX {f.price.toLocaleString()}</span>
                          {f.isPerHead && <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold ml-1">(×{totals.headcount})</span>}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Net Excl. VAT: </span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">UGX {totals.netAmount.toLocaleString()}</span>
                        <span className="mx-2 text-zinc-400">•</span>
                        <span className="text-zinc-500 dark:text-zinc-400">VAT (18%): </span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">UGX {totals.vatAmount.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">Total Base Price</span>
                        <span className="text-lg font-extrabold text-[#D4AF37] dark:text-amber-400">
                          UGX {totals.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Special Notes & Drawer Footer */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Special Seating / Contract Notes</label>
                <textarea
                  placeholder="Extra seating layout details, contract references, dietary specifications..."
                  rows={2}
                  value={resSpecialRequests}
                  onChange={(e) => setResSpecialRequests(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-foreground dark:text-zinc-100 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 leading-normal font-medium resize-none"
                />
              </div>

              {/* Drawer Footer Buttons */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-3 bg-white dark:bg-zinc-900">
                <ShadcnButton
                  type="button"
                  onClick={() => setIsResDrawerOpen(false)}
                  variant="outline"
                  className="rounded-xl px-5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 h-11 cursor-pointer"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  className="rounded-xl px-6 text-xs font-extrabold bg-[#C5A880] hover:bg-[#b3976f] text-[#0A192F] h-11 cursor-pointer shadow-md transition-all"
                >
                  Book Venue & Submit Invoice
                </ShadcnButton>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Update Reservation Sliding Drawer */}
      {/* Update Reservation Sliding Drawer */}
      {selectedQuote && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedQuote(null)}
            className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-md transition-opacity duration-300"
          />

          {/* Slide-out Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl md:max-w-3xl lg:max-w-4xl bg-card text-card-foreground dark:bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-zinc-200 dark:border-zinc-800 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Reservation Details</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold mt-1">Review event specifications and update reservation status & payments.</p>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-zinc-450 hover:bg-zinc-800 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-zinc-900">

              {/* Event Specs Panel */}
              <div className="bg-zinc-50 dark:bg-zinc-950/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Event Information</h5>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Event / Company</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{selectedQuote.companyName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Venue Hall</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{selectedQuote.hallName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Client Contact</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{selectedQuote.clientName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Contact Email</span>
                    <span className="text-zinc-900 dark:text-zinc-100 truncate block">{selectedQuote.email}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Date & Duration</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{selectedQuote.date} ({selectedQuote.daysCount} Days)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Scheduled Time</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{selectedQuote.startTime?.slice(0, 5) || '08:00'} - {selectedQuote.endTime?.slice(0, 5) || '17:00'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Expected Headcount</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{selectedQuote.guestsCount} Guests</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Catering Package</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{selectedQuote.cateringOption}</span>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Technical Overlays</span>
                  <div className="flex gap-2.5 mt-1">
                    {selectedQuote.soundSystem && (
                      <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-2 bg-violet-50 dark:bg-violet-955/20 border-violet-200 dark:border-violet-900/50 text-violet-600 dark:text-violet-400 rounded-md">
                        Sound PA System
                      </Badge>
                    )}
                    {selectedQuote.projector && (
                      <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-2 bg-indigo-50 dark:bg-indigo-955/20 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-md">
                        HD Projector Display
                      </Badge>
                    )}
                    {!selectedQuote.soundSystem && !selectedQuote.projector && (
                      <span className="text-xs text-zinc-450 dark:text-zinc-500 font-medium">None</span>
                    )}
                  </div>
                </div>
                {selectedQuote.specialRequests && (
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Special Requests</span>
                    <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed font-medium mt-1 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800">
                      {selectedQuote.specialRequests}
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="bg-zinc-50 dark:bg-zinc-950/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Financial Summary</h5>
                <div className="grid grid-cols-3 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Total Cost</span>
                    <span className="text-zinc-955 dark:text-zinc-100 font-extrabold">UGX {selectedQuote.totalCostUGX.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Paid Amount</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">UGX {(selectedQuote.amountPaid || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-450 block text-[9px] font-bold uppercase">Balance Due</span>
                    <span className="text-red-500 dark:text-red-400 font-extrabold">UGX {(selectedQuote.balanceDue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Editor Form */}
              <form onSubmit={handleUpdateReservationSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Quick Actions</h5>
                  <div className="flex items-center gap-2">
                    <ShadcnButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditStatus('Approved');
                      }}
                      className={`h-8 rounded-xl text-xs font-bold gap-1 cursor-pointer transition-colors ${
                        editStatus === 'Approved'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-955/30'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </ShadcnButton>
                    <ShadcnButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditStatus('Declined');
                      }}
                      className={`h-8 rounded-xl text-xs font-bold gap-1 cursor-pointer transition-colors ${
                        editStatus === 'Declined'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/30'
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </ShadcnButton>
                    <ShadcnButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditPaymentStatus('Paid');
                        setEditAmountPaid(selectedQuote.totalCostUGX);
                      }}
                      className={`h-8 rounded-xl text-xs font-bold gap-1 cursor-pointer transition-colors ${
                        editPaymentStatus === 'Paid'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-955/30'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Mark Full Payment
                    </ShadcnButton>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Booking Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold cursor-pointer"
                    >
                      <option value="Pending" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Pending</option>
                      <option value="Approved" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Approved</option>
                      <option value="Declined" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Declined</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Payment Status</label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold cursor-pointer"
                    >
                      <option value="Pending" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Pending</option>
                      <option value="Paid" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Paid</option>
                      <option value="PartiallyPaid" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Partially Paid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Amount Paid (UGX)</label>
                  <input
                    type="number"
                    min={0}
                    max={selectedQuote.totalCostUGX}
                    value={editAmountPaid}
                    onChange={(e) => setEditAmountPaid(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-white dark:bg-zinc-900">
                  <ShadcnButton
                    type="button"
                    onClick={() => setSelectedQuote(null)}
                    variant="outline"
                    className="rounded-xl px-4.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 cursor-pointer h-10"
                  >
                    Cancel
                  </ShadcnButton>
                  <ShadcnButton
                    type="submit"
                    className="rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer h-10 shadow-xs dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
                  >
                    Save Changes
                  </ShadcnButton>
                </div>
              </form>

            </div>
          </div>
        </>
      )}
      {/* Event Create / Edit Drawer */}
      {isEventDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setIsEventDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {editingEventId ? 'Edit Event Package' : 'Create New Event'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Configure event details, cover image, pricing, and discount offers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEventDrawerOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEventFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Event Name *
                </label>
                <ShadcnInput
                  type="text"
                  required
                  placeholder="e.g. Seyeya Annual Nile Gala & Dinner"
                  value={eventFormName}
                  onChange={(e) => setEventFormName(e.target.value)}
                  className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs h-10 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Cover Photo / Image URL
                </label>
                <ShadcnInput
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={eventFormPhoto}
                  onChange={(e) => setEventFormPhoto(e.target.value)}
                  className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs h-10 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
                {eventFormPhoto && (
                  <div className="mt-2 h-32 w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100">
                    <img src={eventFormPhoto} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Original Price (UGX) *
                  </label>
                  <ShadcnInput
                    type="number"
                    required
                    min={0}
                    placeholder="e.g. 500000"
                    value={eventFormPriceUGX}
                    onChange={(e) => setEventFormPriceUGX(e.target.value)}
                    className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs h-10 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Discount Amount (UGX)
                  </label>
                  <ShadcnInput
                    type="number"
                    min={0}
                    placeholder="e.g. 50000"
                    value={eventFormDiscountUGX}
                    onChange={(e) => setEventFormDiscountUGX(e.target.value)}
                    className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs h-10 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {/* Net Price Preview */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Net Event Rate Preview</span>
                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatPrice(Math.max(0, Number(eventFormPriceUGX || 0) - Number(eventFormDiscountUGX || 0)))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Event Date
                  </label>
                  <ShadcnInput
                    type="date"
                    value={eventFormDate}
                    onChange={(e) => setEventFormDate(e.target.value)}
                    className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs h-10 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Location / Venue
                  </label>
                  <ShadcnInput
                    type="text"
                    placeholder="e.g. Seyeya Nile Lawn"
                    value={eventFormLocation}
                    onChange={(e) => setEventFormLocation(e.target.value)}
                    className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs h-10 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Max Capacity (Attendees)
                </label>
                <ShadcnInput
                  type="number"
                  min={1}
                  placeholder="e.g. 150"
                  value={eventFormCapacity}
                  onChange={(e) => setEventFormCapacity(e.target.value)}
                  className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs h-10 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Event Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe event highlights, inclusions, and program timing..."
                  value={eventFormDescription}
                  onChange={(e) => setEventFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-hidden focus:border-zinc-955"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="eventFormIsActive"
                  checked={eventFormIsActive}
                  onChange={(e) => setEventFormIsActive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <label htmlFor="eventFormIsActive" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  Event Package is Active & Available for Booking
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                <ShadcnButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsEventDrawerOpen(false)}
                  className="rounded-xl px-4 text-xs font-bold h-10"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  className="rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground h-10 shadow-xs dark:bg-zinc-800! dark:text-white!"
                >
                  {editingEventId ? 'Save Changes' : 'Create Event'}
                </ShadcnButton>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Create / Edit Facility Drawer */}
      {isFacilityDrawerOpen && (
        <>
          <div
            onClick={() => setIsFacilityDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slide-in">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {editingFacilityId ? 'Edit Facility Option' : 'Add New Facility'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Configure technical inclusions, catering options, or event services.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFacilityDrawerOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Form */}
            <form onSubmit={handleFacilityFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Facility Name *
                </label>
                <ShadcnInput
                  type="text"
                  required
                  placeholder="e.g. Catering Services or Public Address System"
                  value={facilityFormName}
                  onChange={(e) => setFacilityFormName(e.target.value)}
                  className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs h-10 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Category *
                </label>
                {facilityCategories.length > 0 ? (
                  <select
                    value={facilityFormCategoryId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setFacilityFormCategoryId(val);
                      const found = facilityCategories.find(c => c.id === val);
                      if (found) setFacilityFormCategory(found.name);
                    }}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs text-zinc-900 dark:text-zinc-50 outline-hidden focus:border-zinc-955 cursor-pointer font-medium"
                  >
                    <option value="">No Category / General</option>
                    {facilityCategories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={facilityFormCategory}
                    onChange={(e) => setFacilityFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs text-zinc-900 dark:text-zinc-50 outline-hidden focus:border-zinc-955 cursor-pointer font-medium"
                  >
                    <option value="Audio/Visual" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">Audio/Visual</option>
                    <option value="Catering & Dining" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">Catering & Dining</option>
                    <option value="Staging & Hall" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">Staging & Hall</option>
                    <option value="Connectivity" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">Connectivity</option>
                    <option value="General Services" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">General Services</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Preset / Standard Price (UGX)
                  </label>
                  <ShadcnInput
                    type="number"
                    min={0}
                    placeholder="e.g. 100000"
                    value={facilityFormPriceUGX}
                    onChange={(e) => setFacilityFormPriceUGX(e.target.value)}
                    className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs h-10 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Pricing Type
                  </label>
                  <select
                    value={facilityFormPricingType}
                    onChange={(e) => setFacilityFormPricingType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs text-zinc-900 dark:text-zinc-50 outline-hidden focus:border-zinc-955 cursor-pointer font-medium"
                  >
                    <option value="FIXED">FIXED (Flat Rate)</option>
                    <option value="PER_PERSON">PER_PERSON (Per Head)</option>
                    <option value="PER_HOUR">PER_HOUR (Hourly Rate)</option>
                    <option value="PER_DAY">PER_DAY (Daily Rate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Icon Visual
                </label>
                <select
                  value={facilityFormIcon}
                  onChange={(e) => setFacilityFormIcon(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs text-zinc-900 dark:text-zinc-50 outline-hidden focus:border-zinc-955 cursor-pointer font-medium"
                >
                  <option value="Sparkles">Sparkles (General)</option>
                  <option value="Folder">Folder (Category Default)</option>
                  <option value="Utensils">Utensils (Food / Dining)</option>
                  <option value="Volume2">Volume2 (PA Sound System)</option>
                  <option value="Video">Video (Projector / Screen)</option>
                  <option value="Wifi">Wifi (Internet)</option>
                  <option value="Mic">Mic (Podium / Stage)</option>
                  <option value="Zap">Zap (Lighting / Power)</option>
                  <option value="Coffee">Coffee (Refreshments)</option>
                  <option value="Layers">Layers (General Services)</option>
                  <option value="Box">Box (Equipment Package)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe facility specs, inclusions, or operational details..."
                  value={facilityFormDescription}
                  onChange={(e) => setFacilityFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-hidden focus:border-zinc-955"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="facilityFormIsActive"
                  checked={facilityFormIsActive}
                  onChange={(e) => setFacilityFormIsActive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <label htmlFor="facilityFormIsActive" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  Facility Option is Active & Selectable in Bookings
                </label>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                <ShadcnButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsFacilityDrawerOpen(false)}
                  className="rounded-xl px-4 text-xs font-bold h-10 cursor-pointer"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  className="rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground h-10 shadow-xs cursor-pointer dark:bg-zinc-800! dark:text-white!"
                >
                  {editingFacilityId ? 'Save Changes' : 'Create Facility'}
                </ShadcnButton>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Create / Edit Facility Category Drawer */}
      {isCategoryDrawerOpen && (
        <>
          <div
            onClick={() => setIsCategoryDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slide-in">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {editingCategoryId ? 'Edit Facility Category' : 'Create Facility Category'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Set up a category group for conference inclusions and equipment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryDrawerOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Form */}
            <form onSubmit={handleCategoryFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Category Name *
                </label>
                <ShadcnInput
                  type="text"
                  required
                  placeholder="e.g. Audio/Visual Equipment or Catering Services"
                  value={categoryFormName}
                  onChange={(e) => setCategoryFormName(e.target.value)}
                  className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs h-10 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Icon Visual
                </label>
                <select
                  value={categoryFormIcon}
                  onChange={(e) => setCategoryFormIcon(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs text-zinc-900 dark:text-zinc-50 outline-hidden focus:border-zinc-955 cursor-pointer font-medium"
                >
                  <option value="Folder">Folder (Default Category)</option>
                  <option value="Volume2">Volume2 (PA & Sound System)</option>
                  <option value="Video">Video (Projectors & Screens)</option>
                  <option value="Utensils">Utensils (Catering & Meals)</option>
                  <option value="Wifi">Wifi (Internet & Connectivity)</option>
                  <option value="Mic">Mic (Staging & Podium)</option>
                  <option value="Zap">Zap (Lighting & Power)</option>
                  <option value="Coffee">Coffee (Beverages & Snacks)</option>
                  <option value="Layers">Layers (General Services)</option>
                  <option value="Box">Box (Equipment Package)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what facilities or equipment belong in this category..."
                  value={categoryFormDescription}
                  onChange={(e) => setCategoryFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-hidden focus:border-zinc-955"
                />
              </div>

              {/* Assign Facilities Checkboxes */}
              {facilities.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Assign Facilities to this Category
                  </label>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2 max-h-44 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20">
                    {facilities.map((fac) => {
                      const isSelected = categoryFormFacilityIds.includes(fac.facility_id);
                      return (
                        <label key={fac.id} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-primary">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCategoryFormFacilityId(fac.facility_id)}
                            className="rounded border-zinc-300 dark:border-zinc-700 accent-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="truncate">{fac.name}</span>
                          {fac.category && (
                            <span className="text-[10px] text-zinc-400 ml-auto shrink-0">({fac.category})</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="categoryFormIsActive"
                  checked={categoryFormIsActive}
                  onChange={(e) => setCategoryFormIsActive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <label htmlFor="categoryFormIsActive" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  Category is Active & Visible
                </label>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                <ShadcnButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryDrawerOpen(false)}
                  className="rounded-xl px-4 text-xs font-bold h-10 cursor-pointer"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  className="rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground h-10 shadow-xs cursor-pointer dark:bg-zinc-800! dark:text-white!"
                >
                  {editingCategoryId ? 'Save Changes' : 'Create Category'}
                </ShadcnButton>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Conferences;

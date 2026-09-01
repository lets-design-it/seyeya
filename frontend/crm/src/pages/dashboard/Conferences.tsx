import React, { useState } from 'react';
import { useConference, ConferenceQuote, EventHall, ConferenceEventItem, ConferenceFacilityItem } from '../../hooks/useConference';
import { useCurrency } from '../../context/CurrencyContext';
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
  Layers
} from 'lucide-react';

interface ConferencesProps {
  activeTab?: 'quotes' | 'halls' | 'events' | 'facilities';
  setActiveTab?: (tab: 'quotes' | 'halls' | 'events' | 'facilities') => void;
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
    isLoading,
    updateQuoteStatus,
    addConferenceHall,
    addEvent,
    updateEvent,
    deleteEvent,
    addFacility,
    updateFacility,
    deleteFacility,
    customers,
    createReservation
  } = useConference();

  const [localActiveTab, localSetActiveTab] = useState<'quotes' | 'halls' | 'events' | 'facilities'>('quotes');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || localSetActiveTab;

  // Selected facilities in Book Event Drawer
  const [selectedFacilityNames, setSelectedFacilityNames] = useState<string[]>(['Public Address System', 'HD Projector & Screen']);

  // Facilities State & Drawer
  const [facilitySearchTerm, setFacilitySearchTerm] = useState('');
  const [facilityCategoryFilter, setFacilityCategoryFilter] = useState('All');
  const [isFacilityDrawerOpen, setIsFacilityDrawerOpen] = useState(false);
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [facilityFormName, setFacilityFormName] = useState('');
  const [facilityFormCategory, setFacilityFormCategory] = useState('General Services');
  const [facilityFormDescription, setFacilityFormDescription] = useState('');
  const [facilityFormIcon, setFacilityFormIcon] = useState('Sparkles');
  const [facilityFormIsActive, setFacilityFormIsActive] = useState(true);

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
  const [newHallDescription, setNewHallDescription] = useState('');
  const [newHallAmenities, setNewHallAmenities] = useState('');

  // Add Reservation Drawer State
  const [isResDrawerOpen, setIsResDrawerOpen] = useState(false);
  const [resCustomerId, setResCustomerId] = useState('new');
  const [resClientName, setResClientName] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resHallId, setResHallId] = useState('');
  const [resEventName, setResEventName] = useState('');
  const [resEventDate, setResEventDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [resStartTime, setResStartTime] = useState('08:00');
  const [resEndTime, setResEndTime] = useState('17:00');
  const [resGuests, setResGuests] = useState<number>(100);
  const [resBookingType, setResBookingType] = useState('FullDay');
  const [resSpecialRequests, setResSpecialRequests] = useState('');
  const [resSoundSystem, setResSoundSystem] = useState(false);
  const [resProjector, setResProjector] = useState(false);
  const [resCateringOption, setResCateringOption] = useState<'None' | 'Standard Breakfast' | 'Executive Full Day'>('None');

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
      await addConferenceHall({
        hall_name: newHallName.trim(),
        capacity: Number(newHallCapacity),
        hourly_rate: Number(newHallHourly || 0),
        half_day_rate: Number(newHallHalfDay || 0),
        full_day_rate: Number(newHallFullDay || 0),
        description: newHallDescription.trim(),
        amenities: newHallAmenities.trim()
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
      await createReservation({
        customer_id: resCustomerId !== 'new' ? Number(resCustomerId) : undefined,
        clientName: resClientName.trim() || undefined,
        email: resEmail.trim() || undefined,
        hall_id: Number(resHallId),
        event_name: resEventName.trim(),
        event_date: resEventDate,
        start_time: resStartTime,
        end_time: resEndTime,
        num_participants: resGuests,
        booking_type: resBookingType,
        special_requests: resSpecialRequests.trim(),
        soundSystem: resSoundSystem,
        projector: resProjector,
        cateringOption: resCateringOption
      });

      // Clear form
      setResCustomerId('new');
      setResClientName('');
      setResEmail('');
      setResHallId('');
      setResEventName('');
      setResEventDate(new Date().toISOString().split('T')[0]);
      setResStartTime('08:00');
      setResEndTime('17:00');
      setResGuests(100);
      setResBookingType('FullDay');
      setResSpecialRequests('');
      setResSoundSystem(false);
      setResProjector(false);
      setResCateringOption('None');
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

  const openCreateFacilityDrawer = () => {
    setEditingFacilityId(null);
    setFacilityFormName('');
    setFacilityFormCategory('General Services');
    setFacilityFormDescription('');
    setFacilityFormIcon('Sparkles');
    setFacilityFormIsActive(true);
    setIsFacilityDrawerOpen(true);
  };

  const openEditFacilityDrawer = (fac: ConferenceFacilityItem) => {
    setEditingFacilityId(fac.id);
    setFacilityFormName(fac.name);
    setFacilityFormCategory(fac.category);
    setFacilityFormDescription(fac.description || '');
    setFacilityFormIcon(fac.icon_name || 'Sparkles');
    setFacilityFormIsActive(fac.is_active);
    setIsFacilityDrawerOpen(true);
  };

  const handleFacilityFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityFormName.trim()) return;

    const payload = {
      name: facilityFormName.trim(),
      category: facilityFormCategory,
      description: facilityFormDescription.trim(),
      icon_name: facilityFormIcon,
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
    const matchesCategory = facilityCategoryFilter === 'All' || fac.category === facilityCategoryFilter;
    return matchesSearch && matchesCategory;
  });

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
            {activeTab === 'facilities' 
              ? 'Conference Facilities & Inclusions' 
              : activeTab === 'events' 
                ? 'Events & Gala Packages' 
                : activeTab === 'halls' 
                  ? 'Event Halls Catalog' 
                  : 'Conferences & Reservations'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {activeTab === 'facilities'
              ? 'Manage equipment, PA sound systems, catering, A/V setups, and inclusions for event bookings.'
              : activeTab === 'events' 
                ? 'Manage special events, gala packages, pricing options, discounts, and event schedules.'
                : 'Review quotes, configure seating specifications, manage venue halls, and approve facility bookings.'
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Selector Pills */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('quotes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'quotes'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Reservations
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('halls')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'halls'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Event Halls
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Events
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('facilities')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'facilities'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Facilities
            </button>
          </div>

          {/* Action Button */}
          {activeTab === 'quotes' ? (
            <ShadcnButton
              onClick={() => setIsResDrawerOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-xs border-none select-none shrink-0 dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
            >
              <Plus className="h-4 w-4" />
              Book Event
            </ShadcnButton>
          ) : activeTab === 'halls' ? (
            <ShadcnButton
              onClick={() => setIsAddDrawerOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-xs border-none select-none shrink-0 dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
            >
              <Plus className="h-4 w-4" />
              Add Hall
            </ShadcnButton>
          ) : activeTab === 'events' ? (
            <ShadcnButton
              onClick={openCreateEventDrawer}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-xs border-none select-none shrink-0 dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
            >
              <Plus className="h-4 w-4" />
              Create Event
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

      {activeTab === 'facilities' ? (
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
                    {Array.from(new Set(facilities.map(f => f.category))).length}
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
                  <SelectTrigger className="!flex !items-center !justify-between !h-10 !px-4 !rounded-xl !border-zinc-200 dark:!border-zinc-800 !bg-white dark:!bg-zinc-900 !text-xs !font-bold !w-44">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 z-50">
                    <SelectItem value="All" className="text-xs">All Categories</SelectItem>
                    <SelectItem value="Audio/Visual" className="text-xs">Audio/Visual</SelectItem>
                    <SelectItem value="Catering & Dining" className="text-xs">Catering & Dining</SelectItem>
                    <SelectItem value="Staging & Hall" className="text-xs">Staging & Hall</SelectItem>
                    <SelectItem value="Connectivity" className="text-xs">Connectivity</SelectItem>
                    <SelectItem value="General Services" className="text-xs">General Services</SelectItem>
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
                            <Badge variant="outline" className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 mt-1">
                              {fac.category}
                            </Badge>
                          </div>
                        </div>

                        <Badge className={`font-bold text-[10px] px-2 py-0.5 rounded-lg border-none ${
                          fac.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'
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
                              SAVE {formatPrice(ev.discount, { compact: true })}
                            </Badge>
                          )}
                          <Badge className={`font-bold text-[10px] px-2.5 py-0.5 rounded-lg shadow-xs border-none ${
                            ev.is_active 
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
      ) : (
        <>
          {/* Quotes and Halls Filter Section */}
          <Card className="p-4 bg-card border border-border dark:border-zinc-800 rounded-2xl shadow-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                {/* Search filter */}
                {activeTab === 'quotes' ? (
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
                ) : (
                  <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <ShadcnInput
                      type="text"
                      placeholder="Search venue halls by name, description or amenities..."
                      value={hallSearchTerm}
                      onChange={(e) => setHallSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 pl-10 pr-4 text-xs text-foreground placeholder-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 focus-visible:border-zinc-955 outline-hidden transition-all"
                    />
                  </div>
                )}

                {/* Reset Button */}
                {((activeTab === 'quotes' && (searchTerm || filter !== 'All')) ||
                  (activeTab === 'halls' && hallSearchTerm)) && (
                    <ShadcnButton
                      onClick={() => {
                        setSearchTerm('');
                        setFilter('All');
                        setHallSearchTerm('');
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
                {activeTab === 'quotes' ? (
                  <>
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
                        <ShadcnButton variant="outline" className="flex items-center justify-between h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300 cursor-pointer text-xs font-bold shadow-xs w-36 transition-all">
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
                  </>
                ) : (
                  <>
                    {/* Halls Columns Selector */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <ShadcnButton variant="outline" className="flex items-center justify-between h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300 cursor-pointer text-xs font-bold shadow-xs w-36 transition-all">
                          <span className="flex items-center gap-1.5">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Columns
                          </span>
                          <ChevronDown className="h-4 w-4 text-zinc-500" />
                        </ShadcnButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[170px] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-md p-1.5 mt-1 z-50">
                        {hallsTable
                          .getAllColumns()
                          .filter((column) => column.getCanHide())
                          .map((column) => (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              className="capitalize text-xs font-semibold cursor-pointer rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            >
                              {column.id === 'name'
                                ? 'Hall Name'
                                : column.id === 'capacity'
                                  ? 'Capacity'
                                  : column.id === 'hourly_rate'
                                    ? 'Hourly'
                                    : column.id === 'half_day_rate'
                                      ? 'Half Day'
                                      : column.id === 'full_day_rate'
                                        ? 'Full Day'
                                        : column.id === 'amenities'
                                          ? 'Amenities'
                                          : column.id}
                            </DropdownMenuCheckboxItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
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
            ) : activeTab === 'quotes' ? (
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
                          className="hover:bg-zinc-50/20 dark:hover:bg-zinc-850/40 transition-colors border-zinc-100 dark:border-zinc-800"
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
            ) : (
              // Halls Directory Table View
              filteredHalls.length === 0 ? (
                <div className="text-center py-20">
                  <Building className="h-9 w-9 mx-auto text-zinc-400 mb-3 animate-pulse" />
                  <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-350 uppercase tracking-wider">No facility halls found</h5>
                  <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                    No conference or board room structures have been configured yet. Let's create your first hall setup.
                  </p>
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader className="bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-800">
                      {hallsTable.getHeaderGroups().map((headerGroup) => (
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
                      {hallsTable.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="hover:bg-zinc-50/20 dark:hover:bg-zinc-850/40 transition-colors border-zinc-100 dark:border-zinc-800"
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
                  {hallsTable.getPageCount() > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex-1 text-zinc-450 dark:text-zinc-400 font-bold">
                        Showing {hallsTable.getRowModel().rows.length} of {filteredHalls.length} items
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">Page</span>
                          <strong className="text-zinc-900 dark:text-zinc-200 font-extrabold">
                            {hallsTable.getState().pagination.pageIndex + 1} of{' '}
                            {hallsTable.getPageCount()}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShadcnButton
                            variant="outline"
                            onClick={() => hallsTable.previousPage()}
                            disabled={!hallsTable.getCanPreviousPage()}
                            className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </ShadcnButton>
                          <ShadcnButton
                            variant="outline"
                            onClick={() => hallsTable.nextPage()}
                            disabled={!hallsTable.getCanNextPage()}
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

      {/* Add Hall Sliding Drawer */}
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 mb-1.5">Amenities (comma-separated)</label>
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
            className="fixed inset-0 z-50 bg-zinc-950/25 dark:bg-zinc-950/50 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Slide-out Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card text-card-foreground dark:bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-zinc-150 dark:border-zinc-800 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Book Conference / Event</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold mt-1">Reserve a venue hall and configure custom technical/seating requirements.</p>
              </div>
              <button
                onClick={() => setIsResDrawerOpen(false)}
                className="text-zinc-455 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddReservationSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-zinc-900">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Client Profile *</label>
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
                  <option value="new" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Create New Client Profile</option>
                  {customers.map(c => (
                    <option key={c.customer_id} value={String(c.customer_id)} className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">
                      {c.full_name} ({c.email || 'No email'})
                    </option>
                  ))}
                </select>
              </div>

              {resCustomerId === 'new' && (
                <div className="grid grid-cols-2 gap-3.5 animate-fade-in">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Venue Hall *</label>
                <select
                  required
                  value={resHallId}
                  onChange={(e) => setResHallId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold cursor-pointer"
                >
                  <option value="" disabled className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Select Venue...</option>
                  {halls.map(h => (
                    <option key={h.id} value={h.id} className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">
                      {h.name} (Max: {h.capacity} guests)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Event / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Corp AGM"
                    value={resEventName}
                    onChange={(e) => setResEventName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-3.5">
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

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Guests Headcount *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={resGuests}
                    onChange={(e) => setResGuests(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Booking Type *</label>
                  <select
                    required
                    value={resBookingType}
                    onChange={(e) => setResBookingType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold cursor-pointer"
                  >
                    <option value="Hourly" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Hourly Rate</option>
                    <option value="HalfDay" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Half Day Rate</option>
                    <option value="FullDay" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Full Day Rate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Catering Option</label>
                <select
                  value={resCateringOption}
                  onChange={(e) => setResCateringOption(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 font-semibold cursor-pointer"
                >
                  <option value="None" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">No Catering (Space only)</option>
                  <option value="Standard Breakfast" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Breakfast Buffet (UGX 25k/head)</option>
                  <option value="Executive Full Day" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Full Day Executive Catering (UGX 55k/head)</option>
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Facilities & Event Inclusions</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {facilities.map((fac) => {
                    const isSelected = selectedFacilityNames.includes(fac.name);
                    const FacIcon = getFacilityIconComponent(fac.icon_name, fac.name, fac.category);
                    return (
                      <button
                        key={fac.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFacilityNames(prev => prev.filter(n => n !== fac.name));
                          } else {
                            setSelectedFacilityNames(prev => [...prev, fac.name]);
                          }
                        }}
                        className={`rounded-xl border p-2.5 text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate mr-1">{fac.name}</span>
                        <FacIcon className="h-4 w-4 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Special Requests</label>
                <textarea
                  placeholder="Extra seating layout details, dietary restrictions, etc..."
                  rows={3}
                  value={resSpecialRequests}
                  onChange={(e) => setResSpecialRequests(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-100 outline-hidden focus:border-zinc-900 dark:focus:border-zinc-700 leading-normal font-medium resize-none"
                />
              </div>

              {/* Drawer Footer Buttons */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-white dark:bg-zinc-900">
                <ShadcnButton
                  type="button"
                  onClick={() => setIsResDrawerOpen(false)}
                  variant="outline"
                  className="rounded-xl px-4.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 cursor-pointer h-10"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  className="rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer h-10 shadow-xs dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
                >
                  Confirm Booking
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
            className="fixed inset-0 z-50 bg-zinc-950/25 dark:bg-zinc-950/50 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Slide-out Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card text-card-foreground dark:bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-zinc-150 dark:border-zinc-800 animate-slide-in">
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
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Update Booking Status</h5>

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
                  <option value="Utensils">Utensils (Food / Dining)</option>
                  <option value="Volume2">Volume2 (PA Sound System)</option>
                  <option value="Projector">Projector (Screen & Video)</option>
                  <option value="Wifi">Wifi (Internet)</option>
                  <option value="Mic">Mic (Podium / Stage)</option>
                  <option value="Zap">Zap (Lighting / Power)</option>
                  <option value="Coffee">Coffee (Refreshments)</option>
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
    </div>
  );
};

export default Conferences;

import React, { useState } from 'react';
import { useConference, ConferenceQuote, EventHall } from '../../hooks/useConference';
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
  Building
} from 'lucide-react';

export const Conferences: React.FC = () => {
  const {
    quotes,
    halls,
    isLoading,
    updateQuoteStatus,
    addConferenceHall,
    customers,
    createReservation
  } = useConference();

  const [activeTab, setActiveTab] = useState<'quotes' | 'halls'>('quotes');

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
          UGX {row.original.totalCostUGX.toLocaleString()}
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
          {row.original.hourly_rate ? `UGX ${row.original.hourly_rate.toLocaleString()}` : 'Free'}
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'half_day_rate',
      header: 'Half Day Rate',
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-zinc-750 dark:text-zinc-350">
          {row.original.half_day_rate ? `UGX ${row.original.half_day_rate.toLocaleString()}` : 'Free'}
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'full_day_rate',
      header: 'Full Day Rate',
      cell: ({ row }) => (
        <span className="font-extrabold text-xs text-zinc-950 dark:text-zinc-100">
          {row.original.full_day_rate ? `UGX ${row.original.full_day_rate.toLocaleString()}` : 'Free'}
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

  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Conferences</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Review quotes, configure seating specifications, manage venue halls, and approve facility bookings.</p>
        </div>
        {activeTab === 'quotes' ? (
          <ShadcnButton
            onClick={() => setIsResDrawerOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none select-none shrink-0 dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
          >
            <Plus className="h-4 w-4" />
            Book Event
          </ShadcnButton>
        ) : (
          <ShadcnButton
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none select-none shrink-0 dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
          >
            <Plus className="h-4 w-4" />
            Add Hall
          </ShadcnButton>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-150 gap-6">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${activeTab === 'quotes' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400 hover:text-zinc-605 dark:hover:text-zinc-300'
            }`}
        >
          Reservations
          {activeTab === 'quotes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 dark:bg-zinc-50 rounded-full animate-fade-in" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('halls')}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${activeTab === 'halls' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400 hover:text-zinc-605 dark:hover:text-zinc-300'
            }`}
        >
          Conference Halls
          {activeTab === 'halls' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 dark:bg-zinc-50 rounded-full animate-fade-in" />
          )}
        </button>
      </div>

      {/* Filter Section */}
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
                  onClick={resetFilters}
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
                  <SelectTrigger className="!flex !items-center !justify-between !h-10 !px-4 !rounded-xl !border-zinc-200 dark:!border-transparent !bg-white hover:!bg-zinc-50 !text-zinc-750 !cursor-pointer !text-xs !font-bold !shadow-xs !w-36 [&_svg]:!text-zinc-500 [&_svg]:!h-4 [&_svg]:!w-4 dark:bg-white! dark:text-black! dark:[&_svg]:text-black! dark:hover:bg-white/90!">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 z-50 shadow-md">
                    <SelectItem value="All" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 outline-hidden">
                      All Statuses
                    </SelectItem>
                    <SelectItem value="Pending" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 outline-hidden">
                      Pending
                    </SelectItem>
                    <SelectItem value="Approved" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 outline-hidden">
                      Approved
                    </SelectItem>
                    <SelectItem value="Declined" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 outline-hidden">
                      Declined
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Quotes Columns Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ShadcnButton variant="outline" className="flex items-center justify-between h-10 px-4 rounded-xl border border-zinc-200 dark:border-transparent bg-white hover:bg-zinc-50 text-zinc-750 cursor-pointer text-xs font-bold shadow-xs w-36 dark:bg-white! dark:text-black! dark:hover:bg-white/90!">
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
                          className="capitalize text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden flex items-center gap-2"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id === 'companyName'
                            ? 'Company'
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
                    <ShadcnButton variant="outline" className="flex items-center justify-between h-10 px-4 rounded-xl border border-zinc-200 dark:border-transparent bg-white hover:bg-zinc-50 text-zinc-750 cursor-pointer text-xs font-bold shadow-xs w-36 dark:bg-white! dark:text-black! dark:hover:bg-white/90!">
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
                          className="capitalize text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden flex items-center gap-2"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id === 'hourly_rate'
                            ? 'Hourly Rate'
                            : column.id === 'half_day_rate'
                              ? 'Half Day Rate'
                              : column.id === 'full_day_rate'
                                ? 'Full Day Rate'
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
                      onClick={() => setSelectedQuote(row.original)}
                      className="cursor-pointer hover:bg-zinc-50/20 dark:hover:bg-zinc-850/40 transition-colors border-zinc-100 dark:border-zinc-800"
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
                  className="rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer h-10 shadow-xs dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Technical Overlays</label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setResSoundSystem(!resSoundSystem)}
                    className={`rounded-xl border p-2.5 text-left flex items-center justify-between transition-colors ${resSoundSystem
                      ? 'border-violet-500/30 bg-violet-650/5 dark:bg-violet-950/20 text-violet-400'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                  >
                    <span className="text-xs font-bold">Sound PA System</span>
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setResProjector(!resProjector)}
                    className={`rounded-xl border p-2.5 text-left flex items-center justify-between transition-colors ${resProjector
                      ? 'border-indigo-500/30 bg-indigo-650/5 dark:bg-indigo-950/20 text-indigo-400'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                  >
                    <span className="text-xs font-bold">HD Projector Display</span>
                    <Video className="h-4 w-4" />
                  </button>
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
                  className="rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer h-10 shadow-xs dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
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
                    className="rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer h-10 shadow-xs dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
                  >
                    Save Changes
                  </ShadcnButton>
                </div>
              </form>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Conferences;

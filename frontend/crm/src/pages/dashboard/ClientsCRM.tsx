import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../services/api';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Guest360DossierSheet } from '../../components/Guest360DossierSheet';
import { RegisterGuestModal } from '../../components/RegisterGuestModal';
import {
  Search,
  X,
  Building,
  Mail,
  Phone,
  Clock,
  ChevronRight,
  ChevronLeft,
  Settings2,
  RefreshCw,
  Star,
  Award,
  Plus,
  User,
  Users,
  MapPin,
  Calendar
} from 'lucide-react';

interface BackendCustomer {
  customer_id: number;
  customer_code: string;
  full_name: string;
  phone_number: string | null;
  email: string | null;
  gender: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  address: string | null;
  nin: string | null;
  passport_number: string | null;
  customer_type: string;
  is_contract_client: boolean;
  is_active: boolean;
  is_child: boolean;
  parent_id?: number | null;
  total_spent: number;
  visit_count: number;
  loyalty_points: number;
  created_at: string;
}

interface CustomerProfile {
  customer_id: number;
  customer_code: string;
  full_name: string;
  phone_number: string | null;
  email: string | null;
  gender: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  address: string | null;
  nin: string | null;
  passport_number: string | null;
  customer_type: string;
  is_contract_client: boolean;
  is_active: boolean;
  is_child: boolean;
  parent_id?: number | null;
  total_spent: number;
  visit_count: number;
  loyalty_points: number;
  created_at: string;
  num_restaurant_orders: number;
  num_accommodation_reservations: number;
  num_conference_reservations: number;
  customer_tier: string | null;
  recent_transactions: Array<{
    type: string;
    reference_id: number;
    amount: number;
    currency: string;
    date: string;
    description: string | null;
  }>;
  reviews: string[];
}

export const ClientsCRM: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  // State
  const [guests, setGuests] = useState<BackendCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});

  // Details drawer states
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);
  const [guestProfile, setGuestProfile] = useState<CustomerProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Create customer modal state
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  // Pagination states
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Fetch CRM Customers
  const fetchGuests = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/crm/customers');
      setGuests(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'Failed to load guest CRM records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // Fetch Guest Details Profile
  const handleViewProfile = async (id: number) => {
    setSelectedGuestId(id);
    setGuestProfile(null);
    setIsProfileLoading(true);
    try {
      const res = await api.get(`/crm/customers/${id}/profile`);
      setGuestProfile(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProfileLoading(false);
    }
  };



  // Filtered list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (!searchTerm) return true;
      const query = searchTerm.toLowerCase();
      return (
        g.full_name.toLowerCase().includes(query) ||
        (g.email && g.email.toLowerCase().includes(query)) ||
        (g.phone_number && g.phone_number.includes(query)) ||
        (g.customer_code && g.customer_code.toLowerCase().includes(query))
      );
    });
  }, [guests, searchTerm]);

  // Reset page when filtering
  useEffect(() => {
    setPagination(p => ({ ...p, pageIndex: 0 }));
  }, [searchTerm]);

  // Table Columns
  const columns = useMemo<ColumnDef<BackendCustomer>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: "Guest Name",
        cell: ({ row }) => {
          const c = row.original;
          const initials = c.full_name
            ? c.full_name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
            : "G";
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-extrabold text-zinc-650 dark:text-zinc-350 shrink-0">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-zinc-850 dark:text-zinc-100 leading-tight">{c.full_name}</p>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg border uppercase tracking-wider shrink-0 ${c.is_child
                    ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                    : 'bg-indigo-50 dark:bg-indigo-955/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50'
                    }`}>
                    {c.is_child ? 'Child' : 'Adult'}
                  </span>
                </div>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-450 mt-0.5 font-bold uppercase tracking-wider">{c.customer_code}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Contact Info",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="space-y-0.5">
              <p className="text-zinc-700 dark:text-zinc-200 font-medium">{c.email || "No email"}</p>
              {c.phone_number && <p className="text-[10px] text-zinc-500 dark:text-zinc-450 font-bold">{c.phone_number}</p>}
            </div>
          );
        },
      },
      {
        accessorKey: "customer_type",
        header: "Account Category",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <Badge variant={c.is_contract_client ? "default" : "secondary"} className="text-[10px] font-bold rounded-lg px-2 bg-zinc-100 dark:bg-zinc-800 border-zinc-250 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                {c.customer_type}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "total_spent",
        header: "Lifetime Value",
        cell: ({ row }) => {
          const spent = Number(row.original.total_spent || 0);
          return (
            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs">
              {formatPrice(spent)}
            </span>
          );
        },
      },
      {
        accessorKey: "visit_count",
        header: "Visits / Points",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="space-y-0.5">
              <p className="text-zinc-750 dark:text-zinc-200 font-bold">{c.visit_count} visit(s)</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">{c.loyalty_points} Points</p>
            </div>
          );
        },
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
          const active = row.original.is_active;
          return (
            <Badge className={`text-[10px] font-bold rounded-lg border-none ${active ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-250 dark:hover:bg-zinc-700'}`}>
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          return (
            <div className="text-right">
              <ShadcnButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewProfile(row.original.customer_id);
                }}
                className="h-8 w-8 p-0 cursor-pointer rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              </ShadcnButton>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredGuests,
    columns,
    state: {
      pagination: { pageIndex, pageSize },
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6 animate-fade-in relative h-full text-foreground">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Guests</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage guest histories, timeline reviews, and loyalty rewards.</p>
        </div>
        <ShadcnButton
          onClick={() => setIsCreateDrawerOpen(true)}
          className="rounded-xl px-4.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer h-10 shadow-xs flex items-center gap-1.5 select-none shrink-0 self-end sm:self-auto dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
        >
          <Plus className="h-4 w-4" />
          Add Guest
        </ShadcnButton>
      </div>

      {/* Directory Table and Search controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-xs">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search guests by name, email, or guest code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 py-2 pl-10 pr-4 text-xs text-foreground placeholder-zinc-500 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <ShadcnButton
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                fetchGuests();
              }}
              className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer flex items-center gap-2 text-xs font-bold dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700! dark:border-transparent!"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </ShadcnButton>

            {/* Column Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ShadcnButton
                  variant="outline"
                  className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer flex items-center gap-2 text-xs font-bold dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700! dark:border-transparent!"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Columns
                </ShadcnButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-1 shadow-md">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="text-xs rounded-lg cursor-pointer py-1.5 px-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id === 'full_name' ? 'Guest Name' :
                          column.id === 'email' ? 'Contact Info' :
                            column.id === 'customer_type' ? 'Category' :
                              column.id === 'total_spent' ? 'Lifetime Value' :
                                column.id === 'visit_count' ? 'Visits/Points' :
                                  column.id === 'is_active' ? 'Status' : column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150 dark:border-zinc-800 overflow-hidden shadow-xs">
          {error && (
            <div className="p-4 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/50 flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-xs text-zinc-500 dark:text-zinc-400 font-semibold flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-zinc-500 dark:text-zinc-400" />
              <span>Loading guest directory...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-800">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="py-3.5 px-4 text-left text-xs font-bold text-zinc-650 dark:text-zinc-400 uppercase tracking-wider">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="py-16 text-center text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                        No guest history folders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        onClick={() => handleViewProfile(row.original.customer_id)}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 cursor-pointer border-b border-zinc-150 dark:border-zinc-800 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3.5 px-4 text-xs">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && guests.length > 0 && (
            <div className="flex items-center justify-between py-3 px-4 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20 text-xs text-zinc-500 dark:text-zinc-400 font-semibold select-none">
              <div className="flex items-center gap-1">
                <span>Page</span>
                <span className="text-zinc-800 dark:text-zinc-100 font-bold">{table.getState().pagination.pageIndex + 1}</span>
                <span>of</span>
                <span className="text-zinc-800 dark:text-zinc-100 font-bold">{table.getPageCount()}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShadcnButton
                  variant="outline"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:opacity-50 flex items-center text-xs font-semibold gap-1"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  Previous
                </ShadcnButton>
                <ShadcnButton
                  variant="outline"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:opacity-50 flex items-center text-xs font-semibold gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </ShadcnButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guest 360 Dossier Sheet */}
      <Guest360DossierSheet
        customerId={selectedGuestId}
        isOpen={selectedGuestId !== null}
        onClose={() => setSelectedGuestId(null)}
      />

      {/* Register Guest Modal */}
      <RegisterGuestModal
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onGuestCreated={fetchGuests}
        existingGuests={guests}
      />
    </div>
  );
};

export default ClientsCRM;

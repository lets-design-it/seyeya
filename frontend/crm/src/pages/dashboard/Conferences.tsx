import React, { useState } from 'react';
import { useConference, ConferenceQuote } from '../../hooks/useConference';
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
  CardContent,
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
  CalendarRange
} from 'lucide-react';

export const Conferences: React.FC = () => {
  const { quotes, updateQuoteStatus } = useConference();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Declined'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    date: true,
    companyName: true,
    clientName: true,
    hallName: true,
    guestsCount: true,
    cateringOption: true,
    avOverlay: true,
    totalCostUGX: true,
    status: true,
  });

  const getStatusBadge = (status: ConferenceQuote['status']) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Declined': return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilter('All');
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

  // Columns definition for TanStack table
  const columns = React.useMemo<ColumnDef<ConferenceQuote>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-zinc-700">
          {row.original.date}
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'companyName',
      header: 'Company',
      cell: ({ row }) => (
        <div className="font-bold text-xs text-zinc-950 leading-tight">
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
          <span className="font-semibold text-xs text-zinc-900 leading-none">
            {row.original.clientName}
          </span>
          <span className="text-[10px] text-zinc-450 font-semibold leading-none mt-1">
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
        <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 bg-zinc-50 border-zinc-200 text-zinc-650">
          {row.original.hallName}
        </Badge>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'guestsCount',
      header: 'Attendance',
      cell: ({ row }) => (
        <span className="text-zinc-750 font-medium text-xs flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          {row.original.guestsCount} Guests ({row.original.daysCount} Days)
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: 'cateringOption',
      header: 'Catering',
      cell: ({ row }) => (
        <span className="text-zinc-750 font-medium text-xs flex items-center gap-1.5">
          <Coffee className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
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
          <div className="flex gap-2 text-zinc-550">
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
            {!q.soundSystem && !q.projector && <span className="text-[10px] text-zinc-400">None</span>}
          </div>
        );
      },
      enableHiding: true,
    },
    {
      accessorKey: 'totalCostUGX',
      header: 'Agreed Pricing',
      cell: ({ row }) => (
        <span className="font-extrabold text-xs text-zinc-950">
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
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            getStatusBadge(row.original.status)
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
                className="h-7 w-7 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-500 cursor-pointer flex items-center justify-center shadow-xs"
                title="Decline Request"
              >
                <X className="h-3.5 w-3.5" />
              </ShadcnButton>
              <ShadcnButton
                onClick={() => updateQuoteStatus(quote.id, 'Approved')}
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-600 cursor-pointer flex items-center justify-center shadow-xs"
                title="Approve Request"
              >
                <Check className="h-3.5 w-3.5" />
              </ShadcnButton>
            </div>
          );
        }
        return (
          <span className="text-[10px] text-zinc-400 font-bold italic pl-2">Verified</span>
        );
      },
      enableHiding: false,
    }
  ], [quotes]);

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

  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-dark tracking-tight">Corporate Event Planner</h3>
          <p className="text-xs text-zinc-550">Review quotes, configure seating specifications, and approve event facility booking slots.</p>
        </div>
      </div>

      {/* Advanced Filter Section */}
      <Card className="p-4 bg-white border border-zinc-150 rounded-2xl shadow-xs">
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
                className="w-full rounded-xl border border-zinc-200 bg-white h-10 pl-10 pr-4 text-xs focus-visible:ring-1 focus-visible:ring-zinc-955 focus-visible:border-zinc-955 outline-hidden transition-all"
              />
            </div>

            {/* Reset Button */}
            {(searchTerm || filter !== 'All') && (
              <ShadcnButton
                onClick={resetFilters}
                variant="ghost"
                className="flex items-center gap-1 text-xs text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 rounded-xl h-10 px-3 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </ShadcnButton>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* Status Selector Dropdown */}
            <Select value={filter} onValueChange={(val: any) => setFilter(val)}>
              <SelectTrigger className="!flex !items-center !justify-between !h-10 !px-4 !rounded-xl !border-zinc-200 !bg-white hover:!bg-zinc-50 !text-zinc-750 !cursor-pointer !text-xs !font-bold !shadow-xs !w-36 [&_svg]:!text-zinc-500 [&_svg]:!h-4 [&_svg]:!w-4">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-zinc-200 rounded-xl p-1 z-50 shadow-md">
                <SelectItem value="All" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 outline-hidden">
                  All Statuses
                </SelectItem>
                <SelectItem value="Pending" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 outline-hidden">
                  Pending
                </SelectItem>
                <SelectItem value="Approved" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 outline-hidden">
                  Approved
                </SelectItem>
                <SelectItem value="Declined" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 outline-hidden">
                  Declined
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Columns selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ShadcnButton variant="outline" className="flex items-center justify-between h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-750 cursor-pointer text-xs font-bold shadow-xs w-36">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Columns
                  </span>
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                </ShadcnButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[170px] bg-white border border-zinc-150 rounded-xl shadow-md p-1.5 mt-1 z-50">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 outline-hidden flex items-center gap-2"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id === 'companyName'
                          ? 'Company'
                          : column.id === 'clientName'
                          ? 'Contact'
                          : column.id === 'hallName'
                          ? 'Hall Name'
                          : column.id === 'guestsCount'
                          ? 'Attendance'
                          : column.id === 'cateringOption'
                          ? 'Catering'
                          : column.id === 'avOverlay'
                          ? 'A/V Overlay'
                          : column.id === 'totalCostUGX'
                          ? 'Pricing'
                          : column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Table Container */}
      <div className="bg-white border border-zinc-150 rounded-[20px] shadow-xs overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-20">
            <CalendarRange className="h-9 w-9 mx-auto text-zinc-400 mb-3 animate-pulse" />
            <h5 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">No event quotes found</h5>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              We couldn't find any event quotes matching the active filters or search queries.
            </p>
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader className="bg-zinc-50/60 border-b border-zinc-150">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-zinc-100">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider py-3.5 px-4 text-left">
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
                    className="hover:bg-zinc-50/20 transition-colors border-zinc-100"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4 text-xs font-medium text-zinc-750">
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/20 text-xs text-zinc-500">
                <div className="flex-1 text-zinc-450 font-bold">
                  Showing {table.getRowModel().rows.length} of {filteredQuotes.length} items
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Page</span>
                    <strong className="text-zinc-900 font-extrabold">
                      {table.getState().pagination.pageIndex + 1} of{' '}
                      {table.getPageCount()}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShadcnButton
                      variant="outline"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border border-zinc-200 disabled:opacity-40 cursor-pointer bg-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </ShadcnButton>
                    <ShadcnButton
                      variant="outline"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border border-zinc-200 disabled:opacity-40 cursor-pointer bg-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </ShadcnButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Conferences;

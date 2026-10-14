import React, { useState, useEffect } from 'react';
import {
  reportService,
  GuestHistory360Report,
  GuestTimelineEvent
} from '../services/reportService';
import { useCurrency } from '../context/CurrencyContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  User,
  Users,
  Building2,
  Utensils,
  Calendar,
  CreditCard,
  Globe,
  UserCheck,
  RefreshCw,
  Clock,
  Phone,
  Mail,
  Shield,
  FileText,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Guest360DossierSheetProps {
  customerId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Guest360DossierSheet: React.FC<Guest360DossierSheetProps> = ({
  customerId,
  isOpen,
  onClose
}) => {
  const { formatPrice } = useCurrency();
  const [data, setData] = useState<GuestHistory360Report | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'Accommodation' | 'Restaurant' | 'Conference' | 'Payment'>('all');

  const fetchDossier = async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await reportService.getGuest360History(customerId);
      setData(result);
    } catch (err: any) {
      console.error("Error loading Guest 360 dossier:", err);
      setError(err?.response?.data?.detail || "Could not retrieve guest historical dossier.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      fetchDossier();
    } else {
      setData(null);
      setFilterType('all');
    }
  }, [isOpen, customerId]);

  const filteredTimeline = (data?.timeline || []).filter((event) => {
    if (filterType === 'all') return true;
    return event.event_type === filterType;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Accommodation':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'Restaurant':
        return <Utensils className="w-4 h-4 text-amber-400" />;
      case 'Conference':
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'Payment':
        return <CreditCard className="w-4 h-4 text-[#D4AF37]" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-[#0A192F] text-foreground border-l border-[#D4AF37]/20 p-0 flex flex-col h-full shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <SheetHeader className="p-6 bg-[#071324] border-b border-[#D4AF37]/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <SheetTitle className="text-xl font-extrabold text-[#D4AF37] flex items-center gap-2">
                  Guest 360° Dossier & History
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400">
                  Comprehensive lifetime customer audit ledger across all Seyeya operations
                </SheetDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={fetchDossier}
              disabled={loading}
              className="bg-[#0A2540] hover:bg-[#07192C] text-[#D4AF37] border border-[#D4AF37]/30 text-xs px-3 h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
              <span className="text-sm font-semibold text-zinc-300">Loading Guest 360 Profile & Ledger...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Profile Card Header */}
              <div className="p-5 rounded-2xl bg-[#071324] border border-[#D4AF37]/30 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-[#D4AF37] text-[#0A192F] font-black text-lg flex items-center justify-center shadow-md border-2 border-[#D4AF37]">
                      {getInitials(data.full_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">{data.full_name}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                          {data.customer_type || 'Guest'}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">
                        Code: <span className="text-zinc-200">#{data.customer_code}</span>
                      </div>
                    </div>
                  </div>

                  {/* Origin Tag */}
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${
                        (data as any).origin === 'Online Portal' || (data as any).account_origin === 'Online Portal'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                      }`}
                    >
                      {(data as any).origin === 'Online Portal' || (data as any).account_origin === 'Online Portal' ? (
                        <Globe className="w-3.5 h-3.5" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      {(data as any).origin || (data as any).account_origin || 'Front Desk Staff'}
                    </span>
                  </div>
                </div>

                {/* Contact & Metrics Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#D4AF37]/15 text-xs">
                  <div className="bg-[#0A192F] p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block text-[11px] uppercase tracking-wider">Email Address</span>
                    <span className="font-medium text-white truncate block mt-0.5" title={data.email || 'N/A'}>
                      {data.email || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-[#0A192F] p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block text-[11px] uppercase tracking-wider">Phone Number</span>
                    <span className="font-medium text-white block mt-0.5">
                      {data.phone_number || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-[#0A192F] p-2.5 rounded-xl border border-[#D4AF37]/30">
                    <span className="text-zinc-400 block text-[11px] uppercase tracking-wider">Total Spent</span>
                    <span className="font-extrabold text-[#D4AF37] block mt-0.5">
                      {formatPrice(data.total_spent)}
                    </span>
                  </div>

                  <div className="bg-[#0A192F] p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block text-[11px] uppercase tracking-wider">Total Stays / Visits</span>
                    <span className="font-extrabold text-white block mt-0.5">
                      {data.visit_count || 1} Visits
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    Activity Ledger Timeline ({filteredTimeline.length})
                  </h3>

                  <div className="flex items-center gap-1 bg-[#071324] p-1 rounded-xl border border-zinc-800">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'Accommodation', label: 'Stays' },
                      { id: 'Restaurant', label: 'Dining' },
                      { id: 'Conference', label: 'Events' },
                      { id: 'Payment', label: 'Payments' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFilterType(tab.id as any)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                          filterType === tab.id
                            ? 'bg-[#D4AF37] text-[#0A192F] shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline Render */}
                {filteredTimeline.length === 0 ? (
                  <div className="p-8 text-center bg-[#071324] rounded-2xl border border-zinc-800 text-zinc-400 text-xs italic">
                    No activity entries recorded for category "{filterType}".
                  </div>
                ) : (
                  <div className="relative border-l-2 border-[#D4AF37]/30 pl-5 ml-3 space-y-4">
                    {filteredTimeline.map((event) => (
                      <div key={event.id} className="relative group">
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-[27px] top-3 w-3.5 h-3.5 rounded-full bg-[#D4AF37] border-2 border-[#0A192F] shadow-sm" />

                        <div className="p-4 rounded-xl bg-[#071324] border border-zinc-800 hover:border-[#D4AF37]/40 transition-all space-y-2 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-[#0A192F] border border-zinc-800">
                                {getEventIcon(event.event_type)}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-white">{event.title}</h4>
                                <span className="text-[11px] text-zinc-400">
                                  {new Date(event.date).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              {event.status}
                            </span>
                          </div>

                          {/* Detail summary row */}
                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                            <div className="text-zinc-300 font-mono text-[11px]">
                              {event.event_type === 'Accommodation' && event.details?.check_in && (
                                <span>Check-in: {event.details.check_in} → Out: {event.details.check_out}</span>
                              )}
                              {event.event_type === 'Restaurant' && (
                                <span>Option: {event.details?.delivery_option || 'Premises'} ({event.details?.seating_location || 'Indoor'})</span>
                              )}
                              {event.event_type === 'Conference' && (
                                <span>Participants: {event.details?.num_participants || 1} people</span>
                              )}
                              {event.event_type === 'Payment' && (
                                <span>Txn: {event.details?.transaction_id || event.id}</span>
                              )}
                            </div>

                            <span className="text-sm font-extrabold text-[#D4AF37]">
                              {formatPrice(event.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};

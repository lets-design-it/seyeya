import React, { useState, useEffect } from 'react';
import {
  reportService,
  ExecutiveSummaryReport,
  StaffPerformanceReport,
  GuestAnalyticsReport,
  GuestHistory360Report,
  SalesChannelReport,
  FinancialVatReport
} from '../../services/reportService';
import { useCurrency } from '../../context/CurrencyContext';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Utensils,
  Receipt,
  Download,
  Calendar,
  Filter,
  Search,
  UserCheck,
  Globe,
  Clock,
  ShieldCheck,
  Truck,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Guest360DossierSheet } from '../../components/Guest360DossierSheet';

interface ReportsViewProps {
  activeSubTab?: 'executive' | 'staff' | 'guests' | 'channels' | 'vat';
  setActiveSubTab?: (tab: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  activeSubTab: externalSubTab,
  setActiveSubTab: externalSetSubTab
}) => {
  const { formatPrice, currency, usdRate } = useCurrency();
  const [internalSubTab, setInternalSubTab] = useState<'executive' | 'staff' | 'guests' | 'channels' | 'vat'>('executive');
  
  const subTab = externalSubTab || internalSubTab;
  const setSubTab = (t: any) => {
    setInternalSubTab(t);
    if (externalSetSubTab) externalSetSubTab(t);
  };

  // Date filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateFilterPreset, setDateFilterPreset] = useState<string>('all');

  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [executiveData, setExecutiveData] = useState<ExecutiveSummaryReport | null>(null);
  const [staffData, setStaffData] = useState<StaffPerformanceReport | null>(null);
  const [guestData, setGuestData] = useState<GuestAnalyticsReport | null>(null);
  const [channelsData, setChannelsData] = useState<SalesChannelReport | null>(null);
  const [vatData, setVatData] = useState<FinancialVatReport | null>(null);

  // Guest 360 Drawer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [guest360Data, setGuest360Data] = useState<GuestHistory360Report | null>(null);
  const [loadingGuest360, setLoadingGuest360] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Guest search and pagination state for table
  const [guestSearch, setGuestSearch] = useState<string>('');
  const [guestPage, setGuestPage] = useState<number>(1);
  const [guestPageSize, setGuestPageSize] = useState<number>(10);

  // Handle Preset Changes
  const handlePresetChange = (preset: string) => {
    setDateFilterPreset(preset);
    const now = new Date();
    if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === '30days') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'ytd') {
      setStartDate(`${now.getFullYear()}-01-01`);
      setEndDate(now.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Load Data
  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (subTab === 'executive') {
        const data = await reportService.getExecutiveSummary(startDate, endDate);
        setExecutiveData(data);
      } else if (subTab === 'staff') {
        const data = await reportService.getStaffPerformance(startDate, endDate);
        setStaffData(data);
      } else if (subTab === 'guests') {
        const data = await reportService.getGuestAnalytics();
        setGuestData(data);
      } else if (subTab === 'channels') {
        const data = await reportService.getSalesChannels(startDate, endDate);
        setChannelsData(data);
      } else if (subTab === 'vat') {
        const data = await reportService.getFinancialVat(startDate, endDate);
        setVatData(data);
      }
    } catch (err: any) {
      console.error("Failed loading report data:", err);
      setError(err?.response?.data?.detail || "Failed to load report analytics. Please verify server connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [subTab, startDate, endDate]);

  // Open Guest 360 Drawer
  const openGuest360 = async (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsDrawerOpen(true);
    setLoadingGuest360(true);
    try {
      const data = await reportService.getGuest360History(customerId);
      setGuest360Data(data);
    } catch (err) {
      console.error("Failed loading guest 360 data", err);
    } finally {
      setLoadingGuest360(false);
    }
  };

  const handleExportCSV = () => {
    reportService.exportCSV(subTab, startDate, endDate);
  };

  const PIE_COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  const getHeaderMeta = () => {
    switch (subTab) {
      case 'staff':
        return {
          title: 'Staff Performance & Revenue Audit',
          description: 'Tracks orders processed by waiters/front desk personnel and total payment value collected per staff member.'
        };
      case 'guests':
        return {
          title: 'Guest 360 & Account Origins',
          description: 'Comprehensive analysis of guest origins, registration channels, lifetime spending, and dossier history.'
        };
      case 'channels':
        return {
          title: 'Sales Channels Breakdown',
          description: 'Revenue distribution across Lodge Accommodations, Nile Restaurant, and Events & Conferences.'
        };
      case 'vat':
        return {
          title: 'Financial & VAT Compliance Audit',
          description: 'Detailed breakdown of taxable revenue, VAT collected (18%), and net revenues across operations.'
        };
      case 'executive':
      default:
        return {
          title: 'Executive Reports & Analytics',
          description: 'Comprehensive business intelligence across lodge bookings, restaurant sales, staff operations, guest origins, and VAT compliance.'
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
              <BarChart3 className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-foreground">{headerMeta.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {headerMeta.description}
          </p>
        </div>

        {/* Global Action & Export */}
        <div className="flex items-center gap-3">
          <Button
            onClick={loadReportData}
            variant="outline"
            className="border-border hover:bg-muted"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExportCSV}
            className="bg-[#D4AF37] text-[#0A192F] hover:bg-[#B89320] font-semibold shadow-md transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      {subTab !== 'guests' && (
        <div className="bg-card p-4 rounded-xl border border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-medium text-foreground">Date Range Filter:</span>
            <div className="flex items-center gap-1 ml-2">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'ytd', label: 'YTD' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    dateFilterPreset === p.id
                      ? 'bg-foreground text-background font-bold'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">From:</span>
              <DatePicker
                value={startDate}
                onChange={(val) => {
                  setDateFilterPreset('custom');
                  setStartDate(val);
                }}
                className="w-38 h-8 py-1 px-2.5 text-xs rounded-lg"
                placeholder="Start date"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">To:</span>
              <DatePicker
                value={endDate}
                onChange={(val) => {
                  setDateFilterPreset('custom');
                  setEndDate(val);
                }}
                className="w-38 h-8 py-1 px-2.5 text-xs rounded-lg"
                placeholder="End date"
                min={startDate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Tab 1: Executive Overview */}
      {subTab === 'executive' && (
        <div className="space-y-6">
          {/* Executive Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-border shadow-xs hover:border-[#D4AF37]/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Gross Revenue
                </CardTitle>
                <div className="p-2 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatPrice(executiveData?.total_revenue_ugx || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Est. USD ${((executiveData?.total_revenue_usd || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-xs hover:border-blue-500/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cottage Lodges Revenue
                </CardTitle>
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500">
                  <Building2 className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatPrice(executiveData?.lodge_revenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active Guests Checked In: <span className="font-semibold text-foreground">{executiveData?.active_checkins || 0}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-xs hover:border-amber-500/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nile Restaurant Revenue
                </CardTitle>
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                  <Utensils className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatPrice(executiveData?.restaurant_revenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending Kitchen Orders: <span className="font-semibold text-amber-600">{executiveData?.pending_orders || 0}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-xs hover:border-emerald-500/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Events & Conference Revenue
                </CardTitle>
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                  <Calendar className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatPrice(executiveData?.conference_revenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending Quotes: <span className="font-semibold text-foreground">{executiveData?.pending_quotes || 0}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Area Chart */}
            <Card className="lg:col-span-2 border border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold">Revenue Growth & Trend (UGX)</CardTitle>
                <CardDescription>Monthly aggregated stream totals across operations</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                  <AreaChart data={executiveData?.monthly_trend_data || []}>
                    <defs>
                      <linearGradient id="colorLodge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value: any) => formatPrice(value)} />
                    <Area type="monotone" dataKey="Lodge" stroke="#D4AF37" fillOpacity={1} fill="url(#colorLodge)" />
                    <Area type="monotone" dataKey="Restaurant" stroke="#3B82F6" fillOpacity={1} fill="url(#colorFood)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribution Breakdown */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold">Revenue Mix Share</CardTitle>
                <CardDescription>Proportional percentage share by department</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(executiveData?.distribution_data || []).map((item, idx) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{item.name}</span>
                      <span className="text-muted-foreground">{item.pct}% ({formatPrice(item.value)})</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: PIE_COLORS[idx % PIE_COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Staff Performance */}
      {subTab === 'staff' && (
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Staff Managed Orders & Revenue Audit</h2>
                <p className="text-xs text-muted-foreground">
                  Tracks orders processed by waiters/front desk personnel and total payment value collected per staff member.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Total Staff Value Managed</div>
                <div className="text-xl font-bold text-[#D4AF37]">
                  {formatPrice(staffData?.total_managed_value || 0)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Staff ID</th>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-center">Orders Handled</th>
                    <th className="p-3 text-center">Payments Processed</th>
                    <th className="p-3 text-right">Total Value Managed (UGX)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Loading staff performance stats...
                      </td>
                    </tr>
                  ) : (staffData?.staff_members || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No staff order activity logged for this period.
                      </td>
                    </tr>
                  ) : (
                    (staffData?.staff_members || []).map((staff) => (
                      <tr key={staff.user_id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-xs text-muted-foreground">#STF-{staff.user_id}</td>
                        <td className="p-3 font-bold text-foreground">
                          <div>{staff.full_name}</div>
                          <div className="text-xs font-normal text-muted-foreground">{staff.email}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                            {staff.role_name}
                          </span>
                        </td>
                        <td className="p-3 text-center font-semibold text-foreground">
                          {staff.orders_count}
                        </td>
                        <td className="p-3 text-center font-semibold text-foreground">
                          {staff.payments_count}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {formatPrice(staff.total_managed_value)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Guest 360 & Account Origins */}
      {subTab === 'guests' && (
        <div className="space-y-6">
          {/* Guest Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  Total Registered Guests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {guestData?.total_guests || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime guest profiles in database
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  Online Self-Registered Portal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {guestData?.online_registered_count || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Created via Guest Web App Direct Portal
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  Staff Provisioned (Front Desk)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {guestData?.staff_provisioned_count || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Created by Reception / Waiter Staff
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  Total Guest Lifetime Spend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#D4AF37]">
                  {formatPrice(guestData?.total_guest_spend || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Child Guests Registered: <span className="font-semibold text-foreground">{guestData?.child_guests_count || 0}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Guest Search & Table */}
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Top Guest 360 Directory</h2>
                <p className="text-xs text-muted-foreground">
                  Inspect origin channel, total spend, visit frequency, and complete historical ledger per guest.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search guest name or email..."
                  value={guestSearch}
                  onChange={(e) => {
                    setGuestSearch(e.target.value);
                    setGuestPage(1);
                  }}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            {(() => {
              const filteredGuests = (guestData?.top_spending_guests || []).filter((g) => {
                const guestName = g.name || (g as any).full_name || '';
                const guestEmail = g.email || '';
                const search = (guestSearch || '').toLowerCase();
                return (
                  !search ||
                  guestName.toLowerCase().includes(search) ||
                  guestEmail.toLowerCase().includes(search)
                );
              });

              const totalGuestPages = Math.ceil(filteredGuests.length / guestPageSize) || 1;
              const paginatedGuests = filteredGuests.slice((guestPage - 1) * guestPageSize, guestPage * guestPageSize);
              const startItem = filteredGuests.length === 0 ? 0 : (guestPage - 1) * guestPageSize + 1;
              const endItem = Math.min(guestPage * guestPageSize, filteredGuests.length);

              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                        <tr>
                          <th className="p-3">Guest ID</th>
                          <th className="p-3">Guest Profile</th>
                          <th className="p-3">Contact</th>
                          <th className="p-3">Account Origin</th>
                          <th className="p-3 text-center">Visits / Stays</th>
                          <th className="p-3 text-right">Total Lifetime Spend</th>
                          <th className="p-3 text-center">360 History</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedGuests.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                              No guest profiles found matching your search.
                            </td>
                          </tr>
                        ) : (
                          paginatedGuests.map((guest) => {
                            const nameDisplay = guest.name || (guest as any).full_name || 'Guest';
                            const originDisplay = guest.origin || (guest as any).account_origin || 'Front Desk Staff';
                            return (
                              <tr key={guest.customer_id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-3 font-mono text-xs text-muted-foreground">#CUST-{guest.customer_id}</td>
                                <td className="p-3 font-bold text-foreground">
                                  {nameDisplay}
                                </td>
                                <td className="p-3 text-xs text-muted-foreground">
                                  <div>{guest.email || 'No email registered'}</div>
                                  <div>{guest.phone_number || ''}</div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${
                                      originDisplay === 'Online Portal'
                                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                    }`}
                                  >
                                    {originDisplay === 'Online Portal' ? (
                                      <Globe className="w-3 h-3" />
                                    ) : (
                                      <UserCheck className="w-3 h-3" />
                                    )}
                                    {originDisplay}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-bold text-foreground">
                                  {guest.visit_count}
                                </td>
                                <td className="p-3 text-right font-extrabold text-[#D4AF37]">
                                  {formatPrice(guest.total_spent)}
                                </td>
                                <td className="p-3 text-center">
                                  <Button
                                    size="sm"
                                    onClick={() => openGuest360(guest.customer_id)}
                                    className="bg-[#D4AF37] text-[#0A192F] hover:bg-[#B89320] font-semibold text-xs h-8 px-3 shadow-xs"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    View 360
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Showing <strong className="text-foreground">{startItem}</strong> to <strong className="text-foreground">{endItem}</strong> of <strong className="text-foreground">{filteredGuests.length}</strong> guests
                      </span>
                      <div className="flex items-center gap-1.5 ml-2">
                        <span>Per page:</span>
                        <select
                          value={guestPageSize}
                          onChange={(e) => {
                            setGuestPageSize(Number(e.target.value));
                            setGuestPage(1);
                          }}
                          className="bg-background border border-border text-foreground rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGuestPage((p) => Math.max(p - 1, 1))}
                        disabled={guestPage <= 1}
                        className="h-8 px-2.5 text-xs font-semibold gap-1 border-border bg-background hover:bg-muted text-foreground disabled:opacity-40"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: totalGuestPages }, (_, i) => i + 1)
                          .filter((page) => {
                            return (
                              page === 1 ||
                              page === totalGuestPages ||
                              Math.abs(page - guestPage) <= 1
                            );
                          })
                          .reduce<(number | string)[]>((acc, page, index, arr) => {
                            if (index > 0 && page - (arr[index - 1] as number) > 1) {
                              acc.push('...');
                            }
                            acc.push(page);
                            return acc;
                          }, [])
                          .map((item, idx) => {
                            if (item === '...') {
                              return (
                                <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                                  ...
                                </span>
                              );
                            }
                            const pageNum = item as number;
                            const isCurrent = pageNum === guestPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setGuestPage(pageNum)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                  isCurrent
                                    ? 'bg-[#D4AF37] text-[#0A192F] shadow-xs'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGuestPage((p) => Math.min(p + 1, totalGuestPages))}
                        disabled={guestPage >= totalGuestPages}
                        className="h-8 px-2.5 text-xs font-semibold gap-1 border-border bg-background hover:bg-muted text-foreground disabled:opacity-40"
                      >
                        Next
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab 4: Sales Channels */}
      {subTab === 'channels' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Restaurant Sales Channels */}
            <Card className="border border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-base font-bold">Restaurant Sales Channels</CardTitle>
                </div>
                <CardDescription>Breakdown by premises eat-in, room service, and external delivery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-foreground">Premises Eat-In</div>
                    <div className="text-xs text-muted-foreground">{channelsData?.restaurant_eat_in_count || 0} completed orders</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-foreground">{formatPrice(channelsData?.restaurant_eat_in_value || 0)}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-foreground">Room Service Delivery</div>
                    <div className="text-xs text-muted-foreground">{channelsData?.restaurant_room_service_count || 0} orders delivered to lodges</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-foreground">{formatPrice(channelsData?.restaurant_room_service_value || 0)}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-primary mt-1" />
                    <div>
                      <div className="text-sm font-bold text-foreground">External Outside Delivery</div>
                      <div className="text-xs text-muted-foreground">{channelsData?.restaurant_external_delivery_count || 0} external orders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-foreground">{formatPrice(channelsData?.restaurant_external_delivery_value || 0)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accommodation Booking Channels */}
            <Card className="border border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-base font-bold">Accommodation Booking Channels</CardTitle>
                </div>
                <CardDescription>Direct online guest portal vs. Front desk reservation desk</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">Direct Online Portal</div>
                    <div className="text-xs text-muted-foreground">{channelsData?.accommodation_online_count || 0} direct online stays</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">{formatPrice(channelsData?.accommodation_online_value || 0)}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-purple-600 dark:text-purple-400">Front Desk & Walk-in</div>
                    <div className="text-xs text-muted-foreground">{channelsData?.accommodation_front_desk_count || 0} receptionist bookings</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-purple-600 dark:text-purple-400">{formatPrice(channelsData?.accommodation_front_desk_value || 0)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 5: Financial & VAT Reconciliation */}
      {subTab === 'vat' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Gross Sales Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatPrice(vatData?.gross_sales_ugx || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Taxable Subtotal: {formatPrice(vatData?.taxable_subtotal || 0)}</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-[#D4AF37]/10 border-[#D4AF37]/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-[#0A192F] dark:text-[#D4AF37] uppercase">18% VAT Liability Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-[#0A192F] dark:text-[#D4AF37]">
                  {formatPrice(vatData?.vat_collected_ugx || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Calculated at standard 18% tax rate</p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Delivery Charges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatPrice(vatData?.delivery_charge_total || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Collected distance delivery fees</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Status & Method Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold">Payments vs Balance Due Reconciliation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-emerald-600">Total Amount Paid</div>
                    <div className="text-xs text-muted-foreground">Cleared payments collected</div>
                  </div>
                  <div className="text-lg font-extrabold text-emerald-600">{formatPrice(vatData?.amount_paid_total || 0)}</div>
                </div>

                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-destructive">Total Outstanding Balance Due</div>
                    <div className="text-xs text-muted-foreground">Unpaid guest balances</div>
                  </div>
                  <div className="text-lg font-extrabold text-destructive">{formatPrice(vatData?.balance_due_total || 0)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold">Payment Methods Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(vatData?.payment_method_breakdown || []).map((method) => (
                  <div key={method.method} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-sm font-bold text-foreground">{method.method}</span>
                      <span className="text-xs text-muted-foreground">({method.count} txns)</span>
                    </div>
                    <span className="font-extrabold text-sm text-foreground">{formatPrice(method.total)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Guest 360 Timeline Dossier Sheet */}
      <Guest360DossierSheet
        customerId={selectedCustomerId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

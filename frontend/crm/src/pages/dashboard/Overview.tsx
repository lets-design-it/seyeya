import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useCurrency } from '../../context/CurrencyContext';
import {
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  ShoppingBag,
  Bed,
  CalendarRange,
  Layers,
  Coins
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
  Cell
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Overview: React.FC = () => {
  const analytics = useAnalytics();
  const { formatPrice, currency, usdRate } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const COLORS = ['#1771F1', '#3b82f6', '#10b981', '#ec4899'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Introduction Banner */}
      <div className="rounded-3xl bg-[#D2FE54] p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-black/5 blur-[40px] pointer-events-none" />
        <h3 className="text-xl font-bold text-primary tracking-tight">Staff Executive Hub</h3>
        <p className="mt-1 text-sm text-zinc-800 max-w-xl">
          Consolidated analytics across Seyeya Cottage booking sheets, kitchen tickets, and corporate event quotas.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="shadow-sm border-zinc-150">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-550">Gross Income</CardTitle>
            <Coins className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-extrabold text-zinc-900 leading-none">
              {formatPrice(analytics.revenueUGX)}
            </div>
            <p className="text-[10px] text-zinc-450 mt-1 font-medium">
              {currency === 'UGX' 
                ? `~ $${(analytics.revenueUGX / usdRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD` 
                : `~ UGX ${analytics.revenueUGX.toLocaleString()}`}
            </p>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="shadow-sm border-zinc-150">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-550">Lodge Check-ins</CardTitle>
            <Bed className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-zinc-900 leading-none">
              {analytics.activeCheckins}
            </div>
            <p className="text-[10px] text-indigo-500 font-bold mt-1">
              ✦ Active room keys
            </p>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="shadow-sm border-zinc-150">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-550">Active Food Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-zinc-900 leading-none">
              {analytics.pendingOrders}
            </div>
            <p className="text-[10px] text-rose-500 font-bold mt-1">
              ✦ In kitchen queue
            </p>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="shadow-sm border-zinc-150">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-550">Pending Quotes</CardTitle>
            <CalendarRange className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-zinc-900 leading-none">
              {analytics.pendingQuotes}
            </div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">
              ✦ Conference requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Graph Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Projections Area Chart */}
        <Card className="lg:col-span-2 shadow-sm border-zinc-150">
          <CardHeader className="flex flex-row items-start justify-between pb-4">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-800">Revenue Stream Projections</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Departmental earnings trends over the current semester ({currency}).</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <span className="text-zinc-550">Lodge</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span className="text-zinc-550">Events</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-zinc-550">Food</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={analytics.monthlyTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLodge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1771F1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1771F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.25} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={9} 
                    tickLine={false} 
                    tickFormatter={(val) => formatPrice(val, { compact: true })} 
                  />
                  <Tooltip
                    formatter={(value: any) => [formatPrice(Number(value))]}
                    contentStyle={{
                      backgroundColor: 'rgba(9, 9, 11, 0.95)',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      fontSize: '10px'
                    }}
                  />
                  <Area type="monotone" dataKey="Lodge" stroke="#1771F1" strokeWidth={2} fillOpacity={1} fill="url(#colorLodge)" />
                  <Area type="monotone" dataKey="Events" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" />
                  <Area type="monotone" dataKey="Restaurant" stroke="#10b981" strokeWidth={1.5} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Revenue breakdown */}
        <Card className="shadow-sm border-zinc-150 flex flex-col justify-between min-h-[350px]">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-800">Operational Breakdown</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Revenue share contribution per branch.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 my-auto">
            {analytics.distributionData.map((dept, index) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground light:text-zinc-700">{dept.name}</span>
                  <span className="text-zinc-550">
                    {dept.pct}% ({dept.value > 0 ? formatPrice(dept.value, { compact: true }) : '0'})
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-100 light:bg-zinc-200 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${dept.pct}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>

          <CardFooter className="text-xs text-zinc-450 justify-center pb-6 border-t border-zinc-100 pt-3">
            Consolidated from Seyeya operations ledger.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
export default Overview;



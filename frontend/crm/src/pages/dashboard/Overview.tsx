import React from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle, 
  ShoppingBag,
  Bed,
  CalendarRange,
  Layers 
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
import { Card } from '../../components/Card';

export const Overview: React.FC = () => {
  const analytics = useAnalytics();

  const COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#ec4899'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Introduction Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border border-violet-500/10 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-violet-500/5 blur-[40px] pointer-events-none" />
        <h3 className="text-xl font-bold text-white tracking-tight">Staff Executive Hub</h3>
        <p className="mt-1 text-sm text-zinc-400 max-w-xl">
          Consolidated analytics across Seyeya Cottage booking sheets, kitchen tickets, and corporate event quotas.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card variant="glow" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 light:text-zinc-400 uppercase tracking-wider">Gross Income</span>
            <h4 className="text-xl font-bold text-white light:text-zinc-900 leading-none">
              UGX {analytics.revenueUGX.toLocaleString()}
            </h4>
            <p className="text-[10px] text-zinc-450 mt-1">
              ~ ${(analytics.revenueUSD).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>

        {/* Metric 2 */}
        <Card variant="glow" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 light:text-zinc-400 uppercase tracking-wider">Lodge Check-ins</span>
            <h4 className="text-2xl font-bold text-white light:text-zinc-900 leading-none">{analytics.activeCheckins}</h4>
            <span className="text-[10px] text-indigo-400 font-semibold mt-1 inline-block">✦ Active room keys active</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Bed className="h-5 w-5" />
          </div>
        </Card>

        {/* Metric 3 */}
        <Card variant="glow" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 light:text-zinc-400 uppercase tracking-wider">Active Food Orders</span>
            <h4 className="text-2xl font-bold text-white light:text-zinc-900 leading-none">{analytics.pendingOrders}</h4>
            <span className="text-[10px] text-rose-450 font-semibold mt-1 inline-block">✦ In kitchen queue</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-450">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </Card>

        {/* Metric 4 */}
        <Card variant="glow" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 light:text-zinc-400 uppercase tracking-wider">Pending Quotes</span>
            <h4 className="text-2xl font-bold text-white light:text-zinc-900 leading-none">{analytics.pendingQuotes}</h4>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">✦ Conference requests</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-450">
            <CalendarRange className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Analytics Graph Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Projections Area Chart */}
        <Card variant="glass" className="p-5 lg:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 light:text-zinc-800">Revenue Stream Projections</h4>
              <p className="text-[10px] text-zinc-500">Departmental earnings trends over the current semester (in UGX).</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <span className="text-zinc-400">Lodge</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span className="text-zinc-400">Events</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-zinc-400">Food</span>
              </div>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLodge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.25} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={9} tickLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  formatter={(value: any) => [`UGX ${value.toLocaleString()}`]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(9, 9, 11, 0.95)', 
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    fontSize: '10px'
                  }} 
                />
                <Area type="monotone" dataKey="Lodge" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorLodge)" />
                <Area type="monotone" dataKey="Events" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" />
                <Area type="monotone" dataKey="Restaurant" stroke="#10b981" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Revenue breakdown */}
        <Card variant="glass" className="p-5 flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 light:text-zinc-800">Operational Breakdown</h4>
            <p className="text-[10px] text-zinc-500">Revenue share contribution per branch.</p>
          </div>
          
          <div className="space-y-4 my-auto">
            {analytics.distributionData.map((dept, index) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-zinc-350 light:text-zinc-700">{dept.name}</span>
                  <span className="text-zinc-400">
                    {dept.pct}% ({dept.value > 0 ? `UGX ${(dept.value / 1000000).toFixed(1)}M` : '0M'})
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-900 light:bg-zinc-200 overflow-hidden">
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
          </div>

          <div className="text-[9px] text-zinc-550 border-t border-zinc-900/60 pt-3 text-center">
            Consolidated from Seyeya operations ledger.
          </div>
        </Card>
      </div>
    </div>
  );
};
export default Overview;

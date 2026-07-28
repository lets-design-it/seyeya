import React, { useMemo, useState, useEffect } from 'react';
import { 
  loadLeads, 
  loadActivities, 
  Lead 
} from '../utils/mockData';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle, 
  PhoneCall, 
  Mail, 
  Calendar, 
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

export const Dashboard: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const leads = useMemo(() => loadLeads(), []);
  const activities = useMemo(() => loadActivities(), []);

  // Compute live KPIs
  const kpis = useMemo(() => {
    const wonLeads = leads.filter(l => l.stage === 'Won');
    const lostLeads = leads.filter(l => l.stage === 'Lost');
    const closedCount = wonLeads.length + lostLeads.length;

    const totalRevenue = wonLeads.reduce((acc, l) => acc + l.value, 0);
    const activeLeadsCount = leads.filter(l => !['Won', 'Lost'].includes(l.stage)).length;
    const totalPipeline = leads
      .filter(l => ['New', 'Contacted', 'Qualified', 'Proposal'].includes(l.stage))
      .reduce((acc, l) => acc + l.value, 0);
    
    const winRate = closedCount > 0 
      ? Math.round((wonLeads.length / closedCount) * 100) 
      : 0;

    return {
      revenue: totalRevenue,
      pipeline: totalPipeline,
      activeLeads: activeLeadsCount,
      winRate: winRate
    };
  }, [leads]);

  // Chart 1: Revenue Timeline (Monthly projections)
  const timelineData = [
    { name: 'Jan', Sales: 45000, Target: 50000 },
    { name: 'Feb', Sales: 62000, Target: 55000 },
    { name: 'Mar', Sales: 80000, Target: 65000 },
    { name: 'Apr', Sales: 95000, Target: 80000 },
    { name: 'May', Sales: 110000, Target: 95000 },
    { name: 'Jun', Sales: kpis.revenue > 0 ? kpis.revenue : 150000, Target: 120000 },
  ];

  // Chart 2: Stage Distribution
  const stageData = useMemo(() => {
    const stages: Record<Lead['stage'], number> = {
      'New': 0,
      'Contacted': 0,
      'Qualified': 0,
      'Proposal': 0,
      'Won': 0,
      'Lost': 0
    };
    leads.forEach(l => {
      stages[l.stage] = (stages[l.stage] || 0) + 1;
    });
    return Object.keys(stages).map(key => ({
      name: key,
      count: stages[key as Lead['stage']],
    }));
  }, [leads]);

  const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#ec4899', '#10b981', '#ef4444'];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneCall className="h-3.5 w-3.5 text-blue-400" />;
      case 'email': return <Mail className="h-3.5 w-3.5 text-indigo-400" />;
      case 'meeting': return <Calendar className="h-3.5 w-3.5 text-pink-400" />;
      default: return <Layers className="h-3.5 w-3.5 text-violet-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Introduction */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-950/30 to-indigo-950/20 border border-violet-500/10 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-violet-500/5 blur-[40px] pointer-events-none" />
        <h3 className="text-xl font-bold text-white tracking-tight">Executive Dashboard Overview</h3>
        <p className="mt-1 text-sm text-zinc-550 max-w-xl">
          Real-time aggregates of Seyeya sales channels, lead velocity metrics, and system activity.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-panel glass-card-glow rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-500 light:text-zinc-550 uppercase tracking-wider">Closed Revenue</span>
            <h4 className="text-2xl font-bold text-white light:text-zinc-900">${kpis.revenue.toLocaleString()}</h4>
            <span className="text-xs text-emerald-400 font-medium">✦ 12% increase from last month</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel glass-card-glow rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-500 light:text-zinc-550 uppercase tracking-wider">Pipeline Value</span>
            <h4 className="text-2xl font-bold text-white light:text-zinc-900">${kpis.pipeline.toLocaleString()}</h4>
            <span className="text-xs text-indigo-400 font-medium">✦ Active contract negotiations</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel glass-card-glow rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-500 light:text-zinc-550 uppercase tracking-wider">Active Leads</span>
            <h4 className="text-2xl font-bold text-white light:text-zinc-900">{kpis.activeLeads}</h4>
            <span className="text-xs text-rose-400 font-medium">✦ Under customer development</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel glass-card-glow rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-500 light:text-zinc-550 uppercase tracking-wider">Conversion Rate</span>
            <h4 className="text-2xl font-bold text-white light:text-zinc-900">{kpis.winRate}%</h4>
            <span className="text-xs text-emerald-400 font-medium">✦ Highly qualified pipeline</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-450">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="glass-panel glass-card-glow rounded-2xl p-5 lg:col-span-2 shadow-lg flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-foreground light:text-zinc-800">Sales Velocity Projection</h4>
              <p className="text-xs text-zinc-500">Comparing target projections against actual closed wins.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-zinc-550">Actual Sales</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500/40" />
                <span className="text-zinc-550">Target</span>
              </div>
            </div>
          </div>
          <div className="h-[260px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(9, 9, 11, 0.9)', 
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }} 
                  />
                  <Area type="monotone" dataKey="Sales" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="Target" stroke="#6366f1" strokeDasharray="4 4" strokeWidth={1.5} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead Stages Distribution */}
        <div className="glass-panel glass-card-glow rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-sm font-bold text-foreground light:text-zinc-800">Pipeline Funnel Distribution</h4>
            <p className="text-xs text-zinc-500">Distribution of leads across each sales stage.</p>
          </div>
          <div className="h-[220px] w-full my-4">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={9} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(9, 9, 11, 0.9)', 
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs text-zinc-500 text-center font-medium  pt-3">
            {stageData.slice(0, 3).map((item, index) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="font-semibold text-foreground capitalize">{item.name}</span>
                <span className="text-zinc-500 mt-0.5">{item.count} items</span>
              </div>
            ))}
            {stageData.slice(3, 6).map((item, index) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="font-semibold text-foreground capitalize">{item.name}</span>
                <span className="text-zinc-500 mt-0.5">{item.count} items</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activities & Deal Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activities Stream */}
        <div className="glass-panel glass-card-glow rounded-2xl p-5 lg:col-span-2 shadow-lg space-y-4">
          <div>
            <h4 className="text-sm font-bold text-foreground light:text-zinc-800">Operational Log Feed</h4>
            <p className="text-xs text-zinc-500">Live feed tracking actions taken across the Seyeya CRM workspace.</p>
          </div>
          <div className=" space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3.5 pt-3 first:pt-0">
                <img src={act.avatar} alt={act.user} className="h-7 w-7 rounded-lg object-cover  shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground light:text-zinc-700">
                    <span className="font-semibold text-white light:text-zinc-900">{act.user}</span>{' '}
                    {act.action}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 font-medium">
                    {getActivityIcon(act.type)}
                    <span>{act.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Velocity Summary */}
        <div className="glass-panel glass-card-glow rounded-2xl p-5 shadow-lg space-y-4">
          <div>
            <h4 className="text-sm font-bold text-foreground light:text-zinc-800">Workload Distribution</h4>
            <p className="text-xs text-zinc-500">Volume breakdown by industry sector.</p>
          </div>
          <div className="space-y-3.5 pt-2">
            {[
              { label: 'SaaS & AI Development', count: leads.filter(l => l.industry.includes('SaaS')).length, pct: '45%' },
              { label: 'FinTech Platforms', count: leads.filter(l => l.industry.includes('FinTech')).length, pct: '25%' },
              { label: 'Healthcare & Biotech', count: leads.filter(l => l.industry.includes('Healthcare')).length, pct: '18%' },
              { label: 'Other B2B Ventures', count: leads.filter(l => !['SaaS & AI', 'FinTech', 'Healthcare'].some(term => l.industry.includes(term))).length, pct: '12%' },
            ].map((industry) => (
              <div key={industry.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground light:text-zinc-700 truncate max-w-[170px]">{industry.label}</span>
                  <span className="text-zinc-550">{industry.count} leads ({industry.pct})</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-100 light:bg-zinc-200 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" 
                    style={{ width: industry.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};



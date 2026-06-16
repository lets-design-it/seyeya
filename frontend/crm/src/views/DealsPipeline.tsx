import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  loadLeads, 
  saveLeads, 
  Lead, 
  addActivity 
} from '../utils/mockData';
import { 
  ArrowLeft, 
  ArrowRight, 
  TrendingUp, 
  Building, 
  User, 
  Clock, 
  DollarSign 
} from 'lucide-react';

const STAGES: Lead['stage'][] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

export const DealsPipeline: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>(() => loadLeads());

  // Filter deals based on role
  const allowedDeals = useMemo(() => {
    return leads.filter(lead => {
      if (user?.role === 'agent') {
        return lead.assignedTo === 'u-agent';
      }
      return true;
    });
  }, [leads, user]);

  // Aggregate sums per column
  const columnAggregates = useMemo(() => {
    const aggregates: Record<Lead['stage'], { count: number; total: number }> = {
      New: { count: 0, total: 0 },
      Contacted: { count: 0, total: 0 },
      Qualified: { count: 0, total: 0 },
      Proposal: { count: 0, total: 0 },
      Won: { count: 0, total: 0 },
      Lost: { count: 0, total: 0 },
    };

    allowedDeals.forEach(deal => {
      aggregates[deal.stage].count += 1;
      aggregates[deal.stage].total += deal.value;
    });

    return aggregates;
  }, [allowedDeals]);

  // Total Pipeline Value
  const totalPipelineVal = useMemo(() => {
    return allowedDeals
      .filter(d => !['Won', 'Lost'].includes(d.stage))
      .reduce((sum, d) => sum + d.value, 0);
  }, [allowedDeals]);

  // Shift deal stage left or right
  const moveDeal = (dealId: string, direction: 'left' | 'right') => {
    const deal = leads.find(l => l.id === dealId);
    if (!deal) return;

    const currentIndex = STAGES.indexOf(deal.stage);
    let nextIndex = currentIndex;

    if (direction === 'left' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    } else if (direction === 'right' && currentIndex < STAGES.length - 1) {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex === currentIndex) return;

    const nextStage = STAGES[nextIndex];
    const updated = leads.map(l => {
      if (l.id === dealId) {
        return {
          ...l,
          stage: nextStage,
          lastActive: 'Just now'
        };
      }
      return l;
    });

    setLeads(updated);
    saveLeads(updated);

    if (user) {
      addActivity(user.name, user.avatar, `shifted pipeline stage of ${deal.company} to ${nextStage}`, 'deal');
    }
  };

  const getOwnerInitials = (ownerId: Lead['assignedTo']) => {
    switch (ownerId) {
      case 'u-admin': return 'SJ';
      case 'u-manager': return 'MV';
      case 'u-agent': return 'ER';
    }
  };

  const getColumnHeaderGlow = (stage: Lead['stage']) => {
    switch (stage) {
      case 'New': return 'border-sky-500/20 shadow-sky-500/5';
      case 'Contacted': return 'border-amber-500/20 shadow-amber-500/5';
      case 'Qualified': return 'border-indigo-500/20 shadow-indigo-500/5';
      case 'Proposal': return 'border-pink-500/20 shadow-pink-500/5';
      case 'Won': return 'border-emerald-500/20 shadow-emerald-500/5';
      case 'Lost': return 'border-rose-500/20 shadow-rose-500/5';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-full min-h-[82vh]">
      {/* Upper overview header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Active Sales Pipeline</h3>
          <p className="text-xs text-zinc-400">Drag or shift deals through stages to capture customer conversions.</p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl px-4 py-2.5">
          <TrendingUp className="h-4.5 w-4.5 text-violet-400" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 leading-none">Total Unclosed Pipeline</span>
            <span className="text-sm font-bold text-zinc-200 mt-1">${totalPipelineVal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Board Scrollable Wrapper */}
      <div className="flex-1 overflow-x-auto pb-4 -mx-6 px-6">
        <div className="flex gap-4 min-w-[1050px] h-full items-start">
          {STAGES.map((stage) => {
            const stageDeals = allowedDeals.filter(deal => deal.stage === stage);
            const aggregate = columnAggregates[stage];

            return (
              <div 
                key={stage} 
                className="flex-1 min-w-[200px] max-w-[280px] bg-zinc-950/20 border border-zinc-900/80 rounded-2xl p-3 flex flex-col max-h-[70vh] overflow-hidden"
              >
                {/* Column Title */}
                <div className="flex flex-col mb-3 pb-2.5 border-b border-zinc-900/60 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">{stage}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-900 text-zinc-400 font-semibold">{aggregate.count}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[9px] text-zinc-500 font-semibold">
                    <span>Column Value:</span>
                    <span className="text-zinc-450">${aggregate.total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
                  {stageDeals.length === 0 ? (
                    <div className="h-16 flex items-center justify-center rounded-xl border border-dashed border-zinc-900 text-[10px] text-zinc-650 text-center font-medium">
                      Empty stage
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div 
                        key={deal.id}
                        className="glass-panel glass-card-glow rounded-xl p-3.5 shadow-md flex flex-col gap-3 group transition-all duration-300 relative border border-zinc-800 hover:border-zinc-700/60"
                      >
                        {/* Company & Price */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-zinc-100 truncate group-hover:text-violet-400 transition-colors leading-tight">
                            {deal.company}
                          </h4>
                          <span className="text-xs font-semibold text-zinc-300 shrink-0">
                            ${deal.value >= 1000 ? `${(deal.value / 1000).toFixed(0)}k` : deal.value}
                          </span>
                        </div>

                        {/* Middle info */}
                        <div className="space-y-1.5 text-[10px] text-zinc-500">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-zinc-600" />
                            <span className="text-zinc-400 truncate">{deal.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building className="h-3 w-3 text-zinc-600" />
                            <span className="text-zinc-450 truncate">{deal.industry}</span>
                          </div>
                        </div>

                        {/* Card Footer: Assignee & Move controllers */}
                        <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2.5 mt-0.5 shrink-0">
                          {/* Owner Badge */}
                          <div 
                            className="h-5 w-5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[9px] font-bold text-violet-400 flex items-center justify-center"
                            title={`Owner: ${deal.assignedTo}`}
                          >
                            {getOwnerInitials(deal.assignedTo)}
                          </div>

                          {/* Hover action arrows to slide deals */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {STAGES.indexOf(stage) > 0 && (
                              <button
                                onClick={() => moveDeal(deal.id, 'left')}
                                className="h-5 w-5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none"
                                title="Move Left"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                            )}
                            {STAGES.indexOf(stage) < STAGES.length - 1 && (
                              <button
                                onClick={() => moveDeal(deal.id, 'right')}
                                className="h-5 w-5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none"
                                title="Move Right"
                              >
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

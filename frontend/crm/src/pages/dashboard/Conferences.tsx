import React, { useState } from 'react';
import { useConference, ConferenceQuote } from '../../hooks/useConference';
import { Card } from '../../components/Card';
import { CalendarRange, Check, X, ShieldAlert, Users, Clock, Coffee, Volume2, Video } from 'lucide-react';

export const Conferences: React.FC = () => {
  const { quotes, updateQuoteStatus } = useConference();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Declined'>('All');

  const filteredQuotes = quotes.filter(q => {
    if (filter === 'All') return true;
    return q.status === filter;
  });

  const getStatusBadge = (status: ConferenceQuote['status']) => {
    switch (status) {
      case 'Pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Declined': return 'bg-rose-500/10 text-rose-450 border-rose-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Corporate Event Planner</h3>
          <p className="text-xs text-zinc-400">Review quotes, configure seating specifications, and approve event facility booking slots.</p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-zinc-950/40 border border-zinc-900 rounded-xl p-1 shrink-0">
          {(['All', 'Pending', 'Approved', 'Declined'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === tab 
                  ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' 
                  : 'text-zinc-500 hover:text-zinc-350 border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Quote Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuotes.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-550 border border-dashed border-zinc-900 rounded-2xl font-semibold text-xs">
            No conference booking entries found matching this status.
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <Card 
              key={quote.id} 
              variant="glass" 
              className="p-5 flex flex-col justify-between hover:border-zinc-800 transition-colors relative"
            >
              {/* Card Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold tracking-wide uppercase ${getStatusBadge(quote.status)}`}>
                    {quote.status}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold">{quote.date}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{quote.companyName}</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Contact: <span className="text-zinc-250 font-medium">{quote.clientName}</span></p>
                </div>
              </div>

              {/* Event specifications */}
              <div className="my-4 space-y-2.5 text-[10px] border-y border-zinc-900/60 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Hall:</span>
                  <span className="font-semibold text-zinc-200">{quote.hallName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Attendance:</span>
                  <span className="text-zinc-350 flex items-center gap-1">
                    <Users className="h-3 w-3 text-zinc-550" />
                    {quote.guestsCount} Guests ({quote.daysCount} Days)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Catering:</span>
                  <span className="text-zinc-350 flex items-center gap-1">
                    <Coffee className="h-3 w-3 text-zinc-550" />
                    {quote.cateringOption}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">A/V Overlay:</span>
                  <div className="flex gap-2 text-zinc-400">
                    {quote.soundSystem && (
                      <span title="Sound System">
                        <Volume2 className="h-3.5 w-3.5 text-violet-400" />
                      </span>
                    )}
                    {quote.projector && (
                      <span title="Screen Projector">
                        <Video className="h-3.5 w-3.5 text-indigo-400" />
                      </span>
                    )}
                    {!quote.soundSystem && !quote.projector && <span>None</span>}
                  </div>
                </div>
              </div>

              {/* Price Tag and Actions */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-none">Agreed Pricing</span>
                  <span className="text-sm font-bold text-white mt-1 block leading-none">
                    UGX {quote.totalCostUGX.toLocaleString()}
                  </span>
                </div>

                {quote.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateQuoteStatus(quote.id, 'Declined')}
                      className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-550 hover:text-white border border-red-500/20 text-red-400 flex items-center justify-center transition-colors focus:outline-none"
                      title="Decline Request"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateQuoteStatus(quote.id, 'Approved')}
                      className="h-8 w-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 text-emerald-450 flex items-center justify-center transition-colors focus:outline-none"
                      title="Approve Request"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {quote.status !== 'Pending' && (
                  <span className="text-[10px] text-zinc-500 font-semibold italic">Verified</span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
export default Conferences;

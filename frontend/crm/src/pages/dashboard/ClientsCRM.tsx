import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  loadLeads, 
  saveLeads, 
  Lead, 
  addActivity 
} from '../../utils/mockData';
import { Card } from '../../components/Card';
import { 
  Search, 
  X, 
  Building, 
  Mail, 
  Phone, 
  Clock, 
  MessageSquare,
  ChevronRight,
  FileText,
  FileCheck,
  UserCheck
} from 'lucide-react';

export const ClientsCRM: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>(() => loadLeads());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Details pane state
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const activeGuest = useMemo(() => {
    return leads.find(l => l.id === activeGuestId) || null;
  }, [leads, activeGuestId]);

  // Restrict list if Agent
  const filteredGuests = useMemo(() => {
    return leads.filter(lead => {
      if (user?.role === 'agent' && lead.assignedTo !== 'u-agent') {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          lead.name.toLowerCase().includes(query) ||
          lead.company.toLowerCase().includes(query) ||
          lead.industry.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [leads, user, searchTerm]);

  // Mock verified contracts list
  const contracts = [
    { id: 'c-101', title: 'Lodge Booking Agreement_Vance.pdf', date: '2026-06-15', size: '280 KB', category: 'Lodge' },
    { id: 'c-102', title: 'Corporate Conference Space AGM_Stellar.pdf', date: '2026-06-12', size: '1.2 MB', category: 'Events' },
    { id: 'c-103', title: 'Groundnut Stew Catering Setup_Apex.pdf', date: '2026-06-10', size: '420 KB', category: 'Catering' },
  ];

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeGuestId) return;

    const updated = leads.map(l => {
      if (l.id === activeGuestId) {
        return {
          ...l,
          notes: [newComment.trim(), ...l.notes],
          lastActive: 'Just now'
        };
      }
      return l;
    });

    setLeads(updated);
    saveLeads(updated);
    
    if (user) {
      addActivity(user.name, user.avatar, `added a CRM note on guest ${activeGuest?.name}`, 'email');
    }
    setNewComment('');
  };

  const getOwnerName = (ownerId: Lead['assignedTo']) => {
    switch (ownerId) {
      case 'u-admin': return 'Sarah Jenkins';
      case 'u-manager': return 'Marcus Vance';
      case 'u-agent': return 'Elena Rostova';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      {/* Header Info */}
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Guests & Clients CRM</h3>
        <p className="text-xs text-zinc-400">Manage Guest Histories, timeline reviews, and signed contract verifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guest Directory table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="glass-panel glass-card-glow rounded-2xl p-3 flex items-center shadow-md">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search guests by name, company, or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Directory Table */}
          <div className="glass-panel glass-card-glow rounded-3xl overflow-hidden border border-zinc-900 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/40 text-[9px] uppercase font-bold tracking-wider text-zinc-500">
                    <th className="py-3.5 px-5">Guest Company</th>
                    <th className="py-3.5 px-5">Contact</th>
                    <th className="py-3.5 px-5">Lifetime Value</th>
                    <th className="py-3.5 px-5">Service Agent</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-xs text-zinc-350">
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-650 font-medium">
                        No guest history folders match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map((guest) => (
                      <tr 
                        key={guest.id}
                        onClick={() => setActiveGuestId(guest.id)}
                        className="hover:bg-zinc-900/20 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-5">
                          <div>
                            <p className="font-semibold text-zinc-200 group-hover:text-violet-400 transition-colors leading-tight">{guest.company}</p>
                            <span className="text-[9px] text-zinc-550 block mt-0.5">{guest.industry}</span>
                          </div>
                        </td>
                        <td className="py-3 px-5">
                          <p className="text-zinc-300 font-medium">{guest.name}</p>
                          <span className="text-[9px] text-zinc-550 block mt-0.5">{guest.email}</span>
                        </td>
                        <td className="py-3 px-5 font-semibold text-zinc-350">
                          UGX {(guest.value * 3700).toLocaleString()}
                        </td>
                        <td className="py-3 px-5">
                          <span className="text-[10px]">{getOwnerName(guest.assignedTo)}</span>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <ChevronRight className="h-4 w-4 text-zinc-650 group-hover:text-violet-400 transition-transform group-hover:translate-x-0.5" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Contract verification lists */}
        <div className="space-y-4">
          <Card variant="glass" className="p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <FileCheck className="h-4.5 w-4.5 text-violet-400" />
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Signed Contract Files</h4>
            </div>

            <div className="divide-y divide-zinc-900/60 space-y-3.5 pt-1">
              {contracts.map((doc) => (
                <div key={doc.id} className="flex items-start gap-3 pt-3 first:pt-0">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400">
                    <FileText className="h-4.5 w-4.5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[10px] font-bold text-zinc-300 truncate leading-tight" title={doc.title}>
                      {doc.title}
                    </h5>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-550 font-semibold">
                      <span>{doc.date}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span className="text-emerald-450 uppercase">{doc.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Sliding details drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-40 w-full sm:max-w-md bg-zinc-950/98 border-l border-zinc-900 shadow-2xl backdrop-blur-xl transform transition-transform duration-300 ease-in-out ${
          activeGuest ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {activeGuest && (
          <div className="flex flex-col h-full font-sans">
            {/* Drawer Header */}
            <div className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/20 shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Guest CRM Record</span>
              <button 
                onClick={() => { setActiveGuestId(null); setNewComment(''); }}
                className="text-zinc-500 hover:text-zinc-350 rounded-lg p-1.5 transition-colors focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                  <Building className="h-3.5 w-3.5" />
                  <span>{activeGuest.industry}</span>
                </div>
                <h4 className="text-lg font-bold text-white leading-tight">{activeGuest.company}</h4>
                <p className="text-xs text-zinc-450">Guest: <span className="text-zinc-200 font-semibold">{activeGuest.name}</span></p>
              </div>

              {/* CRM metrics */}
              <div className="grid grid-cols-2 gap-4 border-y border-zinc-900 py-4.5 text-[10px]">
                <div>
                  <span className="text-zinc-500 block">Lead Assignee:</span>
                  <span className="font-semibold text-zinc-300 mt-1 block">{getOwnerName(activeGuest.assignedTo)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Lifetime Valuation:</span>
                  <span className="font-semibold text-zinc-200 mt-1 block">UGX {(activeGuest.value * 3700).toLocaleString()}</span>
                </div>
              </div>

              {/* Contact Cards */}
              <div className="space-y-3">
                <h5 className="text-[9px] font-bold uppercase tracking-wider text-zinc-550">Contact Files</h5>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-450 flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-zinc-550" />
                      Email
                    </span>
                    <span className="text-zinc-350 select-all font-medium">{activeGuest.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-450 flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-zinc-550" />
                      Direct Line
                    </span>
                    <span className="text-zinc-300 font-medium">{activeGuest.phone}</span>
                  </div>
                </div>
              </div>

              {/* Internal Notes Feed */}
              <div className="space-y-4 border-t border-zinc-900 pt-5 flex-1 flex flex-col min-h-0">
                <h5 className="text-[9px] font-bold uppercase tracking-wider text-zinc-550 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-zinc-550" />
                  Staff Notes Timeline ({activeGuest.notes.length})
                </h5>

                {/* Note submission */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a guest review or contract note..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/40 py-2 px-3 text-xs text-zinc-200 outline-none focus:border-violet-500"
                  />
                  <button 
                    type="submit"
                    className="rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 text-xs text-white font-bold transition-colors"
                  >
                    Post
                  </button>
                </form>

                {/* Timeline scroll */}
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {activeGuest.notes.map((note, idx) => (
                    <div key={idx} className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-3 text-xs">
                      <p className="text-zinc-350 leading-relaxed">{note}</p>
                      <div className="flex items-center gap-1 mt-2 text-[8px] text-zinc-550 font-bold uppercase tracking-wider">
                        <Clock className="h-3 w-3" />
                        <span>Timeline entry</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ClientsCRM;

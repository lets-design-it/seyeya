import React, { useState, useMemo } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { 
  loadLeads, 
  saveLeads, 
  Lead, 
  addActivity 
} from '../utils/mockData';
import { 
  Search, 
  Plus, 
  Filter, 
  X, 
  UserPlus, 
  Briefcase, 
  Building, 
  Mail, 
  Phone, 
  Clock, 
  MessageSquare,
  ChevronRight
} from 'lucide-react';

export const Leads: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const [leads, setLeads] = useState<Lead[]>(() => loadLeads());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  
  // Slide-out panel state
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  
  // Add Lead Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadIndustry, setNewLeadIndustry] = useState('');
  const [newLeadStage, setNewLeadStage] = useState<Lead['stage']>('New');
  const [newLeadValue, setNewLeadValue] = useState('');
  const [newLeadAssignee, setNewLeadAssignee] = useState<Lead['assignedTo']>('u-agent');

  // Comment input state
  const [newComment, setNewComment] = useState('');

  // Active lead helper
  const activeLead = useMemo(() => {
    return leads.find(l => l.id === activeLeadId) || null;
  }, [leads, activeLeadId]);

  // Handle Role-based Visibility (UAC restriction)
  // If role is sales agent, we only allow viewing leads assigned to u-agent
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // 1. Owner restriction for agents
      if (user?.role === 'agent') {
        if (lead.assignedTo !== 'u-agent') return false;
      } else {
        // Manager / Admin filtering
        if (selectedOwner !== 'all') {
          if (lead.assignedTo !== selectedOwner) return false;
        }
      }

      // 2. Stage filtering
      if (selectedStage !== 'all' && lead.stage !== selectedStage) return false;

      // 3. Search query match
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = lead.name.toLowerCase().includes(query);
        const matchCompany = lead.company.toLowerCase().includes(query);
        const matchEmail = lead.email.toLowerCase().includes(query);
        const matchIndustry = lead.industry.toLowerCase().includes(query);
        return matchName || matchCompany || matchEmail || matchIndustry;
      }

      return true;
    });
  }, [leads, user, selectedStage, selectedOwner, searchTerm]);

  // Add Lead handler
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadCompany || !newLeadEmail) return;

    const val = parseFloat(newLeadValue) || 0;
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: newLeadName,
      company: newLeadCompany,
      email: newLeadEmail,
      phone: newLeadPhone || '+1 (555) 000-0000',
      stage: newLeadStage,
      value: val,
      assignedTo: newLeadAssignee,
      industry: newLeadIndustry || 'SaaS & AI',
      lastActive: 'Just now',
      notes: ['Lead registered in database.'],
    };

    const updated = [newLead, ...leads];
    setLeads(updated);
    saveLeads(updated);

    if (user) {
      addActivity(user.name, user.avatar, `created a new lead: ${newLeadName} (${newLeadCompany})`, 'deal');
    }

    // Reset fields
    setNewLeadName('');
    setNewLeadCompany('');
    setNewLeadEmail('');
    setNewLeadPhone('');
    setNewLeadIndustry('');
    setNewLeadStage('New');
    setNewLeadValue('');
    setNewLeadAssignee('u-agent');
    setIsAddModalOpen(false);
  };

  // Update lead fields in slide-out panel
  const handleUpdateLeadField = (leadId: string, field: keyof Lead, value: any) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        // If updating stage, trigger activity log
        if (field === 'stage' && l.stage !== value) {
          if (user) {
            addActivity(user.name, user.avatar, `changed stage of ${l.name} to ${value}`, 'deal');
          }
        }
        return { ...l, [field]: value, lastActive: 'Just now' };
      }
      return l;
    });
    setLeads(updated);
    saveLeads(updated);
  };

  // Add Note/Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeLeadId) return;

    const updated = leads.map(l => {
      if (l.id === activeLeadId) {
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
      addActivity(user.name, user.avatar, `added a comment on ${activeLead?.name}`, 'email');
    }
    setNewComment('');
  };

  const getStageBadgeColor = (stage: Lead['stage']) => {
    switch (stage) {
      case 'New': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Contacted': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Qualified': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Proposal': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'Won': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Lost': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  const getOwnerName = (ownerId: Lead['assignedTo']) => {
    switch (ownerId) {
      case 'u-admin': return 'Sarah Jenkins';
      case 'u-manager': return 'Marcus Vance';
      case 'u-agent': return 'Elena Rostova';
      default: return 'Unassigned';
    }
  };

  return (
    <div className="space-y-5 animate-fade-in relative h-full">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Leads Directory</h3>
          <p className="text-xs text-zinc-550">Search, monitor, and update workspace leads & profiles.</p>
        </div>
        
        {/* Only Admin and Manager can add leads */}
        {user?.role !== 'agent' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-650 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:from-violet-500 hover:to-indigo-550 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Add New Lead
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel glass-card-glow rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-md">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search leads by name, company, email or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl  bg-zinc-50 py-2 pl-9 pr-4 text-xs text-foreground placeholder-zinc-500 outline-none transition-colors focus:border-violet-500 focus:bg-card/60"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0 text-xs text-zinc-550">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="rounded-xl  bg-card/50 px-3 py-1.5 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="all">All Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Owner Filter (Disabled for agent, as they are restricted to their own leads) */}
          <select
            value={user?.role === 'agent' ? 'u-agent' : selectedOwner}
            disabled={user?.role === 'agent'}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="rounded-xl  bg-card/50 px-3 py-1.5 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {user?.role === 'agent' ? (
              <option value="u-agent">Assigned to Me</option>
            ) : (
              <>
                <option value="all">All Assignees</option>
                <option value="u-admin">Sarah Jenkins (Admin)</option>
                <option value="u-manager">Marcus Vance (Manager)</option>
                <option value="u-agent">Elena Rostova (Agent)</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel glass-card-glow rounded-3xl shadow-lg overflow-hidden ">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className=" bg-card/50 text-xs uppercase font-bold tracking-wider text-zinc-550">
                <th className="py-4 px-6">Company & Lead</th>
                <th className="py-4 px-5">Industry</th>
                <th className="py-4 px-5">Sales Stage</th>
                <th className="py-4 px-5">Contract Value</th>
                <th className="py-4 px-5">Lead Owner</th>
                <th className="py-4 px-5">Last Activity</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className=" text-xs text-foreground">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-medium">
                    No matching lead records found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id}
                    onClick={() => setActiveLeadId(lead.id)}
                    className="hover:bg-zinc-100/30 dark:hover:bg-zinc-100/30 light:hover:bg-zinc-100/30 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-6">
                      <div>
                        <p className="font-semibold text-zinc-100 group-hover:text-violet-400 transition-colors leading-tight">{lead.company}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{lead.name}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-zinc-550">{lead.industry}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold tracking-wide ${getStageBadgeColor(lead.stage)}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-foreground">
                      {formatPrice(lead.value)}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-indigo-500/80" />
                        <span className="text-foreground">{getOwnerName(lead.assignedTo)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-zinc-600" />
                        <span>{lead.lastActive}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button className="text-zinc-500 group-hover:text-violet-400 p-1 hover:bg-zinc-100 rounded-lg transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal (Admin & Manager only) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-card/70 backdrop-blur-md animate-fade-in">
          <div className="glass-panel glass-card-glow rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-scale-up ">
            <div className="flex items-center justify-between  pb-3 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Lead Profile</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-foreground rounded-lg p-1.5 transition-colors focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Corp"
                    value={newLeadCompany}
                    onChange={(e) => setNewLeadCompany(e.target.value)}
                    className="w-full rounded-xl  bg-card/50 py-2 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 mb-1.5">Primary Contact *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Kojo"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full rounded-xl  bg-card/50 py-2 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@company.com"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full rounded-xl  bg-card/50 py-2 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full rounded-xl  bg-card/50 py-2 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 mb-1.5">Industry Sector</label>
                  <input
                    type="text"
                    placeholder="e.g. Supply Chain"
                    value={newLeadIndustry}
                    onChange={(e) => setNewLeadIndustry(e.target.value)}
                    className="w-full rounded-xl  bg-card/50 py-2 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 mb-1.5">Deal Value ({currency})</label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(e.target.value)}
                    className="w-full rounded-xl  bg-card/50 py-2 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 mb-1.5">Initial Stage</label>
                  <select
                    value={newLeadStage}
                    onChange={(e) => setNewLeadStage(e.target.value as Lead['stage'])}
                    className="w-full rounded-xl  bg-card/50 py-2 px-3 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 mb-1.5">Lead Assignee</label>
                  <select
                    value={newLeadAssignee}
                    onChange={(e) => setNewLeadAssignee(e.target.value as Lead['assignedTo'])}
                    className="w-full rounded-xl  bg-card/50 py-2 px-3 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="u-agent">Elena Rostova (Agent)</option>
                    <option value="u-manager">Marcus Vance (Manager)</option>
                    <option value="u-admin">Sarah Jenkins (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3  mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl  px-4 py-2 text-xs font-semibold text-zinc-550 hover:text-foreground hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-2 text-xs font-semibold text-white shadow-lg hover:from-violet-500 hover:to-indigo-550 transition-colors"
                >
                  Save Lead Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-out details drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-40 w-full sm:max-w-xl md:max-w-2xl bg-card/95 light:bg-zinc-50/98  light:border-zinc-250 shadow-2xl backdrop-blur-xl transform transition-transform duration-300 ease-in-out ${
          activeLead ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {activeLead && (
          <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="h-16  light:border-zinc-200 flex items-center justify-between px-6 bg-zinc-50">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-550">Lead detail file</span>
              <button 
                onClick={() => { setActiveLeadId(null); setNewComment(''); }}
                className="text-zinc-500 hover:text-foreground rounded-lg p-1.5 transition-colors focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Card Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs text-violet-400 font-semibold tracking-wider uppercase">
                  <Building className="h-3 w-3" />
                  <span>{activeLead.industry}</span>
                </div>
                <h4 className="text-xl font-bold text-white leading-tight">{activeLead.company}</h4>
                <p className="text-xs text-zinc-550">Contact Person: <span className="text-foreground font-medium">{activeLead.name}</span></p>
              </div>

              {/* Status and Value Quick Selectors */}
              <div className="grid grid-cols-2 gap-4  py-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Sales Stage</label>
                  <select
                    value={activeLead.stage}
                    onChange={(e) => handleUpdateLeadField(activeLead.id, 'stage', e.target.value as Lead['stage'])}
                    className="w-full rounded-xl  bg-zinc-100 py-1.5 px-3 text-xs text-zinc-250 outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Contract Value</label>
                  <input
                    type="number"
                    value={activeLead.value}
                    onChange={(e) => handleUpdateLeadField(activeLead.id, 'value', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl  bg-zinc-100 py-1.5 px-3 text-xs text-foreground outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Assignments / Owners */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ownership & Contact Details</h5>
                
                <div className="space-y-2.5">
                  {/* Lead Owner dropdown (locked for agents) */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-550 flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4 text-zinc-500" />
                      Assigned Agent
                    </span>
                    <select
                      value={activeLead.assignedTo}
                      disabled={user?.role === 'agent'}
                      onChange={(e) => handleUpdateLeadField(activeLead.id, 'assignedTo', e.target.value as Lead['assignedTo'])}
                      className="rounded-xl  bg-zinc-100 py-1 px-2.5 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="u-agent">Elena Rostova (Agent)</option>
                      <option value="u-manager">Marcus Vance (Manager)</option>
                      <option value="u-admin">Sarah Jenkins (Admin)</option>
                    </select>
                  </div>

                  {/* Email contact */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-550 flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-zinc-500" />
                      Email File
                    </span>
                    <span className="text-foreground select-all">{activeLead.email}</span>
                  </div>

                  {/* Phone contact */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-550 flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-zinc-500" />
                      Direct Line
                    </span>
                    <span className="text-foreground">{activeLead.phone}</span>
                  </div>
                </div>
              </div>

              {/* Notes and Activity Timeline */}
              <div className="space-y-4  pt-5 flex-1 flex flex-col min-h-0">
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-zinc-500" />
                  Timeline & Comments ({activeLead.notes.length})
                </h5>

                {/* Comment Entry form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a meeting note or feedback..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 rounded-xl  bg-zinc-100 py-2 px-3 text-xs text-foreground outline-none focus:border-violet-500"
                  />
                  <button 
                    type="submit"
                    className="rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 text-xs text-white font-semibold transition-colors"
                  >
                    Add
                  </button>
                </form>

                {/* Notes Feed */}
                <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                  {activeLead.notes.map((note, index) => (
                    <div key={index} className="rounded-xl  bg-card/50 p-3 text-xs">
                      <p className="text-foreground leading-normal">{note}</p>
                      <span className="text-xs text-zinc-650 mt-1 block">Activity Record</span>
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


